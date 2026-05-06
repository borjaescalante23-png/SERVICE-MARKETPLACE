import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { opportunityRequestsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORY_LABELS, ServiceCategory } from '../types';
import { SERVICE_GROUPS } from '../config/categories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, X, Send, ChevronDown, ChevronUp, Users, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_CATEGORY_IDS = SERVICE_GROUPS.flatMap(g => g.categories).map(c => c.id);

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN:      { label: 'Abierto',    cls: 'bg-green-50 text-green-700 border-green-200' },
    CLOSED:    { label: 'Cerrado',    cls: 'bg-gray-50 text-gray-500 border-gray-200' },
    CANCELLED: { label: 'Cancelado',  cls: 'bg-red-50 text-red-600 border-red-200' },
    PENDING:   { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    ACCEPTED:  { label: 'Aceptado',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    REJECTED:  { label: 'Rechazado',  cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-50 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function CreateRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    category: '', title: '', description: '',
    preferredDate: '', maxBudget: '', address: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.title || !form.description) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      await opportunityRequestsApi.create({
        category: form.category,
        title: form.title,
        description: form.description,
        preferredDate: form.preferredDate || undefined,
        maxBudget: form.maxBudget ? parseFloat(form.maxBudget) : undefined,
        address: form.address || undefined,
      });
      toast.success('Solicitud publicada');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al crear la solicitud');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva solicitud</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría *</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Selecciona una categoría</option>
              {SERVICE_GROUPS.map(g => (
                <optgroup key={g.id} label={g.label}>
                  {g.categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              placeholder="Ej: Necesito fontanero urgente"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              required
              rows={4}
              placeholder="Describe el trabajo que necesitas con detalle..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha preferida</label>
              <input
                type="date"
                value={form.preferredDate}
                onChange={e => setForm(p => ({ ...p, preferredDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Presupuesto máx. (€)</label>
              <input
                type="number"
                min={0}
                value={form.maxBudget}
                onChange={e => setForm(p => ({ ...p, maxBudget: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dirección (opcional)</label>
            <input
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              placeholder="Calle, ciudad..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A1628] rounded-xl hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Publicando...' : 'Publicar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplyModal({ requestId, onClose, onApplied }: { requestId: string; onClose: () => void; onApplied: () => void }) {
  const [form, setForm] = useState({ proposedPrice: '', message: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await opportunityRequestsApi.apply(requestId, {
        proposedPrice: parseFloat(form.proposedPrice),
        message: form.message,
      });
      toast.success('Propuesta enviada');
      onApplied();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al enviar la propuesta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enviar propuesta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Precio propuesto (€)</label>
            <input
              type="number"
              min={1}
              required
              value={form.proposedPrice}
              onChange={e => setForm(p => ({ ...p, proposedPrice: e.target.value }))}
              placeholder="50"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mensaje</label>
            <textarea
              required
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              rows={4}
              placeholder="Explica por qué eres el profesional ideal para este trabajo..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A1628] rounded-xl hover:bg-[#2563EB] disabled:opacity-50 transition-colors">
              <Send size={14} />
              {loading ? '...' : 'Enviar propuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestCard({ req, isClient, isProvider, onRefresh }: {
  req: any; isClient: boolean; isProvider: boolean; onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [acceptingApp, setAcceptingApp] = useState<string | null>(null);
  const qc = useQueryClient();

  async function handleAccept(appId: string) {
    setAcceptingApp(appId);
    try {
      await opportunityRequestsApi.acceptApplication(req.id, appId);
      toast.success('Propuesta aceptada. La solicitud está cerrada.');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error');
    } finally {
      setAcceptingApp(null);
    }
  }

  async function handleCancel() {
    try {
      await opportunityRequestsApi.cancel(req.id);
      toast.success('Solicitud cancelada');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error');
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusPill status={req.status} />
              <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700">
                {CATEGORY_LABELS[req.category as ServiceCategory] ?? req.category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{req.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{req.description}</p>
          </div>
          <button onClick={() => setExpanded(p => !p)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 mt-1">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
          {req.maxBudget && <span>Hasta {req.maxBudget}€</span>}
          {req.preferredDate && (
            <span>{format(new Date(req.preferredDate), "d MMM yyyy", { locale: es })}</span>
          )}
          <span className="flex items-center gap-1">
            <Users size={10} />
            {req._count?.applications ?? req.applications?.length ?? 0} propuestas
          </span>
          <span className="ml-auto">{format(new Date(req.createdAt), "d MMM", { locale: es })}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-5 space-y-4">
          {req.address && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {req.address}
            </p>
          )}

          {/* Applications list (visible to client) */}
          {isClient && req.applications && req.applications.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Propuestas recibidas</p>
              <div className="space-y-2">
                {req.applications.map((app: any) => (
                  <div key={app.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{app.proposedPrice}€</span>
                        <StatusPill status={app.status} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{app.message}</p>
                    </div>
                    {req.status === 'OPEN' && app.status === 'PENDING' && (
                      <button
                        onClick={() => handleAccept(app.id)}
                        disabled={acceptingApp === app.id}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {acceptingApp === app.id ? '...' : 'Aceptar'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider actions */}
          {isProvider && req.status === 'OPEN' && (
            <button
              onClick={() => setApplyModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A1628] rounded-xl hover:bg-[#2563EB] transition-colors"
            >
              <Send size={14} />
              Enviar propuesta
            </button>
          )}

          {/* Client cancel */}
          {isClient && req.status === 'OPEN' && (
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Cancelar solicitud
            </button>
          )}
        </div>
      )}

      {applyModal && (
        <ApplyModal
          requestId={req.id}
          onClose={() => setApplyModal(false)}
          onApplied={onRefresh}
        />
      )}
    </div>
  );
}

export default function OpportunityRequests() {
  const { user } = useAuth();
  const [createModal, setCreateModal] = useState(false);
  const [view, setView] = useState<'all' | 'mine'>('all');

  const isClient = !user?.isProvider || view === 'mine';
  const isProvider = !!user?.isProvider;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['opportunity-requests', view],
    queryFn: () => opportunityRequestsApi.list().then(r => r.data),
    enabled: !!user,
  });

  const requests = data?.data ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#0A1628] dark:text-[#F8FAFF]">Solicitudes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isProvider ? 'Encuentra trabajos que se ajusten a tus servicios' : 'Tus solicitudes de servicio'}
          </p>
        </div>
        {!user?.isProvider && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A1628] rounded-xl hover:bg-[#2563EB] transition-colors"
          >
            <Plus size={16} />
            Nueva
          </button>
        )}
      </div>

      {/* View toggle for providers who are also clients */}
      {user?.isProvider && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setView('all')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${
              view === 'all' ? 'bg-[#0A1628] text-white border-[#0A1628]' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Briefcase size={14} className="inline mr-1.5" />
            Buscar trabajos
          </button>
          <button
            onClick={() => setView('mine')}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl border transition-all ${
              view === 'mine' ? 'bg-[#0A1628] text-white border-[#0A1628]' : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700'
            }`}
          >
            <Users size={14} className="inline mr-1.5" />
            Mis solicitudes
          </button>
        </div>
      )}

      {/* Create button for providers in client mode */}
      {user?.isProvider && view === 'mine' && (
        <button
          onClick={() => setCreateModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 text-sm font-semibold text-white bg-[#0A1628] rounded-xl hover:bg-[#2563EB] transition-colors"
        >
          <Plus size={16} />
          Crear nueva solicitud
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay solicitudes disponibles</p>
          {!user?.isProvider && (
            <button
              onClick={() => setCreateModal(true)}
              className="mt-4 px-5 py-2 text-sm font-semibold text-white bg-[#0A1628] rounded-xl hover:bg-[#2563EB] transition-colors"
            >
              Crear la primera
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <RequestCard
              key={req.id}
              req={req}
              isClient={view === 'mine' || !user?.isProvider}
              isProvider={isProvider && view === 'all'}
              onRefresh={() => refetch()}
            />
          ))}
        </div>
      )}

      {createModal && (
        <CreateRequestModal
          onClose={() => setCreateModal(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}
