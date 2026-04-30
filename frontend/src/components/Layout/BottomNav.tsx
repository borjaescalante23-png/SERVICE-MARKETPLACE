import { Link, useLocation } from 'react-router-dom';
import { Home, Search, CalendarCheck, Briefcase, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';

function NavItem({ to, icon, label, active, badge }: {
  to: string; icon: React.ReactNode; label: string; active: boolean; badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative transition-colors ${
        active ? 'text-[#0A1628] dark:text-white' : 'text-gray-400 dark:text-gray-600'
      }`}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold px-0.5">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-semibold leading-none">{label}</span>
      {active && (
        <span className="absolute bottom-0 inset-x-0 flex justify-center">
          <span className="w-5 h-0.5 rounded-full bg-[#2563EB]" />
        </span>
      )}
    </Link>
  );
}

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ page: 1 }).then(r => r.data),
    refetchInterval: 30000,
    enabled: !!user,
    staleTime: 15000,
  });
  const unread = notifData?.unreadCount || 0;

  const navClass = "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800";
  const wrapStyle = { paddingBottom: 'env(safe-area-inset-bottom)' };

  if (!user) {
    return (
      <nav className={navClass} style={wrapStyle}>
        <div className="flex h-16">
          <NavItem to="/" icon={<Home size={22} />} label="Inicio" active={pathname === '/'} />
          <NavItem to="/professionals" icon={<Search size={22} />} label="Servicios" active={pathname.startsWith('/professionals')} />
          <NavItem to="/login" icon={<UserCircle size={22} />} label="Entrar" active={pathname === '/login'} />
        </div>
      </nav>
    );
  }

  const providerTo = user.isProvider ? '/provider-hub' : '/become-provider';
  const isProviderActive = pathname.startsWith('/provider-hub') || pathname.startsWith('/become-provider');

  return (
    <nav className={navClass} style={wrapStyle}>
      <div className="flex h-16">
        <NavItem
          to="/dashboard"
          icon={<Home size={22} />}
          label="Inicio"
          active={pathname === '/dashboard'}
        />
        <NavItem
          to="/professionals"
          icon={<Search size={22} />}
          label="Explorar"
          active={pathname.startsWith('/professionals')}
        />
        <NavItem
          to="/bookings"
          icon={<CalendarCheck size={22} />}
          label="Reservas"
          active={pathname === '/bookings' || (pathname.startsWith('/bookings') && pathname !== '/bookings')}
          badge={unread}
        />
        <NavItem
          to={providerTo}
          icon={<Briefcase size={22} />}
          label="Proveedor"
          active={isProviderActive}
        />
        <NavItem
          to="/settings"
          icon={<UserCircle size={22} />}
          label="Perfil"
          active={pathname.startsWith('/settings')}
        />
      </div>
    </nav>
  );
}
