import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n, LANGUAGES } from '../i18n';
import { notificationsApi, authApi } from '../services/api';
import { ChevronLeft, Sun, Moon, Bell, MapPin, User, MessageSquare, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIF_TYPE_KEYS = [
  'NEW_MESSAGE',
  'BOOKING_CREATED',
  'BOOKING_ACCEPTED',
  'BOOKING_COMPLETED',
  'PAYMENT_HELD',
  'PAYMENT_RELEASED',
  'VERIFICATION_APPROVED',
  'LEVEL_UP',
] as const;

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );
}

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'appearance');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const [language, setLanguage] = useState(lang);
  const [autoTranslate, setAutoTranslate] = useState(
    () => localStorage.getItem('autoTranslate') === 'true'
  );
  const [notifEnabled, setNotifEnabled] = useState<Record<string, boolean>>(() => {
    try {
      const stored = user?.notifSettings ? JSON.parse(user.notifSettings) : {};
      return NOTIF_TYPE_KEYS.reduce((acc, k) => ({ ...acc, [k]: stored[k] !== false }), {} as Record<string, boolean>);
    } catch {
      return NOTIF_TYPE_KEYS.reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<string, boolean>);
    }
  });

  const [location, setLocation] = useState({
    city: user?.professionalProfile?.city || '',
    country: user?.professionalProfile?.country || '',
  });

  const isProfessional = user?.role === 'PROFESSIONAL';

  async function saveAppearance() {
    setSaving(true);
    try {
      setLang(language);
      localStorage.setItem('autoTranslate', String(autoTranslate));
      await notificationsApi.updateSettings({ language });
      await refreshUser();
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    setSaving(true);
    try {
      await notificationsApi.updateSettings({ notifSettings: notifEnabled });
      toast.success(t('settings.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('Las contraseñas no coinciden'); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next, confirmPassword: pwForm.confirm });
      toast.success('Contraseña actualizada. Inicia sesión de nuevo.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSavingPw(false);
    }
  }

  async function saveLocation() {
    setSaving(true);
    try {
      await notificationsApi.updateLocation(location);
      toast.success(t('settings.location_saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'appearance', label: t('settings.appearance'), icon: <Sun size={16} /> },
    { id: 'notifications', label: t('settings.notifications'), icon: <Bell size={16} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={16} /> },
    ...(isProfessional ? [{ id: 'location', label: t('settings.location'), icon: <MapPin size={16} /> }] : []),
    { id: 'account', label: t('settings.account'), icon: <User size={16} /> },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <nav className="sm:w-48 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('settings.theme')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Sun size={22} className={theme === 'light' ? 'text-primary-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}`}>
                      {t('settings.theme_light')}
                    </span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Moon size={22} className={theme === 'dark' ? 'text-primary-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {t('settings.theme_dark')}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('settings.language')}</h3>
                <p className="text-xs text-gray-400 mb-3">{t('settings.language_note')}</p>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={saveAppearance}
                disabled={saving}
                className="w-full py-3 bg-primary-900 dark:bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors"
              >
                {saving ? t('common.saving') : t('settings.save_preferences')}
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('settings.notif_types')}</h3>
              <div className="space-y-3">
                {NOTIF_TYPE_KEYS.map(key => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t(`settings.notif_${key}`)}</span>
                    <Toggle
                      enabled={notifEnabled[key]}
                      onToggle={() => setNotifEnabled(p => ({ ...p, [key]: !p[key] }))}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={saveNotifications}
                disabled={saving}
                className="mt-5 w-full py-3 bg-primary-900 dark:bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors"
              >
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.auto_translate')}</h3>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('settings.auto_translate')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('settings.auto_translate_desc')}</p>
                </div>
                <Toggle
                  enabled={autoTranslate}
                  onToggle={() => setAutoTranslate(p => !p)}
                />
              </div>

              {autoTranslate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                  {t('chat.auto_translate_banner')}
                </div>
              )}

              <button
                onClick={() => {
                  localStorage.setItem('autoTranslate', String(autoTranslate));
                  toast.success(t('settings.saved'));
                }}
                className="w-full py-3 bg-primary-900 dark:bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          )}

          {activeTab === 'location' && isProfessional && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('settings.location_title')}</h3>

              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <MapPin size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Barcelona · España</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    VELORA opera exclusivamente en Barcelona. Tu área de servicio está fijada a esta ciudad.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.city')}</label>
                  <input
                    value="Barcelona"
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('settings.country')}</label>
                  <input
                    value="España"
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('settings.account_title')}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{t('settings.name')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{t('settings.email')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 dark:text-gray-400">{t('settings.role')}</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{user?.role?.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Lock size={16} className="text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cambiar contraseña</h3>
                </div>
                <form onSubmit={savePassword} className="space-y-4">
                  {([
                    { key: 'current', label: 'Contraseña actual' },
                    { key: 'next', label: 'Nueva contraseña' },
                    { key: 'confirm', label: 'Confirmar nueva contraseña' },
                  ] as const).map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                      <div className="relative">
                        <input
                          type={showPw[key] ? 'text' : 'password'}
                          value={pwForm[key]}
                          onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                          required
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">Mínimo 8 caracteres, una mayúscula, una minúscula y un número.</p>
                  <button
                    type="submit"
                    disabled={savingPw}
                    className="w-full py-3 bg-primary-900 dark:bg-primary-700 text-white font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors"
                  >
                    {savingPw ? 'Guardando...' : 'Cambiar contraseña'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
