import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB: D1Database;
  CHAT_ROOM: DurableObjectNamespace;
  DOCUMENTS_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Env }>();

// Habilitar CORS para permitir llamadas desde el cliente frontend local
app.use('/*', cors());

// Endpoint de autenticación (SSO Simulado)
// En producción, valida credenciales o tokens OAuth contra Entra ID/Google Workspace.
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = body.email;
  
  if (!email) {
    return c.json({ error: 'Se requiere un correo institucional (@gruposerex.com)' }, 400);
  }

  // Buscar al empleado en la base de datos
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  
  if (!user) {
    return c.json({ error: 'Usuario no encontrado en el directorio corporativo' }, 404);
  }
  
  // Generamos un token opaco con el Rol inyectado.
  const token = btoa(JSON.stringify({ userId: user.id, role: user.role, expires: Date.now() + 86400000 })); // 24h
  
  return c.json({ token, user });
});

// Obtener detalles del usuario actual
app.get('/api/users/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'No autorizado' }, 401);
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = JSON.parse(atob(token));
    if (payload.expires < Date.now()) throw new Error('Expirado');
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first();
    return c.json(user);
  } catch (e) {
    return c.json({ error: 'Token inválido o expirado' }, 401);
  }
});

// Middleware de autenticación y extracción de usuario (helper)
const getUserFromHeader = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = JSON.parse(atob(token));
    if (payload.expires < Date.now()) return null;
    return payload; // { userId, role }
  } catch (e) {
    return null;
  }
};

// Obtener los activos asignados al usuario actual
app.get('/api/users/me/assets', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload) return c.json({ error: 'No autorizado' }, 401);
  
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM assets_hardware WHERE assigned_user_id = ? AND status = "active"'
  ).bind(payload.userId).all();
  
  return c.json(results);
});

