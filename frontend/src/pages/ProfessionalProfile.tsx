import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi, bookingsApi } from '../services/api';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types';
import StarRating from '../components/common/StarRating';
import { CheckCircle, Clock, Briefcase, Calendar, MapPin, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedService, setSelectedService] = useState<string>('');
  const [address, setAddress] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [expandedExp, setExpandedExp] = useState<string | null>(null);

  const { data: pro, isLoading } = useQuery({
    queryKey: ['professional', id],
    queryFn: () => professionalsApi.getById(id!).then(r => r.data),
    enabled: !!id,
  });

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'CLIENT') { toast.error('Solo clientes pueden reservar'); return; }

    setBooking(true);
    try {
      const { data } = await bookingsApi.create({
        serviceId: selectedService,
        scheduledAt: new Date(scheduledAt).toISOString(),
        address,
        clientNotes: notes,
      });
      toast.success('Reserva creada. Procede al pago para confirmar.');
      navigate(`/bookings/${data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear la reserva');
    } finally {
      setBooking(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!pro) return <div className="text-center py-20 text-gray-500">Profesional no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-primary-600">
                  {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {pro.user?.firstName} {pro.user?.lastName}
                  </h1>
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Verificado</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(pro.avgRating)} size={16} />
                    <span className="font-semibold text-gray-700">{pro.avgRating.toFixed(1)}</span>
                    <span className="text-gray-400 text-sm">({pro.totalReviews} reseñas)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {pro.completedJobs} trabajos completados
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield size={14} />
                    {Math.round(pro.acceptanceRate * 100)}% aceptación
                  </span>
                </div>

                {pro.bio && <p className="mt-4 text-gray-600 leading-relaxed">{pro.bio}</p>}
              </div>
            </div>
          </div>

          {/* Verified Experience */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle size={20} className="text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Experiencia Verificada</h2>
              <span className="ml-auto text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                {pro.experienceEntries?.length || 0} trabajos
              </span>
            </div>

            {pro.experienceEntries?.length === 0 && (
              <p className="text-gray-400 text-sm">Sin entradas de experiencia todavía.</p>
            )}

            <div className="space-y-4">
              {pro.experienceEntries?.map((entry: any) => (
                <div key={entry.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedExp(expandedExp === entry.id ? null : entry.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[entry.serviceCategory]}</span>
                        <span className="font-medium text-gray-900">{entry.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{entry.approximateDate}</span>
                        <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full">
                          {CATEGORY_LABELS[entry.serviceCategory]}
                        </span>
                      </div>
                    </div>
                    {expandedExp === entry.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>

                  {expandedExp === entry.id && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      <p className="text-gray-600 text-sm mt-3 mb-4">{entry.description}</p>
                      {entry.images?.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {entry.images.map((img: any) => (
                            <img
                              key={img.id}
                              src={img.fileUrl}
                              alt={entry.title}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          {pro.reviews?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Reseñas verificadas ({pro.totalReviews})
              </h2>

              <div className="space-y-4">
                {pro.reviews.map((review: any) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-600">
                            {review.clientName?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{review.clientName}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle size={11} className="text-green-500" />
                            <span className="text-xs text-green-600">Reseña verificada</span>
                          </div>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={13} />
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
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

        {/* Right column — booking */}
        <div className="space-y-4">
          {/* Services */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios</h2>
            <div className="space-y-3">
              {pro.services?.map((service: any) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedService === service.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-900">{service.name}</span>
                      <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="font-bold text-primary-600 text-lg">{service.price}€</span>
                      <p className="text-xs text-gray-400">{service.duration}min</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Booking form */}
          {user?.role === 'CLIENT' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reservar</h2>

              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    Fecha y hora
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin size={14} className="inline mr-1" />
                    Dirección
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Tu dirección completa"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Instrucciones especiales..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                  />
                </div>

                {selectedService && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Servicio seleccionado</span>
                      <span className="font-medium">
                        {pro.services?.find((s: any) => s.id === selectedService)?.price}€
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      El pago se retiene en escrow hasta completar el servicio.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={booking || !selectedService}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {booking ? 'Creando reserva...' : 'Solicitar reserva'}
                </button>
              </form>
            </div>
          )}

          {!user && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-gray-500 mb-4">Inicia sesión para reservar este servicio</p>
              <a href="/login" className="block w-full py-3 bg-primary-600 text-white font-semibold rounded-xl text-center hover:bg-primary-700 transition-colors">
                Iniciar sesión
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
