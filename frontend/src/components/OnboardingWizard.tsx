import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Search, ShieldCheck, Star, ArrowRight, X } from 'lucide-react';

const STEPS_CLIENT = [
  {
    icon: <Search size={32} className="text-primary-600" />,
    title: 'Encuentra al profesional ideal',
    description: 'Busca entre cientos de profesionales verificados por categoría, ciudad o nombre. Filtra por valoración y precio.',
  },
  {
    icon: <ShieldCheck size={32} className="text-green-600" />,
    title: 'Reserva con total seguridad',
    description: 'Tu pago queda protegido en escrow hasta que el servicio finalice correctamente. Si algo no va bien, te devolvemos el dinero.',
  },
  {
    icon: <Star size={32} className="text-amber-500" />,
    title: 'Valora y construye confianza',
    description: 'Tras el servicio, deja tu valoración. Ayudas a la comunidad y el profesional mejora su reputación.',
  },
];

const STEPS_PROFESSIONAL = [
  {
    icon: <ShieldCheck size={32} className="text-primary-600" />,
    title: 'Completa tu verificación',
    description: 'Sube tus documentos y haz el KYC biométrico. La verificación desbloquea tu visibilidad en la plataforma.',
  },
  {
    icon: <Star size={32} className="text-amber-500" />,
    title: 'Crea tu perfil y servicios',
    description: 'Añade fotos de trabajos anteriores, describe tus servicios y pon tus precios. Un perfil completo atrae hasta 3× más clientes.',
  },
  {
    icon: <Zap size={32} className="text-green-600" />,
    title: 'Recibe reservas y cobra seguro',
    description: 'Acepta reservas, completa el trabajo y confirma la finalización. El pago se transfiere automáticamente a tu cuenta.',
  },
];

interface Props {
  onDismiss: () => void;
}

export default function OnboardingWizard({ onDismiss }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const steps = user?.role === 'PROFESSIONAL' ? STEPS_PROFESSIONAL : STEPS_CLIENT;
  const isLast = step === steps.length - 1;

  function handleNext() {
    if (isLast) {
      onDismiss();
      if (user?.role === 'PROFESSIONAL') navigate('/dashboard');
      else navigate('/professionals');
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Zap size={28} className="text-white" fill="white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === 0 ? `¡Bienvenido a VELORA, ${user?.firstName}!` : steps[step].title}
          </h2>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-primary-600' : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {steps[step].icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{steps[step].title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{steps[step].description}</p>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          {isLast ? (
            user?.role === 'PROFESSIONAL' ? 'Ir a mi panel' : 'Explorar profesionales'
          ) : (
            'Siguiente'
          )}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
