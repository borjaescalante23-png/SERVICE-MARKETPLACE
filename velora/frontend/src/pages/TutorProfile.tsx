import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Heart, Share2, Star, Monitor, MapPin, Clock, BarChart2, Tag,
  CheckCircle, MessageCircle
} from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { tutorsApi } from '../services/api'
import { TutorProfile as TutorProfileType } from '../types'
import { TUTOR_CATEGORIES } from '../config/categories'
import { useAuth } from '../contexts/AuthContext'

const LEVEL_LABELS: Record<string, string> = {
  ALL: 'Todos los niveles', BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado'
}

const MODE_LABELS: Record<string, string> = {
  ONLINE: 'Online', PRESENTIAL: 'Presencial', BOTH: 'Online y Presencial'
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {}
TUTOR_CATEGORIES.forEach(c => { CATEGORY_COLORS[c.id] = { bg: c.bgColor, color: c.color } })

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [tutor, setTutor] = useState<TutorProfileType | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)
  const [selectedClassIdx, setSelectedClassIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    tutorsApi.getById(id).then(res => { setTutor(res.data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0F1F5C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-[#6B7A99]">Tutor no encontrado</p>
        <button onClick={() => navigate(-1)} className="text-[#3B6FE8] font-medium">Volver</button>
      </div>
    )
  }

  const mainClass = tutor.classes?.[selectedClassIdx] || tutor.classes?.[0]
  const category = mainClass?.category || 'ACADEMIA'
  const colors = CATEGORY_COLORS[category] || { bg: '#F5F3FF', color: '#7C3AED' }
  const includes = mainClass?.includes ? mainClass.includes.split(',') : []

  return (
    <div className="min-h-screen bg-[#F2F4F8] pb-28">
      <header className="flex items-center justify-between px-4 pt-14 pb-3 bg-[#F2F4F8]">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ChevronLeft size={20} color="#0F1F5C" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFav(!isFav)}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
          >
            <Heart size={18} color={isFav ? '#E11D48' : '#0F1F5C'} fill={isFav ? '#E11D48' : 'none'} />
          </button>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Share2 size={18} color="#0F1F5C" />
          </button>
        </div>
      </header>

      <div className="px-4">
        <div className="bg-[#0F1F5C] rounded-3xl p-5 mb-4">
          <div className="flex items-start gap-2 mb-3">
            <span className="px-3 py-1 bg-[#16A34A] text-white text-xs font-medium rounded-full">
              Disponible ahora
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2 leading-tight">
            {mainClass?.title || tutor.headline || 'Clases particulares'}
          </h1>
          <p className="text-white/70 text-sm line-clamp-2 mb-4">
            {mainClass?.description || tutor.bio}
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: colors.color }}
            >
              {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-medium">
                  {tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor'}
                </span>
                {tutor.isVerified && <CheckCircle size={14} color="#3B6FE8" fill="#3B6FE8" />}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star size={13} fill="#D97706" color="#D97706" />
              <span className="text-white text-sm font-bold">{tutor.avgRating.toFixed(1)}</span>
              <span className="text-white/60 text-xs">({tutor.totalReviews})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { icon: mainClass?.teachingMode === 'ONLINE' ? Monitor : MapPin, label: 'Modalidad', value: MODE_LABELS[mainClass?.teachingMode || 'BOTH'] },
            { icon: Clock, label: 'Duración', value: `${mainClass?.duration || 60} min` },
            { icon: BarChart2, label: 'Nivel', value: LEVEL_LABELS[mainClass?.level || 'ALL'] },
            { icon: Tag, label: 'Precio', value: `${mainClass?.pricePerHour || 0}€/h` },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-2xl p-3 text-center">
                <Icon size={16} color="#6B7A99" className="mx-auto mb-1" />
                <p className="text-[9px] text-[#6B7A99] mb-0.5">{stat.label}</p>
                <p className="text-[10px] font-semibold text-[#0F1F5C] leading-tight">{stat.value}</p>
              </div>
            )
          })}
        </div>

        {tutor.classes && tutor.classes.length > 1 && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Clases disponibles</h2>
            <div className="space-y-2">
              {tutor.classes.map((cls, i) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassIdx(i)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-colors ${
                    selectedClassIdx === i ? 'border-[#0F1F5C] bg-[#EEF2FF]' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-[#0F1F5C]">{cls.title}</p>
                    <p className="text-xs text-[#6B7A99]">{LEVEL_LABELS[cls.level]}</p>
                  </div>
                  <span className="text-sm font-bold text-[#0F1F5C]">{cls.pricePerHour}€/h</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F1F5C] mb-2">Sobre esta clase</h2>
          <p className="text-sm text-[#6B7A99] leading-relaxed">
            {mainClass?.description || tutor.bio || 'Sin descripción disponible.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-[#0F1F5C] mb-2">Idiomas</h2>
          <div className="flex flex-wrap gap-2">
            {(tutor.languages || 'Español').split(',').map(lang => (
              <span key={lang} className="px-3 py-1 bg-[#F2F4F8] rounded-full text-sm text-[#0F1F5C]">
                {lang.trim()}
              </span>
            ))}
          </div>
        </div>

        {includes.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">Qué incluye</h2>
            <div className="grid grid-cols-2 gap-2">
              {includes.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#3B6FE8] font-bold text-sm mt-0.5">✓</span>
                  <span className="text-sm text-[#0F1F5C]">{item.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tutor.city && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-2">Ubicación</h2>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} color="#6B7A99" />
              <span className="text-sm text-[#6B7A99]">{tutor.city}</span>
            </div>
            <div className="w-full h-28 bg-[#F2F4F8] rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100" />
              <div className="relative flex flex-col items-center gap-1">
                <div className="w-6 h-6 bg-[#3B6FE8] rounded-full flex items-center justify-center">
                  <MapPin size={12} color="white" fill="white" />
                </div>
                <span className="text-xs text-[#6B7A99] font-medium">{tutor.city}</span>
              </div>
            </div>
          </div>
        )}

        {tutor.reviews && tutor.reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#0F1F5C] mb-3">
              Reseñas ({tutor.totalReviews})
            </h2>
            <div className="space-y-4">
              {tutor.reviews.slice(0, 3).map((review: any) => (
                <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#0F1F5C]">
                      {review.student?.firstName} {review.student?.lastName?.[0]}.
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="#D97706" color="#D97706" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#6B7A99]">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-4 py-3 flex gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <button
          onClick={() => isAuthenticated ? navigate(`/booking/${mainClass?.id}`) : navigate('/login')}
          className="flex-1 bg-[#0F1F5C] text-white font-semibold py-4 rounded-xl text-sm"
        >
          Reservar clase · {mainClass?.pricePerHour} € / h
        </button>
        <button className="w-14 h-14 border-2 border-[#0F1F5C] rounded-xl flex items-center justify-center flex-shrink-0">
          <MessageCircle size={20} color="#0F1F5C" />
        </button>
      </div>

      {isAuthenticated && <BottomNav />}
    </div>
  )
}
