import { useState, useMemo } from 'react'
import { Clock, FileText, Edit, AlertTriangle, Filter, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, differenceInDays, isToday, isYesterday } from 'date-fns'
import { cn } from '@/utils/formatters'

interface Activity {
  id: string
  type: 'created' | 'updated' | 'escalated'
  briefId: string
  briefTitle: string
  timestamp: Date
  description?: string
  read?: boolean
}

type FilterType = 'all' | 'created' | 'updated' | 'escalated' | 'unread'

interface RecentActivityFeedProps {
  activities: Activity[]
  className?: string
  onMarkAsRead?: (activityId: string) => void
  onMarkAllAsRead?: () => void
  showFilters?: boolean
}

export function RecentActivityFeed({
  activities,
  className = '',
  onMarkAsRead,
  onMarkAllAsRead,
  showFilters = true,
}: RecentActivityFeedProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return <FileText className="w-4 h-4 text-green" />
      case 'updated':
        return <Edit className="w-4 h-4 text-blue" />
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-red" />
    }
  }

  const getActivityLabel = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return 'New brief created'
      case 'updated':
        return 'Brief updated'
      case 'escalated':
        return 'High impact development'
    }
  }

  // Group activities by time period
  const groupedActivities = useMemo(() => {
    let filtered = activities

    if (filter === 'unread') {
      filtered = activities.filter((a) => !a.read)
    } else if (filter !== 'all') {
      filtered = activities.filter((a) => a.type === filter)
    }

    const groups: Record<string, Activity[]> = {}

    filtered.forEach((activity) => {
      let group = 'Older'
      if (isToday(activity.timestamp)) {
        group = 'Today'
      } else if (isYesterday(activity.timestamp)) {
        group = 'Yesterday'
      } else if (differenceInDays(new Date(), activity.timestamp) <= 7) {
        group = 'This Week'
      }
      if (!groups[group]) groups[group] = []
      groups[group].push(activity)
    })

    return groups
  }, [activities, filter])

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older']
  const unreadCount = activities.filter((a) => !a.read).length

  const handleActivityClick = (activity: Activity) => {
    if (!activity.read && onMarkAsRead) {
      onMarkAsRead(activity.id)
    }
  }

  return (
    <div className={cn('bg-bg-elevated border border-border rounded-radius-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-text flex items-center gap-2">
          <Clock className="w-5 h-5 text-accent" />
          Recent Activity
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {unreadCount} new
            </span>
          )}
        </h3>
        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-accent hover:text-accent-dark transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-3 border-b border-border bg-bg-surface/50">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            <div className="flex gap-1">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterButton>
              <FilterButton active={filter === 'unread'} onClick={() => setFilter('unread')}>
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </FilterButton>
              <FilterButton active={filter === 'created'} onClick={() => setFilter('created')}>
                Created
              </FilterButton>
              <FilterButton active={filter === 'updated'} onClick={() => setFilter('updated')}>
                Updated
              </FilterButton>
              <FilterButton active={filter === 'escalated'} onClick={() => setFilter('escalated')}>
                Escalated
              </FilterButton>
            </div>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="divide-y divide-border">
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-text-tertiary">No recent activity</p>
          </div>
        ) : (
          groupOrder
            .filter((group) => groupedActivities[group])
            .map((group) => (
              <div key={group}>
                {/* Group Header */}
                <div className="px-6 py-2 bg-bg-surface/80 border-b border-border">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                    {group}
                  </span>
                </div>

                {/* Activities in group */}
                {groupedActivities[group].map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    onClick={() => handleActivityClick(activity)}
                    getActivityIcon={getActivityIcon}
                    getActivityLabel={getActivityLabel}
                  />
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  )
}

// Filter button component
interface FilterButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-radius-lg transition-colors whitespace-nowrap',
        active
          ? 'bg-primary text-white'
          : 'text-text-tertiary hover:text-text hover:bg-bg-surface'
      )}
    >
      {children}
    </button>
  )
}

// Activity item component
interface ActivityItemProps {
  activity: Activity
  onClick: () => void
  getActivityIcon: (type: Activity['type']) => React.ReactNode
  getActivityLabel: (type: Activity['type']) => string
}

function ActivityItem({ activity, onClick, getActivityIcon, getActivityLabel }: ActivityItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      className={cn(
        'px-6 py-4 transition-all duration-200 cursor-pointer group relative',
        'hover:bg-bg-surface',
        !activity.read && 'bg-primary-light/20 hover:bg-primary-light/30'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Unread indicator */}
      {!activity.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
      )}

      <div className="flex items-start gap-3 pl-2">
        <div className={cn(
          'p-2 rounded-lg flex-shrink-0 transition-colors',
          !activity.read ? 'bg-bg-elevated shadow-sm' : 'bg-bg-surface'
        )}>
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium transition-colors',
            !activity.read ? 'text-text' : 'text-text-secondary'
          )}>
            {getActivityLabel(activity.type)}
          </p>
          <Link
            to={`/briefs/${activity.briefId}`}
            className="text-sm text-text-secondary hover:text-accent transition-colors line-clamp-1"
            onClick={(e) => e.stopPropagation()}
          >
            {activity.briefTitle}
          </Link>
          {activity.description && (
            <p className="text-sm text-text-tertiary mt-1 line-clamp-2">
              {activity.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-text-tertiary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
            </p>
            {!activity.read && (
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded">
                New
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          showActions ? 'opacity-100' : 'opacity-0'
        )}>
          <button
            className="p-1.5 hover:bg-bg-surface rounded transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact activity feed for dashboards
interface CompactActivityFeedProps {
  activities: Activity[]
  maxItems?: number
  className?: string
}

export function CompactActivityFeed({
  activities,
  maxItems = 5,
  className = '',
}: CompactActivityFeedProps) {
  const recentActivities = activities.slice(0, maxItems)

  return (
    <div className={cn('space-y-3', className)}>
      {recentActivities.map((activity) => (
        <CompactActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

function CompactActivityItem({ activity }: { activity: Activity }) {
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'created':
        return 'bg-green'
      case 'updated':
        return 'bg-blue'
      case 'escalated':
        return 'bg-red'
    }
  }

  return (
    <div className="flex items-start gap-3 group">
      <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', getActivityColor(activity.type))} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text line-clamp-1 group-hover:text-accent transition-colors">
          <Link to={`/briefs/${activity.briefId}`} className="hover:underline">
            {activity.briefTitle}
          </Link>
        </p>
        <p className="text-xs text-text-tertiary">
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
