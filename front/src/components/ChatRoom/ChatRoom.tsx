import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { MessageList } from '../MessageList/MessageList';
import { MessageInput } from '../MessageInput/MessageInput';
import './ChatRoom.css';

interface ChatRoomProps {
  roomId: string;
  token: string;
  currentUserId: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, token, currentUserId }) => {
  const { messages, isConnected, error, sendMessage } = useWebSocket(roomId, token);

  return (
    <div className="chat-room animate-fade-in">
      <header className="chat-header">
        <div className="header-info">
          <h2>Room: {roomId}</h2>
          <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Conectado' : 'Conectando...'}
          </span>
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
