import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock auth for development when env vars are not set
const isMock = !import.meta.env.VITE_SUPABASE_URL

if (isMock) {
  console.warn('⚠️ Using mock Supabase client - set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file')
}
