import {
  Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart
}

interface CategoryIconProps {
  icon: string
  color: string
  bgColor: string
  size?: number
  containerSize?: number
}

export default function CategoryIcon({ icon, color, bgColor, size = 20, containerSize = 40 }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] || BookOpen
  return (
    <div
      className="flex items-center justify-center rounded-xl flex-shrink-0"
      style={{ width: containerSize, height: containerSize, backgroundColor: bgColor }}
    >
      <Icon size={size} color={color} strokeWidth={2} />
    </div>
  )
}
