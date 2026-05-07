import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import TutorCard from '../components/TutorCard'
import CategoryIcon from '../components/CategoryIcon'
import { TUTOR_CATEGORIES } from '../config/categories'
import { tutorsApi } from '../services/api'
import { TutorProfile } from '../types'
import { useAuth } from '../contexts/AuthContext'

const ICON_MAP: Record<string, any> = { Monitor, Globe, Star, Dumbbell, Music, Palette, BookOpen, Briefcase, Heart }

export default function Explore() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category') || ''
  const queryParam = searchParams.get('query') || ''

  const [view, setView] = useState<'categories' | 'tutors'>(selectedCategory ? 'tutors' : 'categories')
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [tutors, setTutors] = useState<TutorProfile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedCategory || queryParam) {
      setView('tutors')
      loadTutors()
    }
  }, [selectedCategory, queryParam])

  const loadTutors = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (selectedCategory) params.category = selectedCategory
      if (queryParam) params.query = queryParam
      const res = await tutorsApi.list(params)
      setTutors(res.data)
    } catch {
      setTutors([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams(prev => { prev.set('query', searchQuery); return prev })
    setView('tutors')
  }

  const handleCategorySelect = (catId: string) => {
    setSearchParams({ category: catId })
    setView('tutors')
  }

  const activeCatLabel = TUTOR_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Tutores'

  if (view === 'tutors') {
    return (
      <div className="min-h-screen bg-white pb-20">
        <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white">
          <button onClick={() => { setView('categories'); setSearchParams({}) }} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#0F1F5C" />
          </button>
          <h1 className="text-lg font-bold text-[#0F1F5C] flex-1">{activeCatLabel}</h1>
        </header>

        <div className="px-4 mb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar tutores..."
              className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-12"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5">
              <Search size={18} color="#6B7A99" />
            </button>
          </form>
        </div>

        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#0F1F5C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#6B7A99] text-sm">No se encontraron tutores</p>
              <button onClick={() => { setView('categories'); setSearchParams({}) }} className="mt-3 text-[#3B6FE8] text-sm font-medium">
                Explorar categorías
              </button>
            </div>
          ) : (
            tutors.map(tutor => <TutorCard key={tutor.id} tutor={tutor} compact />)
          )}
        </div>

        {isAuthenticated && <BottomNav />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="flex items-center gap-3 px-4 pt-14 pb-4 bg-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#0F1F5C" />
        </button>
        <h1 className="text-lg font-bold text-[#0F1F5C] flex-1 text-center">Todas las categorías</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 mb-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar categoría"
            className="w-full px-4 py-3 bg-[#F2F4F8] rounded-xl text-[#0F1F5C] placeholder-[#6B7A99] outline-none pr-12"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5">
            <Search size={18} color="#6B7A99" />
          </button>
        </form>
      </div>

      <div className="px-4">
        <h2 className="text-sm font-semibold text-[#6B7A99] uppercase tracking-wide mb-3">Categorías principales</h2>
        <div className="divide-y divide-gray-50">
          {TUTOR_CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || BookOpen
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="flex items-center gap-4 py-3.5 w-full text-left"
              >
                <CategoryIcon icon={cat.icon} color={cat.color} bgColor={cat.bgColor} size={20} containerSize={44} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0F1F5C]">{cat.label}</p>
                  <p className="text-xs text-[#6B7A99] mt-0.5">{cat.description}</p>
                </div>
                <ChevronRight size={18} color="#6B7A99" />
              </button>
            )
          })}
        </div>

        <p className="text-center text-sm text-[#6B7A99] mt-6 py-4">
          ¿No encuentras lo que buscas?{' '}
          <button onClick={() => { setView('tutors'); loadTutors() }} className="text-[#3B6FE8] font-medium">
            Explora todas las subcategorías →
          </button>
        </p>
      </div>

      {isAuthenticated && <BottomNav />}
    </div>
  )
}
