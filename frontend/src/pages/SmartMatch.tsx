import { useState, type JSX } from 'react';
import { useMutation } from '@tanstack/react-query';
import { matchApi } from '../services/api';
import { CATEGORY_LABELS, ServiceCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Calendar, DollarSign, Star, Shield, Zap, ChevronRight } from 'lucide-react';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ServiceCategory[];

const LEVEL_BADGE: Record<string, { label: string; color: string; }> = {
  ELITE: { label: 'ELITE', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  PRO:   { label: 'PRO',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  VERIFIED: { label: 'VER', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
};

function ScoreBar({ value, max = 80 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function SmartMatch() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [maxPrice, setMaxPrice] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const mutation = useMutation({
    mutationFn: () => matchApi.match({
      category: category as ServiceCategory,
      // city is always Barcelona — enforced platform-wide
      scheduledAt: scheduledAt || undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }).then(r => r.data),
  });

  const results: any[] = (mutation.data as any)?.results || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Matching Inteligente</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">IA que analiza y clasifica los mejores profesionales para ti</p>
        </div>
      </div>

      {/* Search form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ServiceCategory)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <MapPin size={13} className="inline mr-1" />Ciudad
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-400 font-semibold">
              <MapPin size={13} />
              Barcelona
              <span className="ml-auto text-[10px] font-normal text-blue-500 dark:text-blue-500">Área exclusiva</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <DollarSign size={13} className="inline mr-1" />Precio máximo (€)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Sin límite"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Calendar size={13} className="inline mr-1" />Fecha deseada
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!category || mutation.isPending}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          {mutation.isPending ? 'Analizando con IA...' : 'Encontrar los mejores profesionales'}
        </button>
      </div>

      {/* Results */}
      {mutation.isSuccess && results.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No se encontraron profesionales para estos criterios.</p>
          <p className="text-sm mt-1">Prueba con una ciudad diferente o amplía el precio máximo.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {results.length} profesionales clasificados por puntuación IA
          </p>
          {results.map((pro: any, idx: number) => {
            const badge = LEVEL_BADGE[pro.level] || LEVEL_BADGE.VERIFIED;
            return (
              <div
                key={pro.professionalId}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-primary-200 dark:hover:border-primary-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/professionals/${pro.professionalId}`)}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    idx === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' :
                    idx === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300' :
                    'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  }`}>
                    #{idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {pro.avatarUrl
                      ? <img src={pro.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                          {pro.firstName?.[0] ?? '?'}
                        </div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-white">{pro.firstName} {pro.lastName}</p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${badge.color}`}>{badge.label}</span>
                      {pro.avgRating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                          <Star size={11} fill="currentColor" />{pro.avgRating.toFixed(1)}
                          <span className="text-gray-400 font-normal">({pro.totalReviews})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {pro.city && <span className="flex items-center gap-0.5"><MapPin size={11} />{pro.city}</span>}
                      {pro.completedJobs > 0 && <span><Shield size={11} className="inline mr-0.5" />{pro.completedJobs} trabajos</span>}
                      {pro.matchedService && <span className="text-primary-600 dark:text-primary-400 font-medium">desde {pro.matchedService.price}€</span>}
                    </div>

                    {/* Score bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Puntuación IA</span>
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-0.5">
                          <Zap size={10} />{pro.score}/80
                        </span>
                      </div>
                      <ScoreBar value={pro.score} />
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
