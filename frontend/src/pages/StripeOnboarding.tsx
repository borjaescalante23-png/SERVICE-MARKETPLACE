import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { stripeConnectApi } from '../services/api';
import { CreditCard, CheckCircle, Clock, AlertTriangle, ExternalLink, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StripeOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['stripe-connect-status'],
    queryFn: () => stripeConnectApi.getStatus().then(r => r.data),
    refetchInterval: 10000,
  });

  useEffect(() => {
    const success = searchParams.get('success');
    const refresh = searchParams.get('refresh');
    if (success === 'true') {
      toast.success('¡Onboarding completado! Verificando estado...');
      refetch();
    } else if (refresh === 'true') {
      toast('El proceso se interrumpió. Puedes continuar desde aquí.', { icon: 'ℹ️' });
    }
  }, []);

  async function startOnboarding() {
    setLoading(true);
    try {
      const { data: result } = await stripeConnectApi.startOnboarding();
      window.location.href = result.onboardingUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al conectar con Stripe');
    } finally {
      setLoading(false);
    }
  }

  const status = data?.status || 'NOT_STARTED';
  const chargesEnabled = data?.chargesEnabled || false;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors">
        <ChevronLeft size={18} />Volver
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard size={24} className="text-primary-600" />
          Configurar cuenta de cobros
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Stripe Connect gestiona tus cobros de forma segura y automática.
        </p>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
        chargesEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
        status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' :
        'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        {chargesEnabled ? <CheckCircle size={20} className="text-green-600 flex-shrink-0" /> :
         status === 'PENDING' ? <Clock size={20} className="text-amber-600 flex-shrink-0" /> :
         <AlertTriangle size={20} className="text-gray-400 flex-shrink-0" />}
        <div>
          <p className={`font-semibold text-sm ${chargesEnabled ? 'text-green-800 dark:text-green-300' : status === 'PENDING' ? 'text-amber-800 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}`}>
            {chargesEnabled ? 'Cuenta activa — listo para cobrar' :
             status === 'PENDING' ? 'Verificación en proceso' :
             status === 'INCOMPLETE' ? 'Onboarding incompleto' :
             'Cuenta no configurada'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {chargesEnabled ? 'Los pagos se transferirán automáticamente a tu cuenta bancaria.' :
             status === 'PENDING' ? 'Stripe está verificando tu información. Puede tardar unos minutos.' :
             'Completa el onboarding para recibir pagos de tus servicios.'}
          </p>
        </div>
      </div>

      {/* What Stripe handles */}
      {!chargesEnabled && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">¿Qué incluye el onboarding?</h2>
          <div className="space-y-3">
            {[
              { icon: '🪪', label: 'Verificación de identidad (KYC)', desc: 'Stripe verifica tu DNI/pasaporte' },
              { icon: '🏦', label: 'Cuenta bancaria de cobro', desc: 'IBAN donde recibirás los pagos' },
              { icon: '📋', label: 'Datos fiscales', desc: 'NIF/CIF para cumplimiento tributario' },
              { icon: '🔒', label: 'Seguridad PCI', desc: 'Estándar bancario de máxima seguridad' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!chargesEnabled && (
        <button
          disabled={loading}
          onClick={startOnboarding}
          className="w-full py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <ExternalLink size={16} />
          {loading ? 'Conectando...' : status === 'INCOMPLETE' ? 'Continuar onboarding' : 'Iniciar configuración de Stripe'}
        </button>
      )}

      {chargesEnabled && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Tu cuenta está activa</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Cobros</span>
                <span className="text-green-600 font-medium">✅ Habilitados</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Pagos automáticos</span>
                <span className="text-green-600 font-medium">✅ Configurados</span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Volver al dashboard
          </button>
        </div>
      )}
    </div>
  );
}
