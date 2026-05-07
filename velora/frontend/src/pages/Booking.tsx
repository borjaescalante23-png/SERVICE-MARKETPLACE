import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Monitor, X } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { classesApi, bookingsApi } from '../services/api'
import { TutorClass } from '../types'

const STEPS = ['Fecha y hora', 'Detalles', 'Pago', 'Confirmación']

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getDaysOfWeek(weekOffset: number) {
  const today = new Date()
  const days = []
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    days.push(d)
  }
  return days
}

export default function Booking() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [cls, setCls] = useState<TutorClass | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedHour, setSelectedHour] = useState('')
  const [teachingMode, setTeachingMode] = useState<'PRESENTIAL' | 'ONLINE'>('ONLINE')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [booked, setBooked] = useState(false)

  const days = getDaysOfWeek(weekOffset)
  const today = new Date()

  useEffect(() => {
    if (!classId) return
    classesApi.create
    fetch(`http://localhost:3001/api/tutors?query=`)
      .then(() => {})
      .catch(() => {})
  }, [classId])

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBook = async () => {
    if (!classId || !selectedDate || !selectedHour) return
    setLoading(true)
    try {
      const [h, m] = selectedHour.split(':')
      const scheduledAt = new Date(selectedDate)
      scheduledAt.setHours(parseInt(h), parseInt(m), 0, 0)
      await bookingsApi.create({
        classId,
        scheduledAt: scheduledAt.toISOString(),
        teachingMode,
        address: teachingMode === 'PRESENTIAL' ? address : undefined,
        studentNotes: notes || undefined
      })
      setBooked(true)
      setStep(3)
    } catch {
      alert('Error al crear la reserva. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const price = 25

  return (
    <div className="min-h-screen bg-white flex flex-col pb-28">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white border-b border-gray-50">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#0F1F5C" />
        </button>
        <h1 className="text-base font-semibold text-[#0F1F5C] flex-1">Reservar clase</h1>
      </header>

      <div className="px-4 py-4 flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i === step ? 'bg-[#0F1F5C] text-white' : i < step ? 'bg-[#3B6FE8] text-white' : 'bg-[#F2F4F8] text-[#6B7A99]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] mt-1 font-medium text-center max-w-[50px] ${
                i === step ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'
              }`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mx-1 mb-4 ${i < step ? 'bg-[#3B6FE8]' : 'bg-[#F2F4F8]'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 px-4 space-y-6 overflow-y-auto">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Selecciona fecha</h2>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                  className="w-8 h-8 bg-[#F2F4F8] rounded-lg flex items-center justify-center"
                >
                  <ChevronLeft size={16} color="#6B7A99" />
                </button>
                <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {days.map((d) => {
                    const isToday = d.toDateString() === today.toDateString()
                    const isPast = d < today && !isToday
                    const isSelected = selectedDate?.toDateString() === d.toDateString()
                    return (
                      <button
                        key={d.toISOString()}
                        disabled={isPast}
                        onClick={() => setSelectedDate(d)}
                        className={`flex flex-col items-center py-2.5 px-2 rounded-xl min-w-[44px] transition-colors ${
                          isSelected ? 'bg-[#0F1F5C]' : isPast ? 'opacity-30' : 'bg-[#F2F4F8]'
                        }`}
                      >
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-[#6B7A99]'}`}>
                          {DAYS_SHORT[d.getDay()]}
                        </span>
                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#0F1F5C]'}`}>
                          {d.getDate()}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setWeekOffset(w => w + 1)}
                  className="w-8 h-8 bg-[#F2F4F8] rounded-lg flex items-center justify-center"
                >
                  <ChevronRight size={16} color="#6B7A99" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Selecciona hora</h2>
              <div className="flex flex-wrap gap-2">
                {HOURS.map(h => (
                  <button
                    key={h}
                    onClick={() => setSelectedHour(h)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedHour === h ? 'bg-[#0F1F5C] text-white' : 'bg-[#F2F4F8] text-[#0F1F5C]'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">¿Dónde será la clase?</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setTeachingMode('PRESENTIAL')}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
                    teachingMode === 'PRESENTIAL' ? 'border-[#0F1F5C] bg-[#EEF2FF]' : 'border-gray-200'
                  }`}
                >
                  <MapPin size={20} color={teachingMode === 'PRESENTIAL' ? '#0F1F5C' : '#6B7A99'} />
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${teachingMode === 'PRESENTIAL' ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>
                      Presencial
                    </p>
                    <p className="text-[9px] text-[#6B7A99]">Nos vemos en persona</p>
                  </div>
                  {teachingMode === 'PRESENTIAL' && (
                    <div className="w-4 h-4 bg-[#0F1F5C] rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setTeachingMode('ONLINE')}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-colors ${
                    teachingMode === 'ONLINE' ? 'border-[#0F1F5C] bg-[#EEF2FF]' : 'border-gray-200'
                  }`}
                >
                  <Monitor size={20} color={teachingMode === 'ONLINE' ? '#0F1F5C' : '#6B7A99'} />
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${teachingMode === 'ONLINE' ? 'text-[#0F1F5C]' : 'text-[#6B7A99]'}`}>
                      Online
                    </p>
                    <p className="text-[9px] text-[#6B7A99]">Por videollamada</p>
                  </div>
                  {teachingMode === 'ONLINE' && (
                    <div className="w-4 h-4 bg-[#0F1F5C] rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </button>
              </div>

              {teachingMode === 'PRESENTIAL' && (
                <div className="mt-3 relative">
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Dirección completa"
                    className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-10"
                  />
                  {address && (
                    <button onClick={() => setAddress('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X size={16} color="#6B7A99" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-[#0F1F5C]">Notas para el tutor (opcional)</h2>
                <span className="text-xs text-[#6B7A99]">{notes.length} / 200</span>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 200))}
                placeholder="Cuéntale algo al tutor sobre tus objetivos..."
                rows={3}
                className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none resize-none"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0F1F5C]">Resumen de la reserva</h2>
            <div className="bg-[#F2F4F8] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7A99]">Fecha</span>
                <span className="text-sm font-medium text-[#0F1F5C]">
                  {selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7A99]">Hora</span>
                <span className="text-sm font-medium text-[#0F1F5C]">{selectedHour}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7A99]">Modalidad</span>
                <span className="text-sm font-medium text-[#0F1F5C]">{teachingMode === 'ONLINE' ? 'Online' : 'Presencial'}</span>
              </div>
              {address && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#6B7A99]">Dirección</span>
                  <span className="text-sm font-medium text-[#0F1F5C] text-right max-w-[180px]">{address}</span>
                </div>
              )}
            </div>
            <div className="bg-[#F2F4F8] rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7A99]">Precio por hora</span>
                <span className="text-sm font-medium text-[#0F1F5C]">{price} €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#6B7A99]">Tarifa de plataforma (10%)</span>
                <span className="text-sm font-medium text-[#0F1F5C]">{(price * 0.1).toFixed(2)} €</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between">
                <span className="text-base font-bold text-[#0F1F5C]">Total</span>
                <span className="text-base font-bold text-[#0F1F5C]">{price} €</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0F1F5C]">Método de pago</h2>
            <div className="bg-[#F2F4F8] rounded-2xl p-4">
              <p className="text-sm text-[#6B7A99] text-center py-4">
                Integración con Stripe disponible en producción.
                <br />Para continuar, haz clic en "Confirmar reserva".
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-[#0F1F5C] mb-2">¡Reserva confirmada!</h2>
            <p className="text-sm text-[#6B7A99] mb-8">
              Tu clase ha sido reservada. Recibirás un email de confirmación.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-8 py-3 bg-[#0F1F5C] text-white font-semibold rounded-xl"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={step === 2 ? handleBook : handleNext}
            disabled={loading || (step === 0 && (!selectedDate || !selectedHour))}
            className="w-full py-4 bg-[#0F1F5C] text-white font-semibold rounded-xl text-base disabled:opacity-50"
          >
            {loading ? 'Procesando...' : step === 2 ? `Confirmar reserva · ${price} €` : `Continuar · ${price} € / h`}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
