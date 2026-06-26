import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>
      <h1>Dashboard Gerencial</h1>
      <p>Métricas de tiempos de respuesta, resolución y stock crítico.</p>
      
      <button onClick={handleLogout} style={{ marginTop: '2rem', background: 'transparent', color: 'var(--error-color)', border: 'none', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};
