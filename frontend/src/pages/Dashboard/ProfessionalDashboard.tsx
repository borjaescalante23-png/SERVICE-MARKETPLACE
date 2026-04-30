import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { professionalsApi, servicesApi } from '../../services/api';
import { bookingsApi } from '../../services/api';
import { Booking, BOOKING_STATUS_LABELS, CATEGORY_LABELS, ServiceCategory, VERIFICATION_STATUS_LABELS } from '../../types';
import Badge from '../../components/common/Badge';
import StarRating from '../../components/common/StarRating';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Upload, CheckCircle, AlertCircle, Briefcase, Star, Trash2, Camera, User, TrendingUp, ShieldCheck, CreditCard, CalendarDays, Clock } from 'lucide-react';
import AvailabilitySchedule from '../../components/AvailabilitySchedule';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import LevelBadge from '../../components/common/LevelBadge';
import { useI18n } from '../../i18n';

export default function ProfessionalDashboard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'experience' | 'services' | 'documents' | 'availability'>('overview');
  const [newService, setNewService] = useState({ name: '', description: '', category: 'HAIRDRESSING' as ServiceCategory, price: '', duration: '' });
  const [addingService, setAddingService] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pricingHint, setPricingHint] = useState<{ min: number; max: number; suggested: number; message: string } | null>(null);
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [savingMode, setSavingMode] = useState(false);

  useEffect(() => {
    if (!showServiceForm) return;
    servicesApi.getPricing(newService.category).then(r => setPricingHint(r.data)).catch(() => setPricingHint(null));
  }, [newService.category, showServiceForm]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => professionalsApi.getMyProfile().then(r => r.data),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.list().then(r => r.data),
  });

  useEffect(() => {
    if (profile?.bio) setBio(profile.bio);
  }, [profile?.bio]);

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await professionalsApi.uploadAvatar(fd);
      toast.success('Foto de perfil actualizada');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } catch {
      toast.error('Error al subir la foto');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!confirm('¿Seguro que quieres eliminar este documento?')) return;
    try {
      await professionalsApi.deleteDocument(docId);
      toast.success('Documento eliminado');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al eliminar');
    }
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

  async function handleSaveBio() {
    if (!bio.trim()) return;
    setSavingBio(true);
    try {
      await professionalsApi.updateProfile({ bio: bio.trim() });
      toast.success('Bio guardada');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } catch {
      toast.error('Error al guardar la bio');
    } finally {
      setSavingBio(false);
    }
  }

  async function handleServiceMode(mode: string) {
    setSavingMode(true);
    try {
      await professionalsApi.updateProfile({ serviceMode: mode });
      toast.success('Modo de servicio actualizado');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSavingMode(false);
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await servicesApi.delete(id);
      toast.success('Servicio eliminado');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al eliminar');
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
  const kycStatus = profile?.kycStatus || 'PENDING';
  const stripeStatus = profile?.stripeConnectStatus || 'NOT_STARTED';

  const tabs = [
    { id: 'overview', label: t('profdash.tab_overview') },
    { id: 'bookings', label: t('profdash.tab_bookings') },
    { id: 'experience', label: t('profdash.tab_experience') },
    { id: 'services', label: t('profdash.tab_services') },
    { id: 'documents', label: t('profdash.tab_documents') },
    { id: 'availability', label: 'Disponibilidad' },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Status banner */}
      {!isApproved && (
        <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${
          vs === 'UNDER_REVIEW' ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
          vs === 'REJECTED' ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' :
          'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
        }`}>
          <AlertCircle size={20} className={vs === 'UNDER_REVIEW' ? 'text-blue-500' : vs === 'REJECTED' ? 'text-red-500' : 'text-amber-500'} />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Estado: {VERIFICATION_STATUS_LABELS[vs!]}</p>
            {vs === 'PENDING' && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sube tus documentos y al menos 2 trabajos con imágenes para solicitar verificación.</p>}
            {vs === 'UNDER_REVIEW' && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tu perfil está siendo revisado por el equipo. Te notificaremos pronto.</p>}
            {vs === 'REJECTED' && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Motivo: {profile?.rejectionReason}</p>}
          </div>
        </div>
      )}

      {isApproved && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center gap-3">
          <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
          <span className="text-green-700 dark:text-green-400 font-medium flex-1">{t('profdash.approved')}</span>
          {profile?.level && <LevelBadge level={profile.level} size="md" />}
        </div>
      )}

      {/* Profile incomplete banner */}
      {!profile?.bio && kycStatus !== 'APPROVED' && (
        <Link to="/provider-onboarding" className="block mb-4">
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 hover:opacity-90 transition-opacity">
            <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{t('profdash.banner_incomplete')}</p>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex-shrink-0 whitespace-nowrap">{t('profdash.go_onboarding')}</span>
          </div>
        </Link>
      )}

      {/* KYC Banner */}
      {kycStatus === 'PENDING' && (
        <Link to="/kyc" className="block mb-4">
          <div className="p-4 rounded-2xl flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:opacity-90 transition-opacity">
            <ShieldCheck size={20} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{t('profdash.banner_kyc_pending')}</p>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex-shrink-0 whitespace-nowrap">{t('profdash.go_kyc')}</span>
          </div>
        </Link>
      )}
      {(kycStatus === 'PROCESSING' || kycStatus === 'MANUAL_REVIEW') && (
        <div className="mb-4 p-4 rounded-2xl flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <Clock size={20} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{t('profdash.banner_kyc_review')}</p>
        </div>
      )}
      {kycStatus === 'REJECTED' && (
        <div className="mb-4 p-4 rounded-2xl flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <ShieldCheck size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{t('profdash.banner_kyc_rejected')}</p>
          <Link
            to="/kyc"
            className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap underline-offset-2 hover:underline"
          >
            {t('profdash.retry_kyc')}
          </Link>
        </div>
      )}

      {/* Stripe Connect Banner */}
      {stripeStatus !== 'ACTIVE' && (
        <Link to="/stripe/onboarding" className="block mb-6">
          <div className={`p-4 rounded-2xl flex items-center gap-3 transition-opacity hover:opacity-90 ${
            stripeStatus === 'PENDING'
              ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700'
              : 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
          }`}>
            <CreditCard size={20} className={stripeStatus === 'PENDING' ? 'text-amber-500 flex-shrink-0' : 'text-purple-500 flex-shrink-0'} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {stripeStatus === 'NOT_STARTED' ? 'Configura tu cuenta de cobros' :
                 stripeStatus === 'INCOMPLETE' ? 'Onboarding de Stripe incompleto' :
                 'Verificacion de cuenta en proceso'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {stripeStatus === 'NOT_STARTED' ? 'Necesitas conectar Stripe para recibir pagos.' :
                 stripeStatus === 'INCOMPLETE' ? 'Completa el proceso para activar los cobros.' :
                 'Stripe esta verificando tu informacion.'}
              </p>
            </div>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium flex-shrink-0">→</span>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: t('profdash.stat_rating'), value: profile?.avgRating?.toFixed(1) || '—', icon: <Star size={16} className="text-amber-500" /> },
          { label: t('profdash.stat_reviews'), value: profile?.totalReviews || 0, icon: <Star size={16} className="text-gray-400" /> },
          { label: t('profdash.stat_jobs'), value: profile?.completedJobs || 0, icon: <Briefcase size={16} className="text-blue-500" /> },
          { label: t('profdash.stat_acceptance'), value: `${Math.round((profile?.acceptanceRate || 0) * 100)}%`, icon: <CheckCircle size={16} className="text-green-500" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

          {/* Completion checklist */}
          {(() => {
            const hasPhoto = !!profile?.user?.avatarUrl;
            const hasBio = !!(profile?.bio && profile.bio.length > 10);
            const expCount = (profile?.experienceEntries || []).filter((e: any) => e.images?.length > 0).length;
            const hasExp = expCount >= 2;
            const hasDoc = (profile?.documents || []).some((d: any) => ['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE'].includes(d.type));
            const hasSvc = (profile?.services || []).length > 0;
            const kycOk = kycStatus === 'APPROVED';
            const stripeOk = stripeStatus === 'ACTIVE';
            const steps = [
              { ok: hasPhoto, label: 'Foto de perfil', action: null },
              { ok: hasBio, label: 'Descripción / bio', action: null },
              { ok: hasExp, label: `Mínimo 2 trabajos con fotos (${expCount}/2)`, action: () => setActiveTab('experience') },
              { ok: hasDoc, label: 'Documento de identidad', action: () => setActiveTab('documents') },
              { ok: hasSvc, label: 'Al menos 1 servicio creado', action: () => setActiveTab('services') },
              { ok: kycOk, label: 'Verificación KYC', action: () => window.location.href = '/kyc' },
              { ok: stripeOk, label: 'Cuenta de cobros Stripe', action: () => window.location.href = '/stripe/onboarding' },
            ];
            const done = steps.filter(s => s.ok).length;
            const allDone = done === steps.length;
            return (
              <div className={`rounded-2xl border p-5 ${allDone ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={16} className={allDone ? 'text-green-500' : 'text-gray-300'} />
                    Completa tu perfil
                  </h3>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${allDone ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'}`}>
                    {done}/{steps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4">
                  <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
                </div>
                <div className="space-y-2">
                  {steps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${s.ok ? '' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => !s.ok && s.action && s.action()}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.ok ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {s.ok
                          ? <CheckCircle size={13} className="text-green-500" />
                          : <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 block" />}
                      </div>
                      <span className={`text-sm ${s.ok ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>{s.label}</span>
                      {!s.ok && s.action && <span className="ml-auto text-xs text-primary-500">→</span>}
                    </div>
                  ))}
                </div>
                {!isApproved && done >= 5 && (
                  <p className="mt-4 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                    Una vez completes todos los pasos, el equipo de VELORA revisará tu perfil y lo aprobará en 24-48h.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Profile photo + bio + service mode */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
            {/* Photo */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Camera size={16} className="text-primary-600" />
                {t('profdash.photo_title')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('profdash.photo_desc')}</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {profile?.user?.avatarUrl ? (
                    <img src={profile.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <label className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl cursor-pointer transition-colors ${
                    profile?.user?.avatarUrl
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}>
                    {uploadingAvatar ? t('common.uploading') : profile?.user?.avatarUrl ? t('profdash.change_photo') : t('profdash.upload_photo')}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* Bio */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <User size={16} className="text-primary-600" />
                Descripción profesional
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Cuéntales a los clientes quién eres y qué haces. Mínimo 10 caracteres.</p>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ej: Peluquera con 8 años de experiencia especializada en coloraciones y cortes modernos. Trabajo con productos premium y garantizo resultados..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none dark:bg-gray-800 dark:text-white"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{bio.length}/500</span>
                <button
                  onClick={handleSaveBio}
                  disabled={savingBio || bio.trim().length < 10}
                  className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-40 transition-colors"
                >
                  {savingBio ? 'Guardando...' : 'Guardar bio'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* Service mode */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Modo de servicio</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">¿Cómo ofreces tus servicios?</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'PRESENTIAL', label: 'A domicilio', desc: 'Vas al cliente' },
                  { value: 'REMOTE', label: 'Remoto', desc: 'Online / videollamada' },
                  { value: 'BOTH', label: 'Ambos', desc: 'Flexible' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={savingMode}
                    onClick={() => handleServiceMode(opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all disabled:opacity-50 ${
                      profile?.serviceMode === opt.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${profile?.serviceMode === opt.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active bookings */}
          {bookings.filter((b: Booking) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('profdash.active_bookings')}</h3>
              {bookings
                .filter((b: Booking) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status))
                .slice(0, 3)
                .map((b: Booking) => (
                  <Link key={b.id} to={`/bookings/${b.id}`} className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-primary-200 dark:hover:border-primary-700 mb-2 transition-all">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{b.service?.name}</p>
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
            <p className="text-gray-400 text-center py-10">{t('profdash.no_bookings')}</p>
          ) : bookings.map((b: Booking) => (
            <Link key={b.id} to={`/bookings/${b.id}`} className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-primary-200 dark:hover:border-primary-700 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{b.service?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{b.client?.firstName} {b.client?.lastName}</p>
                  <p className="text-xs text-gray-400 mt-1">{format(new Date(b.scheduledAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
                </div>
                <div className="text-right">
                  <Badge label={BOOKING_STATUS_LABELS[b.status]} type="booking" status={b.status} />
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{b.professionalAmount.toFixed(2)}€</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'experience' && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
            {t('profdash.exp_notice')}
          </div>

          {profile?.experienceEntries?.map((entry: any) => (
            <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{entry.title}</p>
                  <p className="text-xs text-gray-400">{entry.approximateDate} · {CATEGORY_LABELS[entry.serviceCategory]}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.description}</p>
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
                  {t('common.delete')}
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

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={16} />
              {t('profdash.add_work')}
            </h3>
            <form onSubmit={handleExperienceSubmit} className="space-y-4">
              <input name="title" required placeholder={t('profdash.work_title_placeholder')} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <textarea name="description" required minLength={10} placeholder={t('profdash.work_desc_placeholder')} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              <div className="grid grid-cols-2 gap-4">
                <select name="serviceCategory" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                  {Object.keys(CATEGORY_LABELS).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as ServiceCategory]}</option>)}
                </select>
                <input name="approximateDate" required placeholder={t('profdash.work_date_placeholder')} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profdash.work_images')} <span className="text-red-500">*</span>
                </label>
                <input name="images" type="file" accept="image/*,.pdf" multiple required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
                {t('profdash.add_work')}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-4">
          {profile?.services?.map((s: any) => (
            <div key={s.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{s.description}</p>
                <p className="text-xs text-gray-400 mt-1">{CATEGORY_LABELS[s.category]} · {s.duration}min</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="font-bold text-primary-600">{s.price}€</p>
                <button
                  onClick={() => handleDeleteService(s.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar servicio"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {!showServiceForm ? (
            <button onClick={() => setShowServiceForm(true)} className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
              <Plus size={16} />
              {t('profdash.add_service')}
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('profdash.new_service')}</h3>
              <form onSubmit={handleCreateService} className="space-y-4">
                <input value={newService.name} onChange={e => setNewService(p => ({...p, name: e.target.value}))} required placeholder={t('profdash.service_name_placeholder')} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <textarea value={newService.description} onChange={e => setNewService(p => ({...p, description: e.target.value}))} required placeholder={t('profdash.service_desc_placeholder')} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                <div className="grid grid-cols-3 gap-4">
                  <select value={newService.category} onChange={e => setNewService(p => ({...p, category: e.target.value as ServiceCategory}))} className="col-span-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                    {Object.keys(CATEGORY_LABELS).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c as ServiceCategory]}</option>)}
                  </select>
                  <input type="number" value={newService.price} onChange={e => setNewService(p => ({...p, price: e.target.value}))} required placeholder={t('profdash.service_price_placeholder')} min="25" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input type="number" value={newService.duration} onChange={e => setNewService(p => ({...p, duration: e.target.value}))} required placeholder={t('profdash.service_duration_placeholder')} min="15" className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                {pricingHint && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrendingUp size={14} className="text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-300">{t('profdash.pricing_hint_title', { category: CATEGORY_LABELS[newService.category] })}</span>
                    </div>
                    <p className="text-blue-700 dark:text-blue-400 text-xs mb-2">{pricingHint.message}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-blue-600 dark:text-blue-400">{t('profdash.pricing_range', { min: pricingHint.min, max: pricingHint.max })}</span>
                      <button
                        type="button"
                        onClick={() => setNewService(p => ({ ...p, price: String(pricingHint.suggested) }))}
                        className="text-blue-700 dark:text-blue-300 underline hover:no-underline font-medium"
                      >
                        {t('profdash.pricing_use', { price: pricingHint.suggested })}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={addingService} className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
                    {addingService ? t('profdash.creating') : t('profdash.create_service')}
                  </button>
                  <button type="button" onClick={() => setShowServiceForm(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
            {t('profdash.doc_notice')}
          </div>

          {profile?.documents?.map((doc: any) => {
            let ai: any = null;
            try { ai = doc.aiAnalysis ? JSON.parse(doc.aiAnalysis) : null; } catch {}
            return (
              <div key={doc.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">{doc.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400 truncate">{doc.originalName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge label={VERIFICATION_STATUS_LABELS[doc.status as keyof typeof VERIFICATION_STATUS_LABELS] || doc.status} type="verification" status={doc.status} />
                    {['PENDING', 'UNDER_REVIEW'].includes(doc.status) && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {ai && (
                  <div className={`mt-3 p-3 rounded-lg text-xs ${
                    ai.authentic ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${ai.authentic ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        IA: {ai.authentic ? 'Documento válido' : 'Revisión necesaria'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        ai.confidence === 'high' ? 'bg-green-100 text-green-600' :
                        ai.confidence === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        Confianza: {ai.confidence}
                      </span>
                    </div>
                    <p className={ai.authentic ? 'text-green-600' : 'text-amber-600'}>{ai.summary}</p>
                    {ai.flags?.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {ai.flags.map((f: string, i: number) => (
                          <li key={i} className="text-amber-600">⚠ {f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Upload size={16} />
              {t('profdash.upload_doc')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { type: 'NATIONAL_ID', label: 'DNI/NIE' },
                { type: 'PASSPORT', label: 'Pasaporte' },
                { type: 'PROFESSIONAL_CERTIFICATE', label: 'Certificado profesional' },
                { type: 'WORK_EVIDENCE', label: 'Evidencia de trabajo' },
              ].map(({ type, label }) => (
                <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
                  <Upload size={14} className="text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                  </div>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleDocumentUpload(e, type)} />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays size={18} className="text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Horario semanal</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Define los días y horarios en que estás disponible para recibir reservas. Los clientes verán esta información en tu perfil.
          </p>
          <AvailabilitySchedule />
        </div>
      )}
    </div>
  );
}
