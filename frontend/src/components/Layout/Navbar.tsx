import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    toast.success('Sesión cerrada');
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Verified</span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:block">Dashboard</span>
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                  >
                    <Shield size={16} />
                    <span className="hidden sm:block">Admin</span>
                  </Link>
                )}

                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-700">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.firstName}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
