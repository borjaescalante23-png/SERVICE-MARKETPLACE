import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { CATEGORY_LABELS } from '../../types';
import Badge from '../../components/common/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Shield, Users, AlertTriangle, CheckCircle, XCircle, BarChart3, Eye } from 'lucide-react';
import { useI18n } from '../../i18n';
import toast from 'react-hot-toast';

type Tab = 'stats' | 'pending' | 'disputes' | 'fraud';

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [expandedPro, setExpandedPro] = useState<string | null>(null);

  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.stats().then(r => r.data) });
  const { data: pending = [] } = useQuery({ queryKey: ['pending-pros'], queryFn: () => adminApi.pendingProfessionals().then(r => r.data) });
  const { data: disputes = [] } = useQuery({ queryKey: ['disputes'], queryFn: () => adminApi.disputes().then(r => r.data) });
  const { data: fraudEvents = [] } = useQuery({ queryKey: ['fraud-events'], queryFn: () => adminApi.fraudEvents().then(r => r.data) });

  async function approve(id: string) {
    try {
      await adminApi.approveProfessional(id);
      toast.success(t('admin.approved_toast'));
      qc.invalidateQueries({ queryKey: ['pending-pros'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (err: any) { toast.error(err?.response?.data?.error || t('common.error')); }
  }

  async function reject(id: string) {
    const reason = prompt(t('admin.reject_prompt'));
    if (!reason) return;
    try {
      await adminApi.rejectProfessional(id, reason);
      toast.success(t('admin.rejected_toast'));
      qc.invalidateQueries({ queryKey: ['pending-pros'] });
    } catch { toast.error(t('common.error')); }
  }

  async function resolveDispute(id: string, refundClient: boolean) {
    const resolution = prompt(t('admin.resolve_prompt'));
    if (!resolution) return;
    try {
      await adminApi.resolveDispute(id, { resolution, refundClient });
      toast.success(t('admin.dispute_resolved_toast'));
      qc.invalidateQueries({ queryKey: ['disputes'] });
    } catch { toast.error(t('common.error')); }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'stats', label: t('admin.tab_stats') },
    { id: 'pending', label: t('admin.tab_pending'), count: (pending as any[]).length },
    { id: 'disputes', label: t('admin.tab_disputes'), count: (disputes as any[]).length },
    { id: 'fraud', label: t('admin.tab_fraud') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('admin.stat_users'), value: stats.totalUsers, icon: <Users size={20} className="text-blue-500" /> },
            { label: t('admin.stat_approved'), value: stats.totalProfessionals, icon: <CheckCircle size={20} className="text-green-500" /> },
            { label: t('admin.stat_pending'), value: stats.pendingVerifications, icon: <Shield size={20} className="text-amber-500" /> },
            { label: t('admin.stat_bookings'), value: stats.totalBookings, icon: <BarChart3 size={20} className="text-primary-500" /> },
            { label: t('admin.stat_completed'), value: stats.completedBookings, icon: <CheckCircle size={20} className="text-green-500" /> },
            { label: t('admin.stat_disputes'), value: stats.openDisputes, icon: <AlertTriangle size={20} className="text-red-500" /> },
            { label: t('admin.stat_fraud'), value: stats.fraudEventsLast24h, icon: <Shield size={20} className="text-red-500" /> },
            { label: t('admin.stat_revenue'), value: `${stats.platformRevenue?.toFixed(2)}€`, icon: <BarChart3 size={20} className="text-primary-500" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">{stat.icon}</div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {(pending as any[]).length === 0 && <p className="text-gray-400 text-center py-10">{t('admin.no_pending')}</p>}
          {(pending as any[]).map((pro: any) => (
            <div key={pro.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setExpandedPro(expandedPro === pro.id ? null : pro.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{pro.user.firstName} {pro.user.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{pro.user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('admin.registered')} {format(new Date(pro.user.createdAt), "d MMM yyyy", { locale: es })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={pro.verificationStatus === 'PENDING' ? 'Pendiente' : 'En revisión'} color={pro.verificationStatus === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'} />
                    <Eye size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {expandedPro === pro.id && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-5 space-y-4 bg-gray-50 dark:bg-gray-800">
                  {/* Documents */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('admin.documents')} ({pro.documents?.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {pro.documents?.map((doc: any) => (
                        <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:border-primary-300 transition-colors">
                          {doc.type.replace('_', ' ')} · {doc.originalName}
                        </a>
                      ))}
                      {pro.documents?.length === 0 && <p className="text-xs text-red-500">{t('admin.no_documents')}</p>}
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      {t('admin.experience')} ({pro.experienceEntries?.length}{t('admin.experience_required')})
                    </h4>
                    <div className="space-y-2">
                      {pro.experienceEntries?.map((entry: any) => (
                        <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{entry.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{entry.description}</p>
                          {entry.images?.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {entry.images.map((img: any) => (
                                <img key={img.id} src={img.fileUrl} alt="" className="h-12 w-16 object-cover rounded-lg" />
                              ))}
                            </div>
                          )}
                          {entry.images?.length === 0 && <p className="text-xs text-red-500 mt-1">{t('admin.no_images')}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approve(pro.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={14} />
                      {t('admin.approve')}
                    </button>
                    <button
                      onClick={() => reject(pro.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
                    >
                      <XCircle size={14} />
                      {t('admin.reject')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="space-y-4">
          {(disputes as any[]).length === 0 && <p className="text-gray-400 text-center py-10">{t('admin.no_disputes')}</p>}
          {(disputes as any[]).map((d: any) => (
            <div key={d.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{d.booking.service?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('admin.client')}: {d.booking.client?.firstName} — {t('admin.professional')}: {d.booking.professional?.user?.firstName}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{d.booking.totalAmount}€</span>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl mb-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{d.reason}</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{d.description}</p>
                <p className="text-xs text-red-400 mt-1">{format(new Date(d.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</p>
              </div>
              {d.booking.escrow && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('admin.escrow')}: {d.booking.escrow.amount}€ ({d.booking.escrow.status})</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => resolveDispute(d.id, false)} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors">
                  {t('admin.release_to_pro')}
                </button>
                <button onClick={() => resolveDispute(d.id, true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                  {t('admin.refund_to_client')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'fraud' && (
        <div className="space-y-3">
          {(fraudEvents as any[]).length === 0 && <p className="text-gray-400 text-center py-10">{t('admin.no_fraud')}</p>}
          {(fraudEvents as any[]).map((ev: any) => (
            <div key={ev.id} className={`bg-white dark:bg-gray-900 rounded-xl border p-4 ${
              ev.severity === 'HIGH' ? 'border-red-200 dark:border-red-800' : ev.severity === 'MEDIUM' ? 'border-amber-200 dark:border-amber-800' : 'border-gray-100 dark:border-gray-800'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${
                    ev.severity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : ev.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>{ev.severity}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ev.eventType}</span>
                </div>
                <span className="text-xs text-gray-400">{format(new Date(ev.createdAt), "d MMM, HH:mm", { locale: es })}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{ev.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('admin.user')}: {ev.user?.firstName} {ev.user?.lastName} ({ev.user?.email})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
