import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/home')
    } catch {
      setError('Credenciales incorrectas. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-bl-full opacity-60"
        style={{ backgroundColor: '#F5EDD6' }}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-2">
            <span className="text-6xl font-black text-[#0F1F5C] leading-none">V</span>
            <span className="absolute -top-1 -right-4 text-[#D97706] text-lg">★</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0F1F5C] tracking-widest">VELORA</h1>
        </div>

        <div className="text-center mb-2">
          <p className="text-xl font-bold text-[#0F1F5C]">
            Aprende. Enseña.{' '}
            <span className="text-[#3B6FE8]">Conecta sin límites.</span>
          </p>
        </div>
        <p className="text-sm text-[#6B7A99] text-center mb-8 leading-relaxed">
          El marketplace de tutoría donde aprender y enseñar es más rápido y fácil.
        </p>

        <div className="flex gap-2 mb-10">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0F1F5C]" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="w-full space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-full text-base disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <button
          onClick={() => navigate('/register')}
          className="w-full py-4 bg-white border border-gray-200 text-[#0F1F5C] font-semibold rounded-full text-base mt-3"
        >
          Crear cuenta
        </button>

        <button
          onClick={() => navigate('/explore')}
          className="mt-6 text-sm text-[#6B7A99] underline underline-offset-2"
        >
          Explora sin cuenta →
        </button>
      </div>
    </div>
  )
}
