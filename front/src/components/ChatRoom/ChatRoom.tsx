import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Send, X } from 'lucide-react';

interface ChatRoomProps {
  ticketId: string;
  onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ ticketId, onClose }) => {
  const [message, setMessage] = useState('');
  const [userData] = useState(() => JSON.parse(localStorage.getItem('user_data') || '{}'));
  const { messages, connectionStatus, sendMessage } = useWebSocket(ticketId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border animate-fade-in shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Soporte en Línea</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-success' : 'bg-destructive'}`}></span>
              <span className="text-xs text-muted-foreground">
                {connectionStatus === 'connected' ? 'Conectado al Ticket' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
        {messages.map((msg, idx) => {
          const isMe = msg.userId === userData.id;
          return (
            <div key={idx} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              <span className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.userId}</span>
              <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-background border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
            disabled={connectionStatus !== 'connected'}
          />
          <button
            type="submit"
            disabled={!message.trim() || connectionStatus !== 'connected'}
            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
