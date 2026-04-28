import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';
import { CheckCircle, Briefcase, Shield, Star, CreditCard, Zap, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const BENEFITS = [
  { icon: <CreditCard size={18} className="text-green-500" />, title: 'Cobra de forma segura', desc: 'El dinero queda retenido en escrow y se libera al completar el servicio.' },
  { icon: <Shield size={18} className="text-blue-500" />, title: 'Perfil verificado', desc: 'Sube tu documentación y consigue el sello de profesional verificado.' },
  { icon: <Star size={18} className="text-amber-500" />, title: 'Valoraciones reales', desc: 'Clientes verificados dejan reseñas que construyen tu reputación.' },
  { icon: <Zap size={18} className="text-primary-500" />, title: 'Matching inteligente', desc: 'La IA te conecta con clientes que buscan exactamente lo que ofreces.' },
];

const STEPS = [
  'Activa el modo proveedor',
  'Sube tu foto y escribe tu bio',
  'Añade al menos 2 trabajos con fotos',
  'Sube tu documento de identidad',
  'Crea tus servicios con precio',
  'El equipo aprueba tu perfil (24-48h)',
];

export default function BecomeProvider() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.isProvider) {
      navigate('/provider-onboarding', { replace: true });
    }
  }, [user, navigate]);

  async function handleActivate() {
    if (user?.isProvider) {
      navigate('/provider-onboarding');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.toggleProvider();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      await refreshUser();
      toast.success('¡Modo proveedor activado! Completa tu perfil para empezar.');
      navigate('/provider-onboarding');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Error al activar el modo proveedor';
      toast.error(msg);
      console.error('[BecomeProvider] toggleProvider error:', err?.response?.status, err?.response?.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Briefcase size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            Conviértete en profesional VELORA
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base">
            Ofrece tus servicios a domicilio en Barcelona y empieza a ganar desde hoy.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {BENEFITS.map((b, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {b.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{b.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">Cómo funciona</h2>
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  i === 0 ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i === 0 ? 'font-semibold text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {step}
                </span>
                {i === 0 && <span className="ml-auto text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">Ahora</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Free notice */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Activar el modo proveedor es completamente gratis. Solo pagamos cuando tú cobras (10% de comisión).</p>
        </div>

        {/* CTA */}
        <button
          onClick={handleActivate}
          disabled={loading}
          className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-colors text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-200 dark:shadow-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Activando...
            </span>
          ) : (
            <>
              Activar modo proveedor
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Puedes desactivarlo en cualquier momento desde tu perfil.
        </p>
      </div>
    </div>
  );
}
