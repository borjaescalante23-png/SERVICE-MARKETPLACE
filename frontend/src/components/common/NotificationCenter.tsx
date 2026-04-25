import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { AppNotification } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

const PRIORITY_DOT: Record<string, string> = {
  HIGH:   'bg-red-500',
  MEDIUM: 'bg-amber-400',
  LOW:    'bg-gray-300 dark:bg-gray-600',
};

const TYPE_ICONS: Record<string, string> = {
  NEW_MESSAGE: '💬',
  BOOKING_CREATED: '📋',
  BOOKING_ACCEPTED: '✅',
  BOOKING_COMPLETED: '🎉',
  BOOKING_CANCELLED: '❌',
  PAYMENT_HELD: '🔒',
  PAYMENT_RELEASED: '💰',
  PAYMENT_REFUNDED: '↩️',
  VERIFICATION_APPROVED: '✅',
  VERIFICATION_REJECTED: '❌',
  LEVEL_UP: '🏅',
  DISPUTE_OPENED: '⚠️',
  PROVIDER_MARKED_COMPLETE: '🏁',
  CLIENT_CONFIRMED: '👍',
  DISPUTE_RESOLVED: '✔️',
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { t } = useI18n();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ page: 1 }).then(r => r.data),
    refetchInterval: 15000,
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications: AppNotification[] = data?.notifications || [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markAllRead() {
    await notificationsApi.markAllRead();
    qc.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{t('notif.title')}</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <CheckCheck size={12} />
                  {t('notif.mark_all')}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                {t('notif.empty')}
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-default ${
                  !n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <span className="text-lg mt-0.5 block">{TYPE_ICONS[n.type] || '🔔'}</span>
                  {n.priority && n.priority !== 'LOW' && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${PRIORITY_DOT[n.priority] || PRIORITY_DOT.MEDIUM}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${n.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="flex-shrink-0 text-primary-400 hover:text-primary-600 mt-0.5"
                    title={t('notif.mark_read')}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
            <Link
              to="/settings?tab=notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('notif.manage')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
