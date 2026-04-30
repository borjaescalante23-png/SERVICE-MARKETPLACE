import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi } from '../services/api';
import { ProfessionalProfile, CATEGORY_LABELS, CATEGORY_IMAGES, ServiceCategory } from '../types';
import { Briefcase, Search, MapPin, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';

function ProCard({ pro }: { pro: ProfessionalProfile }) {
  const mainService = (pro.services as any[])?.[0];
  const mainCategory = mainService?.category;
  const coverImg = pro.user?.avatarUrl || (mainCategory ? CATEGORY_IMAGES[mainCategory] : '');
  const minPrice = (pro.services as any[])?.length
    ? Math.min(...(pro.services as any[]).map(s => s.price))
    : null;

  return (
    <Link
      to={`/professionals/${pro.id}`}
      className="group flex flex-row sm:flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#0F1A2E] shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.35)] dark:border dark:border-[#1E2D45] hover:shadow-[0_8px_32px_rgba(0,0,0,0.13)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative w-[100px] min-h-[96px] flex-shrink-0 self-stretch sm:w-full sm:min-h-[280px] overflow-hidden bg-gray-100 dark:bg-[#1E2D45]">
        {coverImg ? (
          <img
            src={coverImg}
            alt={`${pro.user?.firstName} ${pro.user?.lastName}`}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A1628]">
            <span className="text-4xl font-black text-white/70">
              {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
            </span>
          </div>
        )}

        {/* Gradient overlay (desktop) */}
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

        {/* Name + level bottom-left (desktop) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 hidden sm:block">
          <p className="font-bold text-white text-sm leading-tight drop-shadow-sm">
            {pro.user?.firstName} {pro.user?.lastName}
          </p>
          {pro.level && pro.level !== 'VERIFIED' && (
            <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              pro.level === 'ELITE'
                ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40'
                : 'bg-violet-400/25 text-violet-200 border border-violet-400/40'
            }`}>
              {pro.level === 'ELITE' ? '★ Elite' : '◆ Pro'}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
        {/* Mobile: name + level */}
        <div className="sm:hidden mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[#0A1628] dark:text-[#F8FAFF] text-sm leading-tight">
              {pro.user?.firstName} {pro.user?.lastName}
            </p>
            {pro.level && pro.level !== 'VERIFIED' && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                pro.level === 'ELITE'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700'
                  : 'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700'
              }`}>
                {pro.level === 'ELITE' ? '★ Elite' : '◆ Pro'}
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Star size={13} fill="#F59E0B" className="text-amber-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-[#0A1628] dark:text-[#F8FAFF]">
            {pro.avgRating.toFixed(1)}
          </span>
          <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">
            ({pro.totalReviews})
          </span>
        </div>

        {/* Main category */}
        {mainCategory && (
          <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] truncate mb-2 sm:mb-3">
            {CATEGORY_LABELS[mainCategory]}
          </p>
        )}

        {/* Footer: jobs + price */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#94A3B8]">
            <Briefcase size={11} />
            <span>{pro.completedJobs} trabajos</span>
          </div>
          {minPrice !== null && (
            <span className="text-sm font-bold text-[#2563EB] dark:text-[#3B82F6] flex-shrink-0">
              desde {minPrice}€
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProfessionalList() {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const [category, setCategory] = useState(params.get('category') || '');
  const [minRating, setMinRating] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCategory(params.get('category') || '');
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

  const categories = Object.keys(CATEGORY_LABELS) as ServiceCategory[];
  const hasActiveFilters = !!(category || minRating || minPrice || maxPrice || search);

  function clearFilters() {
    setCategory('');
    setMinRating('');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }

  const RATINGS = [
    { value: '4.5', label: '4.5+' },
    { value: '4', label: '4.0+' },
    { value: '3', label: '3.0+' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#080F1E]">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-3xl font-black text-[#0A1628] dark:text-[#F8FAFF] mb-1">{t('pros.title')}</h1>
        <p className="text-[#6B7280] dark:text-[#94A3B8]">{t('pros.subtitle')}</p>
      </div>

      {/* Mobile: active category chip */}
      {category && (
        <div className="md:hidden px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => { setCategory(''); setPage(1); }}
            className="flex items-center gap-1.5 text-sm font-medium text-[#2563EB] dark:text-[#3B82F6]"
          >
            <X size={14} />
            {CATEGORY_LABELS[category as ServiceCategory]}
          </button>
        </div>
      )}

      {/* Sticky filter bar */}
      <div className="sticky top-14 md:top-[68px] z-40 bg-[#F8FAFF]/95 dark:bg-[#080F1E]/95 backdrop-blur-sm border-b border-[#E5E7EB] dark:border-[#1E2D45]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
          {/* Search row — hidden on mobile */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0F1A2E] rounded-full border border-[#E5E7EB] dark:border-[#1E2D45] focus-within:border-[#2563EB] dark:focus-within:border-[#3B82F6] focus-within:ring-2 focus-within:ring-[#2563EB]/10 dark:focus-within:ring-[#3B82F6]/10 transition-all shadow-sm">
              <Search size={15} className="text-[#6B7280] dark:text-[#94A3B8] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar profesional..."
                className="flex-1 bg-transparent text-sm text-[#0A1628] dark:text-[#F8FAFF] outline-none placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }}>
                  <X size={14} className="text-[#6B7280] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] transition-colors" />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 font-medium flex-shrink-0">
              <MapPin size={13} />
              <span>Barcelona</span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#0A1628] dark:hover:text-[#F8FAFF] bg-white dark:bg-[#0F1A2E] rounded-full border border-[#E5E7EB] dark:border-[#1E2D45] transition-colors"
              >
                <X size={13} />
                <span className="hidden sm:inline">{t('pros.clear_filters')}</span>
              </button>
            )}
          </div>

          {/* Category + rating pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              onClick={() => { setCategory(''); setPage(1); }}
              className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                !category
                  ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] border-[#0A1628] dark:border-[#F8FAFF]'
                  : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45] hover:border-[#0A1628] dark:hover:border-[#94A3B8]'
              }`}
            >
              {t('pros.all_categories')}
            </button>

            {categories.map(c => (
              <button
                key={c}
                onClick={() => { setCategory(c === category ? '' : c); setPage(1); }}
                className={`flex-shrink-0 px-4 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                  category === c
                    ? 'bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] border-[#0A1628] dark:border-[#F8FAFF]'
                    : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45] hover:border-[#0A1628] dark:hover:border-[#94A3B8]'
                }`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}

            <div className="flex-shrink-0 w-px h-5 bg-[#E5E7EB] dark:bg-[#1E2D45] mx-1" />

            {RATINGS.map(r => (
              <button
                key={r.value}
                onClick={() => { setMinRating(minRating === r.value ? '' : r.value); setPage(1); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all duration-200 ${
                  minRating === r.value
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white dark:bg-[#0F1A2E] text-[#6B7280] dark:text-[#94A3B8] border-[#E5E7EB] dark:border-[#1E2D45] hover:border-amber-400 dark:hover:border-amber-500'
                }`}
              >
                <Star
                  size={11}
                  fill={minRating === r.value ? 'white' : '#F59E0B'}
                  className={minRating === r.value ? 'text-white' : 'text-amber-400'}
                />
                {r.label}
              </button>
            ))}

            <div className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-[#0F1A2E] rounded-full border border-[#E5E7EB] dark:border-[#1E2D45]">
              <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">€</span>
              <input
                type="number"
                value={minPrice}
                onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                placeholder="Min"
                min="0"
                className="w-12 bg-transparent text-xs text-[#0A1628] dark:text-[#F8FAFF] outline-none placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
              />
              <span className="text-xs text-[#6B7280] dark:text-[#94A3B8]">—</span>
              <input
                type="number"
                value={maxPrice}
                onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                placeholder="Max"
                min="0"
                className="w-12 bg-transparent text-xs text-[#0A1628] dark:text-[#F8FAFF] outline-none placeholder-[#6B7280] dark:placeholder-[#94A3B8]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0F1A2E] rounded-2xl overflow-hidden shadow-sm animate-pulse dark:border dark:border-[#1E2D45]">
                <div className="hidden sm:block aspect-[4/3] bg-gray-200 dark:bg-[#1E2D45]" />
                <div className="flex sm:block gap-3 p-4 sm:p-4 sm:space-y-3">
                  <div className="sm:hidden w-[120px] h-20 flex-shrink-0 bg-gray-200 dark:bg-[#1E2D45] rounded-xl" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 bg-gray-200 dark:bg-[#1E2D45] rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-[#1E2D45]/60 rounded-full w-1/2" />
                    <div className="flex justify-between pt-1">
                      <div className="h-3 bg-gray-100 dark:bg-[#1E2D45]/60 rounded-full w-1/3" />
                      <div className="h-3 bg-gray-100 dark:bg-[#1E2D45]/60 rounded-full w-1/4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
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
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-white dark:bg-[#0F1A2E] border border-[#E5E7EB] dark:border-[#1E2D45] flex items-center justify-center shadow-sm">
              <Search size={32} className="text-[#6B7280] dark:text-[#94A3B8]" />
            </div>
            <p className="text-lg font-semibold text-[#0A1628] dark:text-[#F8FAFF] mb-2">{t('pros.no_results')}</p>
            <p className="text-[#6B7280] dark:text-[#94A3B8] text-sm mb-6">Prueba con otros filtros o categorías</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-[#0A1628] dark:bg-[#F8FAFF] text-white dark:text-[#0A1628] text-sm font-semibold rounded-full transition-colors hover:bg-[#2563EB] dark:hover:bg-[#E5E7EB]"
              >
                {t('pros.clear_filters')}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
                {Array.from({ length: data.pagination.pages }).map((_, i) => (
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
        )}
      </div>
    </div>
  );
}
