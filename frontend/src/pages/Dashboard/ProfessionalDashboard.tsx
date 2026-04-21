import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { professionalsApi, servicesApi } from '../../services/api';
import { bookingsApi } from '../../services/api';
import { Booking, BOOKING_STATUS_LABELS, CATEGORY_LABELS, ServiceCategory, VERIFICATION_STATUS_LABELS } from '../../types';
import Badge from '../../components/common/Badge';
import StarRating from '../../components/common/StarRating';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Upload, CheckCircle, AlertCircle, Calendar, Briefcase, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfessionalDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'experience' | 'services' | 'documents'>('overview');
  const [newService, setNewService] = useState({ name: '', description: '', category: 'HAIRDRESSING' as ServiceCategory, price: '', duration: '' });
  const [addingService, setAddingService] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => professionalsApi.getMyProfile().then(r => r.data),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list().then(r => r.data),
  });

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      await professionalsApi.uploadDocument(fd);
      toast.success('Documento subido correctamente');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al subir documento');
    }
    e.target.value = '';
  }

  async function handleExperienceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await professionalsApi.addExperience(fd);
      toast.success('Experiencia añadida');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      form.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al añadir experiencia');
    }
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setAddingService(true);
    try {
      await servicesApi.create({
        ...newService,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration),
      });
      toast.success('Servicio creado');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setShowServiceForm(false);
      setNewService({ name: '', description: '', category: 'HAIRDRESSING', price: '', duration: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear servicio');
    } finally {
      setAddingService(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;

  const vs = profile?.verificationStatus;
  const isApproved = vs === 'APPROVED';

  const tabs = [
    { id: 'overview', label: 'Resumen' },
    { id: 'bookings', label: 'Reservas' },
    { id: 'experience', label: 'Experiencia' },
    { id: 'services', label: 'Servicios' },
    { id: 'documents', label: 'Documentos' },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Status banner */}
      {!isApproved && (
        <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
          vs === 'UNDER_REVIEW' ? 'bg-blue-50 border border-blue-200' :
          vs === 'REJECTED' ? 'bg-red-50 border border-red-200' :
          'bg-amber-50 border border-amber-200'
        }`}>
          <AlertCircle size={20} className={vs === 'UNDER_REVIEW' ? 'text-blue-500' : vs === 'REJECTED' ? 'text-red-500' : 'text-amber-500'} />
          <div>
            <p className="font-medium text-gray-900">Estado: {VERIFICATION_STATUS_LABELS[vs!]}</p>
            {vs === 'PENDING' && <p className="text-sm text-gray-600 mt-1">Sube tus documentos y al menos 2 trabajos con imágenes para solicitar verificación.</p>}
            {vs === 'UNDER_REVIEW' && <p className="text-sm text-gray-600 mt-1">Tu perfil está siendo revisado por el equipo. Te notificaremos pronto.</p>}
            {vs === 'REJECTED' && <p className="text-sm text-gray-600 mt-1">Motivo: {profile?.rejectionReason}</p>}
          </div>
        </div>
      )}

      {isApproved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2">
          <CheckCircle size={18} className="text-green-500" />
          <span className="text-green-700 font-medium">Perfil aprobado y visible en el marketplace</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Valoración', value: profile?.avgRating?.toFixed(1) || '—', icon: <Star size={16} className="text-amber-500" /> },
          { label: 'Reseñas', value: profile?.totalReviews || 0, icon: <Star size={16} className="text-gray-400" /> },
          { label: 'Trabajos', value: profile?.completedJobs || 0, icon: <Briefcase size={16} className="text-blue-500" /> },
          { label: 'Aceptación', value: `${Math.round((profile?.acceptanceRate || 0) * 100)}%`, icon: <CheckCircle size={16} className="text-green-500" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-gray-500">{stat.label}</span></div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <p className="text-gray-500">Bienvenido a tu panel. Usa las pestañas para gestionar tu perfil.</p>
          {bookings.filter((b: Booking) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Reservas activas</h3>
              {bookings
                .filter((b: Booking) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status))
                .slice(0, 3)
                .map((b: Booking) => (
                  <Link key={b.id} to={`/bookings/${b.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-primary-200 mb-2 transition-all">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{b.service?.name}</p>
                        <p className="text-xs text-gray-400">{format(new Date(b.scheduledAt), "d MMM, HH:mm", { locale: es })}</p>
                      </div>
                      <Badge label={BOOKING_STATUS_LABELS[b.status]} type="booking" status={b.status} />
                    </div>
                  </Link>
                ))
              }
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-gray-400 text-center py-10">Sin reservas todavía</p>
          ) : bookings.map((b: Booking) => (
            <Link key={b.id} to={`/bookings/${b.id}`} className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-primary-200 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{b.service?.name}</p>
                  <p className="text-sm text-gray-500">{b.client?.firstName} {b.client?.lastName}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(b.scheduledAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
                </div>
                <div className="text-right">
                  <Badge label={BOOKING_STATUS_LABELS[b.status]} type="booking" status={b.status} />
                  <p className="text-sm font-bold text-gray-900 mt-1">{b.professionalAmount.toFixed(2)}€</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'experience' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <strong>Obligatorio:</strong> Debes subir al menos 2 trabajos con imágenes reales para ser aprobado.
          </div>

          {/* Existing entries */}
          {profile?.experienceEntries?.map((entry: any) => (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{entry.title}</p>
                  <p className="text-xs text-gray-400">{entry.approximateDate} · {CATEGORY_LABELS[entry.serviceCategory]}</p>
                  <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await professionalsApi.deleteExperience(entry.id);
                      toast.success('Eliminado');
                      qc.invalidateQueries({ queryKey: ['my-profile'] });
                    } catch { toast.error('Error'); }
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
              {entry.images?.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {entry.images.map((img: any) => (
                    <img key={img.id} src={img.fileUrl} alt="" className="h-16 w-full object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add experience form */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={16} />
              Añadir trabajo
            </h3>
            <form onSubmit={handleExperienceSubmit} className="space-y-4">
              <input name="title" required placeholder="Título del trabajo" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <textarea name="description" required minLength={10} placeholder="Descripción del trabajo (mín. 10 caracteres)" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <select name="serviceCategory" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  {Object.keys(CATEGORY_LABELS).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as ServiceCategory]}</option>)}
                </select>
                <input name="approximateDate" required placeholder="Fecha aprox. (ej: Marzo 2024)" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes del trabajo <span className="text-red-500">*</span>
                </label>
                <input name="images" type="file" accept="image/*,.pdf" multiple required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
                Añadir trabajo
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          {profile?.services?.map((s: any) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.description}</p>
                <p className="text-xs text-gray-400 mt-1">{CATEGORY_LABELS[s.category]} · {s.duration}min</p>
              </div>
              <p className="font-bold text-primary-600">{s.price}€</p>
            </div>
          ))}

          {!showServiceForm ? (
            <button onClick={() => setShowServiceForm(true)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Plus size={16} />
              Añadir servicio
            </button>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Nuevo servicio</h3>
              <form onSubmit={handleCreateService} className="space-y-4">
                <input value={newService.name} onChange={e => setNewService(p => ({...p, name: e.target.value}))} required placeholder="Nombre del servicio" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <textarea value={newService.description} onChange={e => setNewService(p => ({...p, description: e.target.value}))} required placeholder="Descripción" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                <div className="grid grid-cols-3 gap-4">
                  <select value={newService.category} onChange={e => setNewService(p => ({...p, category: e.target.value as ServiceCategory}))} className="col-span-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    {Object.keys(CATEGORY_LABELS).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as ServiceCategory]}</option>)}
                  </select>
                  <input type="number" value={newService.price} onChange={e => setNewService(p => ({...p, price: e.target.value}))} required placeholder="Precio (€)" min="1" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="number" value={newService.duration} onChange={e => setNewService(p => ({...p, duration: e.target.value}))} required placeholder="Duración (min)" min="15" className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={addingService} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {addingService ? 'Creando...' : 'Crear servicio'}
                  </button>
                  <button type="button" onClick={() => setShowServiceForm(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
            <strong>Requerido:</strong> Sube un documento de identidad válido para verificar tu cuenta.
          </div>

          {profile?.documents?.map((doc: any) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{doc.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-400">{doc.originalName}</p>
              </div>
              <Badge label={VERIFICATION_STATUS_LABELS[doc.status as keyof typeof VERIFICATION_STATUS_LABELS] || doc.status} type="verification" status={doc.status} />
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload size={16} />
              Subir documento
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {['NATIONAL_ID', 'PASSPORT', 'PROFESSIONAL_CERTIFICATE', 'WORK_EVIDENCE'].map(type => (
                <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all">
                  <Upload size={14} className="text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">
                      {type === 'NATIONAL_ID' ? 'DNI/NIE' : type === 'PASSPORT' ? 'Pasaporte' : type === 'PROFESSIONAL_CERTIFICATE' ? 'Certificado profesional' : 'Evidencia de trabajo'}
                    </span>
                  </div>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleDocumentUpload(e, type)} />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
