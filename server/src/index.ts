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
