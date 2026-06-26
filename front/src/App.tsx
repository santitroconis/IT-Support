import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { UserPortal } from './pages/UserPortal/UserPortal';
import { TechPortal } from './pages/TechPortal/TechPortal';
import { ManagerDashboard } from './pages/ManagerDashboard/ManagerDashboard';
import './index.css';

// Componente protector de rutas
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const token = localStorage.getItem('auth_token');
  const userDataStr = localStorage.getItem('user_data');
  
  if (!token || !userDataStr) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userDataStr);
    if (!allowedRoles.includes(user.role)) {
      // Redirigir a su portal correcto si intenta acceder a otro
      if (user.role === 'manager') return <Navigate to="/manager" replace />;
      if (user.role === 'tech') return <Navigate to="/tech" replace />;
      return <Navigate to="/user" replace />;
    }
  } catch (e) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/user/*" element={
          <ProtectedRoute allowedRoles={['user', 'tech', 'manager']}>
            <UserPortal />
          </ProtectedRoute>
        } />

        <Route path="/tech/*" element={
          <ProtectedRoute allowedRoles={['tech', 'manager']}>
            <TechPortal />
          </ProtectedRoute>
        } />

        <Route path="/manager/*" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
