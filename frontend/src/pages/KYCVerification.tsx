import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { professionalsApi, kycApi } from '../services/api';
import { ChevronLeft, Upload, Camera, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

type Step = 'intro' | 'document' | 'selfie' | 'processing' | 'result';

export default function KYCVerification() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('intro');
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => professionalsApi.getMyProfile().then(r => r.data),
  });

  const { data: kycData, refetch: refetchKyc } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => kycApi.getStatus().then(r => r.data),
    refetchInterval: step === 'processing' ? 3000 : false,
  });

  useEffect(() => {
    if (step === 'processing' && kycData?.kycStatus && kycData.kycStatus !== 'PROCESSING') {
      setStep('result');
    }
  }, [kycData?.kycStatus, step]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const idDocument = profile?.documents?.find((d: any) => ['NATIONAL_ID', 'PASSPORT'].includes(d.type));

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
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
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'NATIONAL_ID');
    try {
      await professionalsApi.uploadDocument(fd);
      toast.success('Documento subido correctamente');
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setStep('selfie');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al subir el documento');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function submitSelfie() {
    if (!capturedSelfie) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('selfie', capturedSelfie, 'selfie.jpg');
    try {
      await kycApi.submitSelfie(fd);
      setStep('processing');
      qc.invalidateQueries({ queryKey: ['kyc-status'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al enviar selfie');
    } finally {
      setUploading(false);
    }
  }

  const kycStatus = kycData?.kycStatus || profile?.kycStatus;
  const lastAttempt = kycData?.kycAttempts?.[0];

  if (kycStatus === 'APPROVED' && step !== 'result') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={40} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Identidad verificada</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Tu identidad ha sido verificada con éxito. Ya puedes operar en la plataforma.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
          Ir al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors">
        <ChevronLeft size={18} />Volver
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck size={24} className="text-primary-600" />
          Verificación de identidad (KYC)
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Proceso obligatorio para operar en VELORA. Estándar financiero.
        </p>
      </div>

      {/* Progress */}
      {step !== 'intro' && step !== 'result' && (
        <div className="flex items-center gap-2 mb-8">
          {(['document', 'selfie', 'processing'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                step === s ? 'bg-primary-600 text-white' :
                ['selfie', 'processing'].indexOf(step) > ['document', 'selfie', 'processing'].indexOf(s)
                  ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>{i + 1}</div>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700" />}
            </div>
          ))}
        </div>
      )}

      {/* INTRO */}
      {step === 'intro' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
          <div className="space-y-3">
            {[
              { icon: '🪪', title: 'Documento de identidad', desc: 'DNI, NIE o pasaporte vigente' },
              { icon: '🤳', title: 'Reconocimiento facial', desc: 'Selfie en tiempo real comparado con tu documento' },
              { icon: '🤖', title: 'Verificación con IA', desc: 'Claude analiza autenticidad y coincidencia facial' },
              { icon: '🔒', title: 'Estándar fintech', desc: 'Mismo nivel que apps bancarias y brokers de trading' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
            Tus datos se procesan de forma segura y no se comparten con terceros.
          </div>
          <button
            onClick={() => setStep(idDocument ? 'selfie' : 'document')}
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            {idDocument ? 'Continuar con selfie' : 'Comenzar verificación'}
          </button>
        </div>
      )}

      {/* STEP 1: DOCUMENT */}
      {step === 'document' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Paso 1: Documento de identidad</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sube una foto clara de tu DNI, NIE o pasaporte. Asegúrate de que todos los datos sean legibles.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="font-medium text-green-700 dark:text-green-400 mb-1">✓ Válido</p>
              <ul className="space-y-0.5">
                <li>Imagen clara y nítida</li>
                <li>Todos los datos legibles</li>
                <li>Documento vigente</li>
              </ul>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-600 dark:text-red-400 mb-1">✗ No válido</p>
              <ul className="space-y-0.5">
                <li>Foto borrosa</li>
                <li>Documento recortado</li>
                <li>Documento expirado</li>
              </ul>
            </div>
          </div>
          <label className={`w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            uploading ? 'opacity-50 pointer-events-none' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10'
          }`}>
            <Upload size={28} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {uploading ? 'Subiendo...' : 'Toca para subir tu documento'}
            </span>
            <span className="text-xs text-gray-400">JPG, PNG (máx. 10MB)</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleDocumentUpload} />
          </label>
        </div>
      )}

      {/* STEP 2: SELFIE */}
      {step === 'selfie' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Paso 2: Verificación facial</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tómate una selfie en un lugar bien iluminado. La IA comparará tu rostro con el documento.
          </p>

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
                <div className="absolute inset-0 border-4 border-primary-500/40 rounded-xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 border-2 border-white/60 rounded-full pointer-events-none" />
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

          {capturedPreview && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
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
                  disabled={uploading}
                  onClick={submitSelfie}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={14} />{uploading ? 'Enviando...' : 'Verificar identidad'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: PROCESSING */}
      {step === 'processing' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Analizando tu identidad...</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            La IA está comparando tu documento con el selfie. Este proceso tarda unos segundos.
          </p>
        </div>
      )}

      {/* RESULT */}
      {step === 'result' && (
        <div className="space-y-4">
          {kycStatus === 'APPROVED' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle size={40} className="text-green-600 mx-auto" />
              <h2 className="font-bold text-green-800 dark:text-green-300 text-lg">¡Identidad verificada!</h2>
              <p className="text-sm text-green-700 dark:text-green-400">
                Tu identidad ha sido confirmada. Ya puedes operar en VELORA.
              </p>
              {lastAttempt?.faceMatchScore && (
                <p className="text-xs text-green-600 dark:text-green-500">
                  Coincidencia facial: {Math.round(lastAttempt.faceMatchScore * 100)}%
                </p>
              )}
            </div>
          )}
          {kycStatus === 'MANUAL_REVIEW' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6 text-center space-y-3">
              <Clock size={40} className="text-amber-600 mx-auto" />
              <h2 className="font-bold text-amber-800 dark:text-amber-300 text-lg">En revisión manual</h2>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                El equipo revisará tu verificación en 24-48h y recibirás una notificación.
              </p>
            </div>
          )}
          {kycStatus === 'REJECTED' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
              <XCircle size={40} className="text-red-500 mx-auto" />
              <h2 className="font-bold text-red-700 dark:text-red-300 text-lg">Verificación rechazada</h2>
              <p className="text-sm text-red-600 dark:text-red-400">
                {lastAttempt?.rejectionReason || 'No se pudo confirmar tu identidad. Intenta de nuevo con mejor iluminación.'}
              </p>
              <button
                onClick={() => { setCapturedSelfie(null); setCapturedPreview(''); setStep('document'); }}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Volver al dashboard
          </button>
        </div>
      )}
    </div>
  );
}
