import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi } from '../services/api';
import { ProfessionalProfile, CATEGORY_LABELS, CATEGORY_ICONS, ServiceCategory } from '../types';
import StarRating from '../components/common/StarRating';
import LevelBadge from '../components/common/LevelBadge';
import { CheckCircle, Briefcase, Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { useI18n } from '../i18n';

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
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCategory(params.get('category') || '');
    setPage(1);
  }, [params.toString()]);

  const { data, isLoading } = useQuery({
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
  });

  const categories = Object.keys(CATEGORY_LABELS) as ServiceCategory[];

  const hasActiveFilters = category || minRating || minPrice || maxPrice || search;

  function clearFilters() {
    setCategory('');
    setMinRating('');
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('pros.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('pros.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-200">{t('pros.filters')}</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={12} />
              {t('pros.clear_filters')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {/* Name search */}
          <div className="col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary-500">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder-gray-400"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">{t('pros.all_categories')}</option>
            {categories.map(c => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          {/* Rating */}
          <select
            value={minRating}
            onChange={e => { setMinRating(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">{t('pros.any_rating')}</option>
            <option value="4.5">4.5+ ⭐</option>
            <option value="4">4+ ⭐</option>
            <option value="3">3+ ⭐</option>
          </select>

          {/* Price range */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={minPrice}
              onChange={e => { setMinPrice(e.target.value); setPage(1); }}
              placeholder={t('pros.min_price')}
              min="0"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <span className="text-gray-400 text-xs">—</span>
            <input
              type="number"
              value={maxPrice}
              onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
              placeholder={t('pros.max_price')}
              min="0"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Fixed Barcelona badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-400 font-medium">
            <MapPin size={13} />
            <span>Barcelona</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20">
          <Search size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('pros.no_results')}</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-4 text-primary-600 text-sm font-medium hover:underline">
              {t('pros.clear_filters')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data?.map((pro: ProfessionalProfile) => (
              <Link
                key={pro.id}
                to={`/professionals/${pro.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {pro.user?.avatarUrl ? (
                      <img src={pro.user.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
                      {pro.user?.firstName} {pro.user?.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t('common.verified')}</span>
                      </div>
                      {pro.level && pro.level !== 'VERIFIED' && (
                        <LevelBadge level={pro.level} size="sm" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={Math.round(pro.avgRating)} size={14} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{pro.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({pro.totalReviews})</span>
                </div>

                {pro.bio && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{pro.bio}</p>
                )}

                {pro.services && pro.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {pro.services.slice(0, 2).map(s => (
                      <span key={s.id} className="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full">
                        {CATEGORY_ICONS[s.category]} {CATEGORY_LABELS[s.category]}
                      </span>
                    ))}
                    {pro.services.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                        +{pro.services.length - 2}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Briefcase size={12} />
                    <span>{t('common.jobs', { count: String(pro.completedJobs) })}</span>
                  </div>
                  {pro.services && pro.services[0] && (
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t('common.from_price', { price: String(pro.services[0].price) })}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: data.pagination.pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
