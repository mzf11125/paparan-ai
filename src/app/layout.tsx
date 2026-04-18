import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './styles/globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Paparan.ai — Strategic Briefs for Policymakers',
  description: 'AI-powered policy intelligence system transforming fragmented information into structured, decision-ready briefs for policymakers in ASEAN.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
