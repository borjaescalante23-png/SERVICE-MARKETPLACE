import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { professionalsApi } from '../services/api';
import { ProfessionalProfile, CATEGORY_LABELS, CATEGORY_ICONS, ServiceCategory } from '../types';
import StarRating from '../components/common/StarRating';
import { CheckCircle, MapPin, Briefcase, Search, SlidersHorizontal } from 'lucide-react';

export default function ProfessionalList() {
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get('category') || '');
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['professionals', category, minRating, page],
    queryFn: () => professionalsApi.list({ category: category || undefined, minRating: minRating || undefined, page, limit: 12 }).then(r => r.data),
  });

  const categories = Object.keys(CATEGORY_LABELS) as ServiceCategory[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesionales verificados</h1>
        <p className="text-gray-500">Todos los profesionales han sido revisados y aprobados manualmente.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={18} className="text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={e => { setMinRating(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Cualquier valoración</option>
            <option value="4.5">4.5+ estrellas</option>
            <option value="4">4+ estrellas</option>
            <option value="3">3+ estrellas</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-20">
          <Search size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No se encontraron profesionales con estos filtros.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data?.map((pro: ProfessionalProfile) => (
              <Link
                key={pro.id}
                to={`/professionals/${pro.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {pro.user?.avatarUrl ? (
                      <img src={pro.user.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-primary-600">
                        {pro.user?.firstName?.[0]}{pro.user?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {pro.user?.firstName} {pro.user?.lastName}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                      <span className="text-xs text-green-600 font-medium">Verificado</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={Math.round(pro.avgRating)} size={14} />
                  <span className="text-sm font-medium text-gray-700">{pro.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({pro.totalReviews})</span>
                </div>

                {pro.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{pro.bio}</p>
                )}

                {pro.services && pro.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {pro.services.slice(0, 2).map(s => (
                      <span key={s.id} className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-full">
                        {CATEGORY_ICONS[s.category]} {CATEGORY_LABELS[s.category]}
                      </span>
                    ))}
                    {pro.services.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                        +{pro.services.length - 2}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Briefcase size={12} />
                    <span>{pro.completedJobs} trabajos</span>
                  </div>
                  {pro.services && pro.services[0] && (
                    <span className="font-medium text-gray-700">desde {pro.services[0].price}€</span>
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
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
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
