import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, Trash2, Inbox, AlertTriangle, Bookmark, ShieldAlert, Settings as SettingsIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAppStore, type Notification, type NotificationKind } from '@/contexts/AppContext'
import { usePageMeta } from '@/hooks/usePageMeta'
import { cn } from '@/utils/cn'

const KIND_META: Record<NotificationKind, { icon: LucideIcon; tone: string; borderTone: string; label: string }> = {
  alert:          { icon: AlertTriangle, tone: 'text-warning bg-warning/10 border-warning/25',           borderTone: 'border-l-warning',  label: 'Alert' },
  watchlist:      { icon: Bookmark,      tone: 'text-gold bg-gold/10 border-gold/25',                    borderTone: 'border-l-gold',     label: 'Watchlist' },
  classification: { icon: ShieldAlert,   tone: 'text-error bg-error/10 border-error/25',                 borderTone: 'border-l-error',    label: 'Classification' },
  system:         { icon: SettingsIcon,  tone: 'text-text-secondary bg-bg-subtle border-border',         borderTone: 'border-l-accent',   label: 'System' },
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1)   return 'just now'
  if (min < 60)  return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24)   return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 7)   return `${day}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function NotificationsPage() {
  usePageMeta({ title: 'Inbox', description: 'Saved-search alerts and watchlist updates.' })
  const notifications        = useAppStore(s => s.notifications)
  const markRead             = useAppStore(s => s.markNotificationRead)
  const markAllRead          = useAppStore(s => s.markAllNotificationsRead)
  const removeNotification   = useAppStore(s => s.removeNotification)
  const clearAll             = useAppStore(s => s.clearAllNotifications)
  const addNotification      = useAppStore(s => s.addNotification)

  const [filter, setFilter] = useState<'all' | 'unread' | NotificationKind>('all')

  const visible = useMemo(() => {
    if (filter === 'all')    return notifications
    if (filter === 'unread') return notifications.filter(n => !n.read)
    return notifications.filter(n => n.kind === filter)
  }, [notifications, filter])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const seedDemo = () => {
    addNotification({ kind: 'alert',          title: 'Daily ASEAN trade brief ready',           body: '12 new developments across Indonesia, Malaysia, Singapore.', briefId: 'demo-1' })
    addNotification({ kind: 'watchlist',      title: 'Watched brief updated',                   body: 'OJK digital banking framework — escalated to HIGH impact.',   briefId: 'demo-2' })
    addNotification({ kind: 'classification', title: 'Confidential brief requires review',      body: 'New CONFIDENTIAL brief in your queue: Vietnam currency outlook.', briefId: 'demo-3' })
    addNotification({ kind: 'system',         title: 'Saved search created',                    body: '“ASEAN digital trade — weekly” will fire every Monday 06:00 WIB.' })
  }

  return (
    <div className="px-4 lg:px-8 py-10 max-w-3xl mx-auto">
      {/* Masthead */}
      <header className="mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-text-tertiary" />
          <p className="editorial-eyebrow text-text-muted">My Work</p>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-text text-balance text-4xl lg:text-5xl leading-tight mb-2">
              Inbox
            </h1>
            <p className="text-text-secondary text-base font-serif">
              Saved-search alerts, watchlist updates, and classification escalations.
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-ui border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-ui border border-border text-text-tertiary hover:text-error hover:border-error/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <FilterPill label="All"            active={filter === 'all'}            onClick={() => setFilter('all')}            count={notifications.length} />
        <FilterPill label="Unread"         active={filter === 'unread'}         onClick={() => setFilter('unread')}         count={unreadCount} />
        <FilterPill label="Alerts"         active={filter === 'alert'}          onClick={() => setFilter('alert')} />
        <FilterPill label="Watchlist"      active={filter === 'watchlist'}      onClick={() => setFilter('watchlist')} />
        <FilterPill label="Classification" active={filter === 'classification'} onClick={() => setFilter('classification')} />
        <FilterPill label="System"         active={filter === 'system'}         onClick={() => setFilter('system')} />
      </div>

      {/* List / empty state */}
      {notifications.length === 0 ? (
        <EmptyState onSeed={seedDemo} />
      ) : visible.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="font-display text-text font-semibold mb-1">Nothing here yet.</p>
          <p className="text-sm text-text-tertiary font-ui">Try a different filter.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map(n => (
            <NotificationRow
              key={n.id}
              notification={n}
              onRead={() => markRead(n.id)}
              onRemove={() => removeNotification(n.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterPill({ label, active, count, onClick }: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-ui border transition-colors',
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-bg-elevated text-text-secondary border-border hover:border-border-strong hover:text-text'
      )}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          'px-1.5 rounded-full text-[10px] tabular-nums',
          active ? 'bg-white/20' : 'bg-bg-subtle text-text-tertiary'
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

function NotificationRow({ notification, onRead, onRemove }: {
  notification: Notification
  onRead: () => void
  onRemove: () => void
}) {
  const meta = KIND_META[notification.kind]
  const Inner = (
    <article className={cn(
      'group relative flex items-start gap-3 p-4 rounded-xl border-l-4 border border-l-0 card-lift transition-all',
      meta.borderTone,
      notification.read
        ? 'bg-bg-elevated border-border'
        : 'bg-primary/5 border-primary/15 hover:border-primary/25'
    )}>
      {/* Unread dot — glows to signal unread state */}
      {!notification.read && (
        <span className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full bg-primary animate-glow-pulse" aria-hidden="true" />
      )}

      <div className={cn('flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border', meta.tone)}>
        <meta.icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <p className={cn('text-sm font-ui leading-snug', notification.read ? 'text-text-secondary' : 'font-semibold text-text')}>
            {notification.title}
          </p>
          <span className="flex-shrink-0 text-[11px] text-text-tertiary font-mono tabular-nums">
            {relativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.body && (
          <p className="text-xs text-text-tertiary font-ui mt-1 leading-relaxed">{notification.body}</p>
        )}
        <p className="mt-2 text-[10px] uppercase tracking-widest font-ui text-text-muted">{meta.label}</p>
      </div>

      <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead() }}
            className="p-1.5 rounded text-text-tertiary hover:text-success hover:bg-success/10 transition-colors"
            aria-label="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
          className="p-1.5 rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors"
          aria-label="Dismiss"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  )

  if (notification.briefId) {
    return (
      <li>
        <Link
          to={`/briefs/${notification.briefId}`}
          onClick={() => !notification.read && onRead()}
          className="block"
        >
          {Inner}
        </Link>
      </li>
    )
  }

  return <li onClick={() => !notification.read && onRead()}>{Inner}</li>
}

function EmptyState({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="text-center py-20 px-4 border border-dashed border-border rounded-xl">
      <div className="inline-flex w-12 h-12 mb-4 rounded-2xl bg-bg-subtle border border-border items-center justify-center">
        <Inbox className="w-5 h-5 text-text-tertiary" />
      </div>
      <h2 className="font-display font-semibold text-text mb-1">Inbox zero</h2>
      <p className="text-sm text-text-tertiary font-ui mb-6 max-w-sm mx-auto">
        New alerts, watchlist updates, and classification escalations will land here.
      </p>
      <button
        onClick={onSeed}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold font-ui border border-border text-text-secondary hover:text-text hover:border-border-strong transition-colors"
      >
        <Bell className="w-3.5 h-3.5" />
        Seed demo notifications
      </button>
    </div>
  )
}
