import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import './ChatRoom.css';

interface ChatRoomProps {
  roomId: string;
  token: string;
  currentUserId: string;
  onLeaveRoom: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, token, currentUserId, onLeaveRoom }) => {
  const { messages, isConnected, error, sendMessage } = useWebSocket(roomId, token);

  return (
    <div className="chat-room animate-fade-in">
      <header className="chat-header">
        <div className="header-info">
          <h2>Sala: {roomId}</h2>
          <div className="header-actions">
            <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? 'Conectado' : 'Conectando...'}
            </span>
            <button className="leave-button" onClick={onLeaveRoom}>
              Salir
            </button>
          </div>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </header>
      
      <MessageList messages={messages} currentUserId={currentUserId} />
      
      <MessageInput 
        onSendMessage={sendMessage} 
        disabled={!isConnected} 
      />
    </div>
  );
};
