import React, { useState, type KeyboardEvent } from 'react';
import './RoomSelector.css';

interface RoomSelectorProps {
  onJoinRoom: (roomId: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({ onJoinRoom }) => {
  const [roomName, setRoomName] = useState('');

  const handleJoin = () => {
    const formattedName = roomName.trim().toLowerCase().replace(/\s+/g, '-');
    if (formattedName) {
      onJoinRoom(formattedName);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="room-selector-container animate-fade-in">
      <div className="room-selector-card">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" color="var(--accent-color)">
            <path d="M12 2C6.477 2 2 6.03 2 11c0 2.845 1.488 5.378 3.82 7.042-.236 1.482-.962 3.175-1.026 3.32-.142.325-.01.697.294.881.306.182.684.15 9.176-.708C8.948 21.826 10.435 22 12 22c5.523 0 10-4.03 10-9s-4.477-9-10-9Z" />
          </svg>
        </div>
        <h1 className="room-title">Bienvenido al Chat</h1>
        <p className="room-subtitle">Ingresa el nombre de la sala a la que deseas unirte o crear una nueva.</p>
        
        <div className="room-input-group">
          <input
            type="text"
            className="room-input"
            placeholder="ej. sala-general"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button 
            className="room-join-button" 
            onClick={handleJoin}
            disabled={!roomName.trim()}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
};
