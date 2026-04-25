import { type JSX } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi } from '../services/api';
import { TrendingUp, AlertCircle, DollarSign, MapPin, Star, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TYPE_CONFIG: Record<string, { icon: JSX.Element; color: string; bg: string }> = {
  DEMAND_SPIKE:      { icon: <TrendingUp size={18} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  LOW_COMPETITION:   { icon: <Star size={18} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  PRICE_OPPORTUNITY: { icon: <DollarSign size={18} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  NEW_ZONE:          { icon: <MapPin size={18} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
  SERVICE_WANTED:    { icon: <AlertCircle size={18} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
};

export default function Opportunities() {
  const qc = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesApi.list().then(r => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => opportunitiesApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const unread = (opportunities as any[]).filter((o: any) => !o.isRead);
  const read = (opportunities as any[]).filter((o: any) => o.isRead);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Oportunidades</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Alertas inteligentes para hacer crecer tu negocio</p>
        </div>
        {unread.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1">
            {unread.length} nueva{unread.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {(opportunities as any[]).length === 0 && (
        <div className="text-center py-16">
          <CheckCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay oportunidades disponibles ahora mismo.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">El agente de IA analizará el mercado y te avisará cuando detecte algo relevante.</p>
        </div>
      )}

      {unread.length > 0 && (
        <div className="space-y-3 mb-6">
          {unread.map((op: any) => {
            const cfg = TYPE_CONFIG[op.type] || TYPE_CONFIG.SERVICE_WANTED;
            return (
              <div key={op.id} className={`rounded-2xl border p-5 ${cfg.bg}`}>
                <div className="flex items-start gap-3">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${cfg.color}`}>{op.title}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{op.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(op.createdAt), "d MMM, HH:mm", { locale: es })}
                      {op.expiresAt && ` · Expira ${format(new Date(op.expiresAt), "d MMM", { locale: es })}`}
                    </p>
                  </div>
                  <button
                    onClick={() => markRead.mutate(op.id)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 px-2 py-1 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    Marcar leída
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {read.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Anteriores</p>
          {read.map((op: any) => {
            const cfg = TYPE_CONFIG[op.type] || TYPE_CONFIG.SERVICE_WANTED;
            return (
              <div key={op.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 opacity-60">
                <div className="flex items-start gap-3">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">{op.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{op.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
