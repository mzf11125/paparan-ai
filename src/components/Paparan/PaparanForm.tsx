'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader } from '../ui/Card'
import { Upload, Loader2 } from 'lucide-react'

const REGIONS = [
  { value: 'ASEAN', label: 'ASEAN (Regional)' },
  { value: 'Indonesia', label: 'Indonesia' },
  { value: 'Malaysia', label: 'Malaysia' },
  { value: 'Philippines', label: 'Philippines' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'Myanmar', label: 'Myanmar' },
  { value: 'Cambodia', label: 'Cambodia' },
  { value: 'Laos', label: 'Laos' },
  { value: 'Brunei', label: 'Brunei' },
]

export const PaparanForm: React.FC = () => {
  const router = useRouter()
  const [topic, setTopic] = useState('')
  const [region, setRegion] = useState('ASEAN')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/paparan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, region }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate Paparan')
      }

      const data = await response.json()
      router.push(`/app/paparan/${data.reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="font-serif text-2xl text-paparan-deep">
          Generate Policy Brief
        </h2>
        <p className="text-paparan-slate">
          Enter a topic to generate a structured intelligence brief
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Topic"
          placeholder="e.g., Indonesia's nickel export policy impact on ASEAN"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          error={error}
          disabled={isGenerating}
        />

        <div>
          <label className="block text-sm font-medium text-paparan-ink mb-1.5">
            Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isGenerating}
            className="w-full px-4 py-2.5 border border-paparan-deep/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-paparan-deep/20 focus:border-paparan-deep transition-all bg-white"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="border-2 border-dashed border-paparan-deep/20 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-paparan-slate mb-2" />
          <p className="text-sm text-paparan-slate">
            Optional: Upload documents for context
          </p>
          <p className="text-xs text-paparan-slate mt-1">
            PDF, DOCX supported (max 10MB each)
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isGenerating || !topic.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating Paparan...
            </>
          ) : (
            'Generate Paparan'
          )}
        </Button>
      </form>
    </Card>
  )
}
