import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, AlertTriangle, CheckCircle2, CircleDashed, Users, UserPlus } from 'lucide-react';

interface TicketStat {
  status: string;
  count: number;
}

interface StockAlert {
  name: string;
  stock_central: number;
}

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
  department: string;
}

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'metrics' | 'directory'>('metrics');
  
  // Metrics State
  const [ticketStats, setTicketStats] = useState<TicketStat[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  
  // Directory State
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newDept, setNewDept] = useState('');
  const [userMsg, setUserMsg] = useState('');

  const fetchMetrics = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8787/api/metrics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTicketStats(data.ticketStats || []);
        setStockAlerts(data.stockAlerts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:8787/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(await response.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('http://localhost:8787/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail, full_name: newName, role: newRole, department: newDept })
      });
      const data = await response.json();
      if (response.ok) {
        setUserMsg('Usuario creado exitosamente');
        setNewEmail(''); setNewName(''); setNewDept('');
        fetchUsers();
      } else {
        setUserMsg('Error: ' + data.error);
      }
    } catch (err) {
      setUserMsg('Error de red');
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
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r border-border pr-6">
            <div className="bg-primary/20 p-2 rounded-lg text-primary">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight">Dashboard Gerencial</h1>
              <p className="text-xs text-muted-foreground">Métricas S.C.I.</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'metrics' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              Métricas y SLA
            </button>
            <button 
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'directory' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Users size={16} />
              Directorio de Usuarios
            </button>
          </nav>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        
        {activeTab === 'metrics' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Panel SLA */}
            <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                <BarChart3 className="text-primary" size={20} />
                <h2 className="text-lg font-semibold text-foreground">Estadísticas de Tickets (SLA)</h2>
              </div>
              {ticketStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay datos suficientes para mostrar métricas.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {ticketStats.map(stat => (
                    <div key={stat.status} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {stat.status === 'resolved' ? <CheckCircle2 className="text-success" size={20} /> : <CircleDashed className="text-destructive animate-spin-slow" size={20} />}
                        <span className="font-medium text-foreground capitalize">
                          {stat.status === 'open' ? 'Tickets Abiertos' : stat.status === 'resolved' ? 'Tickets Resueltos' : stat.status}
                        </span>
                      </div>
                      <span className="text-2xl font-bold text-foreground">{stat.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Panel Stock */}
            <section className="bg-card border border-destructive/50 rounded-xl p-6 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                <AlertTriangle className="text-destructive" size={20} />
                <h2 className="text-lg font-semibold text-destructive">Alertas de Stock Crítico</h2>
              </div>
              {stockAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <CheckCircle2 className="text-success opacity-50" size={32} />
                  <p className="text-sm text-muted-foreground">Niveles de inventario estables. No hay alertas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {stockAlerts.map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{alert.name}</span>
                        <span className="text-xs text-muted-foreground">Reposición requerida inmediatamente</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-bold text-destructive">{alert.stock_central}</span>
                        <span className="text-xs text-destructive/80">unidades restantes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2">
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                  <Users className="text-primary" size={20} />
                  <h2 className="text-lg font-semibold text-foreground">Directorio Corporativo</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Rol</th>
                        <th className="px-4 py-3">Departamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-border hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-foreground">{u.full_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-semibold ${u.role === 'manager' ? 'bg-primary/20 text-primary' : u.role === 'tech' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            
            <div className="lg:col-span-1">
              <section className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                  <UserPlus className="text-primary" size={20} />
                  <h2 className="text-lg font-semibold text-foreground">Dar de Alta</h2>
                </div>
                {userMsg && (
                  <div className={`text-xs p-3 rounded-md mb-4 ${userMsg.includes('Error') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-success/10 text-success border border-success/20'}`}>
                    {userMsg}
                  </div>
                )}
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <input type="text" placeholder="Nombre Completo" value={newName} onChange={e => setNewName(e.target.value)} required className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="email" placeholder="Correo (@gruposerex.com)" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input type="text" placeholder="Departamento" value={newDept} onChange={e => setNewDept(e.target.value)} required className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="user">Usuario (Self-Service)</option>
                    <option value="tech">Técnico (Soporte)</option>
                    <option value="manager">Gerente</option>
                  </select>
                  <button type="submit" className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">Crear Empleado</button>
                </form>
              </section>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
