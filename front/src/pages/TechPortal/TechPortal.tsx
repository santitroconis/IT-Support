import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Ticket {
  id: string;
  user_id: string;
  type: string;
  category: string;
  status: string;
  description: string;
  created_at: string;
}

export const TechPortal: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [serial, setSerial] = useState('');
  const [type, setType] = useState('desktop');
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:8787/api/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setTickets(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('http://localhost:8787/api/assets/hardware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ serial_number: serial, type, brand: 'Dell', model: 'Genérica', location: 'Sede Central' })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Hardware registrado exitosamente con ID: ' + data.id);
        setSerial('');
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (err) {
      setMessage('Error de conexión');
    }
  };

  const handleResolve = async (ticketId: string, category: string) => {
    const token = localStorage.getItem('auth_token');
    // Si la categoría es tóner, simulamos enviar un consumable_id para disparar el descuento de stock
    const payload: any = { resolution_notes: 'Resuelto por soporte técnico' };
    if (category === 'toner') {
      payload.consumable_id = 'mock-toner-id-123'; // En una app real, el técnico selecciona qué consumible gastó
      payload.resolution_notes = 'Tóner reemplazado. Stock deducido.';
    }

    try {
      await fetch(`http://localhost:8787/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      fetchData(); // Recargar tickets
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
      <h1>Mesa de Ayuda - Panel de Técnico</h1>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        <div style={{ flex: 2, minWidth: '400px' }}>
          <h2>Bandeja de Tickets Abiertos</h2>
          {tickets.filter(t => t.status === 'open').length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Excelente trabajo, no hay tickets pendientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {tickets.filter(t => t.status === 'open').map(ticket => (
                <div key={ticket.id} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{ticket.type === 'incident' ? '🔴 Falla' : '🟢 Requerimiento'} - {ticket.category.toUpperCase()}</strong>
                    <button 
                      onClick={() => handleResolve(ticket.id, ticket.category)} 
                      style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Resolver
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Usuario: {ticket.user_id} | {ticket.description || 'Sin detalles'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)' }}>
            <h3>Registrar Hardware</h3>
            {message && <div style={{ marginBottom: '1rem', color: message.includes('Error') ? 'var(--error-color)' : 'var(--accent-color)' }}>{message}</div>}
            <form onSubmit={handleRegisterHardware} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="S/N" className="room-input" value={serial} onChange={(e) => setSerial(e.target.value)} required />
              <select className="room-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="desktop">Desktop</option>
                <option value="monitor">Monitor</option>
                <option value="laptop">Laptop</option>
                <option value="printer">Impresora</option>
              </select>
              <button type="submit" className="room-join-button">Guardar Activo</button>
            </form>
          </div>
        </div>
      </div>

      <button onClick={handleLogout} style={{ marginTop: '3rem', background: 'transparent', color: 'var(--error-color)', border: 'none', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};