// Registrar nuevo hardware (Solo Técnicos/Gerentes)
app.post('/api/assets/hardware', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role === 'user') return c.json({ error: 'Prohibido' }, 403);
  
  const body = await c.req.json();
  const id = 'hw_' + Math.random().toString(36).substring(7);
  
  try {
    await c.env.DB.prepare(
      `INSERT INTO assets_hardware (id, serial_number, type, brand, model, location) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, body.serial_number, body.type, body.brand, body.model, body.location).run();
    return c.json({ success: true, id });
  } catch (e: any) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'El serial o la IP ya está registrado' }, 400);
    }
    return c.json({ error: 'Error al registrar hardware' }, 500);
  }
});

// Lógica Estricta de Asignación de Hardware a Usuario
app.post('/api/assets/assign', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role === 'user') return c.json({ error: 'Prohibido' }, 403);
  
  const body = await c.req.json();
  const { userId, hardwareIds } = body; // hardwareIds es un array de IDs ['hw_1', 'hw_2']
  
  if (!userId || !hardwareIds || hardwareIds.length === 0) {
    return c.json({ error: 'Faltan datos de asignación' }, 400);
  }

  // Obtenemos los tipos de hardware solicitados
  const placeholders = hardwareIds.map(() => '?').join(',');
  const query = `SELECT id, type FROM assets_hardware WHERE id IN (${placeholders})`;
  const { results: assets } = await c.env.DB.prepare(query).bind(...hardwareIds).all();

  // REGLA DE NEGOCIO: Si hay un Desktop, DEBE haber al menos un Monitor en la asignación actual 
  // o el usuario ya debe tener uno asignado previamente.
  const hasDesktop = assets.some(a => a.type === 'desktop');
  const assigningMonitor = assets.some(a => a.type === 'monitor');
  
  if (hasDesktop && !assigningMonitor) {
    // Validar si el usuario ya tiene un monitor
    const { results: existing } = await c.env.DB.prepare(
      'SELECT id FROM assets_hardware WHERE assigned_user_id = ? AND type = "monitor" AND status = "active"'
    ).bind(userId).all();
    
    if (existing.length === 0) {
      return c.json({ 
        error: 'Políticas de Asignación: No puedes asignar un Desktop sin un Monitor asociado.' 
      }, 400);
    }
  }

  // Aplicar asignación
  const updateQuery = `UPDATE assets_hardware SET assigned_user_id = ? WHERE id IN (${placeholders})`;
  await c.env.DB.prepare(updateQuery).bind(userId, ...hardwareIds).run();

  return c.json({ success: true, message: 'Asignación completada' });
});

// --- ÉPICA 3: TICKETS Y CONSUMIBLES ---

// Crear un Ticket (Usuario)
app.post('/api/tickets', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload) return c.json({ error: 'No autorizado' }, 401);
  
  const body = await c.req.json();
  // Validaciones estrictas: no texto libre para tipo y categoría
  if (!body.type || !body.category) return c.json({ error: 'Faltan campos estructurados' }, 400);

  const id = 'tkt_' + Math.random().toString(36).substring(7);
  
  await c.env.DB.prepare(
    `INSERT INTO tickets (id, user_id, type, category, description, status) 
     VALUES (?, ?, ?, ?, ?, 'open')`
  ).bind(id, payload.userId, body.type, body.category, body.description || '').run();
  
  return c.json({ success: true, ticketId: id });
});

// Listar Tickets (Depende del Rol)
app.get('/api/tickets', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload) return c.json({ error: 'No autorizado' }, 401);
  
  let query = 'SELECT * FROM tickets ORDER BY created_at DESC';
  let bindings: any[] = [];
  
  // Si es un usuario normal, solo ve sus propios tickets
  if (payload.role === 'user') {
    query = 'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC';
    bindings.push(payload.userId);
  }
  
  const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
  return c.json(results);
});

// Resolver Ticket y Auto-Descontar Consumible
app.post('/api/tickets/:id/resolve', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role === 'user') return c.json({ error: 'Prohibido' }, 403);
  
  const ticketId = c.req.param('id');
  const body = await c.req.json();
  const { resolution_notes, consumable_id } = body;

  try {
    // 1. Cerrar el ticket
    await c.env.DB.prepare(
      `UPDATE tickets SET status = 'resolved', resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP, assigned_tech_id = ? WHERE id = ?`
    ).bind(resolution_notes || '', payload.userId, ticketId).run();

    // 2. Lógica Módulo II: Auto-descuento de Stock Transaccional si se usó un consumible
    if (consumable_id) {
      // Registrar en log transaccional
      const txId = 'tx_' + Math.random().toString(36).substring(7);
      await c.env.DB.prepare(
        `INSERT INTO inventory_transactions (id, consumable_id, tech_id, ticket_id, quantity, destination_location) 
         VALUES (?, ?, ?, ?, -1, 'local')`
      ).bind(txId, consumable_id, payload.userId, ticketId).run();

      // Descontar del central
      await c.env.DB.prepare(
        `UPDATE assets_consumables SET stock_central = stock_central - 1 WHERE id = ?`
      ).bind(consumable_id).run();
    }

    return c.json({ success: true, message: 'Ticket resuelto y stock auditado' });
  } catch (e: any) {
    return c.json({ error: 'Error al resolver ticket: ' + e.message }, 500);
  }
});

// --- ÉPICA 6: PANELES DE GESTIÓN ADMINISTRATIVA ---

// Obtener todos los usuarios (Solo Tech/Manager)
app.get('/api/users', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role === 'user') return c.json({ error: 'Prohibido' }, 403);
  
  const { results } = await c.env.DB.prepare(
    'SELECT id, email, role, full_name, department, office_location FROM users'
  ).all();
  return c.json(results);
});

// Crear un nuevo usuario (Solo Manager)
app.post('/api/users', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role !== 'manager') return c.json({ error: 'Prohibido' }, 403);
  
  const body = await c.req.json();
  const id = 'user_' + Math.random().toString(36).substring(7);
  
  try {
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, role, full_name, department, office_location) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, 
      body.email, 
      'fake_hash', // En prod sería bcrypt.hash(body.password)
      body.role || 'user',
      body.full_name || 'Nuevo Empleado',
      body.department || 'General',
      body.office_location || 'Sede Central'
    ).run();
    return c.json({ success: true, id });
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) return c.json({ error: 'Email ya registrado' }, 400);
    return c.json({ error: 'Error interno' }, 500);
  }
});

// Obtener inventario global (Solo Tech/Manager)
app.get('/api/assets/all', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role === 'user') return c.json({ error: 'Prohibido' }, 403);
  
  const { results } = await c.env.DB.prepare('SELECT * FROM assets_hardware ORDER BY created_at DESC').all();
  return c.json(results);
});


// --- ÉPICA 4: DASHBOARD GERENCIAL ---

app.get('/api/metrics/dashboard', async (c) => {
  const payload = await getUserFromHeader(c);
  if (!payload || payload.role !== 'manager') return c.json({ error: 'Prohibido' }, 403);
  
  // Extraer métricas de SLA y Tickets
  const { results: ticketStats } = await c.env.DB.prepare(
    `SELECT status, COUNT(*) as count FROM tickets GROUP BY status`
  ).all();

  // Extraer alertas de stock de consumibles (Módulo II)
  const { results: stockAlerts } = await c.env.DB.prepare(
    `SELECT name, stock_central FROM assets_consumables WHERE stock_central < 5`
  ).all();

  return c.json({ ticketStats, stockAlerts });
});

// Endpoint para conectar al WebSocket de una sala
app.get('/api/room/:roomId/ws', async (c) => {
  const roomId = c.req.param('roomId');
  
  // Extraemos token (puede venir en query params o headers)
  const token = c.req.query('token');
  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  // Validación estricta del lado del servidor.
  let userId: string;
  try {
    const payload = JSON.parse(atob(token));
    if (payload.expires < Date.now()) {
      throw new Error("Token expired");
    }
    userId = payload.userId;
  } catch (e) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  // Pasamos la conexión al Durable Object de la sala correspondiente
  const id = c.env.CHAT_ROOM.idFromName(roomId);
  const roomObject = c.env.CHAT_ROOM.get(id);

  // Inyectamos datos validados en los headers para que el Durable Object los lea
  const newRequest = new Request(c.req.raw);
  newRequest.headers.set('X-User-Id', userId);
  newRequest.headers.set('X-Room-Id', roomId);

  return roomObject.fetch(newRequest);
});

export default app;

// Exportamos el Durable Object para que Cloudflare lo exponga
export { ChatRoom } from './chat-room';
