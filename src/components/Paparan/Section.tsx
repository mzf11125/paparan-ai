import React from 'react'

interface SectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <section className={`bg-white rounded-card border border-paparan-deep/10 p-8 ${className}`}>
      <h2 className="font-serif text-2xl text-paparan-deep mb-4 pb-2 border-b border-paparan-deep/10">
        {title}
      </h2>
      {children}
    </section>
  )
}
