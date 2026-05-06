import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { professionalsApi } from '../services/api';
import { CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../types';
import { SERVICE_GROUPS, ALL_CATEGORIES } from '../config/categories';
import {
  Search, MapPin, Star, Zap,
  CheckCircle, ChevronRight, Briefcase, Shield,
  Wrench, Scissors, Leaf, Sparkles, Activity,
  Home as HomeIcon, Heart, Dumbbell, BookOpen, Users, Monitor, Grid,
} from 'lucide-react';

const GROUP_ICONS: Record<string, React.ElementType> = {
  HOGAR: HomeIcon, BIENESTAR: Heart, DEPORTE: Dumbbell,
  CLASES: BookOpen, CUIDADOS: Users, TECNOLOGIA: Monitor, OTROS: Grid,
};

const POPULAR_CHIPS = [
  { label: 'Fontanería', value: 'fontanero', Icon: Wrench },
  { label: 'Limpieza', value: 'limpieza', Icon: Sparkles },
  { label: 'Electricista', value: 'electricista', Icon: Zap },
  { label: 'Peluquería', value: 'peluquería', Icon: Scissors },
  { label: 'Jardín', value: 'jardín', Icon: Leaf },
  { label: 'Masajes', value: 'masaje', Icon: Activity },
];

const HERO_MOBILE_CATS: ServiceCategory[] = [
  'PLUMBING', 'ELECTRICIAN', 'CLEANING', 'HANDYMAN', 'GARDENING', 'CHEF',
];


// ─── Category Card ───────────────────────────────────────────────────────────
function CategoryCard({ cat, mobile = false }: { cat: ServiceCategory; mobile?: boolean }) {
  const catPrices: Partial<Record<ServiceCategory, number>> = {
    CLEANING: 25, PLUMBING: 45, HAIRDRESSING: 35, BEAUTY: 35,
    MASSAGE: 50, PERSONAL_TRAINER: 40, GARDENING: 30,
    ELECTRICIAN: 45, CHEF: 60, HANDYMAN: 35,
  };
  const fromPrice = catPrices[cat] ?? 30;

  return (
    <Link
      to={`/professionals?category=${cat}`}
      className={`group relative rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] cursor-pointer transition-all duration-300 hover:-translate-y-1.5 ${
        mobile ? 'flex-shrink-0 w-44 snap-start' : 'w-full'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(10,22,40,0.05)', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 18px 40px rgba(10,22,40,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,22,40,0.05)')}
    >
      {/* Image with zoom */}
      <div className="aspect-square overflow-hidden relative">
        <div
          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
          style={{ backgroundImage: `url(${CATEGORY_IMAGES[cat]})` }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)' }} />
        <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          {CATEGORY_LABELS[cat]}
        </div>
      </div>
      {/* Price row */}
      <div style={{ padding: '12px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6B7280' }}>desde</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0A1628', letterSpacing: '-0.02em' }}>{fromPrice}€<span style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>/h</span></div>
        </div>
        <ChevronRight size={16} color="#6B7280" />
      </div>
    </Link>
  );
}

// ─── Professional Card ────────────────────────────────────────────────────────
function ProfessionalCard({ pro }: { pro: any }) {
  const service = pro.services?.[0];
  const img = pro.experienceEntries?.[0]?.images?.[0]?.fileUrl || pro.user?.avatarUrl;

  return (
    <Link
      to={`/professionals/${pro.id}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      style={{ background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(10,22,40,0.05)', textDecoration: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 18px 40px rgba(10,22,40,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,22,40,0.05)')}
    >
      <div className="aspect-square overflow-hidden relative">
        {img ? (
          <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${img})` }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#0A1628' }}>
            <span className="text-4xl font-black" style={{ color: 'rgba(255,255,255,0.7)' }}>{pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)' }} />
        <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{pro.user?.firstName} {pro.user?.lastName}</div>
          {service && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>{service.name}</div>}
        </div>
      </div>
      <div style={{ padding: '12px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={12} fill="#F59E0B" color="#F59E0B" strokeWidth={1.2} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{pro.avgRating > 0 ? pro.avgRating.toFixed(1) : '—'}</span>
          {pro.totalReviews > 0 && <span style={{ fontSize: 11, color: '#6B7280' }}>· {pro.totalReviews} reseñas</span>}
        </div>
        {service && <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>desde <span style={{ fontSize: 16, fontWeight: 900, color: '#0A1628', letterSpacing: '-0.02em', display: 'block' }}>{service.price}€</span></div>}
      </div>
    </Link>
  );
}

// ─── Wave SVG ─────────────────────────────────────────────────────────────────
function WaveDown({ from, to }: { from: string; to: string }) {
  return (
    <div className="dark:hidden" style={{ background: from, lineHeight: 0, display: 'block' }}>
      <svg viewBox="0 0 1440 72" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '72px' }}>
        <path d="M0,24 C360,72 720,0 1080,48 C1260,68 1380,28 1440,40 L1440,72 L0,72 Z" fill={to} />
      </svg>
    </div>
  );
}

function WaveUp({ from, to }: { from: string; to: string }) {
  return (
    <div className="dark:hidden" style={{ background: from, lineHeight: 0, display: 'block' }}>
      <svg viewBox="0 0 1440 72" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '72px' }}>
        <path d="M0,48 C360,0 720,72 1080,24 C1260,4 1380,44 1440,32 L1440,72 L0,72 Z" fill={to} />
      </svg>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleCategories = (selectedGroup
    ? SERVICE_GROUPS.find(g => g.id === selectedGroup)?.categories ?? []
    : ALL_CATEGORIES
  ).map(c => c.id as ServiceCategory);

  const { data: profData } = useQuery({
    queryKey: ['home-professionals'],
    queryFn: () => professionalsApi.list({ limit: 8 }).then(r => r.data),
    staleTime: 60000,
  });

  const professionals = profData?.data ?? [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/professionals${searchValue ? `?search=${encodeURIComponent(searchValue)}` : ''}`);
  }

  function handleChip(value: string) {
    setSearchValue(value);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#080F1E]">

      {/* ══════════════════════════════════════════════════════════════
          HERO — split layout 60/40
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8FAFF] dark:bg-[#080F1E] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-20">
          <div className="grid lg:grid-cols-[3fr_2fr] gap-8 lg:gap-16 items-center lg:min-h-[calc(80vh-80px)]">

            {/* ── Left column ──────────────────────────────────── */}
            <div>
              {/* Eyebrow */}
              <div style={{ fontSize: 12, fontWeight: 900, color: '#2563EB', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>
                Servicios premium · Barcelona
              </div>

              {/* Title */}
              <h1 style={{ margin: '0 0 24px', fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.02, color: '#0A1628' }}>
                Tu hogar,<br />
                <span style={{ color: '#2563EB', fontWeight: 500 }}>perfectamente</span><br />
                cuidado.
              </h1>

              <p style={{ margin: '0 0 32px', fontSize: 18, fontWeight: 400, color: '#475569', lineHeight: 1.55, maxWidth: 480 }}>
                Profesionales verificados a domicilio. Pago retenido en custodia hasta que confirmes que el trabajo se ha hecho bien.
              </p>

              {/* ── Hero CTAs ─────────────────────────────────── */}
              <div style={{ gap: 12, marginBottom: 32 }} className="hidden md:flex">
                <button
                  onClick={() => navigate('/professionals')}
                  style={{ padding: '16px 32px', borderRadius: 9999, fontFamily: 'Inter', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff', background: '#0A1628', border: 'none', boxShadow: '0 4px 14px rgba(10,22,40,0.30)', transition: 'all 200ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(26,120,255,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(10,22,40,0.30)'; }}
                >
                  Explorar servicios
                </button>
                <button
                  onClick={() => navigate('/how-it-works')}
                  style={{ padding: '16px 32px', borderRadius: 9999, fontFamily: 'Inter', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#0A1628', background: '#fff', border: '1px solid #E5E7EB', boxShadow: 'none', transition: 'all 200ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0A1628'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#0A1628'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#0A1628'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                >
                  Cómo funciona
                </button>
              </div>

              {/* ── Trust chips ─────────────────────────────────── */}
              <div style={{ gap: 20, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', fontSize: 13, color: '#64748B', fontWeight: 500 }} className="hidden md:flex">
                {[['check_circle', 'Pago en custodia'], ['check_circle', 'KYC verificado'], ['check_circle', 'Garantía total']].map(([, label], i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle size={15} style={{ fill: '#2563EB', color: '#fff', flexShrink: 0 }} />
                    {label}
                    {i < 2 && <span style={{ width: 1, height: 12, background: '#CBD5E1', marginLeft: 6 }} />}
                  </span>
                ))}
              </div>

              {/* ── Airbnb-style segmented search bar ─────────── */}
              <form onSubmit={handleSearch} className="hidden md:block mb-6">
                <div className="flex items-stretch bg-white dark:bg-[#0F1A2E] rounded-2xl border border-gray-200 dark:border-[#1E2D45] shadow-xl shadow-gray-200/60 dark:shadow-black/30 overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]/25 focus-within:shadow-2xl focus-within:shadow-[#2563EB]/10 transition-all duration-300">

                  {/* Segment 1: Service */}
                  <div className="flex-1 min-w-0 px-5 py-3.5 cursor-text" onClick={() => inputRef.current?.focus()}>
                    <p className="text-[10px] font-black text-[#0A1628] dark:text-[#F8FAFF] uppercase tracking-widest mb-1">¿Qué necesitas?</p>
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchValue}
                      onChange={e => setSearchValue(e.target.value)}
                      placeholder="Fontanero, limpieza, chef..."
                      className="w-full text-sm text-gray-800 dark:text-[#F8FAFF] placeholder-gray-400 dark:placeholder-[#94A3B8] focus:outline-none bg-transparent font-medium"
                    />
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-gray-100 dark:bg-[#1E2D45] my-3 flex-shrink-0" />

                  {/* Segment 2: Location */}
                  <div className="hidden sm:block px-5 py-3.5 flex-shrink-0 min-w-[130px]">
                    <p className="text-[10px] font-black text-[#0A1628] dark:text-[#F8FAFF] uppercase tracking-widest mb-1">¿Dónde?</p>
                    <p className="text-sm text-gray-500 dark:text-[#94A3B8] font-medium flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#2563EB] flex-shrink-0" />
                      Barcelona
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px bg-gray-100 dark:bg-[#1E2D45] my-3 flex-shrink-0" />

                  {/* Segment 3: When */}
                  <div className="hidden sm:block px-5 py-3.5 flex-shrink-0 min-w-[100px]">
                    <p className="text-[10px] font-black text-[#0A1628] dark:text-[#F8FAFF] uppercase tracking-widest mb-1">¿Cuándo?</p>
                    <p className="text-sm text-gray-500 dark:text-[#94A3B8] font-medium">Hoy</p>
                  </div>

                  {/* Search button */}
                  <div className="flex items-center p-2 flex-shrink-0">
                    <button
                      type="submit"
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white active:scale-95 transition-all hover:scale-105"
                      style={{ background: '#0A1628', boxShadow: '0 4px 14px rgba(10,22,40,0.35)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#2563EB')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#0A1628')}
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </div>
              </form>

              {/* Mobile category grid — replaces search bar on small screens */}
              <div className="md:hidden grid grid-cols-2 gap-3 mb-2">
                {HERO_MOBILE_CATS.map(cat => (
                  <Link
                    key={cat}
                    to={`/professionals?category=${cat}`}
                    className="group relative rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="relative h-24 bg-gray-200 dark:bg-gray-800">
                      <img
                        src={CATEGORY_IMAGES[cat]}
                        alt={CATEGORY_LABELS[cat]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <span className="text-white text-xs font-bold block truncate">{CATEGORY_LABELS[cat]}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="md:hidden mb-2">
                <Link
                  to="/professionals"
                  className="block w-full py-3 text-center text-sm font-semibold text-[#2563EB] dark:text-[#3B82F6]"
                >
                  Ver todos los servicios
                </Link>
              </div>

              {/* ── Popular chips ─────────────────────────────── */}
              <div className="hidden md:flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {POPULAR_CHIPS.map(({ label, value, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChip(value)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#0F1A2E] border border-gray-200 dark:border-[#1E2D45] rounded-full text-xs font-semibold text-gray-600 dark:text-[#94A3B8] hover:bg-[#0A1628] hover:text-white hover:border-[#0A1628] dark:hover:bg-[#F8FAFF] dark:hover:text-[#0A1628] dark:hover:border-[#F8FAFF] active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Right column — VELORA photo mosaic ──────────── */}
            <div className="hidden lg:block relative select-none">
              {/* Grid mosaic: chef spans left 2 rows, living + massage on right */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '220px 220px',
                gridTemplateAreas: '"a b" "a c"',
                gap: 12,
                height: 452,
              }}>
                {[
                  { src: '/velora/img_0.jpg', label: 'Chef privado', from: 60, area: 'a' },
                  { src: '/velora/img_1.jpg', label: 'Limpieza',     from: 25, area: 'b' },
                  { src: '/velora/img_2.jpg', label: 'Masajes',      from: 50, area: 'c' },
                ].map((t, i) => (
                  <div key={i} style={{
                    gridArea: t.area, position: 'relative', overflow: 'hidden',
                    borderRadius: 16,
                    backgroundImage: `url(${t.src})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0) 50%)',
                    }} />
                    <div style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 2 }}>desde {t.from}€</div>
                      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{t.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating verified-pros chip */}
              <div style={{
                position: 'absolute', left: -18, bottom: -22, background: '#fff',
                padding: '12px 18px', borderRadius: 14,
                boxShadow: '0 12px 32px rgba(10,22,40,0.12), 0 1px 0 rgba(10,22,40,0.04)',
                border: '1px solid #EEF2F7',
                display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600, color: '#0A1628',
                zIndex: 10,
              }}>
                <div style={{ display: 'flex' }}>
                  {['/velora/img_3.jpg', '/velora/img_4.jpg', '/velora/img_5.jpg'].map((src, i) => (
                    <div key={i} style={{
                      width: 26, height: 26, borderRadius: 9999, marginLeft: i ? -8 : 0,
                      border: '2px solid #fff',
                      backgroundImage: `url('${src}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span>+500 profesionales verificados</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>Disponibles esta semana</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Wave hero → categories */}
        <WaveDown from="#F8FAFF" to="#ffffff" />
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CATEGORÍAS
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '72px 32px 64px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#2563EB', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Categorías</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(26px,3.5vw,38px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0A1628' }}>Todo lo que necesitas en casa</h2>
            </div>
            <Link
              to="/professionals"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#0A1628', textDecoration: 'none', flexShrink: 0 }}
            >
              Ver todos <ChevronRight size={15} strokeWidth={2.4} />
            </Link>
          </div>

          {/* Group chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                selectedGroup === null
                  ? 'bg-[#0A1628] text-white border-[#0A1628]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              Todos
            </button>
            {SERVICE_GROUPS.map(group => {
              const Icon = GROUP_ICONS[group.id];
              const active = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(active ? null : group.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    active
                      ? 'bg-[#0A1628] text-white border-[#0A1628]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {Icon && <Icon size={14} />}
                  {group.label}
                </button>
              );
            })}
          </div>

          {/* Mobile: 2-col grid */}
          <div className="grid grid-cols-2 sm:hidden gap-[18px]">
            {visibleCategories.map(cat => <CategoryCard key={cat} cat={cat} />)}
          </div>

          {/* Desktop: 4-col grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
            {visibleCategories.map(cat => <CategoryCard key={cat} cat={cat} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROFESIONALES DESTACADOS
      ══════════════════════════════════════════════════════════════ */}
      {professionals.length > 0 && (
        <section style={{ background: '#fff', padding: '0 32px 64px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#2563EB', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Destacados</div>
                <h2 style={{ margin: 0, fontSize: 'clamp(26px,3.5vw,36px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#0A1628' }}>Profesionales disponibles</h2>
              </div>
              <Link
                to="/professionals"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#0A1628', textDecoration: 'none', flexShrink: 0 }}
              >
                Ver todos <ChevronRight size={15} strokeWidth={2.4} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[18px]">
              {professionals.map((pro: any) => <ProfessionalCard key={pro.id} pro={pro} />)}
            </div>
          </div>
        </section>
      )}

      {/* Wave white → F8FAFF */}
      <WaveDown from="#ffffff" to="#F8FAFF" />

      {/* ══════════════════════════════════════════════════════════════
          TRUST / GARANTÍAS — VELORA style (3 white cards on #F8FAFF)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '72px 32px', background: '#F8FAFF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={{ fontSize: 12, fontWeight: 900, color: '#2563EB', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Garantías</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(28px,4vw,38px)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#0A1628' }}>Diseñado para la confianza</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: <Shield size={22} className="text-[#2563EB]" />, title: 'KYC + verificación manual', body: 'No cualquiera puede registrarse como profesional. Cada perfil se revisa por IA y por nuestro equipo antes de la aprobación.' },
              { icon: <CheckCircle size={22} className="text-[#2563EB]" />, title: 'Pago en custodia', body: 'Tu dinero queda retenido de forma segura. Solo se libera cuando confirmes que el trabajo se ha hecho bien.' },
              { icon: <Star size={22} className="text-[#2563EB]" />, title: 'Reseñas verificadas', body: 'Solo quienes han contratado y pagado pueden valorar. Reseñas reales, no opiniones anónimas.' },
            ].map((p, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 26, boxShadow: '0 1px 3px rgba(10,22,40,0.05)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(37,99,235,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  {p.icon}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.01em', marginBottom: 8 }}>{p.title}</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: '#6B7280', lineHeight: 1.6 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave F8FAFF → white */}
      <WaveUp from="#F8FAFF" to="#ffffff" />

      {/* ══════════════════════════════════════════════════════════════
          CTA PROVEEDOR
      ══════════════════════════════════════════════════════════════ */}
      {!user?.isProvider && (
        <section style={{ background: '#fff', padding: '64px 32px' }}>
          <div style={{ maxWidth: 1024, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 32, padding: '32px 40px', borderRadius: 20, border: '1px solid #E5E7EB', boxShadow: '0 8px 32px rgba(10,22,40,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minWidth: 280 }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #2563EB 0%, #0A1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={24} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#0A1628', margin: '0 0 4px', letterSpacing: '-0.01em' }}>¿Quieres ofrecer tus servicios?</p>
                  <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                    Únete a más de 500 profesionales y empieza a ganar en Barcelona
                  </p>
                </div>
              </div>
              <Link
                to={user ? '/become-provider' : '/register'}
                style={{ padding: '14px 28px', fontSize: 14, fontWeight: 700, color: '#fff', background: '#0A1628', borderRadius: 9999, textDecoration: 'none', flexShrink: 0, boxShadow: '0 4px 20px rgba(10,22,40,0.25)', transition: 'all 200ms' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0A1628'; }}
              >
                Empezar ahora
              </Link>
            </div>
          </div>
        </section>
      )}


    </div>
  );
}
