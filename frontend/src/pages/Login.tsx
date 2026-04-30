import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { Eye, EyeOff, Zap, Shield, Star, Lock, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success(t('login.welcome'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  const DEMO_ACCOUNTS = [
    { label: 'Admin', email: 'admin@marketplace.com', pass: 'Admin1234!' },
    { label: 'Cliente', email: 'cliente@test.com', pass: 'Client1234!' },
    { label: 'Profesional', email: 'profesional@test.com', pass: 'Pro1234!' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Navy left panel ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F2257 60%, #162d6e 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #60A5FA 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #93C5FD 0%, transparent 70%)' }} />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-white font-black text-2xl tracking-tight">VELORA</span>
        </Link>

        {/* Claims */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-3">
            {t('login.panel_title')}
          </h2>
          <p className="text-white/50 text-base mb-10 leading-relaxed">
            Profesionales verificados a domicilio en Barcelona
          </p>
          <div className="space-y-4">
            {[
              { icon: <Shield size={16} />, text: t('login.feature1') },
              { icon: <Lock size={16} />, text: t('login.feature2') },
              { icon: <Star size={16} />, text: t('login.feature3') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                  {item.icon}
                </div>
                <span className="text-sm text-white/70">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-sm">© 2026 VELORA</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-[#080F1E]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F2257 100%)' }}>
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-black text-[#0A1628] dark:text-[#F8FAFF] text-xl">VELORA</span>
          </div>

          <h1 className="text-3xl font-bold text-[#0A1628] dark:text-[#F8FAFF] mb-2">{t('login.title')}</h1>
          <p className="text-[#6B7280] dark:text-[#94A3B8] mb-8">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-1.5">
                {t('login.email')}
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#0A1628]/20 dark:focus:ring-[#3B82F6]/20 focus:border-[#0A1628] dark:focus:border-[#3B82F6] text-[#0A1628] dark:text-[#F8FAFF] bg-white dark:bg-[#0F1A2E] placeholder-[#6B7280] dark:placeholder-[#94A3B8] transition-colors"
                placeholder={t('login.email_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#0A1628]/20 dark:focus:ring-[#3B82F6]/20 focus:border-[#0A1628] dark:focus:border-[#3B82F6] pr-12 text-[#0A1628] dark:text-[#F8FAFF] bg-white dark:bg-[#0F1A2E] transition-colors"
                  placeholder={t('login.password_placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold rounded-xl disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
              style={{ background: '#0A1628' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2563EB'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; }}
            >
              {loading ? t('login.loading') : t('login.button')}
            </button>
          </form>

          {/* Demo accounts — collapsible */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB] dark:border-[#1E2D45]">
            <button
              type="button"
              onClick={() => setShowDemo(p => !p)}
              className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] uppercase tracking-wide transition-colors w-full"
            >
              Cuentas de demo
              <ChevronDown
                size={14}
                className={`ml-auto transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}
              />
            </button>
            {showDemo && (
              <div className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map(c => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setForm({ email: c.email, password: c.pass })}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-[#F8FAFF] dark:bg-[#0F1A2E] hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-[#E5E7EB] dark:border-[#1E2D45] hover:border-[#2563EB]/40 dark:hover:border-[#3B82F6]/40 text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] transition-all text-sm"
                  >
                    <span className="font-semibold">{c.label}:</span> {c.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-center mt-6 text-sm text-[#6B7280] dark:text-[#94A3B8]">
            {t('login.no_account')}{' '}
            <Link to="/register" className="text-[#2563EB] dark:text-[#3B82F6] font-semibold hover:underline">
              {t('login.register_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
