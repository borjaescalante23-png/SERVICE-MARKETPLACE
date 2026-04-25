import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import { Zap, CheckCircle, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get('role') === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'CLIENT';

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: defaultRole as 'CLIENT' | 'PROFESSIONAL',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success(t('register.success'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

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
            {t('register.panel_title')}
          </h2>
          <div className="space-y-5">
            <div
              onClick={() => setForm(p => ({ ...p, role: 'CLIENT' }))}
              className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                form.role === 'CLIENT' ? 'bg-white/15 border border-white/30' : 'hover:bg-white/10'
              }`}
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{t('register.im_client')}</p>
                <p className="text-white/60 text-sm mt-0.5">{t('register.client_desc')}</p>
              </div>
              {form.role === 'CLIENT' && <CheckCircle size={18} className="text-primary-300 ml-auto flex-shrink-0 mt-1" />}
            </div>

            <div
              onClick={() => setForm(p => ({ ...p, role: 'PROFESSIONAL' }))}
              className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                form.role === 'PROFESSIONAL' ? 'bg-white/15 border border-white/30' : 'hover:bg-white/10'
              }`}
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{t('register.im_professional')}</p>
                <p className="text-white/60 text-sm mt-0.5">{t('register.pro_desc')}</p>
              </div>
              {form.role === 'PROFESSIONAL' && <CheckCircle size={18} className="text-primary-300 ml-auto flex-shrink-0 mt-1" />}
            </div>
          </div>
        </div>

        <p className="text-white/30 text-sm">© 2026 VELORA</p>
      </div>

      {/* White form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-primary-900 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-primary-900 dark:text-white text-xl">VELORA</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('register.title')}</h1>
          <p className="text-gray-500 mb-8">{t('register.subtitle')}</p>

          {/* Mobile role toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 mb-6 lg:hidden">
            {(['CLIENT', 'PROFESSIONAL'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm(p => ({ ...p, role: r }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  form.role === r ? 'bg-primary-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {r === 'CLIENT' ? t('register.role_client') : t('register.role_professional')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('register.firstname')}</label>
                <input
                  required
                  value={form.firstName}
                  onChange={set('firstName')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 text-gray-900 dark:text-white dark:bg-gray-800"
                  placeholder={t('register.firstname_placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('register.lastname')}</label>
                <input
                  required
                  value={form.lastName}
                  onChange={set('lastName')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 text-gray-900 dark:text-white dark:bg-gray-800"
                  placeholder={t('register.lastname_placeholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('register.email')}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 text-gray-900 dark:text-white dark:bg-gray-800"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('register.password')}</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-600 text-gray-900 dark:text-white dark:bg-gray-800"
                placeholder={t('register.password_placeholder')}
              />
            </div>

            {form.role === 'PROFESSIONAL' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-1">{t('register.verification_title')}</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {t('register.verification_desc')}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors shadow-sm mt-2"
            >
              {loading ? t('register.loading') : (
                form.role === 'CLIENT' ? t('register.button_client') : t('register.button_professional')
              )}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            {t('register.have_account')}{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:underline">
              {t('register.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
