import { useAuth } from '../../contexts/AuthContext';
import ClientDashboard from './ClientDashboard';
import ProfessionalDashboard from './ProfessionalDashboard';
import AdminDashboard from './AdminDashboard';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.isProvider) return <ProfessionalDashboard />;
  return <ClientDashboard />;
}
