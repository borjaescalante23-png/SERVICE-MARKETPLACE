import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsApi, messagesApi, reviewsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BOOKING_STATUS_LABELS } from '../types';
import StarRating from '../components/common/StarRating';
import Badge from '../components/common/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Send, Lock, CheckCircle, AlertTriangle, MessageSquare, ChevronLeft, Languages, CreditCard, Clock, ShieldCheck, Printer } from 'lucide-react';
import { useI18n } from '../i18n';
import toast from 'react-hot-toast';

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const autoTranslate = localStorage.getItem('autoTranslate') === 'true';
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') toast.success(t('booking.payment_success'));
    else if (payment === 'cancelled') toast(t('booking.payment_cancelled'), { icon: 'ℹ️' });
  }, []);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getById(bookingId!).then(r => r.data),
    enabled: !!bookingId,
    refetchInterval: 8000,
  });

  async function action(key: string, fn: () => Promise<any>, successMsg: string) {
    setActionLoading(key);
    try {
      await fn();
      toast.success(successMsg);
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('common.error'));
    } finally {
      setActionLoading(null);
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
      toast.error(err?.response?.data?.message || t('common.error'));
    } finally {
      setSending(false);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await reviewsApi.create(bookingId!, review);
      toast.success(t('booking.review_done'));
      qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('common.error'));
    } finally {
      setSubmittingReview(false);
    }
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!booking) return <div className="text-center py-20 text-gray-500">{t('booking.not_found')}</div>;

  const isClient = booking.clientId === user?.id;
  const isProfessional = booking.professional?.userId === user?.id;
  const paymentPending = booking.paymentStatus === 'PENDING';
  const paymentHeld = booking.paymentStatus === 'HELD_IN_ESCROW';
  const isTerminal = ['COMPLETED', 'AUTO_COMPLETED', 'CANCELLED', 'DISPUTED'].includes(booking.status);
  const isProviderCompleted = booking.status === 'COMPLETED_BY_PROVIDER';

  const hoursLeft = isProviderCompleted && booking.autoReleaseAt
    ? Math.max(0, Math.round((new Date(booking.autoReleaseAt).getTime() - Date.now()) / 3600000))
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 transition-colors"
      >
        <ChevronLeft size={18} />
        {t('common.back')}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('booking.title')}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {format(new Date(booking.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge label={BOOKING_STATUS_LABELS[booking.status]} type="booking" status={booking.status} />
          {['COMPLETED', 'AUTO_COMPLETED'].includes(booking.status) && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors print:hidden"
            >
              <Printer size={13} />
              Recibo
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="md:col-span-2 space-y-4">

          {/* Service details */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">{t('booking.service_details')}</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.service')}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">{booking.service?.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.scheduled')}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {format(new Date(booking.scheduledAt), "d 'de' MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{t('booking.address')}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right text-xs sm:text-sm">{booking.address}</span>
              </div>
              {booking.clientNotes && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">{t('booking.notes')}</span>
                  <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">{booking.clientNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment / Escrow */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={16} className="text-blue-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t('booking.payment_protected')}</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('booking.total')}</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">{booking.totalAmount}€</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('booking.platform_fee')}</span>
                <span>{booking.platformFee?.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{t('booking.to_professional')}</span>
                <span>{booking.professionalAmount?.toFixed(2)}€</span>
              </div>
              {booking.escrow && (
                <div className={`mt-2 p-3 rounded-xl text-xs font-medium ${
                  booking.escrow.status === 'HELD' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                  booking.escrow.status === 'RELEASED' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                  'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}>
                  {booking.escrow.status === 'HELD' && t('booking.escrow_held')}
                  {booking.escrow.status === 'RELEASED' && t('booking.escrow_released')}
                  {booking.escrow.status === 'REFUNDED' && t('booking.escrow_refunded')}
                </div>
              )}
            </div>
          </div>

          {/* Dual-confirmation banner: COMPLETED_BY_PROVIDER */}
          {isProviderCompleted && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <h2 className="font-semibold text-amber-800 dark:text-amber-300 text-sm sm:text-base">
                  El proveedor marcó el servicio como completado
                </h2>
              </div>
              {hoursLeft !== null && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Liberación automática en <span className="font-bold">{hoursLeft}h</span> si no hay respuesta.
                </p>
              )}
              {isClient && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    disabled={actionLoading === 'client-confirm'}
                    onClick={() => action('client-confirm', () => bookingsApi.clientConfirm(bookingId!), 'Servicio confirmado. Pago liberado al profesional.')}
                    className="px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck size={14} />
                    {actionLoading === 'client-confirm' ? '...' : 'Confirmar servicio recibido'}
                  </button>
                  <button
                    disabled={actionLoading === 'client-dispute'}
                    onClick={() => {
                      const r = prompt('Motivo de la disputa (ej: servicio no completado):');
                      const d = prompt('Describe el problema en detalle:');
                      if (r && d) action('client-dispute', () => bookingsApi.clientDispute(bookingId!, { reason: r, description: d }), 'Disputa abierta. La IA la analizará automáticamente.');
                    }}
                    className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800 flex items-center gap-1.5"
                  >
                    <AlertTriangle size={13} />
                    {actionLoading === 'client-dispute' ? '...' : 'Disputar'}
                  </button>
                </div>
              )}
              {isProfessional && (
                <p className="text-sm text-amber-600 dark:text-amber-400">Esperando confirmación del cliente.</p>
              )}
            </div>
          )}

          {/* AI Dispute analysis result */}
          {booking.dispute?.aiAnalysis && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-blue-500" />
                <h2 className="font-semibold text-blue-800 dark:text-blue-300 text-sm sm:text-base">Resolución IA de disputa</h2>
                <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                  {Math.round((booking.dispute.aiAnalysis.confidence || 0) * 100)}% confianza
                </span>
              </div>
              <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${
                booking.dispute.aiAnalysis.resolution === 'FULL_REFUND' ? 'text-red-600' :
                booking.dispute.aiAnalysis.resolution === 'PARTIAL_REFUND' ? 'text-amber-600' : 'text-green-600'
              }`}>
                {booking.dispute.aiAnalysis.resolution === 'FULL_REFUND' ? 'Reembolso completo' :
                 booking.dispute.aiAnalysis.resolution === 'PARTIAL_REFUND' ? `Reembolso parcial${booking.dispute.aiAnalysis.partialAmount ? ` · ${booking.dispute.aiAnalysis.partialAmount}€` : ''}` :
                 'Pago liberado al proveedor'}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">{booking.dispute.aiAnalysis.reasoning}</p>
            </div>
          )}

          {/* Actions */}
          {!isTerminal && !isProviderCompleted && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">{t('booking.actions')}</h2>
              <div className="flex flex-wrap gap-2.5">

                {/* PROFESSIONAL: accept when PENDING */}
                {isProfessional && booking.status === 'PENDING' && (
                  <button
                    disabled={actionLoading === 'accept'}
                    onClick={() => action('accept', () => bookingsApi.accept(bookingId!), t('booking.accepted_toast'))}
                    className="px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'accept' ? '...' : t('booking.accept')}
                  </button>
                )}

                {/* CLIENT: pay via Stripe when PENDING */}
                {isClient && booking.status === 'PENDING' && paymentPending && (
                  <button
                    disabled={actionLoading === 'pay'}
                    onClick={async () => {
                      setActionLoading('pay');
                      try {
                        const { data } = await bookingsApi.pay(bookingId!);
                        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
                        else { toast.success(t('booking.payment_processed')); qc.invalidateQueries({ queryKey: ['booking', bookingId] }); }
                      } catch (err: any) {
                        // If Stripe not configured, try mock payment
                        try {
                          await bookingsApi.confirmPayment(bookingId!);
                          toast.success(t('booking.payment_processed'));
                          qc.invalidateQueries({ queryKey: ['booking', bookingId] });
                        } catch {
                          toast.error(err?.response?.data?.error || t('common.error'));
                        }
                      } finally { setActionLoading(null); }
                    }}
                    className="px-4 py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-xl hover:bg-primary-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Lock size={14} />
                    {actionLoading === 'pay' ? '...' : t('booking.pay_stripe', { amount: String(booking.totalAmount) })}
                  </button>
                )}

                {/* CLIENT: confirm payment manually (when ACCEPTED, payment still pending) */}
                {isClient && booking.status === 'ACCEPTED' && paymentPending && (
                  <button
                    disabled={actionLoading === 'confirm'}
                    onClick={() => action('confirm', () => bookingsApi.confirmPayment(bookingId!), t('booking.payment_processed'))}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <CreditCard size={14} />
                    {actionLoading === 'confirm' ? '...' : 'Confirmar pago · ' + booking.totalAmount + '€'}
                  </button>
                )}

                {/* Info pill for professional waiting on payment */}
                {isProfessional && booking.status === 'ACCEPTED' && paymentPending && (
                  <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm rounded-xl border border-amber-200 dark:border-amber-800">
                    Esperando pago del cliente
                  </div>
                )}

                {/* PROFESSIONAL: start when ACCEPTED + payment held */}
                {isProfessional && booking.status === 'ACCEPTED' && paymentHeld && (
                  <button
                    disabled={actionLoading === 'start'}
                    onClick={() => action('start', () => bookingsApi.start(bookingId!), t('booking.started_toast'))}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'start' ? '...' : t('booking.start_service')}
                  </button>
                )}

                {/* PROFESSIONAL: mark complete (IN_PROGRESS) — triggers 48h dual-confirmation */}
                {isProfessional && booking.status === 'IN_PROGRESS' && (
                  <div className="w-full space-y-2">
                    {showEvidenceForm && (
                      <textarea
                        value={evidenceNote}
                        onChange={e => setEvidenceNote(e.target.value)}
                        placeholder="Describe el trabajo realizado (opcional)..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-gray-800 dark:text-white"
                      />
                    )}
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        disabled={actionLoading === 'provider-complete'}
                        onClick={() => action('provider-complete', () => bookingsApi.providerComplete(bookingId!, evidenceNote || undefined), 'Marcado como completado. El cliente tiene 48h para confirmar.')}
                        className="px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle size={14} />
                        {actionLoading === 'provider-complete' ? '...' : 'Marcar como completado'}
                      </button>
                      <button
                        onClick={() => setShowEvidenceForm(p => !p)}
                        className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors"
                      >
                        {showEvidenceForm ? 'Ocultar nota' : 'Añadir evidencia'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel */}
                <button
                  disabled={actionLoading === 'cancel'}
                  onClick={() => {
                    const r = prompt(t('booking.cancel_prompt'));
                    if (r) action('cancel', () => bookingsApi.cancel(bookingId!, r), t('booking.cancelled_toast'));
                  }}
                  className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
                >
                  {t('booking.cancel')}
                </button>

                {/* Dispute */}
                {['ACCEPTED', 'IN_PROGRESS'].includes(booking.status) && !booking.dispute && (
                  <button
                    disabled={actionLoading === 'dispute'}
                    onClick={() => {
                      const r = prompt(t('booking.dispute_reason_prompt'));
                      const d = prompt(t('booking.dispute_desc_prompt'));
                      if (r && d) action('dispute', () => bookingsApi.dispute(bookingId!, { reason: r, description: d }), t('booking.dispute_opened_toast'));
                    }}
                    className="px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-xl hover:bg-orange-100 transition-colors border border-orange-200 dark:border-orange-800 flex items-center gap-1.5"
                  >
                    <AlertTriangle size={13} />
                    {t('booking.dispute')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Review form */}
          {isClient && ['COMPLETED', 'AUTO_COMPLETED'].includes(booking.status) && !booking.review && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={16} className="text-green-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{t('booking.review_title')}</h2>
              </div>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('booking.review_rating')}</label>
                  <StarRating rating={review.rating} interactive size={28} onChange={r => setReview(p => ({ ...p, rating: r }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('booking.review_comment')}</label>
                  <textarea
                    required
                    minLength={10}
                    value={review.comment}
                    onChange={e => setReview(p => ({ ...p, comment: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm dark:bg-gray-800 dark:text-white"
                    placeholder={t('booking.review_placeholder')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {submittingReview ? t('booking.review_publishing') : t('booking.review_submit')}
                </button>
              </form>
            </div>
          )}

          {booking.review && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-2">
              <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300">{t('booking.review_done')}</span>
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col h-[500px] md:h-[600px]">
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <MessageSquare size={16} className="text-primary-500" />
            <span className="font-medium text-gray-900 dark:text-white text-sm">Chat</span>
            <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
              <Lock size={10} />{t('booking.chat_protected')}
            </span>
          </div>

          {autoTranslate && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex items-center gap-2">
              <Languages size={12} className="text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('chat.auto_translate_banner')}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {booking.messages?.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-8">{t('booking.chat_empty')}</p>
            )}
            {booking.messages?.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}>
                    {msg.isFlagged && (
                      <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
                        <AlertTriangle size={9} />
                        <span>{t('booking.msg_flagged')}</span>
                      </div>
                    )}
                    <p className="break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                      {format(new Date(msg.createdAt), 'HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!['COMPLETED', 'CANCELLED'].includes(booking.status) && (
            <form onSubmit={sendMsg} className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
