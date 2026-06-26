import { useState, useEffect, useRef, useCallback } from 'react';

export interface ChatMessage {
  id?: string;
  type: 'message' | 'system';
  roomId?: string;
  userId: string;
  content: string;
  createdAt?: string;
}

export const useWebSocket = (roomId: string, token: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    const wsUrl = `ws://localhost:8787/api/room/${roomId}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error('Failed to parse websocket message', e);
      }
    };

    ws.onerror = () => {
      setError('Error en la conexión WebSocket');
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconexión simple
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 3000);
    };

    wsRef.current = ws;

    return ws;
  }, [roomId, token]);

  useEffect(() => {
    const ws = connect();
    return () => {
      if (ws) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    } else {
      setError('No se puede enviar el mensaje, WebSocket desconectado.');
    }
  }, []);

  return { messages, isConnected, error, sendMessage };
};
