import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import OnboardingWizard from '../OnboardingWizard';
import { useAuth } from '../../contexts/AuthContext';

const AUTH_ROUTES = ['/login', '/register'];

export default function Layout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isAuth = AUTH_ROUTES.includes(pathname);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `onboarding_done_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowOnboarding(true);
    }
  }, [user]);

  function dismissOnboarding() {
    if (user) localStorage.setItem(`onboarding_done_${user.id}`, '1');
    setShowOnboarding(false);
  }

  if (isAuth) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <footer className="hidden md:block border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2026 VELORA · Marketplace de servicios del hogar</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Términos</Link>
            <Link to="/privacy" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
      <BottomNav />
      {showOnboarding && <OnboardingWizard onDismiss={dismissOnboarding} />}
    </div>
  );
}
