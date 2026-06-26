import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Laptop } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email.endsWith('@gruposerex.com')) {
      setError('Debes usar un correo corporativo válido.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8787/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));

      if (data.user.role === 'manager') navigate('/manager');
      else if (data.user.role === 'tech') navigate('/tech');
      else navigate('/user');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 animate-fade-in">
      <form 
        onSubmit={handleLogin}
        className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-2xl flex flex-col items-center text-center gap-6"
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          <Laptop size={40} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Portal S.C.I.</h2>
          <p className="text-muted-foreground text-sm">Sistema Centralizado de Inventario y Soporte TI</p>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 w-full p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="w-full space-y-4">
          <input 
            type="email" 
            placeholder="tucorreo@gruposerex.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground text-center"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? 'Autenticando...' : 'Ingresar al Portal'}
          </button>
        </div>
      </form>
    </div>
  );
};
