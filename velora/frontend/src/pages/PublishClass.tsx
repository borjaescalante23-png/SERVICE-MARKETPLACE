import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, GraduationCap, User, Lightbulb, ChevronDown } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { TUTOR_CATEGORIES } from '../config/categories'

const STEPS = ['Información', 'Detalles', 'Precio', 'Disponibilidad', 'Vista previa']

export default function PublishClass() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState<'TUTOR' | 'STUDENT'>('TUTOR')
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    pricePerHour: '',
    level: 'ALL',
    teachingMode: 'BOTH',
    language: 'Español',
    duration: '60',
    includes: ''
  })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-gray-50">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#0F1F5C" />
        </button>
        <h1 className="text-base font-semibold text-[#0F1F5C] flex-1">Publicar clase</h1>
      </header>

      <div className="px-4 py-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  i === step ? 'bg-[#0F1F5C] text-white' : i < step ? 'bg-[#3B6FE8] text-white' : 'bg-[#F2F4F8] text-[#6B7A99]'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${i === step ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-200 mx-1.5" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-5 overflow-y-auto">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-base font-semibold text-[#0F1F5C] mb-3">¿Qué quieres publicar?</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setRole('TUTOR')}
                  className={`flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl border-2 transition-colors relative ${
                    role === 'TUTOR' ? 'border-[#3B6FE8] bg-[#EEF2FF]' : 'border-gray-200'
                  }`}
                >
                  {role === 'TUTOR' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#3B6FE8] rounded-full flex items-center justify-center">
                      <span className="text-white text-[9px]">✓</span>
                    </div>
                  )}
                  <GraduationCap size={28} color={role === 'TUTOR' ? '#3B6FE8' : '#6B7A99'} />
                  <div className="text-center px-2">
                    <p className={`text-xs font-semibold ${role === 'TUTOR' ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>
                      Ofrezco una clase
                    </p>
                    <p className="text-[10px] text-[#6B7A99]">Soy tutor</p>
                  </div>
                </button>
                <button
                  onClick={() => setRole('STUDENT')}
                  className={`flex-1 flex flex-col items-center gap-3 py-5 rounded-2xl border-2 transition-colors relative ${
                    role === 'STUDENT' ? 'border-[#3B6FE8] bg-[#EEF2FF]' : 'border-gray-200'
                  }`}
                >
                  {role === 'STUDENT' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-[#3B6FE8] rounded-full flex items-center justify-center">
                      <span className="text-white text-[9px]">✓</span>
                    </div>
                  )}
                  <User size={28} color={role === 'STUDENT' ? '#3B6FE8' : '#6B7A99'} />
                  <div className="text-center px-2">
                    <p className={`text-xs font-semibold ${role === 'STUDENT' ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>
                      Busco un tutor
                    </p>
                    <p className="text-[10px] text-[#6B7A99]">Soy estudiante</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[#0F1F5C]">Cuéntanos sobre tu clase</h2>
              <div>
                <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Título de la clase</label>
                <input
                  value={form.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Ej. Clases de Matemáticas para Bachillerato"
                  className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Categoría</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => handleChange('category', e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] outline-none appearance-none"
                  >
                    <option value="">Selecciona una categoría</option>
                    {TUTOR_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} color="#6B7A99" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[#6B7A99] font-medium">Descripción</label>
                  <span className="text-xs text-[#6B7A99]">{form.description.length} / 500</span>
                </div>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value.slice(0, 500))}
                  placeholder="Cuéntales a los estudiantes de qué trata tu clase, tu experiencia, metodología, etc."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 p-4 rounded-2xl" style={{ backgroundColor: '#FFFBEB' }}>
                <Lightbulb size={18} color="#D97706" className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#D97706] mb-0.5">Consejo</p>
                  <p className="text-xs text-[#6B7A99]">
                    Sé claro y específico. Una buena descripción te ayudará a recibir más reservas.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Detalles de la clase</h2>
            <div>
              <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Nivel</label>
              <div className="grid grid-cols-2 gap-2">
                {[['ALL', 'Todos los niveles'], ['BEGINNER', 'Principiante'], ['INTERMEDIATE', 'Intermedio'], ['ADVANCED', 'Avanzado']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => handleChange('level', val)}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      form.level === val ? 'border-[#0F1F5C] bg-[#EEF2FF] text-[#0F1F5C]' : 'border-gray-200 text-[#6B7A99]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Modalidad</label>
              <div className="grid grid-cols-3 gap-2">
                {[['ONLINE', 'Online'], ['PRESENTIAL', 'Presencial'], ['BOTH', 'Ambas']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => handleChange('teachingMode', val)}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      form.teachingMode === val ? 'border-[#0F1F5C] bg-[#EEF2FF] text-[#0F1F5C]' : 'border-gray-200 text-[#6B7A99]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6B7A99] font-medium mb-1 block">Duración (minutos)</label>
              <div className="flex gap-2">
                {['30', '45', '60', '90', '120'].map(d => (
                  <button
                    key={d}
                    onClick={() => handleChange('duration', d)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      form.duration === d ? 'border-[#0F1F5C] bg-[#EEF2FF] text-[#0F1F5C]' : 'border-gray-200 text-[#6B7A99]'
                    }`}
                  >
                    {d}'
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Precio por hora</h2>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F1F5C] font-semibold text-lg">€</span>
              <input
                type="number"
                value={form.pricePerHour}
                onChange={e => handleChange('pricePerHour', e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-4 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] text-xl font-bold outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7A99] text-sm">/ hora</span>
            </div>
            <div className="bg-[#EEF2FF] rounded-2xl p-4">
              <p className="text-xs text-[#3B6FE8] font-medium mb-1">Recibirás</p>
              <p className="text-2xl font-bold text-[#0F1F5C]">
                {form.pricePerHour ? (parseFloat(form.pricePerHour) * 0.9).toFixed(2) : '0.00'} €
              </p>
              <p className="text-xs text-[#6B7A99] mt-0.5">Velora retiene un 10% de comisión</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Disponibilidad</h2>
            <div className="grid grid-cols-7 gap-1">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                <button
                  key={d}
                  className="aspect-square rounded-xl bg-[#0F1F5C] text-white text-sm font-semibold flex items-center justify-center"
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-[#6B7A99] mb-1 block">Desde</label>
                <input type="time" defaultValue="09:00" className="w-full px-3 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#6B7A99] mb-1 block">Hasta</label>
                <input type="time" defaultValue="20:00" className="w-full px-3 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] outline-none" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C]">Vista previa</h2>
            <div className="bg-[#0F1F5C] rounded-3xl p-5">
              <span className="px-3 py-1 bg-[#16A34A] text-white text-xs font-medium rounded-full">Disponible</span>
              <h3 className="text-xl font-bold text-white mt-3 mb-2">{form.title || 'Título de tu clase'}</h3>
              <p className="text-white/70 text-sm line-clamp-2">{form.description || 'Descripción de la clase...'}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between">
              <div>
                <p className="text-xs text-[#6B7A99]">Precio</p>
                <p className="text-lg font-bold text-[#0F1F5C]">{form.pricePerHour || '0'} € / h</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7A99]">Nivel</p>
                <p className="text-sm font-medium text-[#0F1F5C]">{form.level === 'ALL' ? 'Todos' : form.level}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7A99]">Modalidad</p>
                <p className="text-sm font-medium text-[#0F1F5C]">{form.teachingMode}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => {
            if (step < STEPS.length - 1) setStep(step + 1)
            else navigate('/home')
          }}
          className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-xl text-base"
        >
          {step === STEPS.length - 1 ? 'Publicar clase' : 'Siguiente'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
