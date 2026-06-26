import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Settings, HardDrive, CheckCircle, MessageSquare, Box, Users } from 'lucide-react';
import { ChatRoom } from '../../components/ChatRoom/ChatRoom';

interface Ticket {
  id: string;
  user_id: string;
  type: string;
  category: string;
  status: string;
  description: string;
  created_at: string;
}

interface HardwareAsset {
  id: string;
  serial_number: string;
  type: string;
  brand: string;
  model: string;
  assigned_user_id: string | null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

export const TechPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tickets' | 'inventory'>('tickets');
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<HardwareAsset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [serial, setSerial] = useState('');
  const [type, setType] = useState('desktop');
  const [message, setMessage] = useState('');
  
  const [assignUserId, setAssignUserId] = useState('');
  const [assignAssetIds, setAssignAssetIds] = useState<string[]>([]);
  const [assignMsg, setAssignMsg] = useState('');

  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const [ticketsRes, assetsRes, usersRes] = await Promise.all([
        fetch('http://localhost:8787/api/tickets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8787/api/assets/all', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:8787/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
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
        body: JSON.stringify({ serial_number: serial, type, brand: 'Genérica', model: 'Genérica', location: 'Sede Central' })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registrado: ' + data.id);
        setSerial('');
        fetchData();
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (err) {
      setMessage('Error de red');
    }
  };

  const handleAssignHardware = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || assignAssetIds.length === 0) {
      setAssignMsg('Error: Selecciona un usuario y al menos un equipo.');
      return;
    }
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('http://localhost:8787/api/assets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: assignUserId, hardwareIds: assignAssetIds })
      });
      const data = await response.json();
      if (response.ok) {
        setAssignMsg('Equipos asignados exitosamente.');
        setAssignAssetIds([]);
        fetchData();
      } else {
        setAssignMsg('Error: ' + data.error);
      }
    } catch (err) {
      setAssignMsg('Error de conexión');
    }
  };

  const handleToggleAssetSelection = (id: string) => {
    setAssignAssetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleResolve = async (ticketId: string, category: string) => {
    const token = localStorage.getItem('auth_token');
    const payload: any = { resolution_notes: 'Resuelto por soporte técnico' };
    if (category === 'toner') {
      payload.consumable_id = 'mock-toner-id-123';
      payload.resolution_notes = 'Tóner reemplazado. Stock deducido.';
    }
    try {
      await fetch(`http://localhost:8787/api/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      fetchData();
      if (activeChatTicketId === ticketId) setActiveChatTicketId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden animate-fade-in">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r border-border pr-6">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Mesa de Ayuda</h1>
              <p className="text-xs text-muted-foreground">Panel de Técnico S.C.I.</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'tickets' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Settings size={16} />
              Tickets Kanban
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Box size={16} />
              Inventario y Asignación
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'tickets' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                  <Settings className="text-primary" size={20} />
                  <h2 className="text-lg font-semibold text-foreground">Bandeja Kanban: Tickets Abiertos</h2>
                </div>
                {tickets.filter(t => t.status === 'open').length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-6 rounded-lg border border-border/50 text-center flex flex-col items-center gap-2">
                    <CheckCircle className="text-success" size={24} />
                    Excelente trabajo, no hay tickets pendientes.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {tickets.filter(t => t.status === 'open').map(ticket => (
                      <div key={ticket.id} className="p-4 rounded-lg bg-background border border-border flex flex-col sm:flex-row justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ticket.type === 'incident' ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                              {ticket.type === 'incident' ? 'Falla' : 'Requerimiento'}
                            </span>
                            <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">{ticket.category.toUpperCase()}</h3>
                          <p className="text-xs text-muted-foreground mt-1">Usuario ID: {ticket.user_id}</p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 justify-center">
                          <button onClick={() => setActiveChatTicketId(ticket.id)} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 rounded-md transition-colors w-full sm:w-auto">
                            <MessageSquare size={14} /> Abrir Chat
                          </button>
                          <button onClick={() => handleResolve(ticket.id, ticket.category)} className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-success text-white hover:bg-success/90 rounded-md transition-colors w-full sm:w-auto">
                            <CheckCircle size={14} /> Resolver
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
            <div className="lg:col-span-1">
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                  <HardDrive className="text-primary" size={20} />
                  <h2 className="text-lg font-semibold text-foreground">Registro Rápido</h2>
                </div>
                {message && <div className={`text-xs p-3 rounded-md mb-4 ${message.includes('Error') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>{message}</div>}
                <form onSubmit={handleRegisterHardware} className="space-y-4">
                  <input type="text" className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase" placeholder="S/N (Ej: AB123456)" value={serial} onChange={(e) => setSerial(e.target.value)} required />
                  <select className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="desktop">Desktop PC</option>
                    <option value="monitor">Monitor</option>
                    <option value="laptop">Laptop</option>
                  </select>
                  <button type="submit" className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">Guardar en Inventario</button>
                </form>
              </section>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                <Box className="text-primary" size={20} />
                <h2 className="text-lg font-semibold text-foreground">Inventario Físico (Global)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Serial (S/N)</th>
                      <th className="px-4 py-3">Asignado a</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(a => (
                      <tr key={a.id} className="border-b border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-foreground uppercase">{a.type}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.serial_number}</td>
                        <td className="px-4 py-3">
                          {a.assigned_user_id ? (
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded-md text-xs">{a.assigned_user_id}</span>
                          ) : (
                            <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">En Bodega</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
            <section className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                <Users className="text-primary" size={20} />
                <h2 className="text-lg font-semibold text-foreground">Asignación a Empleado</h2>
              </div>
              {assignMsg && (
                  <div className={`text-xs p-3 rounded-md mb-4 ${assignMsg.includes('Error') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
                    {assignMsg}
                  </div>
              )}
              <form onSubmit={handleAssignHardware} className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">1. Seleccionar Usuario</label>
                  <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" required>
                    <option value="" disabled>-- Elige un empleado --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">2. Seleccionar Equipos en Bodega (Multi-selección)</label>
                  <div className="max-h-[200px] overflow-y-auto border border-border rounded-md bg-background p-2 space-y-2">
                    {assets.filter(a => !a.assigned_user_id).length === 0 && <p className="text-xs text-muted-foreground p-2">No hay equipos libres.</p>}
                    {assets.filter(a => !a.assigned_user_id).map(a => (
                      <label key={a.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-md cursor-pointer border border-transparent hover:border-border">
                        <input type="checkbox" checked={assignAssetIds.includes(a.id)} onChange={() => handleToggleAssetSelection(a.id)} className="accent-primary w-4 h-4" />
                        <span className="text-sm text-foreground font-medium uppercase">{a.type}</span>
                        <span className="text-xs text-muted-foreground">{a.serial_number}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/30 border border-border p-3 rounded-md">
                  <p className="text-xs text-muted-foreground"><strong>Nota:</strong> Las políticas exigen que si asignas un DESKTOP, debe ir acompañado de un MONITOR en la misma transacción (o el usuario debe tener uno ya asignado). De lo contrario, el sistema rechazará la operación.</p>
                </div>
                
                <button type="submit" className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">Ejecutar Asignación de Activos</button>
              </form>
            </section>
          </div>
        )}
      </main>

      {activeChatTicketId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setActiveChatTicketId(null)}></div>
          <div className="relative w-full max-w-md h-full shadow-2xl animate-fade-in" style={{ transformOrigin: 'right', animation: 'slideIn 0.3s ease-out forwards' }}>
            <ChatRoom ticketId={activeChatTicketId} onClose={() => setActiveChatTicketId(null)} />
          </div>
        </div>
      )}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
};
