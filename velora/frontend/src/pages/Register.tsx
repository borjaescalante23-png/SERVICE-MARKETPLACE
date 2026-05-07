import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/home')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 rounded-bl-full opacity-60" style={{ backgroundColor: '#F5EDD6' }} />

      <div className="relative px-6 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#0F1F5C" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-2">
            <span className="text-5xl font-black text-[#0F1F5C] leading-none">V</span>
            <span className="absolute -top-1 -right-3 text-[#D97706] text-base">★</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F1F5C] tracking-widest">VELORA</h1>
          <p className="text-[#6B7A99] text-sm mt-1">Crea tu cuenta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <input
              name="firstName"
              placeholder="Nombre"
              value={form.firstName}
              onChange={handleChange}
              className="flex-1 px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
              required
            />
            <input
              name="lastName"
              placeholder="Apellido"
              value={form.lastName}
              onChange={handleChange}
              className="flex-1 px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
              required
            />
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-full text-base mt-2 disabled:opacity-70"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7A99] mt-6">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-[#3B6FE8] font-medium">
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  )
}
