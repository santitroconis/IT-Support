import { Hono } from 'hono';
import { cors } from 'hono/cors';

export interface Env {
  DB: D1Database;
  CHAT_ROOM: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// Habilitar CORS para permitir llamadas desde el cliente frontend local
app.use('/*', cors());

// Endpoint de autenticación falso (para demostración)
// En producción, valida credenciales y devuelve un ID de sesión/token opaco.
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const username = body.username || 'user_' + Math.random().toString(36).substring(7);
  
  // Generamos un token opaco. El cliente NO DEBE desencriptarlo.
  // Toda la información de sesión queda contenida o referenciada aquí.
  const token = btoa(JSON.stringify({ userId: username, expires: Date.now() + 3600000 }));
  
  return c.json({ token });
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
