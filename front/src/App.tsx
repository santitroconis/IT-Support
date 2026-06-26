import { useState, useEffect } from 'react';
import { ChatRoom } from './components/ChatRoom/ChatRoom';
import './index.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const roomId = 'global-lounge'; // Sala fija para demostración

  useEffect(() => {
    // Simular el inicio de sesión para obtener el token opaco
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
          // Solo para que la UI sepa quién es y diferencie sus mensajes.
          // El backend asume el control estricto basándose en la validación del token.
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

  return (
    <>
      {token && userId ? (
        <ChatRoom roomId={roomId} token={token} currentUserId={userId} />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
          Autenticando de forma segura...
        </div>
      )}
    </>
  );
}

export default App;
