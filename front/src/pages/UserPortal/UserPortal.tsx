import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HardwareAsset {
  id: string;
  serial_number: string;
  type: string;
  brand: string;
  model: string;
}

export const UserPortal: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<HardwareAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:8787/api/users/me/assets', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
        }
      } catch (err) {
        console.error('Error fetching assets', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssets();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }} className="animate-fade-in">
      <h1>Portal del Usuario (Self-Service)</h1>
      <p>Bienvenido. Desde aquí podrás reportar incidentes y solicitar consumibles.</p>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', flex: 1, minWidth: '300px' }}>
          <h3>Mis Equipos Asignados</h3>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Cargando inventario...</p>
          ) : assets.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No tienes equipos asignados actualmente en el sistema corporativo.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {assets.map(asset => (
                <li key={asset.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                  <strong>{asset.type.toUpperCase()}</strong>: {asset.brand} {asset.model} 
                  <br />
                  <small style={{ color: 'var(--text-secondary)' }}>S/N: {asset.serial_number}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', flex: 1, minWidth: '300px' }}>
          <h3>Mis Tickets Activos</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No tienes tickets abiertos.</p>
          <button className="room-join-button" style={{ marginTop: '1rem' }}>Crear Nuevo Requerimiento</button>
        </div>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '2rem', background: 'transparent', color: 'var(--error-color)', border: 'none', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};
