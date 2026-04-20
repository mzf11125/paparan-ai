// Format date to readable string
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Format date with time
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get relative time (e.g., "2 days ago")
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Capitalize first letter
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Convert text to title case
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

// Get delta type color class
export function getDeltaTypeColor(deltaType: string): string {
  const colors = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    UPDATED: 'bg-amber-100 text-amber-800 border-amber-200',
    ESCALATED: 'bg-red-100 text-red-800 border-red-200',
    'DE-ESCALATED': 'bg-green-100 text-green-800 border-green-200'
  }
  return colors[deltaType as keyof typeof colors] || colors.NEW
}

// Get impact level color class
export function getImpactColor(impact: string): string {
  const colors = {
    HIGH: 'bg-red-50 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-gray-50 text-gray-700 border-gray-200'
  }
  return colors[impact as keyof typeof colors] || colors.LOW
}

// Get confidence level color class
export function getConfidenceColor(confidence: string): string {
  const colors = {
    HIGH: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-red-100 text-red-700'
  }
  return colors[confidence as keyof typeof colors] || colors.MEDIUM
}

// Get source type color class
export function getSourceTypeColor(sourceType: string): string {
  const colors = {
    government: 'bg-blue-100 text-blue-700',
    news: 'bg-amber-100 text-amber-700',
    research: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700'
  }
  return colors[sourceType as keyof typeof colors] || colors.other
}

// Class names utility for conditional classes
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
