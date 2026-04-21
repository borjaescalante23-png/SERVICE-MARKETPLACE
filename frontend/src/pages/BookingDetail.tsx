import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, messagesApi, reviewsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BOOKING_STATUS_LABELS, CATEGORY_LABELS } from '../types';
import StarRating from '../components/common/StarRating';
import Badge from '../components/common/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Lock, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId!).then(r => r.data),
    enabled: !!bookingId,
    refetchInterval: 5000,
  });

  async function action(fn: () => Promise<any>, successMsg: string) {
    try {
      await fn();
      toast.success(successMsg);
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error');
    }
  }

  async function sendMsg(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const { data } = await messagesApi.send(bookingId!, message);
      if (data.warning) toast(data.warning, { icon: '⚠️' });
      setMessage('');
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewsApi.create(bookingId!, review);
      toast.success('Reseña publicada con verificación');
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al publicar reseña');
    } finally {
      setSubmittingReview(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!booking) return <div className="text-center py-20 text-gray-500">Reserva no encontrada</div>;

  const isClient = booking.clientId === user?.id;
  const isProfessional = booking.professional?.userId === user?.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Reserva</h1>
          <Badge
            label={BOOKING_STATUS_LABELS[booking.status]}
            type="booking"
            status={booking.status}
          />
        </div>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(booking.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="md:col-span-2 space-y-4">
          {/* Service info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Detalles del servicio</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Servicio</span>
                <span className="font-medium">{booking.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha programada</span>
                <span className="font-medium">
                  {format(new Date(booking.scheduledAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dirección</span>
                <span className="font-medium text-right max-w-48">{booking.address}</span>
              </div>
              {booking.clientNotes && (
                <div>
                  <span className="text-gray-500">Notas</span>
                  <p className="mt-1 text-gray-700">{booking.clientNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Escrow / Payment info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} className="text-blue-500" />
              <h2 className="font-semibold text-gray-900">Pago protegido</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-lg text-gray-900">{booking.totalAmount}€</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Comisión plataforma</span>
                <span>{booking.platformFee.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Al profesional</span>
                <span>{booking.professionalAmount.toFixed(2)}€</span>
              </div>
              {booking.escrow && (
                <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${
                  booking.escrow.status === 'HELD' ? 'bg-blue-50 text-blue-700' :
                  booking.escrow.status === 'RELEASED' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {booking.escrow.status === 'HELD' && '🔒 Fondos retenidos en escrow'}
                  {booking.escrow.status === 'RELEASED' && '✅ Fondos liberados al profesional'}
                  {booking.escrow.status === 'REFUNDED' && '↩️ Fondos devueltos al cliente'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="flex flex-wrap gap-3">
              {isClient && booking.status === 'PENDING' && booking.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => action(() => bookingsApi.pay(bookingId!), 'Pago realizado. Fondos en escrow.')}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Pagar ({booking.totalAmount}€)
                </button>
              )}

              {isProfessional && booking.status === 'PENDING' && booking.paymentStatus === 'HELD_IN_ESCROW' && (
                <button
                  onClick={() => action(() => bookingsApi.accept(bookingId!), 'Reserva aceptada')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                >
                  Aceptar reserva
                </button>
              )}

              {isProfessional && booking.status === 'ACCEPTED' && (
                <button
                  onClick={() => action(() => bookingsApi.start(bookingId!), 'Servicio iniciado')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Iniciar servicio
                </button>
              )}

              {(isClient || isProfessional) && ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status) && (
                <button
                  onClick={() => action(() => bookingsApi.complete(bookingId!), 'Servicio completado. Pago liberado.')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                >
                  Marcar completado
                </button>
              )}

              {!['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(booking.status) && (
                <button
                  onClick={() => {
                    const r = prompt('Motivo de cancelación:');
                    if (r) action(() => bookingsApi.cancel(bookingId!, r), 'Reserva cancelada');
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                >
                  Cancelar
                </button>
              )}

              {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && !booking.dispute && (
                <button
                  onClick={() => {
                    const r = prompt('Motivo de la disputa:');
                    const d = prompt('Descripción detallada:');
                    if (r && d) action(
                      () => bookingsApi.dispute(bookingId!, { reason: r, description: d }),
                      'Disputa abierta. El equipo la revisará.'
                    );
                  }}
                  className="px-4 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-xl hover:bg-orange-100 transition-colors border border-orange-200 flex items-center gap-1"
                >
                  <AlertTriangle size={14} />
                  Abrir disputa
                </button>
              )}
            </div>
          </div>

          {/* Review */}
          {isClient && booking.status === 'COMPLETED' && booking.paymentStatus === 'RELEASED' && !booking.review && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-green-500" />
                <h2 className="font-semibold text-gray-900">Deja tu reseña verificada</h2>
              </div>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valoración</label>
                  <StarRating
                    rating={review.rating}
                    interactive
                    size={28}
                    onChange={r => setReview(p => ({ ...p, rating: r }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                  <textarea
                    required
                    minLength={10}
                    value={review.comment}
                    onChange={e => setReview(p => ({ ...p, comment: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                    placeholder="Describe tu experiencia con este profesional..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {submittingReview ? 'Publicando...' : 'Publicar reseña verificada'}
                </button>
              </form>
            </div>
          )}

          {booking.review && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm text-green-700">Reseña publicada y verificada</span>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary-500" />
            <span className="font-medium text-gray-900">Chat</span>
            <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <Lock size={11} />
              Protegido
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {booking.messages?.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-8">
                Inicia la conversación. Los mensajes están monitorizados por seguridad.
              </p>
            )}
            {booking.messages?.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.isFlagged && (
                      <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                        <AlertTriangle size={10} />
                        <span>Datos eliminados por seguridad</span>
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
            <form onSubmit={sendMsg} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
