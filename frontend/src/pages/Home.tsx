import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import {
  Shield, Star, CheckCircle, Lock, Users, Award, ArrowRight, Zap,
  Scissors, Sparkles, Wrench, Hammer, BookOpen, UtensilsCrossed,
  Activity, Hand, Heart, Leaf, MapPin, X,
} from 'lucide-react';
import { CATEGORY_LABELS, ServiceCategory } from '../types';

const FEATURED_CATEGORIES: { cat: ServiceCategory; icon: React.ReactNode; color: string }[] = [
  { cat: 'PLUMBING',        icon: <Wrench size={22} />,          color: 'text-blue-600 bg-blue-50' },
  { cat: 'ELECTRICIAN',     icon: <Zap size={22} />,             color: 'text-amber-600 bg-amber-50' },
  { cat: 'GARDENING',       icon: <Leaf size={22} />,            color: 'text-green-600 bg-green-50' },
  { cat: 'CLEANING',        icon: <Sparkles size={22} />,        color: 'text-cyan-600 bg-cyan-50' },
  { cat: 'HANDYMAN',        icon: <Hammer size={22} />,          color: 'text-orange-600 bg-orange-50' },
  { cat: 'CHEF',            icon: <UtensilsCrossed size={22} />, color: 'text-rose-600 bg-rose-50' },
  { cat: 'HAIRDRESSING',    icon: <Scissors size={22} />,        color: 'text-violet-600 bg-violet-50' },
  { cat: 'PERSONAL_TRAINER',icon: <Activity size={22} />,        color: 'text-red-600 bg-red-50' },
  { cat: 'MASSAGE',         icon: <Hand size={22} />,            color: 'text-teal-600 bg-teal-50' },
];

const BCN_LAT_MIN = 41.25, BCN_LAT_MAX = 41.55, BCN_LNG_MIN = 1.90, BCN_LNG_MAX = 2.35;

function LocationBanner() {
  const { t } = useI18n();
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied' | 'dismissed' | 'outside'>(() => {
    return (localStorage.getItem('locationStatus') as any) || 'idle';
  });

  async function requestLocation() {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      const inBarcelona = lat >= BCN_LAT_MIN && lat <= BCN_LAT_MAX && lng >= BCN_LNG_MIN && lng <= BCN_LNG_MAX;
      if (!inBarcelona) {
        localStorage.setItem('locationStatus', 'outside');
        setStatus('outside');
        return;
      }
      localStorage.setItem('userCity', 'Barcelona');
      localStorage.setItem('locationStatus', 'granted');
      setStatus('granted');
    } catch {
      localStorage.setItem('locationStatus', 'denied');
      setStatus('denied');
    }
  }

  function dismiss() {
    localStorage.setItem('locationStatus', 'dismissed');
    setStatus('dismissed');
  }

  if (status === 'granted' || status === 'denied' || status === 'dismissed') return null;

  if (status === 'outside') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 mb-8 max-w-6xl mx-auto">
        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900">VELORA solo opera en Barcelona</p>
          <p className="text-xs text-red-600 mt-0.5">Por ahora solo ofrecemos servicios dentro de la ciudad de Barcelona.</p>
        </div>
        <button onClick={dismiss} className="p-1.5 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-center gap-4 mb-8 max-w-6xl mx-auto">
      <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
        <MapPin size={18} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-900">{t('location.banner_title')}</p>
        <p className="text-xs text-primary-600 mt-0.5">{t('location.banner_subtitle')}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={requestLocation}
          className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
        >
          {t('location.activate')}
        </button>
        <button onClick={dismiss} className="p-1.5 text-primary-400 hover:text-primary-600 transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const city = 'Barcelona';

  const TRUST_PILLARS = [
    {
      icon: <CheckCircle size={24} className="text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      title: t('trust.verified_title'),
      desc: t('trust.verified_desc'),
    },
    {
      icon: <Lock size={24} className="text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      title: t('trust.escrow_title'),
      desc: t('trust.escrow_desc'),
    },
    {
      icon: <Star size={24} className="text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      title: t('trust.reviews_title'),
      desc: t('trust.reviews_desc'),
    },
    {
      icon: <Shield size={24} className="text-primary-500" />,
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      title: t('trust.fraud_title'),
      desc: t('trust.fraud_desc'),
    },
    {
      icon: <Users size={24} className="text-violet-500" />,
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      title: t('trust.closed_title'),
      desc: t('trust.closed_desc'),
    },
    {
      icon: <Award size={24} className="text-rose-500" />,
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      title: t('trust.experience_title'),
      desc: t('trust.experience_desc'),
    },
  ];

  const STEPS = [
    { step: '1', title: t('home.step1_title'), desc: t('home.step1_desc') },
    { step: '2', title: t('home.step2_title'), desc: t('home.step2_desc') },
    { step: '3', title: t('home.step3_title'), desc: t('home.step3_desc') },
  ];

  const HERO_STATS = [
    { val: '500+', label: t('home.stat_professionals') },
    { val: '4.9★', label: t('home.stat_rating') },
    { val: '98%', label: t('home.stat_satisfaction') },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-primary-900 to-navy-dark text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary-600 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <span className="text-sm font-medium text-white/90">{t('home.hero_badge')}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            {t('home.hero_title_1')}
            <br />
            <span className="bg-gradient-to-r from-primary-300 to-primary-400 bg-clip-text text-transparent">
              {t('home.hero_title_2')}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.hero_subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/professionals"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl text-base"
            >
              {t('home.professionals_near', { city })}
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/register?role=PROFESSIONAL"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600/40 text-white font-semibold rounded-2xl border border-primary-400/40 hover:bg-primary-600/60 transition-all text-base backdrop-blur-sm"
            >
              {t('home.im_professional')}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm mx-auto text-center">
            {HERO_STATS.map(({ val, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{val}</div>
                <div className="text-xs text-white/50 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location banner */}
      <div className="px-4 pt-8">
        <LocationBanner />
      </div>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {t('home.categories_title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              {t('home.categories_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-3 sm:gap-4">
            {FEATURED_CATEGORIES.map(({ cat, icon, color }) => (
              <Link
                key={cat}
                to={`/professionals?category=${cat}`}
                className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} dark:bg-opacity-20`}>
                  {icon}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 text-center group-hover:text-primary-600 transition-colors leading-tight">
                  {CATEGORY_LABELS[cat]}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/professionals"
              className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors text-sm"
            >
              {t('home.see_all')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {t('home.trust_title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              {t('home.trust_subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRUST_PILLARS.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('home.steps_title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-14">{t('home.steps_subtitle')}</p>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-xl font-extrabold mb-4 shadow-md">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-navy-light to-navy-dark text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('home.cta_title')}</h2>
          <p className="text-primary-200 mb-8 text-lg max-w-lg mx-auto">
            {t('home.cta_subtitle')}
          </p>
          <Link
            to="/register?role=PROFESSIONAL"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-900 font-semibold rounded-2xl hover:bg-gray-50 transition-all shadow-lg text-base"
          >
            {t('home.cta_button')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-navy-dark text-slate-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-white text-sm">VELORA</span>
          </div>
          <p className="text-sm text-slate-500">© 2025 VELORA. {t('home.footer_tagline')}</p>
          <div className="flex gap-4 text-sm">
            <Link to="/professionals" className="hover:text-white transition-colors">{t('home.footer_services')}</Link>
            <Link to="/register" className="hover:text-white transition-colors">{t('home.footer_register')}</Link>
            <Link to="/login" className="hover:text-white transition-colors">{t('home.footer_login')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
