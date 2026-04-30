import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../services/api';
import { Booking, BOOKING_STATUS_LABELS } from '../types';
import Badge from '../components/common/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'active' | 'past';

export default function Bookings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('active');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list().then(r => r.data),
  });

  const active = bookings.filter((b: Booking) =>
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED_BY_PROVIDER'].includes(b.status)
  );
  const past = bookings.filter((b: Booking) =>
    ['COMPLETED', 'AUTO_COMPLETED', 'CANCELLED', 'DISPUTED'].includes(b.status)
  );

  const shown = tab === 'active' ? active : past;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-[#0A1628] dark:text-[#F8FAFF] mb-5">Mis reservas</h1>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl mb-6">
        {([['active', 'Activas'], ['past', 'Historial']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === id
                ? 'bg-white dark:bg-gray-800 text-[#0A1628] dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
            {id === 'active' && active.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                {active.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center">
            <Calendar size={32} className="text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-base font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-2">
            {tab === 'active' ? 'No tienes reservas activas' : 'No hay reservas en el historial'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {tab === 'active' ? 'Encuentra el profesional perfecto para lo que necesitas' : 'Tus reservas completadas aparecerán aquí'}
          </p>
          {tab === 'active' && (
            <Link
              to="/professionals"
              className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-full transition-all active:scale-95"
              style={{ background: '#0A1628' }}
            >
              Explorar servicios
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((b: Booking) => <BookingCard key={b.id} booking={b} userId={user?.id ?? ''} />)}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, userId }: { booking: Booking; userId: string }) {
  const isClient = booking.clientId === userId;
  const otherName = isClient
    ? `${booking.professional?.user?.firstName ?? ''} ${booking.professional?.user?.lastName ?? ''}`.trim()
    : `${booking.client?.firstName ?? ''} ${booking.client?.lastName ?? ''}`.trim();

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      {booking.professional?.user?.avatarUrl ? (
        <img
          src={booking.professional.user.avatarUrl}
          alt=""
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
            {otherName?.[0] ?? '?'}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-[#0A1628] dark:text-[#F8FAFF] truncate">{booking.service?.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{otherName}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
          <Calendar size={10} />
          {format(new Date(booking.scheduledAt), "d 'de' MMM, HH:mm", { locale: es })}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Badge label={BOOKING_STATUS_LABELS[booking.status]} type="booking" status={booking.status} />
        <p className="text-sm font-bold text-[#0A1628] dark:text-[#F8FAFF]">{booking.totalAmount}€</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
    </Link>
  );
}
