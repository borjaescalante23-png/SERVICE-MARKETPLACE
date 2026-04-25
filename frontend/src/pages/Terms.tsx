import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
        <ArrowLeft size={16} /> Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Términos y Condiciones</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: abril 2026</p>

      <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">1. Aceptación de los términos</h2>
          <p>Al acceder y utilizar VELORA, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">2. Descripción del servicio</h2>
          <p>VELORA es una plataforma de marketplace que conecta a clientes con profesionales de servicios del hogar. Actuamos como intermediario y no somos parte directa de los contratos de servicio entre clientes y profesionales.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">3. Registro de cuentas</h2>
          <p>Debes proporcionar información veraz y completa al registrarte. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">4. Política de pagos y escrow</h2>
          <p>Los pagos se retienen en un sistema de escrow seguro hasta que el servicio se complete satisfactoriamente. La plataforma cobra una comisión del 15% sobre el precio del servicio. Los reembolsos están sujetos a nuestra política de cancelación.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">5. Política de cancelación</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Cancelación con más de 48h de antelación: reembolso completo.</li>
            <li>Cancelación entre 24h y 48h antes del servicio: reembolso del 50%.</li>
            <li>Cancelación con menos de 24h de antelación: sin reembolso.</li>
            <li>Cancelación por parte del profesional: reembolso completo siempre.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">6. Verificación de profesionales</h2>
          <p>Los profesionales deben pasar un proceso de verificación de identidad (KYC) y revisión de documentación. La verificación no garantiza la calidad del servicio, aunque contribuye a crear un entorno más seguro.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">7. Resolución de disputas</h2>
          <p>En caso de disputa, VELORA actuará como mediador. Podemos utilizar inteligencia artificial para analizar el caso de forma objetiva. La resolución puede incluir reembolso total, parcial o liberación de pago al profesional según las evidencias aportadas.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">8. Propiedad intelectual</h2>
          <p>Todo el contenido de VELORA, incluyendo logos, diseño y código, es propiedad exclusiva de VELORA S.L. Queda prohibida su reproducción sin autorización expresa.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">9. Limitación de responsabilidad</h2>
          <p>VELORA no se hace responsable de los daños o perjuicios derivados de la prestación de servicios entre usuarios. Actuamos únicamente como intermediario tecnológico.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">10. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos los cambios significativos mediante un aviso en la plataforma.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">11. Contacto</h2>
          <p>Para cualquier consulta sobre estos términos, contáctanos en <span className="text-primary-600 dark:text-primary-400">legal@velora.es</span>.</p>
        </section>
      </div>
    </div>
  );
}
