import { Star, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TutorProfile } from '../types'
import { TUTOR_CATEGORIES } from '../config/categories'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {}
TUTOR_CATEGORIES.forEach(c => { CATEGORY_COLORS[c.id] = { bg: c.bgColor, color: c.color } })

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}

interface TutorCardProps {
  tutor: TutorProfile
  compact?: boolean
}

export default function TutorCard({ tutor, compact = false }: TutorCardProps) {
  const navigate = useNavigate()
  const mainClass = tutor.classes?.[0]
  const category = mainClass?.category || 'ACADEMIA'
  const colors = CATEGORY_COLORS[category] || { bg: '#F5F3FF', color: '#7C3AED' }

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/tutor/${tutor.id}`)}
        className="flex items-center gap-3 w-full p-3 bg-white rounded-2xl shadow-sm border border-gray-50 text-left"
      >
        <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: colors.color }}>
          {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F1F5C] truncate">
            {tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor'}
          </p>
          <p className="text-xs text-[#6B7A99] truncate">{mainClass?.title || tutor.headline}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={11} fill="#D97706" color="#D97706" />
            <span className="text-xs font-medium text-[#0F1F5C]">{tutor.avgRating.toFixed(1)}</span>
            <span className="text-xs text-[#6B7A99]">({tutor.totalReviews})</span>
            {mainClass && <span className="text-xs font-bold text-[#0F1F5C] ml-1">{mainClass.pricePerHour}€/h</span>}
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate(`/tutor/${tutor.id}`)}
      className="flex-shrink-0 w-40 bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden text-left"
    >
      <div className="relative p-3 pb-0">
        <div className="w-full h-28 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: colors.color }}>
          {tutor.user ? getInitials(tutor.user.firstName, tutor.user.lastName) : 'TU'}
        </div>
        <button className="absolute top-4 right-4 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center">
          <Heart size={13} color="#6B7A99" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs font-bold text-[#0F1F5C] line-clamp-2 leading-tight">{mainClass?.title || tutor.headline}</p>
        <p className="text-[10px] text-[#6B7A99] mt-0.5 truncate">
          {tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor'}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} fill="#D97706" color="#D97706" />
          <span className="text-[10px] font-medium text-[#0F1F5C]">{tutor.avgRating.toFixed(1)}</span>
          <span className="text-[10px] text-[#6B7A99]">({tutor.totalReviews})</span>
        </div>
        {mainClass && (
          <p className="text-sm font-bold text-[#0F1F5C] mt-1">{mainClass.pricePerHour} € / h</p>
        )}
      </div>
    </button>
  )
}
