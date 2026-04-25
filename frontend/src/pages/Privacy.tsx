import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Política de Privacidad</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: abril 2026</p>

      <div className="space-y-8 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Responsable del tratamiento</h2>
          <p>VELORA S.L. es el responsable del tratamiento de tus datos personales, con domicilio en España, conforme al RGPD (Reglamento UE 2016/679) y la LOPDGDD.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Datos que recopilamos</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Datos de identificación: nombre, apellidos, correo electrónico, teléfono.</li>
            <li>Datos de verificación (profesionales): documentos de identidad, fotografía facial.</li>
            <li>Datos de uso: historial de reservas, valoraciones, mensajes.</li>
            <li>Datos de pago: procesados por Stripe (no almacenamos datos bancarios directamente).</li>
            <li>Datos de ubicación: ciudad y dirección de servicio.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Finalidad del tratamiento</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Gestionar la relación contractual entre clientes y profesionales.</li>
            <li>Verificar la identidad de los profesionales para mayor seguridad.</li>
            <li>Procesar pagos y gestionar el sistema de escrow.</li>
            <li>Enviar notificaciones relacionadas con el servicio (in-app).</li>
            <li>Detectar y prevenir fraudes mediante análisis de comportamiento.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Base jurídica</h2>
          <p>El tratamiento se basa en la ejecución del contrato (art. 6.1.b RGPD), el cumplimiento de obligaciones legales (art. 6.1.c) y el interés legítimo en la prevención del fraude (art. 6.1.f).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Plazo de conservación</h2>
          <p>Conservamos tus datos durante el tiempo necesario para la relación contractual y, posteriormente, durante los plazos legalmente establecidos (hasta 5 años para datos fiscales).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Transferencias internacionales</h2>
          <p>Algunos proveedores (Stripe, Anthropic) pueden estar situados fuera del EEE. En tales casos, las transferencias se realizan con las garantías adecuadas (cláusulas contractuales estándar).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Tus derechos</h2>
          <p>Puedes ejercer los siguientes derechos escribiendo a <span className="text-primary-600 dark:text-primary-400">privacidad@velora.es</span>:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>Acceso a tus datos personales.</li>
            <li>Rectificación de datos inexactos.</li>
            <li>Supresión ("derecho al olvido").</li>
            <li>Limitación u oposición al tratamiento.</li>
            <li>Portabilidad de los datos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Uso de IA</h2>
          <p>Utilizamos modelos de IA (Claude de Anthropic) para: verificar documentos de identidad, analizar disputas y ofrecer recomendaciones de precios. En ningún caso se utilizan tus datos para entrenar modelos de IA de terceros.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Cookies</h2>
          <p>Utilizamos únicamente cookies técnicas necesarias para el funcionamiento de la plataforma. No utilizamos cookies de seguimiento o publicidad.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Reclamaciones</h2>
          <p>Si consideras que el tratamiento de tus datos no cumple la normativa, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>
        </section>
      </div>
    </div>
  );
}
