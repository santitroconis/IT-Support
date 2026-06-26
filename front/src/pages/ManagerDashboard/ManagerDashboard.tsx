import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react';

interface TicketStat {
  status: string;
  count: number;
}

interface StockAlert {
  name: string;
  stock_central: number;
}

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [ticketStats, setTicketStats] = useState<TicketStat[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
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
    fetchMetrics();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getStatusIcon = (status: string) => {
    if (status === 'resolved') return <CheckCircle2 className="text-success" size={20} />;
    if (status === 'open') return <CircleDashed className="text-destructive animate-spin-slow" size={20} />;
    return <CircleDashed className="text-muted-foreground" size={20} />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden animate-fade-in">
      
      {/* Navbar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">Dashboard Gerencial</h1>
            <p className="text-xs text-muted-foreground">Métricas S.C.I.</p>
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
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
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
                    {getStatusIcon(stat.status)}
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

      </main>

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
