import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { Eye, EyeOff, Zap, Shield, Star, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex">
      {/* Navy panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary-900 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight">VELORA</span>
        </Link>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-6">
            {t('login.panel_title')}
          </h2>
          <div className="space-y-4">
            {[
              { icon: <Shield size={18} />, text: t('login.feature1') },
              { icon: <Lock size={18} />, text: t('login.feature2') },
              { icon: <Star size={18} />, text: t('login.feature3') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="text-primary-300">{item.icon}</div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-sm">© 2026 VELORA</p>
      </div>

      {/* White form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-primary-900 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-primary-900 dark:text-white text-xl">VELORA</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('login.title')}</h1>
          <p className="text-gray-500 mb-8">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('login.email')}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 placeholder-gray-400"
                placeholder={t('login.email_placeholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent pr-12 text-gray-900 dark:text-white dark:bg-gray-800"
                  placeholder={t('login.password_placeholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? t('login.loading') : t('login.button')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('login.test_accounts')}</p>
            <div className="space-y-2">
              {[
                { label: 'Admin', email: 'admin@marketplace.com', pass: 'Admin1234!' },
                { label: 'Cliente', email: 'cliente@test.com', pass: 'Client1234!' },
                { label: 'Profesional', email: 'profesional@test.com', pass: 'Pro1234!' },
              ].map(c => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setForm({ email: c.email, password: c.pass })}
                  className="w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 border border-transparent text-gray-600 dark:text-gray-300 hover:text-primary-800 transition-all text-sm"
                >
                  <span className="font-semibold">{c.label}:</span> {c.email}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            {t('login.no_account')}{' '}
            <Link to="/register" className="text-primary-700 font-semibold hover:underline">
              {t('login.register_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
