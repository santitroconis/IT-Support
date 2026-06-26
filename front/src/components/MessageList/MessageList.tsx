import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../hooks/useWebSocket';
import './MessageList.css';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list-container">
      {messages.map((msg, index) => {
        if (msg.type === 'system') {
          return (
            <div key={index} className="system-message animate-fade-in">
              {msg.content}
            </div>
          );
        }

        const isOwn = msg.userId === currentUserId;

        return (
          <div key={msg.id || index} className={`message-wrapper ${isOwn ? 'own-message' : 'other-message'} animate-fade-in`}>
            {!isOwn && <div className="avatar">{msg.userId.substring(0, 2).toUpperCase()}</div>}
            <div className="message-bubble">
              <span className="message-content">{msg.content}</span>
              <span className="message-time">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
