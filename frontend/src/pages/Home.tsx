import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { professionalsApi } from '../services/api';
import { CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../types';
import {
  Search, MapPin, Star, Zap,
  CheckCircle, ChevronRight, Briefcase,
  Wrench, Scissors, Leaf, Sparkles, Activity, Award,
} from 'lucide-react';

const CATEGORIES: ServiceCategory[] = [
  'PLUMBING', 'ELECTRICIAN', 'CLEANING', 'HANDYMAN',
  'GARDENING', 'CHEF', 'HAIRDRESSING', 'PERSONAL_TRAINER',
  'MASSAGE', 'ELDERCARE', 'TUTORING', 'PET_CARE',
];

const POPULAR_CHIPS = [
  { label: 'Fontanería', value: 'fontanero', Icon: Wrench },
  { label: 'Limpieza', value: 'limpieza', Icon: Sparkles },
  { label: 'Electricista', value: 'electricista', Icon: Zap },
  { label: 'Peluquería', value: 'peluquería', Icon: Scissors },
  { label: 'Jardín', value: 'jardín', Icon: Leaf },
  { label: 'Masajes', value: 'masaje', Icon: Activity },
];

// ─── Category Card ───────────────────────────────────────────────────────────
function CategoryCard({ cat, mobile = false }: { cat: ServiceCategory; mobile?: boolean }) {
  return (
    <Link
      to={`/professionals?category=${cat}`}
      className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-[#0F1A2E] border border-gray-100 dark:border-[#1E2D45] shadow-sm hover:shadow-2xl hover:shadow-gray-200/80 dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-300 ${
        mobile ? 'flex-shrink-0 w-44 snap-start' : 'w-full'
      }`}
    >
      {/* Image with zoom */}
      <div className="aspect-square overflow-hidden">
        <img
          src={CATEGORY_IMAGES[cat]}
          alt={CATEGORY_LABELS[cat]}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      {/* Info */}
      <div className="p-3.5">
        <p className="text-sm font-black text-[#0A1628] dark:text-[#F8FAFF]">{CATEGORY_LABELS[cat]}</p>
        <p className="text-xs text-gray-400 dark:text-[#94A3B8] mt-0.5">desde 25€</p>
      </div>
      {/* Slide-up button */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-white/95 dark:bg-[#0F1A2E]/95 backdrop-blur-sm pt-2 border-t border-gray-50 dark:border-[#1E2D45]">
        <div className="py-2 text-center text-xs font-extrabold text-white rounded-xl"
          style={{ background: '#0A1628' }}
        >
          Reservar
        </div>
      </div>
    </Link>
  );
}

// ─── Professional Card ────────────────────────────────────────────────────────
function ProfessionalCard({ pro }: { pro: any }) {
  const service = pro.services?.[0];
  const img = pro.experienceEntries?.[0]?.images?.[0]?.fileUrl;

  return (
    <Link
      to={`/professionals/${pro.id}`}
      className="group block bg-white dark:bg-[#0F1A2E] rounded-2xl border border-gray-100 dark:border-[#1E2D45] shadow-sm hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-black/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      <div className="aspect-[4/3] bg-gray-50 dark:bg-[#1E2D45] overflow-hidden relative">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : pro.user?.avatarUrl ? (
          <img src={pro.user.avatarUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A1628]">
            <span className="text-4xl font-black text-white/70">{pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-bold text-[#0A1628] dark:text-[#F8FAFF] text-sm truncate">{pro.user?.firstName} {pro.user?.lastName}</p>
        {service && <p className="text-xs text-gray-400 dark:text-[#94A3B8] mt-0.5 truncate">{service.name}</p>}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-[#1E2D45]">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-[#F8FAFF]">{pro.avgRating > 0 ? pro.avgRating.toFixed(1) : '—'}</span>
            {pro.totalReviews > 0 && <span className="text-xs text-gray-400 dark:text-[#94A3B8]">({pro.totalReviews})</span>}
          </div>
          {service && <span className="text-sm font-black text-[#2563EB] dark:text-[#3B82F6]">{service.price}€</span>}
        </div>
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
  const inputRef = useRef<HTMLInputElement>(null);

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
              {/* Location badge */}
              <div className="inline-flex items-center gap-1.5 mb-6 px-3.5 py-1.5 bg-white dark:bg-[#0F1A2E] rounded-full border border-gray-200 dark:border-[#1E2D45] shadow-sm text-sm text-gray-500 dark:text-[#94A3B8]">
                <MapPin size={13} className="text-[#2563EB]" />
                Barcelona
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] xl:text-[4.2rem] font-black text-[#0A1628] dark:text-[#F8FAFF] leading-[1.04] tracking-tight mb-5">
                Tu hogar,<br />
                <span className="text-[#2563EB]">perfectamente</span><br />
                cuidado
              </h1>

              <p className="text-lg text-gray-500 dark:text-[#94A3B8] font-light mb-10 max-w-md leading-relaxed">
                Profesionales verificados a domicilio en Barcelona. Reserva en minutos, pago 100% seguro.
              </p>

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
                {CATEGORIES.slice(0, 6).map(cat => (
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

            {/* ── Right column — photo collage ──────────────── */}
            <div className="hidden lg:block relative h-[520px] select-none">

              {/* Ambient circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-[#2563EB]/[0.06] pointer-events-none" />

              {/* Card 1 — back, rotated right */}
              <div
                className="absolute top-6 right-2 w-[210px] h-[270px] rounded-3xl overflow-hidden shadow-2xl shadow-gray-400/25"
                style={{ transform: 'rotate(8deg)', zIndex: 1 }}
              >
                <img src={CATEGORY_IMAGES['GARDENING']} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Card 2 — middle, rotated left */}
              <div
                className="absolute top-14 right-[110px] w-[200px] h-[255px] rounded-3xl overflow-hidden shadow-2xl shadow-gray-400/25"
                style={{ transform: 'rotate(-6deg)', zIndex: 2 }}
              >
                <img src={CATEGORY_IMAGES['MASSAGE']} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Card 3 — front */}
              <div
                className="absolute top-44 right-14 w-[230px] h-[285px] rounded-3xl overflow-hidden shadow-2xl shadow-gray-400/30"
                style={{ transform: 'rotate(3deg)', zIndex: 3 }}
              >
                <img src={CATEGORY_IMAGES['CHEF']} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating social proof card */}
              <div className="absolute bottom-10 left-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                  <Star size={18} className="text-[#2563EB] fill-[#2563EB]" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#0A1628]">4.9 / 5</p>
                  <p className="text-xs text-gray-400">+2.400 valoraciones</p>
                </div>
              </div>

              {/* Floating verified badge */}
              <div className="absolute top-4 left-8 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 z-10 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={13} className="text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-[#0A1628]">500+ profesionales</span>
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
      <section className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-black tracking-widest text-[#2563EB] uppercase mb-2">Especialidades</p>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0A1628] dark:text-[#F8FAFF] tracking-tight">¿Qué necesitas hoy?</h2>
            </div>
            <Link
              to="/professionals"
              className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#0A1628] dark:text-[#F8FAFF] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
            >
              Ver todas <ChevronRight size={16} />
            </Link>
          </div>

          {/* Mobile: 2-col grid */}
          <div className="grid grid-cols-2 sm:hidden gap-3">
            {CATEGORIES.map(cat => <CategoryCard key={cat} cat={cat} />)}
          </div>

          {/* Desktop: 4-col grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES.map(cat => <CategoryCard key={cat} cat={cat} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PROFESIONALES DESTACADOS
      ══════════════════════════════════════════════════════════════ */}
      {professionals.length > 0 && (
        <section className="bg-white dark:bg-[#080F1E] py-6 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-black tracking-widest text-[#2563EB] uppercase mb-2">Destacados</p>
                <h2 className="text-3xl font-black text-[#0A1628] dark:text-[#F8FAFF] tracking-tight">Profesionales disponibles</h2>
              </div>
              <Link
                to="/professionals"
                className="flex items-center gap-1 text-sm font-bold text-[#0A1628] dark:text-[#F8FAFF] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors"
              >
                Ver todos <ChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {professionals.map((pro: any) => <ProfessionalCard key={pro.id} pro={pro} />)}
            </div>
          </div>
        </section>
      )}

      {/* Wave white → navy */}
      <WaveDown from="#ffffff" to="#0A1628" />

      {/* ══════════════════════════════════════════════════════════════
          TRUST / POR QUÉ VELORA
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#0A1628] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black tracking-widest text-[#2563EB] uppercase mb-3">Garantías</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Por qué elegir VELORA
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <CheckCircle size={30} className="text-emerald-400" />,
                stat: '500+',
                label: 'Profesionales verificados',
                sub: 'KYC completo, antecedentes revisados',
              },
              {
                icon: <Star size={30} className="text-[#2563EB] fill-[#2563EB]" />,
                stat: '4.9',
                label: 'Valoración media',
                sub: 'Basado en opiniones reales de clientes',
              },
              {
                icon: <Award size={30} className="text-amber-400" />,
                stat: '100%',
                label: 'Pagos seguros',
                sub: 'Escrow garantizado, cobras solo al finalizar',
              },
            ].map(({ icon, stat, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center p-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.07] border border-white/[0.08] flex items-center justify-center mb-6">
                  {icon}
                </div>
                <p className="text-5xl font-black text-[#2563EB] mb-2">{stat}</p>
                <p className="text-base font-bold text-white mb-1">{label}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave navy → white */}
      <WaveUp from="#0A1628" to="#ffffff" />

      {/* ══════════════════════════════════════════════════════════════
          CTA PROVEEDOR
      ══════════════════════════════════════════════════════════════ */}
      {!user?.isProvider && (
        <section className="bg-white dark:bg-[#080F1E] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 p-8 sm:p-10 rounded-3xl border border-gray-100 dark:border-[#1E2D45] shadow-xl shadow-gray-100/80 dark:shadow-black/30 dark:bg-[#0F1A2E]">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0A1628 100%)' }}>
                  <Briefcase size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-black text-[#0A1628] dark:text-[#F8FAFF] mb-1">¿Quieres ofrecer tus servicios?</p>
                  <p className="text-gray-500 dark:text-[#94A3B8] text-sm leading-relaxed">
                    Únete a más de 500 profesionales y empieza a ganar en Barcelona
                  </p>
                </div>
              </div>
              <Link
                to={user ? '/become-provider' : '/register'}
                className="flex-shrink-0 px-7 py-3.5 text-sm font-black text-white rounded-full active:scale-95 transition-all"
                style={{ background: '#0A1628', boxShadow: '0 4px 20px rgba(10,22,40,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2563EB')}
                onMouseLeave={e => (e.currentTarget.style.background = '#0A1628')}
              >
                Empezar ahora
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#0A1628] border-t border-white/[0.06] py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0A1628 100%)' }}>
              <Zap size={15} className="text-white" fill="white" />
            </div>
            <span className="font-black text-white text-base tracking-tight">VELORA</span>
          </div>
          <p className="text-xs text-white/20">© 2026 VELORA. Barcelona, Spain.</p>
          <div className="flex gap-7 text-xs text-white/35">
            <Link to="/professionals" className="hover:text-white transition-colors">Servicios</Link>
            <Link to="/register" className="hover:text-white transition-colors">Registrarse</Link>
            <Link to="/login" className="hover:text-white transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
