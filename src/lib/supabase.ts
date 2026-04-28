import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// Enhanced Supabase client configuration with security best practices
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage for better UX
    persistSession: true,
    // Automatically refresh token before expiry
    autoRefreshToken: true,
    // Detect session in URL (for magic links, OAuth)
    detectSessionInUrl: true,
    // Use localStorage for session storage (more secure than cookies for client-side)
    storage: window.localStorage,
    // Use PKCE flow for better security (Proof Key for Code Exchange)
    // This prevents authorization code interception attacks
    flowType: 'pkce',
    // Session storage key prefix
    storageKey: 'paparan-ai-auth-token'
  },
  global: {
    // Add client info for debugging and monitoring
    headers: {
      'X-Client-Info': 'paparan-ai-web',
      'X-Client-Version': '1.0.0'
    }
  },
  db: {
    // Use public schema by default
    schema: 'public'
  },
  // Enable realtime for subscribed tables
  realtime: {
    // Enable realtime for specific tables (configure in Supabase dashboard)
    params: {
      eventsPerSecond: 10
    }
  }
})

/**
 * Subscribe with automatic retry logic for flaky connections
 * Handles subscription failures and reconnection attempts
 */
export interface SubscriptionOptions {
  channel: string
  table: string
  filter?: string
  eventType?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
}

export function subscribeWithRetry(options: SubscriptionOptions): {
  channel: RealtimeChannel
  unsubscribe: () => void
} {
  const {
    channel: channelName,
    table,
    filter,
    eventType = '*',
    callback,
    maxRetries = 3,
    retryDelay = 1000,
    onError
  } = options

  let retryCount = 0
  let currentChannel: RealtimeChannel | null = null
  let unsubscribeFn: (() => void) | null = null

  const subscribe = (): RealtimeChannel => {
    const channel = supabase
      .channel(`${channelName}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: eventType,
          schema: 'public',
          table: table,
          filter: filter
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_BAD' || status === 'TIMED_OUT') {
          const error = new Error(`Subscription failed with status: ${status}`)
          onError?.(error)

          if (retryCount < maxRetries) {
            retryCount++
            // Exponential backoff
            const delay = retryDelay * Math.pow(2, retryCount - 1)
            setTimeout(() => {
              currentChannel = subscribe()
            }, delay)
          }
        } else if (status === 'SUBSCRIBED') {
          // Reset retry count on successful subscription
          retryCount = 0
        }
      })

    return channel
  }

  currentChannel = subscribe()

  return {
    channel: currentChannel,
    unsubscribe: () => {
      currentChannel?.unsubscribe()
    }
  }
}

/**
 * Check if user has a specific role
 * Uses the has_role function created in migration 006
 */
export async function hasRole(role: 'user' | 'analyst' | 'admin'): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', { required_role: role })
    if (error) return false
    return data ?? false
  } catch {
    return false
  }
}

/**
 * Get current user's role
 */
export async function getCurrentRole(): Promise<'user' | 'analyst' | 'admin'> {
  try {
    const { data, error } = await supabase.rpc('get_current_role')
    if (error) return 'user'
    return (data as 'user' | 'analyst' | 'admin') ?? 'user'
  } catch {
    return 'user'
  }
}

/**
 * Check if current user can access another user's data
 */
export async function canAccessUserData(targetUserId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    if (user.id === targetUserId) return true

    // Check if user has elevated role
    const role = await getCurrentRole()
    return role === 'analyst' || role === 'admin'
  } catch {
    return false
  }
}

/**
 * Log security event to audit log
 */
export async function logSecurityEvent(
  eventType: string,
  eventDetails: Record<string, any>
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_security_event', {
      event_type: eventType,
      event_details: eventDetails
    })
    if (error) return null
    return data as string
  } catch {
    return null
  }
}

/**
 * Validate email format using the database function
 */
export async function isValidEmail(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_valid_email', { email })
    if (error) return false
    return data ?? false
  } catch {
    return false
  }
}

/**
 * Validate URL format using the database function
 */
export async function isValidUrl(url: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_valid_url', { url })
    if (error) return false
    return data ?? false
  } catch {
    return false
  }
}

/**
 * Run a quick health check on the database
 */
export async function healthCheck(): Promise<{
  status: string
  connected: boolean
  authenticated: boolean
}> {
  try {
    const { data, error } = await supabase.rpc('quick_check')
    if (error) {
      return { status: 'error', connected: false, authenticated: false }
    }

    const check = data as any
    const { data: { session } } = await supabase.auth.getSession()

    return {
      status: check?.status ?? 'unknown',
      connected: check?.database === 'connected',
      authenticated: !!session
    }
  } catch {
    return { status: 'error', connected: false, authenticated: false }
  }
}

/**
 * Get database health status (requires admin role)
 */
export async function getDatabaseHealth(): Promise<any | null> {
  try {
    // Check if user has admin role first
    const isAdmin = await hasRole('admin')
    if (!isAdmin) {
      return null
    }

    const { data, error } = await supabase.rpc('database_health')
    if (error) return null
    return data
  } catch {
    return null
  }
}

/**
 * Sanitize HTML input using the database function
 */
export async function sanitizeHtml(html: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc('sanitize_html', { html })
    if (error) return html
    return (data as string) ?? html
  } catch {
    return html
  }
}

/**
 * Log query performance for monitoring
 */
export async function logQueryPerformance(
  queryName: string,
  tableName: string,
  executionMs: number,
  rowCount = 0
): Promise<void> {
  try {
    await supabase.rpc('log_query', {
      query_name_param: queryName,
      table_name_param: tableName,
      execution_ms_param: executionMs,
      row_count_param: rowCount
    })
  } catch {
    // Silently fail for logging
  }
}

/**
 * Log error for tracking
 */
export async function logError(
  errorCode: string,
  errorMessage: string,
  errorCategory: string = 'SYSTEM',
  tableName?: string,
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical' = 'error'
): Promise<void> {
  try {
    await supabase.rpc('log_error', {
      error_code_param: errorCode,
      error_message_param: errorMessage,
      error_category_param: errorCategory,
      table_name_param: tableName,
      severity_param: severity
    })
  } catch {
    // Silently fail for logging
  }
}

// Export a singleton instance for convenience
export default supabase

// Type definitions for common database tables
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string | null
          tracked_topics: any[] | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          tracked_topics?: any[] | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          tracked_topics?: any[] | null
          created_at?: string
        }
      }
      paparan_reports: {
        Row: {
          id: string
          user_id: string
          topic: string
          region: string
          report_type: string
          content: any
          delta_summary: any | null
          previous_report_id: string | null
          urgency_score: number | null
          source_count: number | null
          confidence_score: string | null
          rpjmn_alignment: any | null
          diplomat_meta: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          region?: string
          report_type?: string
          content: any
          delta_summary?: any | null
          previous_report_id?: string | null
          urgency_score?: number | null
          source_count?: number | null
          confidence_score?: string | null
          rpjmn_alignment?: any | null
          diplomat_meta?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          region?: string
          report_type?: string
          content?: any
          delta_summary?: any | null
          previous_report_id?: string | null
          urgency_score?: number | null
          source_count?: number | null
          confidence_score?: string | null
          rpjmn_alignment?: any | null
          diplomat_meta?: any | null
          created_at?: string
        }
      }
      // Add other table types as needed
    }
  }
}
