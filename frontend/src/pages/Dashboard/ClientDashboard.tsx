import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, authApi } from '../../services/api';
import { Booking, BOOKING_STATUS_LABELS, CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../../types';
import Badge from '../../components/common/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Calendar, Briefcase } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

const CATEGORIES = Object.keys(CATEGORY_IMAGES) as ServiceCategory[];

export default function ClientDashboard() {
  const { t } = useI18n();
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const [activatingProvider, setActivatingProvider] = useState(false);

  async function handleBecomeProvider() {
    setActivatingProvider(true);
    try {
      await authApi.toggleProvider();
      await refreshUser();
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      toast.success('Modo proveedor activado. Completa tu perfil para empezar.');
    } catch {
      toast.error('Error al activar el modo proveedor');
    } finally {
      setActivatingProvider(false);
    }
  }

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list().then(r => r.data),
  });

  const active = bookings.filter((b: Booking) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  const past = bookings.filter((b: Booking) => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(b.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('client.title')}</h1>
        <Link
          to="/professionals"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          {t('client.new_booking')}
        </Link>
      </div>

      {/* What do you need today? */}
      <div className="mb-10">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">¿Qué necesitas hoy?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              to={`/professionals?category=${cat}`}
              className="group relative rounded-2xl overflow-hidden block shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative h-28 sm:h-36 bg-gray-200 dark:bg-gray-800">
                <img
                  src={CATEGORY_IMAGES[cat]}
                  alt={CATEGORY_LABELS[cat]}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('client.empty')}</p>
          <Link to="/professionals" className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium">
            {t('client.explore')}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('client.active')}</h2>
              <div className="space-y-3">
                {active.map((b: Booking) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('client.history')}</h2>
              <div className="space-y-3">
                {past.map((b: Booking) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Become provider CTA */}
      <div className="mt-10 p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Briefcase size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">¿Quieres ofrecer tus servicios?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Activa el modo proveedor para empezar a ganar dinero</p>
          </div>
        </div>
        <button
          onClick={handleBecomeProvider}
          disabled={activatingProvider}
          className="flex-shrink-0 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {activatingProvider ? 'Activando...' : 'Activar modo proveedor'}
        </button>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      to={`/bookings/${booking.id}`}
      className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{booking.service?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {booking.professional?.user?.firstName} {booking.professional?.user?.lastName}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Calendar size={11} />
            {format(new Date(booking.scheduledAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <div className="text-right">
          <Badge label={BOOKING_STATUS_LABELS[booking.status]} type="booking" status={booking.status} />
          <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">{booking.totalAmount}€</p>
        </div>
      </div>
    </Link>
  );
}
