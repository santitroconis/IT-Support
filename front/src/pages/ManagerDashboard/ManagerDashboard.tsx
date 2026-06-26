import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }} className="animate-fade-in">
      <h1>Dashboard Gerencial S.C.I.</h1>
      <p>Métricas de tiempos de respuesta, resolución y stock crítico en tiempo real.</p>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        
        {/* Panel de Tickets */}
        <div style={{ flex: 1, minWidth: '300px', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--bg-tertiary)' }}>
          <h3>Estadísticas de Tickets (SLA)</h3>
          {ticketStats.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Sin datos suficientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {ticketStats.map(stat => (
                <div key={stat.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px' }}>
                  <span style={{ textTransform: 'capitalize' }}>{stat.status === 'open' ? '🔴 Abiertos' : stat.status === 'resolved' ? '🟢 Resueltos' : stat.status}</span>
                  <strong>{stat.count}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Stock */}
        <div style={{ flex: 1, minWidth: '300px', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--error-color)' }}>
          <h3 style={{ color: 'var(--error-color)' }}>Alertas de Stock Crítico</h3>
          {stockAlerts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No hay consumibles en estado crítico.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {stockAlerts.map((alert, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', borderLeft: '4px solid var(--error-color)' }}>
                  <span>{alert.name}</span>
                  <strong style={{ color: 'var(--error-color)' }}>{alert.stock_central} unds.</strong>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <button onClick={handleLogout} style={{ marginTop: '3rem', background: 'transparent', color: 'var(--error-color)', border: 'none', cursor: 'pointer' }}>
        Cerrar Sesión
      </button>
    </div>
  );
};
