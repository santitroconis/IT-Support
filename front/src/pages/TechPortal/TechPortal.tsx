import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const TechPortal: React.FC = () => {
  const navigate = useNavigate();
  const [serial, setSerial] = useState('');
  const [type, setType] = useState('desktop');
  const [message, setMessage] = useState('');

  const handleRegisterHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8787/api/assets/hardware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serial_number: serial,
          type,
          brand: 'Dell',
          model: 'OptiPlex 3080',
          location: 'Sede Central'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Hardware registrado exitosamente con ID: ' + data.id);
        setSerial('');
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (err: any) {
      setMessage('Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }} className="animate-fade-in">
      <h1>Mesa de Ayuda - Panel de Técnico</h1>
      <p>Gestión de Inventario (Módulo I)</p>
      
      <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', maxWidth: '500px', marginTop: '2rem' }}>
        <h3>Registrar Nuevo Hardware</h3>
        {message && <div style={{ marginBottom: '1rem', color: message.includes('Error') ? 'var(--error-color)' : 'var(--accent-color)' }}>{message}</div>}
        <form onSubmit={handleRegisterHardware} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Número de Serial (S/N)" 
            className="room-input" 
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            required
          />
          <select 
            className="room-input" 
            value={type} 
            onChange={(e) => setType(e.target.value)}
          >
            <option value="desktop">Desktop (Requiere Monitor para asignar)</option>
            <option value="monitor">Monitor</option>
            <option value="laptop">Laptop</option>
            <option value="printer">Impresora de Red</option>
          </select>
          <button type="submit" className="room-join-button">Registrar en Inventario</button>
        </form>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '2rem', background: 'transparent', color: 'var(--error-color)', border: 'none', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};
