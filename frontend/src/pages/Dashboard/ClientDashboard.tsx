import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../services/api';
import { Booking, BOOKING_STATUS_LABELS } from '../../types';
import Badge from '../../components/common/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Calendar } from 'lucide-react';
import { useI18n } from '../../i18n';

export default function ClientDashboard() {
  const { t } = useI18n();
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list().then(r => r.data),
  });

  const active = bookings.filter((b: Booking) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  const past = bookings.filter((b: Booking) => ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(b.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('client.title')}</h1>
        <Link
          to="/professionals"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          {t('client.new_booking')}
        </Link>
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
