import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, BookOpen, User, Search, CalendarDays, BookMarked, MessageCircle, Heart,
  Monitor, Globe, Star, Dumbbell, Music, Palette, Briefcase, Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import BottomNav from '../components/BottomNav'
import TutorCard from '../components/TutorCard'
import { tutorsApi } from '../services/api'
import { TutorProfile } from '../types'
import { TUTOR_CATEGORIES } from '../config/categories'

const ICON_MAP: Record<string, any> = {
  Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart
}

const quickAccess = [
  { icon: CalendarDays, label: 'Mis clases', path: '/bookings' },
  { icon: BookMarked, label: 'Mis reservas', path: '/bookings' },
  { icon: MessageCircle, label: 'Mensajes', path: '/messages' },
  { icon: Heart, label: 'Favoritos', path: '/favorites' },
]

const homeCats = TUTOR_CATEGORIES.slice(0, 5)

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tutors, setTutors] = useState<TutorProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    tutorsApi.list().then(res => setTutors(res.data)).catch(() => {})
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/explore?query=${encodeURIComponent(searchQuery)}`)
  }

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName[0]}${lastName[0]}`.toUpperCase()

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="flex items-center justify-between px-4 pt-14 pb-4 bg-white">
        <h1 className="text-2xl font-bold text-[#0F1F5C] tracking-widest">VELORA</h1>
        <button className="relative p-2">
          <Bell size={22} color="#0F1F5C" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </header>

      <main className="px-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F5C]">
            Hola, {user?.firstName}
          </h2>
          <p className="text-sm text-[#6B7A99] mt-0.5">¿Qué quieres hacer hoy?</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/explore')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0F1F5C] text-white rounded-xl font-semibold text-sm"
          >
            <BookOpen size={17} />
            Quiero aprender
          </button>
          <button
            onClick={() => navigate('/publish')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-[#0F1F5C] text-[#0F1F5C] rounded-xl font-semibold text-sm"
          >
            <User size={17} />
            Quiero enseñar
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar clases, materias o habilidades"
            className="w-full px-4 py-3.5 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-12"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5">
            <Search size={19} color="#6B7A99" />
          </button>
        </form>

        <div className="flex justify-around">
          {quickAccess.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5"
                style={{ minWidth: 44 }}
              >
                <div className="w-12 h-12 bg-[#F2F4F8] rounded-xl flex items-center justify-center">
                  <Icon size={22} color="#0F1F5C" />
                </div>
                <span className="text-xs text-[#6B7A99]">{item.label}</span>
              </button>
            )
          })}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#0F1F5C]">Categorías</h3>
            <button onClick={() => navigate('/explore')} className="text-sm text-[#3B6FE8] font-medium">
              Ver todas
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {homeCats.map((cat) => {
              const Icon = ICON_MAP[cat.icon] || BookOpen
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/explore?category=${cat.id}`)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: cat.bgColor }}
                  >
                    <Icon size={22} color={cat.color} />
                  </div>
                  <span className="text-[10px] text-[#6B7A99] text-center leading-tight font-medium">
                    {cat.label.split(' ')[0]}
                  </span>
                </button>
              )
            })}
            <button
              onClick={() => navigate('/explore')}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#F2F4F8] flex items-center justify-center">
                <Plus size={22} color="#6B7A99" />
              </div>
              <span className="text-[10px] text-[#6B7A99] text-center leading-tight font-medium">Más</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#0F1F5C]">Populares para ti</h3>
            <button onClick={() => navigate('/explore')} className="text-sm text-[#3B6FE8] font-medium">
              Ver todas
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            {tutors.slice(0, 6).map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-[#0F1F5C]">Nuevos tutores esta semana</h3>
            <button onClick={() => navigate('/explore')} className="text-sm text-[#3B6FE8] font-medium">
              Ver todas
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {tutors.slice(0, 8).map((tutor, i) => {
              const colors = ['#3B6FE8', '#0891B2', '#D97706', '#16A34A', '#EA580C', '#E11D48', '#7C3AED', '#DB2777']
              return (
                <button
                  key={tutor.id}
                  onClick={() => navigate(`/tutor/${tutor.id}`)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  >
                    {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
                  </div>
                  <span className="text-[10px] text-[#6B7A99] max-w-[48px] text-center truncate">
                    {tutor.user?.firstName}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
