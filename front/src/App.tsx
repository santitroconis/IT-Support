import { useState, useEffect } from 'react';
import { ChatRoom } from './components/ChatRoom/ChatRoom';
import { RoomSelector } from './components/RoomSelector/RoomSelector';
import './index.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('http://localhost:8787/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          try {
            const payload = JSON.parse(atob(data.token));
            setUserId(payload.userId);
          } catch(e) {
            console.error("No se pudo leer el payload del token", e);
          }
        }
      } catch (err) {
        console.error("Fallo de autenticación simulada", err);
      }
    };

    fetchToken();
  }, []);

  if (!token || !userId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Autenticando de forma segura...
      </div>
    );
  }

  return (
    <>
      {currentRoomId ? (
        <ChatRoom 
          roomId={currentRoomId} 
          token={token} 
          currentUserId={userId} 
          onLeaveRoom={() => setCurrentRoomId(null)}
        />
      ) : (
        <RoomSelector onJoinRoom={(id) => setCurrentRoomId(id)} />
      )}
    </>
  );
}

export default App;
