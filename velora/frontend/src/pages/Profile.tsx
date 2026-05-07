import { useNavigate } from 'react-router-dom'
import { User, Settings, Star, BookMarked, LogOut, ChevronRight, Shield } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = () => {
    if (!user) return 'U'
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }

  const menuItems = [
    { icon: BookMarked, label: 'Mis reservas', path: '/bookings' },
    { icon: Star, label: 'Mis reseñas', path: '/reviews' },
    { icon: Shield, label: 'Verificación', path: '/verify' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-[#F2F4F8] pb-20">
      <div className="bg-white px-4 pt-14 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#0F1F5C] flex items-center justify-center text-white text-2xl font-bold">
            {getInitials()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F1F5C]">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-[#6B7A99]">{user?.email}</p>
            {user?.tutorProfile && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={12} fill="#D97706" color="#D97706" />
                <span className="text-xs font-medium text-[#0F1F5C]">{user.tutorProfile.avgRating.toFixed(1)}</span>
                <span className="text-xs text-[#6B7A99]">· Tutor verificado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {!user?.tutorProfile && (
          <button
            onClick={() => navigate('/publish')}
            className="w-full flex items-center justify-between p-4 bg-[#0F1F5C] rounded-2xl"
          >
            <div>
              <p className="text-white font-semibold text-sm">Conviértete en tutor</p>
              <p className="text-white/70 text-xs mt-0.5">Empieza a enseñar y gana dinero</p>
            </div>
            <ChevronRight size={20} color="white" />
          </button>
        )}

        <div className="bg-white rounded-2xl overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-50 last:border-0"
              >
                <div className="w-9 h-9 bg-[#F2F4F8] rounded-xl flex items-center justify-center">
                  <Icon size={18} color="#0F1F5C" />
                </div>
                <span className="text-sm font-medium text-[#0F1F5C] flex-1 text-left">{item.label}</span>
                <ChevronRight size={16} color="#6B7A99" />
              </button>
            )
          })}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-4 w-full"
          >
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <LogOut size={18} color="#E11D48" />
            </div>
            <span className="text-sm font-medium text-red-500 flex-1 text-left">Cerrar sesión</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
