import { useState } from 'react';
import { X, Search, Shield, CreditCard, ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    icon: <Search size={32} className="text-primary-600" />,
    title: 'Encuentra el profesional que necesitas',
    desc: 'Busca entre cientos de profesionales verificados en Barcelona. Fontaneros, electricistas, limpieza, y mucho más.',
  },
  {
    icon: <Shield size={32} className="text-green-500" />,
    title: 'Profesionales verificados',
    desc: 'Cada profesional pasa por un proceso de verificación de identidad y documentación. Tu seguridad es lo primero.',
  },
  {
    icon: <CreditCard size={32} className="text-blue-500" />,
    title: 'Pago protegido',
    desc: 'Tu dinero queda retenido de forma segura hasta que confirmes que el servicio se realizó correctamente.',
  },
];

interface Props {
  onDone: () => void;
}

export default function Onboarding({ onDone }: Props) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;

  function next() {
    if (isLast) {
      onDone();
    } else {
      setSlide(s => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm p-8 relative shadow-2xl">
        <button
          onClick={onDone}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-700">
            {SLIDES[slide].icon}
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {SLIDES[slide].title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            {SLIDES[slide].desc}
          </p>

          {/* Dots */}
          <div className="flex gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? 'w-6 bg-primary-600' : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-950 dark:bg-primary-600 text-white font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-primary-700 transition-colors text-sm"
          >
            {isLast ? 'Empezar' : 'Siguiente'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
