import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Settings, HardDrive, CheckCircle, MessageSquare } from 'lucide-react';
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

export const TechPortal: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [serial, setSerial] = useState('');
  const [type, setType] = useState('desktop');
  const [message, setMessage] = useState('');
  
  // Estado para controlar el chat de un ticket abierto
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);

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
      
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Mesa de Ayuda</h1>
            <p className="text-xs text-muted-foreground">Panel de Técnico S.C.I.</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bandeja de Tickets */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <Settings className="text-primary" size={20} />
              <h2 className="text-lg font-semibold text-foreground">Bandeja Kanban: Tickets Abiertos</h2>
            </div>

            {tickets.filter(t => t.status === 'open').length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 p-6 rounded-lg border border-border/50 text-center flex flex-col items-center gap-2">
                <CheckCircle className="text-success" size={24} />
                Excelente trabajo, no hay tickets pendientes de resolución.
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
                      {ticket.description && <p className="text-xs text-muted-foreground mt-1 italic">"{ticket.description}"</p>}
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 justify-center">
                      <button 
                        onClick={() => setActiveChatTicketId(ticket.id)}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 rounded-md transition-colors w-full sm:w-auto"
                      >
                        <MessageSquare size={14} />
                        Abrir Chat
                      </button>
                      <button 
                        onClick={() => handleResolve(ticket.id, ticket.category)} 
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-success text-white hover:bg-success/90 rounded-md transition-colors w-full sm:w-auto"
                      >
                        <CheckCircle size={14} />
                        Resolver Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Registro de Hardware */}
        <div className="lg:col-span-1">
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <HardDrive className="text-primary" size={20} />
              <h2 className="text-lg font-semibold text-foreground">Registro de Inventario</h2>
            </div>
            
            {message && (
              <div className={`text-xs p-3 rounded-md mb-4 ${message.includes('Error') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
                {message}
              </div>
            )}
            
            <form onSubmit={handleRegisterHardware} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Número de Serial (S/N)</label>
                <input 
                  type="text" 
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  placeholder="Ej: AB123456"
                  value={serial} 
                  onChange={(e) => setSerial(e.target.value)} 
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Tipo de Equipo</label>
                <select 
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="desktop">Desktop PC</option>
                  <option value="monitor">Monitor</option>
                  <option value="laptop">Laptop</option>
                  <option value="printer">Impresora</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Guardar Activo en D1
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* Drawer del Chat en Tiempo Real */}
      {activeChatTicketId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setActiveChatTicketId(null)}></div>
          <div className="relative w-full max-w-md h-full shadow-2xl animate-fade-in" style={{ transformOrigin: 'right', animation: 'slideIn 0.3s ease-out forwards' }}>
            <ChatRoom ticketId={activeChatTicketId} onClose={() => setActiveChatTicketId(null)} />
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
