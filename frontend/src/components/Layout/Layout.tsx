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
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <footer className="hidden md:block" style={{ background: '#0A1628', color: '#fff', padding: '60px 32px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 36 * 0.31, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round">
                    <path d="M13 2 L4 14 H10 L8 22 L19 10 H13 Z" />
                  </svg>
                </div>
                <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.02em', color: '#fff' }}>VELORA</span>
              </div>
              <p style={{ marginTop: 16, fontSize: 14, fontWeight: 300, color: '#94A3B8', lineHeight: 1.6, maxWidth: 320 }}>
                Servicios premium a domicilio. Profesionales verificados, pago seguro y garantía en cada reserva.
              </p>
            </div>
            {[
              { title: 'Servicios', items: ['Limpieza', 'Fontanería', 'Peluquería', 'Cuidado mayores'] },
              { title: 'Empresa', items: ['Nosotros', 'Profesionales', 'Cómo funciona', 'Contacto'] },
              { title: 'Confianza', items: ['Garantías', 'Pago seguro', 'KYC', 'Privacidad'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff', marginBottom: 14 }}>{col.title}</div>
                {col.items.map(item => (
                  <div key={item} style={{ fontSize: 13, fontWeight: 400, color: '#94A3B8', padding: '5px 0', cursor: 'pointer' }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1E2D45', paddingTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8' }}>
            <span>© 2026 VELORA · Barcelona</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link to="/terms" style={{ color: '#94A3B8', textDecoration: 'none' }}>Términos</Link>
              <Link to="/privacy" style={{ color: '#94A3B8', textDecoration: 'none' }}>Privacidad</Link>
              <span style={{ cursor: 'pointer' }}>Cookies</span>
            </div>
          </div>
        </div>
      </footer>
      <BottomNav />
      {showOnboarding && <OnboardingWizard onDismiss={dismissOnboarding} />}
    </div>
  );
}
