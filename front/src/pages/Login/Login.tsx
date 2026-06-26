import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar dominio
    if (!email.endsWith('@gruposerex.com')) {
      setError('Debes usar un correo corporativo válido.');
      return;
    }

    try {
      // Nota: apuntando al localhost para desarrollo. 
      // En prod debe usar import.meta.env.VITE_API_URL
      const response = await fetch('http://localhost:8787/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      // Redirigir según el rol del usuario
      if (data.user.role === 'manager') navigate('/manager');
      else if (data.user.role === 'tech') navigate('/tech');
      else navigate('/user');

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <form className="login-card" onSubmit={handleLogin}>
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48" color="var(--accent-color)">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
          </svg>
        </div>
        <h2>Portal S.C.I.</h2>
        <p>Sistema Centralizado de Inventario y Soporte TI</p>
        
        {error && <div className="error-banner">{error}</div>}
        
        <input 
          type="email" 
          placeholder="tucorreo@gruposerex.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="room-input"
        />
        <button type="submit" className="room-join-button" style={{marginTop: '1rem'}}>
          Ingresar al Portal
        </button>
      </form>
    </div>
  );
};
