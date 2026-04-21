import { Link } from 'react-router-dom';
import { Shield, Star, CheckCircle, Lock, Users, Award } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_ICONS, ServiceCategory } from '../types';

const FEATURED_CATEGORIES: ServiceCategory[] = [
  'HAIRDRESSING', 'BEAUTY', 'CLEANING', 'CHEF', 'HANDYMAN', 'MASSAGE',
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <Shield size={16} className="text-primary-200" />
            <span className="text-sm font-medium text-primary-100">Marketplace 100% verificado</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Servicios premium<br />
            <span className="text-primary-300">a domicilio</span>
          </h1>

          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Profesionales verificados, pagos seguros y experiencia garantizada.
            Sin riesgos, sin sorpresas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/professionals"
              className="px-8 py-4 bg-white text-primary-800 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-lg"
            >
              Explorar profesionales
            </Link>
            <Link
              to="/register?role=PROFESSIONAL"
              className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-500 transition-colors text-lg"
            >
              Soy profesional
            </Link>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Diseñado para la confianza
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Cada profesional es revisado manualmente. Cada pago está protegido.
            Cada reseña es verificada.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckCircle size={28} className="text-green-500" />,
                title: 'Profesionales verificados',
                desc: 'Revisión manual de documentos e historial de trabajos reales antes de la aprobación.',
              },
              {
                icon: <Lock size={28} className="text-blue-500" />,
                title: 'Pagos en escrow',
                desc: 'Tu dinero queda retenido hasta confirmar que el servicio se ha completado satisfactoriamente.',
              },
              {
                icon: <Star size={28} className="text-amber-500" />,
                title: 'Reseñas verificadas',
                desc: 'Solo los clientes que han completado y pagado un servicio pueden dejar valoraciones.',
              },
              {
                icon: <Shield size={28} className="text-purple-500" />,
                title: 'Anti-fraude integrado',
                desc: 'Sistema de detección que bloquea el intercambio de contactos fuera de la plataforma.',
              },
              {
                icon: <Users size={28} className="text-indigo-500" />,
                title: 'Marketplace cerrado',
                desc: 'No cualquiera puede registrarse como profesional. Calidad sobre cantidad.',
              },
              {
                icon: <Award size={28} className="text-rose-500" />,
                title: 'Experiencia demostrada',
                desc: 'Cada profesional debe subir pruebas visuales reales de sus trabajos anteriores.',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all">
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Servicios disponibles
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/professionals?category=${cat}`}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                <span className="text-sm font-medium text-gray-700 text-center group-hover:text-primary-600 transition-colors">
                  {CATEGORY_LABELS[cat]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">¿Eres profesional?</h2>
          <p className="text-primary-200 mb-8 text-lg">
            Únete a la plataforma de confianza. Solo profesionales verificados
            con experiencia real demostrada.
          </p>
          <Link
            to="/register?role=PROFESSIONAL"
            className="inline-flex px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors text-lg"
          >
            Solicitar acceso
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p>© 2024 Verified. Marketplace de servicios premium verificados.</p>
      </footer>
    </div>
  );
}
