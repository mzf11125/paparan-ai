'use client'

import React from 'react'
import { type Paparan } from '@/lib/schema'
import { DeltaLabel } from '../ui/DeltaLabel'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Download, Share2 } from 'lucide-react'
import { Section } from './Section'

interface PaparanDisplayProps {
  paparan: Paparan
  topic: string
  region: string
  createdAt: Date
}

export const PaparanDisplay: React.FC<PaparanDisplayProps> = ({
  paparan,
  topic,
  region,
  createdAt,
}) => {
  const handleExportPDF = async () => {
    // PDF export will be implemented in Phase 8
    alert('PDF export coming soon')
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Paparan: ${topic}`,
        text: `Policy intelligence brief on ${topic}`,
      })
    }
  }

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-paparan-deep">
            {topic}
          </h1>
          <p className="text-paparan-slate mt-1">
            {region} • {createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Section title="Executive Summary">
        <ul className="space-y-3">
          {paparan.executiveSummary.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-paparan-amber font-bold">•</span>
              <span className="text-paparan-ink leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Current Situation */}
      <Section title="Current Situation">
        <p className="text-paparan-ink leading-relaxed whitespace-pre-line">
          {paparan.currentSituation}
        </p>
      </Section>

      {/* Key Developments */}
      <Section title="Key Developments">
        <div className="space-y-4">
          {paparan.keyDevelopments.map((dev, i) => (
            <Card key={i} variant="bordered" className="p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <DeltaLabel
                  deltaType={dev.deltaType}
                  impactLevel={dev.impactLevel}
                />
              </div>
              <p className="text-paparan-ink leading-relaxed">
                {dev.description}
              </p>
              {dev.entities && dev.entities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {dev.entities.map((entity, j) => (
                    <span
                      key={j}
                      className="inline-flex px-2 py-0.5 text-xs font-medium bg-paparan-deep/5 text-paparan-deep rounded"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* Strategic Implications */}
      <Section title="Strategic Implications">
        <p className="text-paparan-ink leading-relaxed whitespace-pre-line">
          {paparan.strategicImplications}
        </p>
      </Section>

      {/* Risks and Opportunities */}
      <Section title="Risks and Opportunities">
        <div className="grid md:grid-cols-2 gap-4">
          {paparan.risksAndOpportunities.map((item, i) => {
            const isRisk = item.type === 'RISK'
            return (
              <Card
                key={i}
                variant={isRisk ? 'default' : 'bordered'}
                className={`p-4 ${isRisk ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    isRisk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.type}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    item.severity === 'HIGH'
                      ? 'bg-red-50 text-red-600'
                      : item.severity === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    {item.severity}
                  </span>
                </div>
                <p className="text-sm text-paparan-ink">{item.description}</p>
              </Card>
            )
          })}
        </div>
      </Section>

      {/* Recommended Actions */}
      <Section title="Recommended Actions">
        <ol className="space-y-3">
          {paparan.recommendedActions.map((action, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-paparan-deep text-paparan-cream text-sm font-semibold rounded-full">
                {i + 1}
              </span>
              <span className="text-paparan-ink leading-relaxed">{action}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Sources */}
      <Section title="Sources">
        <div className="space-y-3">
          {paparan.sources.map((source, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-paparan-slate">[{i + 1}]</span>
              <div className="flex-1">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-paparan-deep hover:text-paparan-sage transition-colors"
                  >
                    {source.title}
                  </a>
                ) : (
                  <span className="font-medium text-paparan-ink">{source.title}</span>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    source.type === 'government'
                      ? 'bg-blue-100 text-blue-700'
                      : source.type === 'news'
                      ? 'bg-amber-100 text-amber-700'
                      : source.type === 'research'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {source.type}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    source.confidence === 'HIGH'
                      ? 'bg-green-100 text-green-700'
                      : source.confidence === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {source.confidence} confidence
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </article>
  )
}
