import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi, bookingsApi } from '../services/api';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types';
import StarRating from '../components/common/StarRating';
import LevelBadge from '../components/common/LevelBadge';
import AddressMapPicker, { type AddressResult } from '../components/AddressMapPicker';
import Lightbox from '../components/Lightbox';
import { availabilityApi } from '../services/api';
import {
  CheckCircle, Briefcase, Calendar, MapPin, Shield,
  ChevronDown, ChevronUp, ChevronLeft, Globe, Edit2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConfirmedAddress {
  formatted: string;
  street: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
  housingType: 'casa' | 'piso';
  floor: string;
  door: string;
}

function buildAddressString(a: ConfirmedAddress): string {
  // Use street+city for a cleaner, precise address; fall back to formatted
  const base = a.street && a.city
    ? `${a.street}, ${a.city}${a.postalCode ? ` ${a.postalCode}` : ''}`
    : (a.formatted || 'Dirección no especificada');
  const s = base.length < 10 ? `Dirección: ${base}` : base;
  if (a.housingType === 'piso') {
    return `${s} — Piso ${a.floor}${a.door ? ` Puerta ${a.door}` : ''}`;
  }
  return s;
}

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState<string>('');
  const [confirmedAddr, setConfirmedAddr] = useState<ConfirmedAddress | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [expandedExp, setExpandedExp] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const { data: pro, isLoading } = useQuery({
    queryKey: ['professional', id],
    queryFn: () => professionalsApi.getById(id!).then(r => r.data),
    enabled: !!id,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['professional-availability', id],
    queryFn: () => availabilityApi.getByProfessional(id!).then(r => r.data),
    enabled: !!id,
  });

  // Must be before early returns — hooks must always run in the same order
  const availabilityWarning = useMemo(() => {
    if (!scheduledAt || !(availability as any[]).length) return null;
    const date = new Date(scheduledAt);
    if (isNaN(date.getTime())) return null;
    const dow = date.getDay();
    const slot = (availability as any[]).find(s => s.dayOfWeek === dow);
    if (!slot) return 'El profesional no suele trabajar este día';
    const [sH, sM] = slot.startTime.split(':').map(Number);
    const [eH, eM] = slot.endTime.split(':').map(Number);
    const timeMins = date.getHours() * 60 + date.getMinutes();
    if (timeMins < sH * 60 + sM || timeMins > eH * 60 + eM) {
      return `Fuera del horario habitual: ${slot.startTime}–${slot.endTime}`;
    }
    return null;
  }, [scheduledAt, availability]);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (user.role === 'ADMIN') { toast.error('Los administradores no pueden realizar reservas'); return; }

    if (!confirmedAddr) { toast.error('Selecciona la dirección del servicio en el mapa'); return; }
    if (!scheduledAt) { toast.error('Selecciona una fecha y hora para el servicio'); return; }
    if (!selectedService) { toast.error('Selecciona un servicio'); return; }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      toast.error('La fecha debe ser futura'); return;
    }

    const addressStr = buildAddressString(confirmedAddr);

    setBooking(true);
    try {
      const { data } = await bookingsApi.create({
        serviceId: selectedService,
        scheduledAt: scheduledDate.toISOString(),
        address: addressStr,
        clientNotes: notes,
      });
      toast.success(t('profile.booking_created'));
      navigate(`/bookings/${data.id}`);
    } catch (err: any) {
      const apiError = err?.response?.data?.error;
      const status = err?.response?.status;
      if (!apiError && !status) {
        toast.error('Error de conexión — comprueba que el servidor está activo');
      } else {
        toast.error(apiError || t('common.error'));
      }
    } finally {
      setBooking(false);
    }
  }

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!pro) return <div className="text-center py-20 text-gray-500">{t('profile.not_found')}</div>;

  const selectedSvc = pro.services?.find((s: any) => s.id === selectedService);
  const hasActiveServices = (pro.services?.length ?? 0) > 0;

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-5 transition-colors"
      >
        <ChevronLeft size={18} />
        {t('common.back')}
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {pro.user?.avatarUrl ? (
                  <img src={pro.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {pro.user?.firstName} {pro.user?.lastName}
                  </h1>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <CheckCircle size={13} className="text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('common.verified')}</span>
                  </div>
                  {pro.level && pro.level !== 'VERIFIED' && <LevelBadge level={pro.level} size="md" />}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={Math.round(pro.avgRating)} size={15} />
                  <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{pro.avgRating.toFixed(1)}</span>
                  <span className="text-gray-400 text-xs">({pro.totalReviews} {t('profile.reviews_short')})</span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Briefcase size={12} />{pro.completedJobs} {t('profile.completed_jobs')}</span>
                  <span className="flex items-center gap-1"><Shield size={12} />{Math.round(pro.acceptanceRate * 100)}{t('profile.acceptance')}</span>
                  {pro.city && <span className="flex items-center gap-1"><MapPin size={12} />{pro.city}{pro.country ? `, ${pro.country}` : ''}</span>}
                  {pro.serviceMode && (
                    <span className="flex items-center gap-1">
                      <Globe size={12} />
                      {pro.serviceMode === 'REMOTE' ? t('profile.service_remote') : pro.serviceMode === 'BOTH' ? t('profile.service_both') : t('profile.service_presential')}
                    </span>
                  )}
                </div>
                {pro.bio && <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{pro.bio}</p>}
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle size={18} className="text-green-500" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('profile.verified_experience')}</h2>
              <span className="ml-auto text-xs px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                {pro.experienceEntries?.length || 0} {t('profile.works')}
              </span>
            </div>
            {pro.experienceEntries?.length === 0 && <p className="text-gray-400 text-sm">{t('profile.no_experience')}</p>}
            <div className="space-y-3">
              {pro.experienceEntries?.map((entry: any) => (
                <div key={entry.id} className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    onClick={() => setExpandedExp(expandedExp === entry.id ? null : entry.id)}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[entry.serviceCategory]}</span>
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{entry.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">{entry.approximateDate}</span>
                        <span className="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full">
                          {CATEGORY_LABELS[entry.serviceCategory]}
                        </span>
                      </div>
                    </div>
                    {expandedExp === entry.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
                  </button>
                  {expandedExp === entry.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-800">
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 mb-3">{entry.description}</p>
                      {entry.images?.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {entry.images.map((img: any, imgIdx: number) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setLightbox({
                                images: entry.images.map((i: any) => i.fileUrl),
                                index: imgIdx,
                              })}
                              className="overflow-hidden rounded-lg group relative"
                            >
                              <img src={img.fileUrl} alt={entry.title} className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-200" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          {availability.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-primary-600" />
                Disponibilidad semanal
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']).map((label, i) => {
                  const dayIdx = i === 6 ? 0 : i + 1;
                  const slot = (availability as any[]).find(s => s.dayOfWeek === dayIdx);
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl text-xs text-center border ${
                        slot
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <p className="font-semibold">{label}</p>
                      {slot ? (
                        <p className="mt-0.5 text-xs">{slot.startTime}–{slot.endTime}</p>
                      ) : (
                        <p className="mt-0.5">No disponible</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          {pro.reviews?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-5">
                {t('profile.reviews_title')} ({pro.totalReviews})
              </h2>
              <div className="space-y-3">
                {(pro.reviews ?? []).map((review: any) => (
                  <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{review.clientName?.[0] || '?'}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">{review.clientName}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle size={10} className="text-green-500" />
                            <span className="text-xs text-green-600 dark:text-green-400">{t('profile.review_verified')}</span>
                          </div>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={12} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p>
                    {review.completedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(review.completedAt), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column — services + booking */}
        <div className="space-y-4">
          {/* Services */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">{t('profile.services')}</h2>
            {!hasActiveServices ? (
              <div className="py-6 text-center">
                <Briefcase size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Este profesional no tiene servicios activos actualmente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pro.services.map((service: any) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      selectedService === service.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <span className="font-medium text-gray-900 dark:text-white text-sm block truncate">{service.name}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{service.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-primary-600 dark:text-primary-400">{service.price}€</span>
                        <p className="text-xs text-gray-400">{service.duration}min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Booking form */}
          {user && user.role !== 'ADMIN' && pro.userId !== user.id && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 overflow-visible">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('profile.book_title')}</h2>

              {!hasActiveServices ? (
                <div className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                  No es posible reservar: el profesional no tiene servicios disponibles.
                </div>
              ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {/* Date/time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                    <Calendar size={12} className="inline mr-1" />{t('profile.datetime')}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm dark:bg-gray-800 dark:text-white"
                  />
                  {availabilityWarning && (
                    <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span>⚠</span>{availabilityWarning}
                    </p>
                  )}
                </div>

                {/* Address section */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1">
                    <MapPin size={12} />Dirección del servicio
                  </p>

                  {confirmedAddr && !showMap ? (
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                      <MapPin size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                          {confirmedAddr.street || confirmedAddr.formatted.split(',')[0]}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {confirmedAddr.city && (
                            <span className="text-xs text-green-600 dark:text-green-500">{confirmedAddr.city}</span>
                          )}
                          {confirmedAddr.postalCode && (
                            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                              CP {confirmedAddr.postalCode}
                            </span>
                          )}
                          <span className="text-xs text-green-600 dark:text-green-500 capitalize">
                            {confirmedAddr.housingType === 'piso' ? `Piso ${confirmedAddr.floor}${confirmedAddr.door ? ` · ${confirmedAddr.door}` : ''}` : 'Casa / Chalet'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button" onClick={() => setShowMap(true)}
                        className="flex-shrink-0 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <AddressMapPicker
                      onConfirm={(result) => {
                        setConfirmedAddr({
                          formatted: result.formatted,
                          street: result.street,
                          city: result.city,
                          postalCode: result.postalCode,
                          lat: result.lat,
                          lng: result.lng,
                          housingType: result.housingType,
                          floor: result.floor,
                          door: result.door,
                        });
                        setShowMap(false);
                      }}
                    />
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">{t('profile.notes')}</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder={t('profile.notes_placeholder')}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Summary */}
                {selectedSvc && (
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{selectedSvc.name}</span>
                      <span className="font-bold text-primary-700 dark:text-primary-300">{selectedSvc.price}€</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t('profile.escrow_note')}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={booking || !selectedService}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {booking ? t('profile.booking_loading') : t('profile.book_button')}
                </button>
              </form>
              )}
            </div>
          )}

          {!user && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('profile.login_to_book')}</p>
              <a href="/login" className="block w-full py-3 bg-primary-600 text-white font-semibold rounded-xl text-center hover:bg-primary-700 transition-colors text-sm">
                {t('profile.login_button')}
              </a>
            </div>
          )}

          {user && user.role !== 'ADMIN' && pro.userId === user.id && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Este es tu perfil profesional.</p>
              <a href="/dashboard" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
                Ir a mi panel →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
    {lightbox && (
      <Lightbox
        images={lightbox.images}
        index={lightbox.index}
        onClose={() => setLightbox(null)}
        onNav={(i) => setLightbox(lb => lb ? { ...lb, index: i } : null)}
      />
    )}
    </>
  );
}
