import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../i18n';
import {
  LogOut, Shield, Zap,
  Sun, Moon, Home, Search, CalendarCheck, Briefcase, UserCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import NotificationCenter from '../common/NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleLogout() {
    await logout();
    toast.success(t('nav.logout'));
    navigate('/');
  }

  return (
    <nav
      className={`sticky top-0 z-50 bg-white dark:bg-[#080F1E] border-b transition-all duration-300 ${
        scrolled
          ? 'border-gray-200 dark:border-[#1E2D45] shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]'
          : 'border-gray-100 dark:border-[#1E2D45]/50 shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-[68px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0A1628 100%)' }}>
              <Zap size={17} className="text-white" fill="white" />
            </div>
            <span className="font-black text-[#0A1628] dark:text-[#F8FAFF] text-[1.2rem] tracking-tight">VELORA</span>
          </Link>

          {/* Desktop center nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              {[
                { to: '/dashboard', icon: <Home size={15} />, label: 'Inicio' },
                { to: '/professionals', icon: <Search size={15} />, label: 'Explorar' },
                { to: '/bookings', icon: <CalendarCheck size={15} />, label: 'Reservas' },
                { to: user.isProvider ? '/provider-hub' : '/become-provider', icon: <Briefcase size={15} />, label: 'Proveedor',
                  active: pathname.startsWith('/provider-hub') || pathname.startsWith('/become-provider') },
                { to: '/settings', icon: <UserCircle size={15} />, label: 'Perfil' },
              ].map(({ to, icon, label, active }) => {
                const isActive = active ?? (pathname === to || (to !== '/dashboard' && pathname.startsWith(to)));
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      isActive
                        ? 'text-[#0A1628] dark:text-[#F8FAFF] bg-gray-100 dark:bg-[#0F1A2E]'
                        : 'text-gray-500 dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] hover:bg-gray-50 dark:hover:bg-[#0F1A2E]'
                    }`}
                  >
                    {icon}
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#2563EB] hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Shield size={15} />
                    Admin
                  </Link>
                )}
                <NotificationCenter />

                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-400 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F8FAFF] hover:bg-gray-100 dark:hover:bg-[#0F1A2E] rounded-xl transition-all"
                  title={theme === 'dark' ? t('nav.light_mode') : t('nav.dark_mode')}
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-1">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0A1628] flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-black text-white">
                        {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF]">{user.firstName}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#0A1628] transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-bold text-white rounded-full active:scale-95 transition-all"
                  style={{ background: '#0A1628' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2563EB')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#0A1628')}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile right: notifications + theme */}
          <div className="md:hidden flex items-center gap-1">
            {user && <NotificationCenter />}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 dark:text-[#94A3B8] hover:text-gray-700 dark:hover:text-[#F8FAFF] hover:bg-gray-100 dark:hover:bg-[#0F1A2E] rounded-xl transition-all"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {user ? (
              user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0A1628] flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">
                    {user.firstName?.[0] ?? '?'}{user.lastName?.[0] ?? ''}
                  </span>
                </div>
              )
            ) : (
              <Link to="/login" className="px-3 py-1.5 text-xs font-bold text-white rounded-full" style={{ background: '#0A1628' }}>
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
