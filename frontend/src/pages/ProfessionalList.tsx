import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi } from '../services/api';
import { ProfessionalProfile, CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../types';
import { Briefcase, Search, MapPin, X, Star, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '../i18n';
import { SERVICE_GROUPS, getCategoryLabel } from '../config/categories';

function TierBadge({ level }: { level?: string }) {
  if (!level || level === 'VERIFIED') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 9999, background: '#ECFDF5', color: '#065F46', fontSize: 11, fontWeight: 700, border: '1px solid rgba(6,95,70,0.13)' }}>
      <span style={{ fontSize: 10 }}>✓</span>Verificado
    </span>
  );
  const isElite = level === 'ELITE';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 9999, background: isElite ? '#FFFBEB' : '#F5F3FF', color: isElite ? '#92400E' : '#5B21B6', fontSize: 11, fontWeight: 700, border: `1px solid ${isElite ? 'rgba(146,64,14,0.13)' : 'rgba(91,33,182,0.13)'}` }}>
      <span style={{ fontSize: 10 }}>{isElite ? '★' : '◆'}</span>{isElite ? 'Elite' : 'Pro'}
    </span>
  );
}

function ProCard({ pro }: { pro: ProfessionalProfile }) {
  const mainService = (pro.services as any[])?.[0];
  const mainCategory = mainService?.category;
  const avatarImg = pro.user?.avatarUrl || (mainCategory ? CATEGORY_IMAGES[mainCategory as ServiceCategory] : '');
  const minPrice = (pro.services as any[])?.length
    ? Math.min(...(pro.services as any[]).map((s: any) => s.price))
    : null;

  return (
    <Link
      to={`/professionals/${pro.id}`}
      className="group"
      style={{
        display: 'flex', gap: 14, alignItems: 'flex-start', textDecoration: 'none',
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
        padding: 16, boxShadow: '0 1px 3px rgba(10,22,40,0.05)',
        transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 14px 30px rgba(10,22,40,0.10)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 1px 3px rgba(10,22,40,0.05)';
        el.style.transform = 'none';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 64, height: 64, borderRadius: 9999, flexShrink: 0,
        backgroundImage: avatarImg ? `url(${avatarImg})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center top',
        background: avatarImg ? undefined : '#0A1628',
        border: '2px solid #fff', boxShadow: '0 1px 4px rgba(10,22,40,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!avatarImg && (
          <span style={{ fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>
            {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
          {pro.user?.firstName} {pro.user?.lastName}
          <svg width={14} height={14} viewBox="0 0 24 24" fill="#10B981" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        {mainCategory && (
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginTop: 1 }}>
            {CATEGORY_LABELS[mainCategory as ServiceCategory] ?? getCategoryLabel(mainCategory)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11, color: '#6B7280' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Star size={12} fill="#F59E0B" color="#F59E0B" strokeWidth={1.2} />
            <span style={{ color: '#0A1628', fontWeight: 700 }}>{pro.avgRating.toFixed(1)}</span>
          </span>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: '#D1D5DB' }} />
          <span>{pro.totalReviews} reseñas</span>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: '#D1D5DB' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Briefcase size={11} /> {pro.completedJobs} trabajos
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
          <TierBadge level={pro.level} />
        </div>
      </div>

      {/* Price */}
      {minPrice !== null && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: '#6B7280', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>desde</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0A1628', letterSpacing: '-0.02em' }}>{minPrice}€</div>
        </div>
      )}
    </Link>
  );
}

export default function ProfessionalList() {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const [category, setCategory] = useState(params.get('category') || '');
  const [activeGroup, setActiveGroup] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(SERVICE_GROUPS.map(g => g.id)));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const cat = params.get('category') || '';
    setCategory(cat);
    if (cat) {
      const group = SERVICE_GROUPS.find(g => g.categories.some(c => c.id === cat));
      if (group) setActiveGroup(group.id);
    }
    setPage(1);
  }, [params.toString()]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['professionals', category, minRating, minPrice, maxPrice, debouncedSearch, page],
    queryFn: () => professionalsApi.list({
      category: category || undefined,
      minRating: minRating || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      search: debouncedSearch || undefined,
      page,
      limit: 12,
    }).then(r => r.data),
    retry: 2,
  });

  const hasActiveFilters = !!(category || minRating || minPrice || maxPrice || search);
  const visibleCategories = activeGroup
    ? SERVICE_GROUPS.find(g => g.id === activeGroup)?.categories ?? []
    : [];

  function clearFilters() {
    setCategory('');
    setActiveGroup('');
    setMinRating('');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }

  function selectCategory(cat: string) {
    setCategory(cat === category ? '' : cat);
    setPage(1);
  }

  function selectGroup(gid: string) {
    if (activeGroup === gid) {
      setActiveGroup('');
    } else {
      setActiveGroup(gid);
      setCategory('');
      setPage(1);
    }
  }

  function toggleGroupExpanded(gid: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });
  }

  const RATINGS = [
    { value: '4.5', label: '4.5+' },
    { value: '4', label: '4.0+' },
    { value: '3', label: '3.0+' },
  ];

  function renderSidebar() { return (
    <div className="space-y-1">
      {/* Search (sidebar mobile) */}
      <div className="mb-4 md:hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-[#0F1A2E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6] transition-all">
          <Search size={14} className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-sm text-[#0A1628] dark:text-[#F8FAFF] outline-none placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
          />
        </div>
      </div>

      {/* Rating filter */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-2 px-1">Valoración</p>
        <div className="flex flex-wrap gap-1.5">
          {RATINGS.map(r => (
            <button
              key={r.value}
              onClick={() => { setMinRating(minRating === r.value ? '' : r.value); setPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                minRating === r.value
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45] hover:border-amber-400'
              }`}
            >
              <Star size={10} fill={minRating === r.value ? 'white' : '#F59E0B'} className={minRating === r.value ? 'text-white' : 'text-amber-400'} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price filter */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-2 px-1">Precio (€)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={e => { setMinPrice(e.target.value); setPage(1); }}
            placeholder="Mín"
            min="0"
            className="w-full px-3 py-2 bg-white dark:bg-[#0F1A2E] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl text-sm text-[#0A1628] dark:text-[#F8FAFF] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
          />
          <span className="text-[#6B7280] dark:text-[#94A3B8] text-sm flex-shrink-0">—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="Máx"
            min="0"
            className="w-full px-3 py-2 bg-white dark:bg-[#0F1A2E] border border-[#E5E7EB] dark:border-[#1E2D45] rounded-xl text-sm text-[#0A1628] dark:text-[#F8FAFF] outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] transition-colors placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
          />
        </div>
      </div>

      {/* Group + category tree */}
      <div>
        <p className="text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wider mb-2 px-1">Categorías</p>
        <button
          onClick={() => { setCategory(''); setActiveGroup(''); setPage(1); }}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium mb-1 transition-colors ${
            !category && !activeGroup
              ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628]'
              : 'text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F8FAFF] dark:hover:bg-[#0F1A2E]'
          }`}
        >
          Todos los profesionales
        </button>

        {SERVICE_GROUPS.map(group => (
          <div key={group.id}>
            <button
              onClick={() => toggleGroupExpanded(group.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeGroup === group.id
                  ? 'text-[#2563EB] dark:text-[#3B82F6]'
                  : 'text-[#0A1628] dark:text-[#F8FAFF] hover:bg-[#F8FAFF] dark:hover:bg-[#0F1A2E]'
              }`}
            >
              <span>{group.label}</span>
              <ChevronDown
                size={14}
                className={`text-[#6B7280] dark:text-[#94A3B8] transition-transform duration-200 ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedGroups.has(group.id) && (
              <div className="ml-3 mb-1 space-y-0.5 border-l border-[#E5E7EB] dark:border-[#1E2D45] pl-3">
                {group.categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { selectGroup(group.id); selectCategory(cat.id); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      category === cat.id
                        ? 'text-[#2563EB] dark:text-[#3B82F6] font-semibold bg-blue-50 dark:bg-blue-900/15'
                        : 'text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] hover:bg-[#F8FAFF] dark:hover:bg-[#0F1A2E]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  ); }

  return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#080F1E]">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div style={{ fontSize: 12, fontWeight: 900, color: '#2563EB', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>
          {category ? `${CATEGORY_LABELS[category as ServiceCategory] ?? getCategoryLabel(category)} · Barcelona` : 'Servicios · Barcelona'}
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, letterSpacing: '-0.02em', color: '#0A1628' }}>{t('pros.title')}</h1>
      </div>

      {/* Mobile filter bar */}
      <div className="md:hidden sticky top-14 z-40 bg-[#F8FAFF]/95 dark:bg-[#080F1E]/95 backdrop-blur-sm border-b border-[#E5E7EB] dark:border-[#1E2D45]">
        <div className="px-4 py-2.5 space-y-2">
          {/* Search + filter button */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#0F1A2E] rounded-full border border-[#E5E7EB] dark:border-[#1E2D45] focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6] transition-all shadow-sm">
              <Search size={14} className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar profesional..."
                className="flex-1 bg-transparent text-sm text-[#0A1628] dark:text-[#F8FAFF] outline-none placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }}>
                  <X size={13} className="text-[#6B7280]" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all shadow-sm ${
                hasActiveFilters
                  ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] border-[#0A1628] dark:border-[#F8FAFF]'
                  : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45]'
              }`}
            >
              <SlidersHorizontal size={14} />
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />}
            </button>
          </div>

          {/* Group chips row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => { setActiveGroup(''); setCategory(''); setPage(1); }}
              className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                !activeGroup
                  ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] border-[#0A1628] dark:border-[#F8FAFF]'
                  : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45]'
              }`}
            >
              Todos
            </button>
            {SERVICE_GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => selectGroup(group.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  activeGroup === group.id
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45]'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {/* Category chips row (only when group selected) */}
          {activeGroup && visibleCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => selectCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                    category === cat.id
                      ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] border-[#0A1628] dark:border-[#F8FAFF]'
                      : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-[85%] max-w-xs h-full bg-[#F8FAFF] dark:bg-[#080F1E] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] dark:border-[#1E2D45]">
              <span className="font-bold text-[#0A1628] dark:text-[#F8FAFF]">Filtros</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={() => { clearFilters(); setSidebarOpen(false); }}
                    className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-medium"
                  >
                    Limpiar
                  </button>
                )}
                <button onClick={() => setSidebarOpen(false)}>
                  <X size={20} className="text-[#6B7280] dark:text-[#94A3B8]" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {renderSidebar()}
            </div>
            <div className="sticky bottom-0 p-4 bg-[#F8FAFF] dark:bg-[#080F1E] border-t border-[#E5E7EB] dark:border-[#1E2D45]">
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full py-3 bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] font-semibold rounded-xl text-sm"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="hidden md:flex gap-8">
          {/* Desktop sidebar */}
          <aside className="w-64 flex-shrink-0 pt-6">
            <div className="sticky top-24 space-y-1">
              {/* Search */}
              <div className="mb-5">
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-[#0F1A2E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6] transition-all shadow-sm">
                  <Search size={14} className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Buscar profesional..."
                    className="flex-1 bg-transparent text-sm text-[#0A1628] dark:text-[#F8FAFF] outline-none placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
                  />
                  {search && (
                    <button onClick={() => { setSearch(''); setPage(1); }}>
                      <X size={13} className="text-[#6B7280]" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 px-1">
                <MapPin size={13} className="text-[#2563EB] dark:text-[#3B82F6]" />
                <span className="text-xs text-[#2563EB] dark:text-[#3B82F6] font-medium">Barcelona</span>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center gap-2 px-3 py-2 mb-3 text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] bg-white dark:bg-[#0F1A2E] rounded-xl border border-[#E5E7EB] dark:border-[#1E2D45] transition-colors"
                >
                  <X size={13} />
                  {t('pros.clear_filters')}
                </button>
              )}

              {renderSidebar()}
            </div>
          </aside>

          {/* Desktop results */}
          <div className="flex-1 pt-6">
            <ResultsGrid
              isLoading={isLoading}
              isError={isError}
              data={data}
              page={page}
              setPage={setPage}
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
              t={t}
            />
          </div>
        </div>

        {/* Mobile results */}
        <div className="md:hidden pt-4">
          <ResultsGrid
            isLoading={isLoading}
            isError={isError}
            data={data}
            page={page}
            setPage={setPage}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

function ResultsGrid({
  isLoading, isError, data, page, setPage, hasActiveFilters, clearFilters, t,
}: {
  isLoading: boolean;
  isError: boolean;
  data: any;
  page: number;
  setPage: (value: number | ((p: number) => number)) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  t: (key: string) => string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 16 }} className="animate-pulse">
            <div style={{ width: 64, height: 64, borderRadius: 9999, background: '#E5E7EB', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, background: '#E5E7EB', borderRadius: 9999, width: '60%', marginBottom: 8 }} />
              <div style={{ height: 12, background: '#F3F4F6', borderRadius: 9999, width: '40%', marginBottom: 12 }} />
              <div style={{ height: 10, background: '#F3F4F6', borderRadius: 9999, width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-white dark:bg-[#0F1A2E] border border-[#E5E7EB] dark:border-[#1E2D45] flex items-center justify-center shadow-sm">
          <Search size={32} className="text-[#6B7280] dark:text-[#94A3B8]" />
        </div>
        <p className="text-lg font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-2">No se pudo conectar</p>
        <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mb-6">Comprueba tu conexión e inténtalo de nuevo</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] text-sm font-semibold rounded-full transition-colors hover:bg-[#2563EB]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (data?.data?.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-white dark:bg-[#0F1A2E] border border-[#E5E7EB] dark:border-[#1E2D45] flex items-center justify-center shadow-sm">
          <Search size={32} className="text-[#6B7280] dark:text-[#94A3B8]" />
        </div>
        <p className="text-lg font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-2">{t('pros.no_results')}</p>
        <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mb-6">Prueba con otros filtros o categorías</p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] text-sm font-semibold rounded-full transition-colors hover:bg-[#2563EB]"
          >
            {t('pros.clear_filters')}
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {data?.pagination && (
        <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-4">
          {data.pagination.total} profesional{data.pagination.total !== 1 ? 'es' : ''} encontrado{data.pagination.total !== 1 ? 's' : ''}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data?.data?.map((pro: ProfessionalProfile) => (
          <ProCard key={pro.id} pro={pro} />
        ))}
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#1E2D45] bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#0A1628] dark:hover:border-[#94A3B8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: data.pagination.pages }).map((_: unknown, i: number) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                page === i + 1
                  ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628]'
                  : 'bg-white dark:bg-[#0F1A2E] border border-[#E5E7EB] dark:border-[#1E2D45] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#0A1628] dark:hover:border-[#94A3B8]'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
            disabled={page === data.pagination.pages}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E5E7EB] dark:border-[#1E2D45] bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#0A1628] dark:hover:border-[#94A3B8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}
