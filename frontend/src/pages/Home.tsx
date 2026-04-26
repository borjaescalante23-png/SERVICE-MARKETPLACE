import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { professionalsApi } from '../services/api';
import { CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../types';
import {
  Search, MapPin, Star, Zap,
  Shield, Lock, CheckCircle, ChevronRight, Briefcase,
} from 'lucide-react';

const CATEGORIES: ServiceCategory[] = [
  'PLUMBING', 'ELECTRICIAN', 'CLEANING', 'HANDYMAN',
  'GARDENING', 'CHEF', 'HAIRDRESSING', 'PERSONAL_TRAINER',
  'MASSAGE', 'CHILDCARE', 'TUTORING', 'PET_CARE',
];

function ProfessionalCard({ pro }: { pro: any }) {
  const service = pro.services?.[0];
  const img = pro.experienceEntries?.[0]?.images?.[0]?.fileUrl;

  return (
    <Link
      to={`/professionals/${pro.id}`}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all group"
    >
      <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {pro.user?.avatarUrl ? (
              <img src={pro.user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-400">{pro.user?.firstName?.[0]}</span>
              </div>
            )}
          </div>
        )}
        {pro.verificationStatus === 'APPROVED' && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-medium text-green-700 border border-green-200 dark:border-green-800 flex items-center gap-1">
            <CheckCircle size={10} className="text-green-500" />
            Verificado
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
          {pro.user?.firstName} {pro.user?.lastName}
        </p>
        {service && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{service.name}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {pro.avgRating > 0 ? pro.avgRating.toFixed(1) : '—'}
            </span>
            {pro.totalReviews > 0 && (
              <span className="text-xs text-gray-400">({pro.totalReviews})</span>
            )}
          </div>
          {service && (
            <span className="text-sm font-bold text-primary-600">{service.price}€</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: profData } = useQuery({
    queryKey: ['home-professionals'],
    queryFn: () => professionalsApi.list({ limit: 8 }).then(r => r.data),
    staleTime: 60000,
  });

  const professionals = profData?.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/professionals${searchValue ? `?search=${encodeURIComponent(searchValue)}` : ''}`);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Search hero */}
      <section className="bg-white dark:bg-gray-950 pt-12 pb-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3 text-sm text-gray-500 dark:text-gray-400">
            <MapPin size={14} className="text-primary-500" />
            <span>Barcelona</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
            ¿Qué necesitas hoy?
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Buscar fontanero, limpieza, peluquero..."
              className="w-full pl-12 pr-32 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-gray-950 dark:bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-primary-700 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Category photo grid */}
      <section className="pb-12 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 text-center">Explora por categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat}
                to={`/professionals?category=${cat}`}
                className="group relative rounded-2xl overflow-hidden block shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-36 sm:h-44 bg-gray-200 dark:bg-gray-800">
                  <img
                    src={CATEGORY_IMAGES[cat]}
                    alt={CATEGORY_LABELS[cat]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="text-white text-sm font-bold block truncate" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Professionals grid */}
      {professionals.length > 0 && (
        <section className="py-12 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profesionales disponibles</h2>
              <Link
                to="/professionals"
                className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
              >
                Ver todos <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {professionals.map((pro: any) => (
                <ProfessionalCard key={pro.id} pro={pro} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust — minimal */}
      <section className="py-12 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { icon: <Shield size={20} className="text-green-500" />, label: 'Profesionales verificados' },
            { icon: <Lock size={20} className="text-blue-500" />, label: 'Pagos protegidos' },
            { icon: <Star size={20} className="text-amber-400" />, label: 'Valoraciones reales' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-800">
                {icon}
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Become provider CTA — secondary */}
      {!user?.isProvider && (
        <section className="py-10 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">¿Quieres ofrecer tus servicios?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Únete como proveedor y empieza a ganar</p>
                </div>
              </div>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="flex-shrink-0 px-5 py-2.5 bg-gray-950 dark:bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-primary-700 transition-colors"
              >
                Empezar
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-white text-sm">VELORA</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 VELORA. Barcelona, Spain.</p>
          <div className="flex gap-4 text-xs">
            <Link to="/professionals" className="hover:text-white transition-colors">Servicios</Link>
            <Link to="/register" className="hover:text-white transition-colors">Registrarse</Link>
            <Link to="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
