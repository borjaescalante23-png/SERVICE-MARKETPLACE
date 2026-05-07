import { MessageCircle } from 'lucide-react'
import BottomNav from '../components/BottomNav'

const mockConversations = [
  { id: '1', name: 'Laura García', lastMessage: 'Perfecto, nos vemos el lunes a las 10:00', time: '10:32', unread: 2, color: '#0891B2' },
  { id: '2', name: 'Carlos Martínez', lastMessage: 'He enviado los detalles de la pista', time: 'Ayer', unread: 0, color: '#16A34A' },
  { id: '3', name: 'David Rodríguez', lastMessage: '¿Pudiste instalar Python correctamente?', time: 'Ayer', unread: 1, color: '#3B6FE8' },
]

function getInitials(name: string) {
  const parts = name.split(' ')
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function Messages() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-[#0F1F5C]">Mensajes</h1>
        <p className="text-sm text-[#6B7A99] mt-0.5">Tus conversaciones</p>
      </header>

      <div className="px-4">
        {mockConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 bg-[#F2F4F8] rounded-full flex items-center justify-center">
              <MessageCircle size={28} color="#6B7A99" />
            </div>
            <p className="text-[#6B7A99] text-sm text-center">No tienes mensajes aún.<br />Reserva una clase para empezar.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {mockConversations.map((conv) => (
              <button key={conv.id} className="flex items-center gap-3 py-4 w-full text-left">
                <div
                  className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: conv.color }}
                >
                  {getInitials(conv.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0F1F5C]">{conv.name}</p>
                    <span className="text-xs text-[#6B7A99]">{conv.time}</span>
                  </div>
                  <p className="text-xs text-[#6B7A99] truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 bg-[#0F1F5C] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[9px] font-bold">{conv.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
