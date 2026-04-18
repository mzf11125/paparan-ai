'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FilePlus, Archive, Settings } from 'lucide-react'

const navItems = [
  { href: '/app', label: 'Dashboard', icon: Home },
  { href: '/app/create', label: 'Create Paparan', icon: FilePlus },
  { href: '/app/archive', label: 'Archive', icon: Archive },
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-paparan-deep/10 bg-paparan-cream">
      <div className="flex h-16 items-center border-b border-paparan-deep/10 px-6">
        <Link href="/" className="font-serif text-lg font-semibold text-paparan-deep">
          Paparan.ai
        </Link>
      </div>

      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-paparan-deep text-paparan-cream'
                      : 'text-paparan-ink hover:bg-paparan-deep/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
