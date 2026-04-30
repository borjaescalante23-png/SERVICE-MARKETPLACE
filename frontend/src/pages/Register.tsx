import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Shield, Star, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role: 'CLIENT' });
      toast.success('Cuenta creada correctamente');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-950 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-white font-extrabold text-2xl tracking-tight">VELORA</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-8">
            El marketplace de servicios premium de Barcelona
          </h2>
          <div className="space-y-4">
            {[
              { icon: <Shield size={16} className="text-green-400" />, text: 'Profesionales verificados con documentación real' },
              { icon: <Lock size={16} className="text-blue-400" />, text: 'Tu pago protegido hasta confirmar el servicio' },
              { icon: <Star size={16} className="text-amber-400" />, text: 'Valoraciones verificadas de clientes reales' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <p className="text-white/70 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-sm">© 2026 VELORA</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-gray-950 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-gray-950 dark:text-white text-xl">VELORA</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Crear cuenta</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Gratis. Sin compromiso.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre</label>
                <input
                  required
                  value={form.firstName}
                  onChange={set('firstName')}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-gray-900 dark:text-[#F8FAFF] dark:bg-[#0F1A2E] placeholder-gray-400 dark:placeholder-[#94A3B8] transition-colors"
                  placeholder="Carlos"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Apellido</label>
                <input
                  required
                  value={form.lastName}
                  onChange={set('lastName')}
                  className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-gray-900 dark:text-[#F8FAFF] dark:bg-[#0F1A2E] placeholder-gray-400 dark:placeholder-[#94A3B8] transition-colors"
                  placeholder="García"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set('email')}
                className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-gray-900 dark:text-[#F8FAFF] dark:bg-[#0F1A2E] placeholder-gray-400 dark:placeholder-[#94A3B8] transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 dark:border-[#1E2D45] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-gray-900 dark:text-[#F8FAFF] dark:bg-[#0F1A2E] placeholder-gray-400 dark:placeholder-[#94A3B8] transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-950 dark:bg-primary-600 text-white font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm mt-2 text-sm"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-700 dark:text-primary-400 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
