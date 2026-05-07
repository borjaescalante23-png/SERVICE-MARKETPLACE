import { Home, Search, Plus, MessageCircle, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { icon: Home, label: 'Inicio', path: '/home' },
  { icon: Search, label: 'Explorar', path: '/explore' },
  { icon: Plus, label: 'Publicar', path: '/publish', isCenter: true },
  { icon: MessageCircle, label: 'Mensajes', path: '/messages' },
  { icon: User, label: 'Perfil', path: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 flex items-end justify-around px-2 pb-safe z-50"
      style={{ height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon

        if (tab.isCenter) {
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center mb-2"
              style={{ minWidth: 56 }}
            >
              <div className="w-14 h-14 rounded-full bg-[#0F1F5C] flex items-center justify-center shadow-lg"
                style={{ marginBottom: -8 }}>
                <Icon size={24} color="white" strokeWidth={2.5} />
              </div>
            </button>
          )
        }

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-end gap-0.5 pb-1 flex-1"
            style={{ minHeight: 56 }}
          >
            <Icon size={22} color={isActive ? '#0F1F5C' : '#6B7A99'} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium" style={{ color: isActive ? '#0F1F5C' : '#6B7A99' }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
