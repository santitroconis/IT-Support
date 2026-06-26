import { Env } from './index';

interface Session {
  webSocket: WebSocket;
  userId: string;
}

export class ChatRoom {
  state: DurableObjectState;
  env: Env;
  sessions: Session[] = [];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    // Validamos que sea una petición de Upgrade a WebSocket
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const userId = request.headers.get('X-User-Id');
    const roomId = request.headers.get('X-Room-Id');

    if (!userId || !roomId) {
      return new Response('Missing internal headers', { status: 400 });
    }

    // Creamos el par de WebSockets (cliente y servidor)
    const { 0: client, 1: server } = new WebSocketPair();

    this.handleSession(server, userId, roomId);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleSession(ws: WebSocket, userId: string, roomId: string) {
    ws.accept();
    
    const session: Session = { webSocket: ws, userId };
    this.sessions.push(session);

    // Broadcast al conectarse
    this.broadcast(JSON.stringify({ type: 'system', content: `User joined`, userId }));

    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === 'message') {
          const messageContent = data.content;
          const messageId = crypto.randomUUID();
          
          // Persistencia en D1 (Asíncrona para no bloquear el hilo de red)
          this.env.DB.prepare(
            'INSERT INTO messages (id, room_id, user_id, content) VALUES (?, ?, ?, ?)'
          )
          .bind(messageId, roomId, userId, messageContent)
          .run()
          .catch(e => console.error("Error al guardar mensaje en D1:", e));

          // Retransmitimos el mensaje a todos en la sala
          const payload = JSON.stringify({
            id: messageId,
            type: 'message',
            roomId: roomId,
            userId: userId,
            content: messageContent,
            createdAt: new Date().toISOString()
          });

          this.broadcast(payload);
        }
      } catch (err) {
        console.error('Error procesando mensaje WebSocket', err);
      }
    });

    ws.addEventListener('close', () => {
      this.sessions = this.sessions.filter(s => s !== session);
      this.broadcast(JSON.stringify({ type: 'system', content: `User left`, userId }));
    });
    
    ws.addEventListener('error', () => {
      this.sessions = this.sessions.filter(s => s !== session);
    });
  }

  broadcast(message: string) {
    for (const session of this.sessions) {
      try {
        session.webSocket.send(message);
      } catch (err) {
        // En caso de error (ej. desconexión abrupta), ignoramos y el evento close lo limpiará
      }
    }
  }
}
