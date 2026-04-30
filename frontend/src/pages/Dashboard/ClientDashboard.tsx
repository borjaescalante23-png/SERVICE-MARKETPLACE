import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../../types';
import { Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CATEGORIES = Object.keys(CATEGORY_IMAGES) as ServiceCategory[];

export default function ClientDashboard() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [activatingProvider, setActivatingProvider] = useState(false);

  async function handleBecomeProvider() {
    setActivatingProvider(true);
    try {
      const { data } = await authApi.toggleProvider();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      await refreshUser();
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Modo proveedor activado. Completa tu perfil para empezar.');
    } catch {
      toast.error('Error al activar el modo proveedor');
    } finally {
      setActivatingProvider(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Saludo */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A1628] dark:text-[#F8FAFF]">
          Hola, {user?.firstName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">¿Qué necesitas hoy?</p>
      </div>

      {/* Categorías */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            to={`/professionals?category=${cat}`}
            className="group relative rounded-2xl overflow-hidden block shadow-sm hover:shadow-lg transition-all active:scale-[0.98]"
          >
            <div className="relative h-28 sm:h-36 bg-gray-200 dark:bg-gray-800">
              <img
                src={CATEGORY_IMAGES[cat]}
                alt={CATEGORY_LABELS[cat]}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <span className="text-white text-xs font-bold block truncate">{CATEGORY_LABELS[cat]}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA Proveedor */}
      {!user?.isProvider && (
        <div className="p-5 bg-white dark:bg-[#0F1A2E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D45] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase size={18} className="text-[#2563EB] dark:text-[#3B82F6]" />
            </div>
            <div>
              <p className="font-semibold text-[#0A1628] dark:text-[#F8FAFF] text-sm">¿Quieres ofrecer tus servicios?</p>
              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">Activa el modo proveedor para empezar a ganar dinero</p>
            </div>
          </div>
          <button
            onClick={handleBecomeProvider}
            disabled={activatingProvider}
            className="flex-shrink-0 px-5 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
            style={{ background: '#0A1628' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; }}
          >
            {activatingProvider ? 'Activando...' : 'Activar modo proveedor'}
          </button>
        </div>
      )}
    </div>
  );
}
