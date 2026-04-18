'use client'

import React from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { FileText, LogOut } from 'lucide-react'
import { Button } from '../ui/Button'

interface HeaderProps {
  user?: {
    email?: string
  } | null
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const handleSignOut = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-paparan-deep/10 bg-paparan-cream/95 backdrop-blur supports-[backdrop-filter]:bg-paparan-cream/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-paparan-deep" />
          <span className="font-serif text-xl font-semibold text-paparan-deep">
            Paparan.ai
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-paparan-slate hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-sm text-paparan-deep hover:text-paparan-sage transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-paparan-deep hover:text-paparan-sage transition-colors"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
