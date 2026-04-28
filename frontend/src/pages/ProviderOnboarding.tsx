import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { professionalsApi, servicesApi, kycApi } from '../services/api';
import { ServiceCategory, CATEGORY_LABELS } from '../types';
import {
  Camera, Upload, CheckCircle, ArrowRight, ShieldCheck,
  RefreshCw, Briefcase, User, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STEP_LABELS = ['Perfil', 'Servicio', 'Verificación KYC', 'Disponibilidad'];

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ServiceCategory[];

type KycSubStep = 'intro' | 'document' | 'selfie' | 'processing' | 'result';
type ServiceMode = 'PRESENTIAL' | 'REMOTE' | 'BOTH';

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  // Step 1: photo + bio
  const [bio, setBio] = useState('');
  const [savingStep1, setSavingStep1] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Step 2: service
  const [svcName, setSvcName] = useState('');
  const [svcCategory, setSvcCategory] = useState<ServiceCategory>('CLEANING');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('60');
  const [svcDescription, setSvcDescription] = useState('');
  const [savingService, setSavingService] = useState(false);

  // Step 3: KYC
  const [kycSubStep, setKycSubStep] = useState<KycSubStep>('intro');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState('');
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 4: service mode
  const [serviceMode, setServiceMode] = useState<ServiceMode>('PRESENTIAL');
  const [savingMode, setSavingMode] = useState(false);
  const [finished, setFinished] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => professionalsApi.getMyProfile().then(r => r.data),
  });

  const { data: kycData, refetch: refetchKyc } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus().then(r => r.data),
    refetchInterval: kycSubStep === 'processing' ? 3000 : false,
    enabled: step === 2,
  });

  useEffect(() => {
    if (kycSubStep === 'processing' && kycData?.kycStatus && kycData.kycStatus !== 'PROCESSING') {
      setKycSubStep('result');
    }
  }, [kycData?.kycStatus, kycSubStep]);

  useEffect(() => {
    if (profile?.bio) setBio(profile.bio);
    if (profile?.serviceMode) setServiceMode(profile.serviceMode as ServiceMode);
  }, [profile?.bio, profile?.serviceMode]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const kycStatus = kycData?.kycStatus || profile?.kycStatus;
  const idDocument = profile?.documents?.find((d: any) => ['NATIONAL_ID', 'PASSPORT'].includes(d.type));
  const hasAvatar = !!profile?.user?.avatarUrl;
  const hasBio = bio.trim().length >= 10;

  // --- Step 1 handlers ---

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
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

  async function handleSaveStep1() {
    if (!hasBio) { toast.error('Escribe al menos 10 caracteres en tu bio'); return; }
    setSavingStep1(true);
    try {
      await professionalsApi.updateProfile({ bio: bio.trim() });
      toast.success('Perfil guardado');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setStep(1);
    } catch {
      toast.error('Error al guardar el perfil');
    } finally {
      setSavingStep1(false);
    }
  }

  // --- Step 2 handlers ---

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    if (!svcName.trim() || !svcDescription.trim() || !svcPrice) {
      toast.error('Completa todos los campos');
      return;
    }
    const price = parseFloat(svcPrice);
    if (price < 25) { toast.error('El precio mínimo es 25€'); return; }
    setSavingService(true);
    try {
      await servicesApi.create({
        name: svcName.trim(),
        description: svcDescription.trim(),
        category: svcCategory,
        price,
        duration: parseInt(svcDuration),
      });
      toast.success('Servicio creado');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setStep(2);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear el servicio');
    } finally {
      setSavingService(false);
    }
  }

  // --- Step 3 KYC handlers ---

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      toast.error('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function captureSelfie() {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob(blob => {
      if (!blob) return;
      setCapturedSelfie(blob);
      setCapturedPreview(URL.createObjectURL(blob));
      stopCamera();
    }, 'image/jpeg', 0.92);
  }

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'NATIONAL_ID');
    try {
      await professionalsApi.uploadDocument(fd);
      toast.success('Documento subido');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setKycSubStep('selfie');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al subir el documento');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  }

  async function submitSelfie() {
    if (!capturedSelfie) return;
    setUploadingSelfie(true);
    const fd = new FormData();
    fd.append('selfie', capturedSelfie, 'selfie.jpg');
    try {
      await kycApi.submitSelfie(fd);
      setKycSubStep('processing');
      refetchKyc();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al enviar selfie');
    } finally {
      setUploadingSelfie(false);
    }
  }

  function handleKycContinue() {
    setStep(3);
  }

  // --- Step 4 handler ---

  async function handleFinish() {
    setSavingMode(true);
    try {
      await professionalsApi.updateProfile({ serviceMode });
      toast.success('¡Perfil configurado! Bienvenido a VELORA.');
      setFinished(true);
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingMode(false);
    }
  }

  if (finished) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">¡Todo listo!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Tu perfil de profesional está configurado. El equipo lo revisará y lo aprobará en 24-48h.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-colors"
        >
          Ir al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase size={18} className="text-primary-600" />
          <span className="text-sm font-medium text-primary-600">Configuración de perfil profesional</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{STEP_LABELS[step]}</h1>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1.5 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 transition-colors ${
              i < step ? 'bg-green-500 text-white' :
              i === step ? 'bg-primary-600 text-white' :
              'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 0: Photo + Bio */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-primary-600" />
              Foto de perfil
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile?.user?.avatarUrl ? (
                  <img src={profile.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Camera size={15} />
                  {uploadingAvatar ? 'Subiendo...' : hasAvatar ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {hasAvatar && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle size={11} /> Foto subida correctamente
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Descripción profesional</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Cuéntale a los clientes quién eres y qué haces. Mínimo 10 caracteres.</p>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Soy profesional con X años de experiencia en..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-between mt-1.5">
              <span className={`text-xs ${hasBio ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                {hasBio ? '¡Bien!' : `${bio.trim().length}/10 mínimo`}
              </span>
              <span className="text-xs text-gray-400">{bio.length}/500</span>
            </div>
          </div>

          <button
            onClick={handleSaveStep1}
            disabled={savingStep1 || !hasBio}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {savingStep1 ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Continuar <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      )}

      {/* STEP 1: Service creation */}
      {step === 1 && (
        <form onSubmit={handleCreateService} className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Define el primer servicio que vas a ofrecer. Podrás añadir más desde el dashboard.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del servicio</label>
              <input
                type="text"
                value={svcName}
                onChange={e => setSvcName(e.target.value)}
                placeholder="Ej: Limpieza general del hogar"
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría</label>
              <select
                value={svcCategory}
                onChange={e => setSvcCategory(e.target.value as ServiceCategory)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
              <textarea
                value={svcDescription}
                onChange={e => setSvcDescription(e.target.value)}
                rows={3}
                placeholder="Describe qué incluye el servicio..."
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Precio (€)</label>
                <input
                  type="number"
                  value={svcPrice}
                  onChange={e => setSvcPrice(e.target.value)}
                  placeholder="Mín. 25€"
                  min="25"
                  step="1"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duración (min)</label>
                <select
                  value={svcDuration}
                  onChange={e => setSvcDuration(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[30, 45, 60, 90, 120, 180, 240].map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingService}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {savingService ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Crear servicio y continuar <ArrowRight size={18} /></>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: KYC */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Already approved */}
          {kycStatus === 'APPROVED' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-4">
              <ShieldCheck size={36} className="text-green-600 mx-auto" />
              <h2 className="font-bold text-green-800 dark:text-green-300">Identidad ya verificada</h2>
              <p className="text-sm text-green-700 dark:text-green-400">Tu identidad fue verificada anteriormente. Puedes continuar.</p>
              <button onClick={handleKycContinue} className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                Continuar <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Intro */}
          {kycSubStep === 'intro' && kycStatus !== 'APPROVED' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ShieldCheck size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Verificación de identidad (KYC)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Obligatoria para operar en VELORA</p>
                </div>
              </div>
              <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>Sube una foto de tu DNI, NIE o pasaporte vigente</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <span>Hazte una selfie en tiempo real — la IA compara tu rostro con el documento</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                Tus datos se procesan de forma segura y no se comparten con terceros.
              </div>
              <button
                onClick={() => setKycSubStep(idDocument ? 'selfie' : 'document')}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                {idDocument ? 'Continuar con selfie' : 'Comenzar verificación'}
              </button>
            </div>
          )}

          {/* Document upload */}
          {kycSubStep === 'document' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Paso 1: Documento de identidad</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sube una foto clara de tu DNI, NIE o pasaporte.</p>
              <label className={`w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                uploadingDoc ? 'opacity-50 pointer-events-none' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
              }`}>
                <Upload size={28} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {uploadingDoc ? 'Subiendo...' : 'Toca para subir tu documento'}
                </span>
                <span className="text-xs text-gray-400">JPG, PNG (máx. 10MB)</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleDocumentUpload} />
              </label>
            </div>
          )}

          {/* Selfie */}
          {kycSubStep === 'selfie' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 dark:text-white">Paso 2: Verificación facial</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hazte una selfie en un lugar bien iluminado.</p>

              {!cameraActive && !capturedPreview && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs text-center text-gray-500 dark:text-gray-400">
                    {['Buena iluminación', 'Rostro centrado', 'Sin gafas de sol'].map(tip => (
                      <div key={tip} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">{tip}</div>
                    ))}
                  </div>
                  <button
                    onClick={startCamera}
                    className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera size={18} />Activar cámara
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-52 border-2 border-white/60 rounded-full pointer-events-none" />
                  </div>
                  <canvas ref={canvasRef} className="sr-only" />
                  <button
                    onClick={captureSelfie}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera size={18} />Capturar selfie
                  </button>
                </div>
              )}

              {capturedPreview && !cameraActive && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden aspect-video bg-black">
                    <img src={capturedPreview} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setCapturedSelfie(null); setCapturedPreview(''); startCamera(); }}
                      className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <RefreshCw size={14} />Repetir
                    </button>
                    <button
                      disabled={uploadingSelfie}
                      onClick={submitSelfie}
                      className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} />{uploadingSelfie ? 'Enviando...' : 'Verificar identidad'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {kycSubStep === 'processing' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Analizando tu identidad...</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">La IA está comparando tu documento con el selfie. Unos segundos.</p>
            </div>
          )}

          {/* Result */}
          {kycSubStep === 'result' && (
            <div className="space-y-3">
              {kycStatus === 'APPROVED' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-3">
                  <CheckCircle size={36} className="text-green-600 mx-auto" />
                  <h2 className="font-bold text-green-800 dark:text-green-300">¡Identidad verificada!</h2>
                  <p className="text-sm text-green-700 dark:text-green-400">Tu identidad ha sido confirmada.</p>
                  {kycData?.kycAttempts?.[0]?.faceMatchScore && (
                    <p className="text-xs text-green-600">Coincidencia facial: {Math.round(kycData.kycAttempts[0].faceMatchScore * 100)}%</p>
                  )}
                  <button onClick={handleKycContinue} className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                    Continuar <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {kycStatus === 'MANUAL_REVIEW' && (
                <div className="space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 text-center space-y-3">
                    <Clock size={36} className="text-amber-600 mx-auto" />
                    <h2 className="font-bold text-amber-800 dark:text-amber-300">En revisión manual</h2>
                    <p className="text-sm text-amber-700 dark:text-amber-400">El equipo revisará tu verificación en 24-48h.</p>
                  </div>
                  <button onClick={handleKycContinue} className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    Continuar de todos modos <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {kycStatus === 'REJECTED' && (
                <div className="space-y-3">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
                    <h2 className="font-bold text-red-700 dark:text-red-300">Verificación rechazada</h2>
                    <p className="text-sm text-red-600 dark:text-red-400">Inténtalo de nuevo con mejor iluminación.</p>
                  </div>
                  <button
                    onClick={() => { setCapturedSelfie(null); setCapturedPreview(''); setKycSubStep('document'); }}
                    className="w-full py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Service mode + finish */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-1">¿Cómo ofreces tus servicios?</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Puedes cambiarlo en cualquier momento desde el dashboard.</p>
            <div className="space-y-2">
              {([
                { value: 'PRESENTIAL', label: 'Presencial', desc: 'Me desplazo al domicilio del cliente' },
                { value: 'REMOTE', label: 'Remoto', desc: 'Servicio a distancia (videollamada, etc.)' },
                { value: 'BOTH', label: 'Ambos', desc: 'Presencial y remoto' },
              ] as { value: ServiceMode; label: string; desc: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setServiceMode(opt.value)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    serviceMode === opt.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <p className={`font-medium text-sm ${serviceMode === opt.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
            Podrás configurar tu horario de disponibilidad desde la pestaña "Disponibilidad" en tu dashboard.
          </div>

          <button
            onClick={handleFinish}
            disabled={savingMode}
            className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {savingMode ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Finalizar configuración <CheckCircle size={18} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
