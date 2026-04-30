import { useAuth } from '../../contexts/AuthContext';
import ClientDashboard from './ClientDashboard';
import AdminDashboard from './AdminDashboard';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  return <ClientDashboard />;
}
