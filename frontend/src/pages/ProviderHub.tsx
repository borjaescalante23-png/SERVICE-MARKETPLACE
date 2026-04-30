import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi, professionalsApi } from '../services/api';
import { Booking, BOOKING_STATUS_LABELS, VERIFICATION_STATUS_LABELS } from '../types';
import Badge from '../components/common/Badge';
import LevelBadge from '../components/common/LevelBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle, AlertCircle, ShieldCheck, CreditCard,
  Star, Briefcase, TrendingUp, Clock, ChevronRight, Calendar,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProviderHub() {
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => professionalsApi.getMyProfile().then(r => r.data),
    enabled: !!user?.isProvider,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list().then(r => r.data),
    enabled: !!user?.isProvider,
  });

  if (!user?.isProvider) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
          <Briefcase size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#0A1628] dark:text-[#F8FAFF] mb-3">Conviértete en profesional</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          Activa el modo proveedor para empezar a ofrecer tus servicios y ganar dinero con VELORA.
        </p>
        <Link
          to="/become-provider"
          className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-full transition-all active:scale-95"
          style={{ background: '#0A1628' }}
        >
          Activar modo proveedor
        </Link>
      </div>
    );
  }

  const vs = profile?.verificationStatus;
  const isApproved = vs === 'APPROVED';
  const kycStatus = profile?.kycStatus || 'PENDING';
  const stripeStatus = profile?.stripeConnectStatus || 'NOT_STARTED';

  const activeBookings = bookings.filter((b: Booking) =>
    b.professionalId === profile?.id &&
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)
  );

  const completedBookings = bookings.filter((b: Booking) =>
    b.professionalId === profile?.id &&
    ['COMPLETED', 'AUTO_COMPLETED'].includes(b.status)
  );

  const totalEarned = completedBookings.reduce(
    (sum: number, b: Booking) => sum + (b.professionalAmount || 0), 0
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628] dark:text-[#F8FAFF]">Hub Proveedor</h1>
          {profile?.level && (
            <div className="mt-1">
              <LevelBadge level={profile.level} size="sm" />
            </div>
          )}
        </div>
        {isApproved && profile?.level && (
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            profile.level === 'ELITE'
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
              : profile.level === 'PRO'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
          }`}>
            <CheckCircle size={12} />
            {profile.level === 'ELITE' ? 'Elite' : profile.level === 'PRO' ? 'Pro' : 'Verificado'}
          </span>
        )}
      </div>

      {!isApproved && vs === 'REJECTED' && (
        <div className="mb-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Verificación rechazada</p>
          {profile?.rejectionReason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{profile.rejectionReason}</p>
          )}
        </div>
      )}

      {!isApproved && vs && vs !== 'REJECTED' && (
        <div className={`mb-3 p-4 rounded-2xl flex items-start gap-3 ${
          vs === 'UNDER_REVIEW'
            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          <AlertCircle size={18} className={vs === 'UNDER_REVIEW' ? 'text-blue-500 flex-shrink-0' : 'text-amber-500 flex-shrink-0'} />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {VERIFICATION_STATUS_LABELS[vs]}
            </p>
            {vs === 'PENDING' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Completa tu perfil para solicitar verificación.
              </p>
            )}
          </div>
        </div>
      )}

      {kycStatus === 'PENDING' && (
        <Link to="/kyc" className="block mb-3">
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:opacity-90 transition-opacity">
            <ShieldCheck size={18} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Verificación de identidad pendiente</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Completa el KYC para poder recibir reservas</p>
            </div>
            <ChevronRight size={16} className="text-blue-400 flex-shrink-0" />
          </div>
        </Link>
      )}

      {stripeStatus !== 'ACTIVE' && (
        <Link to="/stripe/onboarding" className="block mb-5">
          <div className={`p-4 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-opacity ${
            stripeStatus === 'PENDING'
              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'
              : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
          }`}>
            <CreditCard size={18} className={stripeStatus === 'PENDING' ? 'text-amber-500 flex-shrink-0' : 'text-purple-500 flex-shrink-0'} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {stripeStatus === 'NOT_STARTED' ? 'Configura tu cuenta de cobros' :
                 stripeStatus === 'INCOMPLETE' ? 'Onboarding de Stripe incompleto' :
                 'Verificación de cuenta en proceso'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stripeStatus === 'NOT_STARTED' ? 'Necesitas Stripe para recibir pagos' :
                 'Completa el proceso para activar los cobros'}
              </p>
            </div>
            <ChevronRight size={16} className="text-purple-400 flex-shrink-0" />
          </div>
        </Link>
      )}

      {!loadingProfile && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={13} className="text-amber-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Rating</span>
            </div>
            <p className="text-xl font-bold text-[#0A1628] dark:text-white">
              {profile?.avgRating?.toFixed(1) || '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Briefcase size={13} className="text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Trabajos</span>
            </div>
            <p className="text-xl font-bold text-[#0A1628] dark:text-white">
              {profile?.completedJobs || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={13} className="text-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Ganado</span>
            </div>
            <p className="text-xl font-bold text-[#0A1628] dark:text-white">
              {totalEarned > 0 ? `${totalEarned.toFixed(0)}€` : '—'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/opportunities" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 bg-[#F0F4FF] dark:bg-[#0F1A2E] rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-[#0A1628] dark:text-[#F8FAFF]" />
          </div>
          <p className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF]">Oportunidades</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Trabajos cercanos a ti</p>
        </Link>
        <Link to="/provider-onboarding" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 bg-[#F0F4FF] dark:bg-[#0F1A2E] rounded-xl flex items-center justify-center">
            <Briefcase size={18} className="text-[#0A1628] dark:text-[#F8FAFF]" />
          </div>
          <p className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF]">Mi perfil</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Servicios, bio y fotos</p>
        </Link>
        <Link to="/kyc" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 bg-[#F0F4FF] dark:bg-[#0F1A2E] rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className={kycStatus === 'APPROVED' ? 'text-[#0A1628] dark:text-[#F8FAFF]' : 'text-gray-400 dark:text-gray-500'} />
          </div>
          <p className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF]">Verificación KYC</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {kycStatus === 'APPROVED' ? 'Completado' : kycStatus === 'PROCESSING' ? 'En revisión' : 'Pendiente'}
          </p>
        </Link>
        <Link to="/stripe/onboarding" className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-blue-200 dark:hover:border-blue-900 transition-all active:scale-[0.98]">
          <div className="w-10 h-10 bg-[#F0F4FF] dark:bg-[#0F1A2E] rounded-xl flex items-center justify-center">
            <CreditCard size={18} className={stripeStatus === 'ACTIVE' ? 'text-[#0A1628] dark:text-[#F8FAFF]' : 'text-gray-400 dark:text-gray-500'} />
          </div>
          <p className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF]">Stripe Connect</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {stripeStatus === 'ACTIVE' ? 'Activo' : stripeStatus === 'PENDING' ? 'En revisión' : 'Configura cobros'}
          </p>
        </Link>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Reservas activas</h2>
          <Link to="/bookings" className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ver todas</Link>
        </div>

        {loadingBookings ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : activeBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 text-center">
            <Clock size={28} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No tienes reservas activas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map((b: Booking) => (
              <Link key={b.id} to={`/bookings/${b.id}`} className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-sm transition-all active:scale-[0.99]">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{b.client?.firstName?.[0] ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF] truncate">{b.service?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.client?.firstName} {b.client?.lastName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                    <Calendar size={10} />
                    {format(new Date(b.scheduledAt), "d 'de' MMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge label={BOOKING_STATUS_LABELS[b.status]} type="booking" status={b.status} />
                  <p className="text-sm font-bold text-[#0A1628] dark:text-[#F8FAFF]">{b.professionalAmount?.toFixed(0)}€</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
