import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HardwareAsset {
  id: string;
  serial_number: string;
  type: string;
  brand: string;
  model: string;
}

interface Ticket {
  id: string;
  type: string;
  category: string;
  status: string;
  created_at: string;
}

export const UserPortal: React.FC = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<HardwareAsset[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario estructurado
  const [ticketType, setTicketType] = useState('incident');
  const [ticketCategory, setTicketCategory] = useState('outlook');
  const [ticketDesc, setTicketDesc] = useState('');

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const [assetsRes, ticketsRes] = await Promise.all([
        fetch('http://localhost:8787/api/users/me/assets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8787/api/tickets', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    try {
      await fetch('http://localhost:8787/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: ticketType, category: ticketCategory, description: ticketDesc })
      });
      fetchData(); // Recargar datos
      setTicketDesc('');
    } catch (err) {
      console.error(err);
    }
  };

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
            <p style={{ color: 'var(--text-secondary)' }}>No tienes equipos asignados actualmente.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {assets.map(asset => (
                <li key={asset.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                  <strong>{asset.type.toUpperCase()}</strong>: {asset.brand} {asset.model} <br />
                  <small style={{ color: 'var(--text-secondary)' }}>S/N: {asset.serial_number}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', flex: 1, minWidth: '300px' }}>
          <h3>Mis Tickets</h3>
          {tickets.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No tienes tickets en el historial.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tickets.map(ticket => (
                <li key={ticket.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--bg-tertiary)' }}>
                  <strong>[{ticket.status.toUpperCase()}]</strong> {ticket.type === 'incident' ? 'Falla' : 'Requerimiento'} - {ticket.category}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)', maxWidth: '600px' }}>
        <h3>Crear Nuevo Ticket</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Recuerda la política "Cero WhatsApp". Todo requerimiento debe entrar por aquí.</p>
        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <select className="room-input" value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
            <option value="incident">Reportar Incidente / Falla</option>
            <option value="requirement">Solicitar Requerimiento / Consumible</option>
          </select>

          <select className="room-input" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
            {ticketType === 'incident' ? (
              <>
                <option value="outlook">Problema con Outlook/Correo</option>
                <option value="excel">Falla en Excel/Licencia</option>
                <option value="internet">Sin conexión a Internet</option>
                <option value="core_sys">Falla en Mango / Orbis</option>
              </>
            ) : (
              <>
                <option value="toner">Solicitud de Tóner</option>
                <option value="peripheral">Reemplazo de Mouse/Teclado</option>
              </>
            )}
          </select>
          
          <textarea 
            className="room-input" 
            placeholder="Detalles adicionales (Opcional)" 
            rows={3} 
            value={ticketDesc} 
            onChange={(e) => setTicketDesc(e.target.value)}
          />
          <button type="submit" className="room-join-button">Abrir Ticket Oficial</button>
        </form>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '2rem', background: 'transparent', color: 'var(--error-color)', border: 'none', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};
