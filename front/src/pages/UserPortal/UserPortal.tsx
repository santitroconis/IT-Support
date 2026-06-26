import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Laptop, Ticket as TicketIcon, PlusCircle, MessageSquare } from 'lucide-react';
import { ChatRoom } from '../../components/ChatRoom/ChatRoom';

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
  
  const [ticketType, setTicketType] = useState('incident');
  const [ticketCategory, setTicketCategory] = useState('outlook');
  const [ticketDesc, setTicketDesc] = useState('');
  
  // Estado para controlar el chat de un ticket abierto
  const [activeChatTicketId, setActiveChatTicketId] = useState<string | null>(null);

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
      fetchData();
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden animate-fade-in">
      
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <Laptop size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Portal del Usuario</h1>
            <p className="text-xs text-muted-foreground">Self-Service S.C.I.</p>
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
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Equipos Asignados */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <Laptop className="text-primary" size={20} />
              <h2 className="text-lg font-semibold text-foreground">Mis Equipos Asignados</h2>
            </div>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1"><div className="h-4 bg-muted rounded w-3/4"></div></div>
              </div>
            ) : assets.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/50 text-center">
                No tienes equipos asignados actualmente en el sistema.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map(asset => (
                  <div key={asset.id} className="p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-md uppercase">
                        {asset.type}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{asset.brand} {asset.model}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">S/N: {asset.serial_number}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Historial de Tickets */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <TicketIcon className="text-primary" size={20} />
              <h2 className="text-lg font-semibold text-foreground">Mis Tickets</h2>
            </div>
            
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center p-4">No tienes tickets en el historial.</p>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-background border border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-destructive' : 'bg-success'}`}></span>
                        <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                          {ticket.status}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {ticket.type === 'incident' ? 'Falla' : 'Requerimiento'} - <span className="font-medium">{ticket.category}</span>
                      </p>
                    </div>
                    
                    {/* Botón de Chat para tickets abiertos */}
                    {ticket.status === 'open' && (
                      <button 
                        onClick={() => setActiveChatTicketId(ticket.id)}
                        className="mt-3 sm:mt-0 flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 rounded-md transition-colors"
                      >
                        <MessageSquare size={14} />
                        Chat Soporte
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Crear Ticket */}
        <div className="lg:col-span-1">
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
              <PlusCircle className="text-primary" size={20} />
              <h2 className="text-lg font-semibold text-foreground">Nuevo Ticket</h2>
            </div>
            
            <p className="text-xs text-muted-foreground mb-6">
              Recuerda la política "Cero WhatsApp". Todo requerimiento debe entrar por este canal oficial.
            </p>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Tipo de Solicitud</label>
                <select 
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={ticketType} 
                  onChange={(e) => setTicketType(e.target.value)}
                >
                  <option value="incident">Reportar Incidente / Falla</option>
                  <option value="requirement">Solicitar Requerimiento / Consumible</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Categoría</label>
                <select 
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={ticketCategory} 
                  onChange={(e) => setTicketCategory(e.target.value)}
                >
                  {ticketType === 'incident' ? (
                    <>
                      <option value="outlook">Problema con Outlook/Correo</option>
                      <option value="excel">Falla en Excel/Licencia</option>
                      <option value="internet">Sin conexión a Internet</option>
                      <option value="core_sys">Falla en Sistema Core</option>
                    </>
                  ) : (
                    <>
                      <option value="toner">Solicitud de Tóner</option>
                      <option value="peripheral">Reemplazo de Mouse/Teclado</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Detalles Adicionales</label>
                <textarea 
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Explica brevemente..." 
                  rows={3} 
                  value={ticketDesc} 
                  onChange={(e) => setTicketDesc(e.target.value)}
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Abrir Ticket Oficial
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
