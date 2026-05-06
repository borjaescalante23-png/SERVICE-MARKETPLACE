import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi, bookingsApi } from '../services/api';
import { CATEGORY_LABELS, CATEGORY_IMAGES } from '../types';
import AddressMapPicker, { type AddressData } from '../components/AddressMapPicker';
import Lightbox from '../components/Lightbox';
import { availabilityApi } from '../services/api';
import {
  CheckCircle, Briefcase, Calendar, MapPin, Shield,
  ChevronDown, ChevronUp, ChevronLeft, Globe, Star, Clock, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type ConfirmedAddress = AddressData;

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

function LevelPill({ level }: { level: string }) {
  if (level === 'ELITE') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 border border-amber-400/40 text-amber-300">
      ★ Elite
    </span>
  );
  if (level === 'PRO') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-400/20 border border-violet-400/40 text-violet-300">
      ◆ Pro
    </span>
  );
  return null;
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-5 rounded-full bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] text-[11px] font-black flex items-center justify-center flex-shrink-0">
        {n}
      </span>
      <span className="text-xs font-bold text-[#0A1628] dark:text-[#F8FAFF] uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState<string>('');
  const [confirmedAddr, setConfirmedAddr] = useState<ConfirmedAddress | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [expandedExp, setExpandedExp] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM'>('NONE');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringIntervalDays, setRecurringIntervalDays] = useState(7);

  const scheduledAt = selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : '';

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

  const daySlotInfo = useMemo(() => {
    if (!selectedDate || !(availability as any[]).length) return null;
    const dow = new Date(selectedDate + 'T12:00').getDay();
    return (availability as any[]).find((s: any) => s.dayOfWeek === dow) || null;
  }, [selectedDate, availability]);

  const visibleSlots = useMemo(() => {
    if (!daySlotInfo) return TIME_SLOTS;
    const [sH] = daySlotInfo.startTime.split(':').map(Number);
    const [eH] = daySlotInfo.endTime.split(':').map(Number);
    return TIME_SLOTS.filter(t => {
      const [h] = t.split(':').map(Number);
      return h >= sH && h <= eH;
    });
  }, [daySlotInfo]);

  const availabilityWarning = useMemo(() => {
    if (!selectedDate || !daySlotInfo) return null;
    const dow = new Date(selectedDate + 'T12:00').getDay();
    const slot = (availability as any[]).find((s: any) => s.dayOfWeek === dow);
    if (!slot) return 'El profesional no suele trabajar este día';
    return null;
  }, [selectedDate, daySlotInfo, availability]);

  const next14Days = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const isDayAvailable = useCallback((date: Date) => {
    if (!(availability as any[]).length) return true;
    const dow = date.getDay();
    return (availability as any[]).some((s: any) => s.dayOfWeek === dow);
  }, [availability]);

  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const recurringSessionCount = useMemo(() => {
    if (recurringFreq === 'NONE' || !selectedDate) return 1;
    const intervalDays =
      recurringFreq === 'WEEKLY' ? 7 :
      recurringFreq === 'BIWEEKLY' ? 14 :
      recurringFreq === 'MONTHLY' ? 30 :
      recurringIntervalDays;
    if (!recurringEndDate) return 4;
    const base = new Date(selectedDate);
    const end = new Date(recurringEndDate);
    let count = 1;
    for (let i = 1; i <= 3; i++) {
      const d = new Date(base.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
      if (d <= end) count++;
      else break;
    }
    return count;
  }, [recurringFreq, selectedDate, recurringEndDate, recurringIntervalDays]);

  const FREQ_OPTIONS = [
    { id: 'NONE', label: 'Puntual' },
    { id: 'WEEKLY', label: 'Semanal' },
    { id: 'BIWEEKLY', label: 'Quincenal' },
    { id: 'MONTHLY', label: 'Mensual' },
    { id: 'CUSTOM', label: 'Personalizado' },
  ] as const;

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (user.role === 'ADMIN') { toast.error('Los administradores no pueden realizar reservas'); return; }
    if (!confirmedAddr) { toast.error('Selecciona la dirección del servicio'); return; }
    if (!scheduledAt) { toast.error('Selecciona una fecha y hora'); return; }
    if (!selectedService) { toast.error('Selecciona un servicio'); return; }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      toast.error('La fecha debe ser futura'); return;
    }

    const addressStr = confirmedAddr.formatted || `${confirmedAddr.street} ${confirmedAddr.number}, ${confirmedAddr.city}`;

    const intervalDays =
      recurringFreq === 'WEEKLY' ? 7 :
      recurringFreq === 'BIWEEKLY' ? 14 :
      recurringFreq === 'MONTHLY' ? 30 :
      recurringFreq === 'CUSTOM' ? recurringIntervalDays : undefined;

    setBooking(true);
    try {
      const { data } = await bookingsApi.create({
        serviceId: selectedService,
        scheduledAt: scheduledDate.toISOString(),
        address: addressStr,
        clientNotes: notes,
        isRecurring: recurringFreq !== 'NONE',
        recurringFrequency: recurringFreq !== 'NONE' ? recurringFreq : undefined,
        recurringIntervalDays: recurringFreq === 'CUSTOM' ? intervalDays : undefined,
        recurringEndDate: recurringFreq !== 'NONE' && recurringEndDate ? new Date(recurringEndDate).toISOString() : undefined,
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
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#080F1E] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!pro) return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#080F1E] flex items-center justify-center">
      <p className="text-[#6B7280] dark:text-[#94A3B8]">{t('profile.not_found')}</p>
    </div>
  );

  const selectedSvc = pro.services?.find((s: any) => s.id === selectedService);
  const hasActiveServices = (pro.services?.length ?? 0) > 0;
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#080F1E]">

        {/* ── Banner header ── */}
        <div
          className="relative"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #0F2257 55%, #162d6e 100%)' }}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)' }}
          />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors pt-5"
            >
              <ChevronLeft size={18} />
              {t('common.back')}
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-5 pb-8">
              <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 ring-[3px] ring-white bg-[#2563EB]">
                {pro.user?.avatarUrl ? (
                  <img src={pro.user.avatarUrl} alt="" className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl font-black text-white">
                      {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h1 className="text-2xl font-bold text-white">
                    {pro.user?.firstName} {pro.user?.lastName}
                  </h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/25">
                    <CheckCircle size={12} className="text-green-400" />
                    <span className="text-xs font-semibold text-white">{t('common.verified')}</span>
                  </div>
                  {pro.level && pro.level !== 'VERIFIED' && <LevelPill level={pro.level} />}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14}
                        fill={i < Math.round(pro.avgRating) ? '#F59E0B' : 'transparent'}
                        className={i < Math.round(pro.avgRating) ? 'text-amber-400' : 'text-white/25'}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-white text-sm">{pro.avgRating.toFixed(1)}</span>
                  <span className="text-white/50 text-xs">({pro.totalReviews} {t('profile.reviews_short')})</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/55">
                  <span className="flex items-center gap-1.5"><Briefcase size={11} />{pro.completedJobs} {t('profile.completed_jobs')}</span>
                  <span className="flex items-center gap-1.5"><Shield size={11} />{Math.round(pro.acceptanceRate * 100)}{t('profile.acceptance')}</span>
                  {pro.city && <span className="flex items-center gap-1.5"><MapPin size={11} />{pro.city}{pro.country ? `, ${pro.country}` : ''}</span>}
                  {pro.serviceMode && (
                    <span className="flex items-center gap-1.5">
                      <Globe size={11} />
                      {pro.serviceMode === 'REMOTE' ? t('profile.service_remote') : pro.serviceMode === 'BOTH' ? t('profile.service_both') : t('profile.service_presential')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-36 md:pb-6">
          <div className="grid md:grid-cols-3 gap-6">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-5">

              {pro.bio && (
                <div className="bg-white dark:bg-[#0F1A2E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D45] p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-3">Sobre mí</h2>
                  <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm leading-relaxed">{pro.bio}</p>
                </div>
              )}

              {/* Experience */}
              <div className="bg-white dark:bg-[#0F1A2E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D45] p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle size={18} className="text-green-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-[#0A1628] dark:text-[#F8FAFF]">
                    {t('profile.verified_experience')}
                  </h2>
                  <span className="ml-auto text-xs px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium border border-green-100 dark:border-green-800/50">
                    {pro.experienceEntries?.length || 0} {t('profile.works')}
                  </span>
                </div>
                {pro.experienceEntries?.length === 0 && (
                  <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm">{t('profile.no_experience')}</p>
                )}
                <div className="space-y-2.5">
                  {pro.experienceEntries?.map((entry: any) => (
                    <div key={entry.id} className="border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 hover:bg-[#F8FAFF] dark:hover:bg-[#080F1E] transition-colors text-left"
                        onClick={() => setExpandedExp(expandedExp === entry.id ? null : entry.id)}
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="flex items-center gap-2">
                            <img src={CATEGORY_IMAGES[entry.serviceCategory]} alt="" className="w-5 h-5 rounded-lg object-cover flex-shrink-0" />
                            <span className="font-medium text-[#0A1628] dark:text-[#F8FAFF] text-sm truncate">{entry.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">{entry.approximateDate}</span>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-[#2563EB] dark:text-[#3B82F6] rounded-full">
                              {CATEGORY_LABELS[entry.serviceCategory]}
                            </span>
                          </div>
                        </div>
                        {expandedExp === entry.id
                          ? <ChevronUp size={15} className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0" />
                          : <ChevronDown size={15} className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0" />
                        }
                      </button>
                      {expandedExp === entry.id && (
                        <div className="px-4 pb-4 border-t border-[#E5E7EB] dark:border-[#1E2D45]">
                          <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mt-3 mb-3 leading-relaxed">{entry.description}</p>
                          {entry.images?.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {entry.images.map((img: any, imgIdx: number) => (
                                <button key={img.id} type="button"
                                  onClick={() => setLightbox({ images: entry.images.map((i: any) => i.fileUrl), index: imgIdx })}
                                  className="overflow-hidden rounded-xl group relative"
                                >
                                  <img src={img.fileUrl} alt={entry.title} className="w-full h-20 sm:h-24 object-cover group-hover:scale-105 transition-transform duration-200" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
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
              {(availability as any[]).length > 0 && (
                <div className="bg-white dark:bg-[#0F1A2E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D45] p-5 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-[#2563EB] dark:text-[#3B82F6]" />
                    Disponibilidad semanal
                  </h2>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']).map((label, i) => {
                      const dayIdx = i === 6 ? 0 : i + 1;
                      const slot = (availability as any[]).find(s => s.dayOfWeek === dayIdx);
                      return (
                        <div key={i} className={`p-2.5 rounded-xl text-xs text-center border transition-colors ${
                          slot
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/60 text-[#2563EB] dark:text-[#3B82F6]'
                            : 'bg-[#F8FAFF] dark:bg-[#080F1E] border-[#E5E7EB] dark:border-[#1E2D45] text-[#6B7280] dark:text-[#94A3B8]'
                        }`}>
                          <p className="font-semibold">{label}</p>
                          {slot ? (
                            <p className="mt-0.5 opacity-80 leading-tight text-[10px]">{slot.startTime}–{slot.endTime}</p>
                          ) : (
                            <p className="mt-0.5 opacity-50">—</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {pro.reviews?.length > 0 && (
                <div className="bg-white dark:bg-[#0F1A2E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D45] p-5 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-5">
                    {t('profile.reviews_title')}{' '}
                    <span className="text-[#6B7280] dark:text-[#94A3B8] font-normal text-sm">({pro.totalReviews})</span>
                  </h2>
                  <div className="space-y-3">
                    {(pro.reviews ?? []).map((review: any) => (
                      <div key={review.id} className="p-4 bg-[#F8FAFF] dark:bg-[#080F1E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45]">
                        <div className="flex items-start justify-between mb-2.5 gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#0A1628] dark:bg-[#1E2D45] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">{review.clientName?.[0] || '?'}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF] truncate block">{review.clientName}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <CheckCircle size={10} className="text-green-500" />
                                <span className="text-[11px] text-green-600 dark:text-green-400">{t('profile.review_verified')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12}
                                fill={i < review.rating ? '#F59E0B' : 'transparent'}
                                className={i < review.rating ? 'text-amber-400' : 'text-gray-200 dark:text-[#1E2D45]'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm leading-relaxed">{review.comment}</p>
                        {review.completedAt && (
                          <p className="text-xs text-[#6B7280]/60 dark:text-[#94A3B8]/60 mt-2">
                            {format(new Date(review.completedAt), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: booking sidebar (tablet+) ── */}
            <div className="hidden md:block space-y-0">
              <div className="bg-white dark:bg-[#0F1A2E] rounded-2xl border border-[#E5E7EB] dark:border-[#1E2D45] overflow-hidden">

                {/* ── Step 1: Service ── */}
                <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
                  <StepLabel n={1} label={t('profile.services')} />
                  {!hasActiveServices ? (
                    <div className="py-4 text-center">
                      <Briefcase size={22} className="mx-auto mb-2 text-[#6B7280] dark:text-[#94A3B8]" />
                      <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Sin servicios activos</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pro.services.map((service: any) => (
                        <button
                          key={service.id}
                          onClick={() => setSelectedService(service.id)}
                          className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 ${
                            selectedService === service.id
                              ? 'border-[#2563EB] dark:border-[#3B82F6] bg-blue-50 dark:bg-blue-900/15'
                              : 'border-[#E5E7EB] dark:border-[#1E2D45] hover:border-[#0A1628] dark:hover:border-[#94A3B8]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <span className="font-semibold text-[#0A1628] dark:text-[#F8FAFF] text-sm block truncate">{service.name}</span>
                              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5 line-clamp-2">{service.description}</p>
                              <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-[#6B7280] dark:text-[#94A3B8] bg-gray-100 dark:bg-[#1E2D45] px-1.5 py-0.5 rounded-full">
                                <Clock size={10} />{service.duration}min
                              </span>
                            </div>
                            <span className="font-black text-[#0A1628] dark:text-[#F8FAFF] text-lg flex-shrink-0">{service.price}€</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {hasActiveServices && (
                  <>
                    {/* ── Step 2: Frequency ── */}
                    <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
                      <StepLabel n={2} label="Frecuencia" />
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {FREQ_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setRecurringFreq(opt.id)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all ${
                              recurringFreq === opt.id
                                ? 'border-[#2563EB] dark:border-[#3B82F6] bg-[#2563EB] dark:bg-[#3B82F6] text-white'
                                : 'border-[#E5E7EB] dark:border-[#1E2D45] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#0A1628] dark:hover:border-[#94A3B8]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {recurringFreq === 'CUSTOM' && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">Cada</span>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={recurringIntervalDays}
                            onChange={e => setRecurringIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#1E2D45] text-sm text-center bg-white dark:bg-[#080F1E] text-[#0A1628] dark:text-[#F8FAFF] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6]"
                          />
                          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">días</span>
                        </div>
                      )}
                      {recurringFreq !== 'NONE' && (
                        <div>
                          <label className="block text-xs text-[#6B7280] dark:text-[#94A3B8] mb-1">Fecha fin (opcional)</label>
                          <input
                            type="date"
                            value={recurringEndDate}
                            onChange={e => setRecurringEndDate(e.target.value)}
                            min={selectedDate || minDate}
                            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] text-sm bg-white dark:bg-[#080F1E] text-[#0A1628] dark:text-[#F8FAFF] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors"
                          />
                          {selectedDate && (
                            <p className="mt-1.5 text-xs text-[#2563EB] dark:text-[#3B82F6] font-medium">
                              {recurringSessionCount} sesión{recurringSessionCount !== 1 ? 'es' : ''} programada{recurringSessionCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Step 3: Date ── */}
                    <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
                      <StepLabel n={3} label="Elige el día" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                        min={minDate}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:focus:ring-[#3B82F6]/20 focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-sm bg-white dark:bg-[#080F1E] text-[#0A1628] dark:text-[#F8FAFF] transition-colors"
                      />
                      {availabilityWarning && (
                        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span>⚠</span>{availabilityWarning}
                        </p>
                      )}
                    </div>

                    {/* ── Step 4: Time slots ── */}
                    {selectedDate && (
                      <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
                        <StepLabel n={4} label="Elige la hora" />
                        <div className="grid grid-cols-3 gap-2">
                          {visibleSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2 text-sm font-semibold rounded-xl border-2 transition-all duration-150 ${
                                selectedTime === slot
                                  ? 'border-[#2563EB] dark:border-[#3B82F6] bg-[#2563EB] dark:bg-[#3B82F6] text-white'
                                  : 'border-[#E5E7EB] dark:border-[#1E2D45] text-[#0A1628] dark:text-[#F8FAFF] hover:border-[#0A1628] dark:hover:border-[#94A3B8]'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                          {visibleSlots.length === 0 && (
                            <p className="col-span-3 text-center text-xs text-[#6B7280] dark:text-[#94A3B8] py-3">
                              No hay horarios disponibles este día
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Step 5: Address ── */}
                    {user && user.role !== 'ADMIN' && pro.userId !== user.id && (
                      <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
                        <StepLabel n={5} label="Dirección del servicio" />
                        {confirmedAddr ? (
                          <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                            <MapPin size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                                {confirmedAddr.street} {confirmedAddr.number}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                {confirmedAddr.postalCode && (
                                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                                    CP {confirmedAddr.postalCode}
                                  </span>
                                )}
                                <span className="text-xs text-green-600 dark:text-green-500">
                                  {confirmedAddr.buildingType === 'piso'
                                    ? `Piso${confirmedAddr.floor ? ` ${confirmedAddr.floor}` : ''}${confirmedAddr.door ? ` · ${confirmedAddr.door}` : ''}`
                                    : confirmedAddr.buildingType === 'local' ? 'Local' : 'Casa / Chalet'}
                                </span>
                              </div>
                            </div>
                            <button type="button" onClick={() => setConfirmedAddr(null)}
                              className="flex-shrink-0 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            >
                              Cambiar
                            </button>
                          </div>
                        ) : (
                          <AddressMapPicker onConfirm={setConfirmedAddr} />
                        )}
                      </div>
                    )}

                    {/* ── Notes ── */}
                    {user && user.role !== 'ADMIN' && pro.userId !== user.id && (
                      <div className="p-5 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
                        <label className="block text-xs font-bold text-[#0A1628] dark:text-[#F8FAFF] uppercase tracking-wide mb-2">
                          {t('profile.notes')}
                        </label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          rows={2}
                          placeholder={t('profile.notes_placeholder')}
                          className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:focus:ring-[#3B82F6]/20 focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-sm resize-none bg-white dark:bg-[#080F1E] text-[#0A1628] dark:text-[#F8FAFF] placeholder-[#6B7280] dark:placeholder-[#94A3B8] transition-colors"
                        />
                      </div>
                    )}

                    {/* ── Summary + Book button ── */}
                    {user && user.role !== 'ADMIN' && pro.userId !== user.id && (
                      <div className="p-5">
                        {selectedSvc && (
                          <div className="mb-4 p-3.5 bg-[#F8FAFF] dark:bg-[#080F1E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45]">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-[#6B7280] dark:text-[#94A3B8]">{selectedSvc.name}</span>
                              <span className="font-bold text-[#0A1628] dark:text-[#F8FAFF]">{selectedSvc.price}€</span>
                            </div>
                            {scheduledAt && (
                              <p className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
                                {format(new Date(scheduledAt), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                              </p>
                            )}
                            {recurringFreq !== 'NONE' && (
                              <p className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">
                                {recurringSessionCount} sesiones · {selectedSvc.price * recurringSessionCount}€ total
                              </p>
                            )}
                            <p className="text-[11px] text-[#6B7280] dark:text-[#94A3B8] mt-1">{t('profile.escrow_note')}</p>
                          </div>
                        )}
                        {/* Assessment visit banner */}
                        {selectedSvc?.hasAssessmentVisit && (
                          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                            <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Visita de valoración incluida</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                {selectedSvc.assessmentPrice
                                  ? `El profesional realizará una visita previa por ${selectedSvc.assessmentPrice}€ para valorar el trabajo.`
                                  : 'El profesional realizará una visita previa gratuita para valorar el trabajo.'}
                              </p>
                            </div>
                          </div>
                        )}
                        <form onSubmit={handleBooking}>
                          <button
                            type="submit"
                            disabled={booking || !selectedService || !scheduledAt || !confirmedAddr}
                            className="w-full py-3.5 text-white font-bold rounded-xl disabled:opacity-40 transition-all text-sm active:scale-[0.98] shadow-lg"
                            style={{ background: '#0A1628', boxShadow: '0 4px 14px rgba(10,22,40,0.3)' }}
                            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#2563EB'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; }}
                          >
                            {booking ? t('profile.booking_loading') : recurringFreq !== 'NONE' ? 'Solicitar servicio recurrente' : t('profile.book_button')}
                          </button>
                        </form>
                        {/* VELORA guarantee */}
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#6B7280] dark:text-[#94A3B8]">
                          <Shield size={12} className="text-green-500" />
                          <span>Garantía VELORA · Pago protegido por escrow</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Not logged in */}
                {!user && (
                  <div className="p-5">
                    <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mb-4 text-center">{t('profile.login_to_book')}</p>
                    <a href="/login" className="block w-full py-3 text-white font-bold rounded-xl text-sm text-center transition-all"
                      style={{ background: '#0A1628' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; }}
                    >
                      {t('profile.login_button')}
                    </a>
                  </div>
                )}

                {/* Own profile */}
                {user && user.role !== 'ADMIN' && pro.userId === user.id && (
                  <div className="p-5 text-center">
                    <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">Este es tu perfil profesional.</p>
                    <a href="/dashboard" className="mt-3 inline-block text-sm font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline">
                      Ir a mi panel →
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky booking bar (above BottomNav) ── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F1A2E]/95 backdrop-blur-sm border-t border-[#E5E7EB] dark:border-[#1E2D45] px-4 py-3">
        {!user ? (
          <a
            href="/login"
            className="block w-full py-3.5 text-center text-white font-bold rounded-xl text-sm"
            style={{ background: '#0A1628' }}
          >
            Iniciar sesión para reservar
          </a>
        ) : user.role === 'ADMIN' || pro?.userId === user?.id ? null : !hasActiveServices ? (
          <p className="text-center text-sm text-[#6B7280] dark:text-[#94A3B8] py-1">Sin servicios disponibles</p>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] leading-none">desde</p>
              <p className="text-xl font-black text-[#0A1628] dark:text-[#F8FAFF] leading-none mt-0.5">
                {pro && Math.min(...(pro.services ?? []).map((s: any) => s.price))}€
              </p>
            </div>
            <button
              onClick={() => setShowBookingSheet(true)}
              className="flex-1 py-3.5 text-white font-bold rounded-xl text-sm active:scale-[0.98] transition-all"
              style={{ background: '#0A1628', boxShadow: '0 4px 14px rgba(10,22,40,0.3)' }}
            >
              Reservar
            </button>
          </div>
        )}
      </div>

      {/* ── Mobile booking bottom sheet ── */}
      {showBookingSheet && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowBookingSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[92vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h3 className="text-base font-bold text-[#0A1628] dark:text-[#F8FAFF]">Hacer una reserva</h3>
              <button
                onClick={() => setShowBookingSheet(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Step 1: Service */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <StepLabel n={1} label={t('profile.services')} />
                <div className="space-y-2">
                  {pro.services.map((service: any) => (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200 ${
                        selectedService === service.id
                          ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <span className="font-semibold text-[#0A1628] dark:text-[#F8FAFF] text-sm block truncate">{service.name}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{service.description}</p>
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                            <Clock size={10} />{service.duration}min
                          </span>
                        </div>
                        <span className="font-black text-[#0A1628] dark:text-[#F8FAFF] text-lg flex-shrink-0">{service.price}€</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Frequency */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <StepLabel n={2} label="Frecuencia" />
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {FREQ_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRecurringFreq(opt.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all ${
                        recurringFreq === opt.id
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {recurringFreq === 'CUSTOM' && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Cada</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={recurringIntervalDays}
                      onChange={e => setRecurringIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-center bg-white dark:bg-gray-800 text-[#0A1628] dark:text-white outline-none"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">días</span>
                  </div>
                )}
                {recurringFreq !== 'NONE' && (
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha fin (opcional)</label>
                    <input
                      type="date"
                      value={recurringEndDate}
                      onChange={e => setRecurringEndDate(e.target.value)}
                      min={selectedDate || minDate}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-[#0A1628] dark:text-white outline-none"
                    />
                    {selectedDate && (
                      <p className="mt-1.5 text-xs text-[#2563EB] font-medium">
                        {recurringSessionCount} sesión{recurringSessionCount !== 1 ? 'es' : ''} programada{recurringSessionCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Date visual picker */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <StepLabel n={3} label="Elige el día" />
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 no-scrollbar">
                  {next14Days.map(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const available = isDayAvailable(date);
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        disabled={!available}
                        onClick={() => { setSelectedDate(dateStr); setSelectedTime(''); }}
                        className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB] text-white'
                            : available
                              ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0A1628] dark:text-white'
                              : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase">{DAY_LABELS[date.getDay()]}</span>
                        <span className="text-lg font-black leading-none mt-0.5">{date.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                {availabilityWarning && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock size={11} />{availabilityWarning}
                  </p>
                )}
              </div>

              {/* Step 4: Time slots */}
              {selectedDate && (
                <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                  <StepLabel n={4} label="Elige la hora" />
                  <div className="grid grid-cols-4 gap-2">
                    {visibleSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 text-sm font-semibold rounded-xl border-2 transition-all duration-150 ${
                          selectedTime === slot
                            ? 'border-[#2563EB] bg-[#2563EB] text-white'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0A1628] dark:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                    {visibleSlots.length === 0 && (
                      <p className="col-span-4 text-center text-xs text-gray-500 dark:text-gray-400 py-3">
                        No hay horarios disponibles este día
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Address */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                <StepLabel n={5} label="Dirección del servicio" />
                {confirmedAddr ? (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                    <MapPin size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                        {confirmedAddr.street} {confirmedAddr.number}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {confirmedAddr.postalCode && (
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                            CP {confirmedAddr.postalCode}
                          </span>
                        )}
                        <span className="text-xs text-green-600 dark:text-green-500">
                          {confirmedAddr.buildingType === 'piso'
                            ? `Piso${confirmedAddr.floor ? ` ${confirmedAddr.floor}` : ''}${confirmedAddr.door ? ` · ${confirmedAddr.door}` : ''}`
                            : confirmedAddr.buildingType === 'local' ? 'Local' : 'Casa / Chalet'}
                        </span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setConfirmedAddr(null)}
                      className="flex-shrink-0 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <AddressMapPicker onConfirm={setConfirmedAddr} />
                )}
              </div>

              {/* Notes */}
              <div className="p-5">
                <label className="block text-xs font-bold text-[#0A1628] dark:text-[#F8FAFF] uppercase tracking-wide mb-2">
                  {t('profile.notes')}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder={t('profile.notes_placeholder')}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-sm resize-none bg-white dark:bg-gray-800 text-[#0A1628] dark:text-[#F8FAFF] placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
              </div>
            </div>

            {/* Fixed bottom: summary + book button */}
            <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              {selectedSvc && scheduledAt && (
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedSvc.name}</p>
                  <p className="text-sm font-bold text-[#0A1628] dark:text-[#F8FAFF]">{selectedSvc.price}€</p>
                </div>
              )}
              {selectedSvc?.hasAssessmentVisit && (
                <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-2">
                  <CheckCircle size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {selectedSvc.assessmentPrice
                      ? `Incluye visita de valoración previa (${selectedSvc.assessmentPrice}€)`
                      : 'Incluye visita de valoración previa gratuita'}
                  </p>
                </div>
              )}
              <form onSubmit={handleBooking}>
                <button
                  type="submit"
                  disabled={booking || !selectedService || !scheduledAt || !confirmedAddr}
                  className="w-full py-4 text-white font-bold rounded-xl disabled:opacity-40 transition-all text-sm active:scale-[0.98]"
                  style={{ background: '#0A1628', boxShadow: '0 4px 14px rgba(10,22,40,0.3)' }}
                >
                  {booking ? t('profile.booking_loading') : recurringFreq !== 'NONE' ? 'Solicitar servicio recurrente' : t('profile.book_button')}
                </button>
              </form>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                <Shield size={11} className="text-green-500" />
                Garantía VELORA · Pago protegido
              </div>
            </div>
          </div>
        </div>
      )}

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
