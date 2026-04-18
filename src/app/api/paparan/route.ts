import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { generatePaparan } from '@/lib/paparan'
import { CreatePaparanInput } from '@/lib/schema'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const input = CreatePaparanInput.parse(body)

    // Get previous Paparan for delta comparison
    const { data: previous } = await supabase
      .from('paparan_reports')
      .select('content')
      .eq('user_id', user.id)
      .eq('topic', input.topic)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Generate Paparan
    const paparan = await generatePaparan({
      topic: input.topic,
      region: input.region,
      previousPaparan: previous?.content,
    })

    // Store in database
    const { data: report, error: insertError } = await supabase
      .from('paparan_reports')
      .insert({
        user_id: user.id,
        topic: input.topic,
        region: input.region,
        report_type: 'on_demand',
        content: paparan,
        previous_report_id: previous?.id || null,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Store sources
    if (paparan.sources && paparan.sources.length > 0) {
      await supabase.from('sources').insert(
        paparan.sources.map((source: any) => ({
          paparan_id: report.id,
          url: source.url || null,
          title: source.title,
          source_type: source.type,
          confidence: source.confidence,
        }))
      )
    }

    return NextResponse.json({
      paparan,
      reportId: report.id,
    })
  } catch (error) {
    console.error('Paparan generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate Paparan' },
      { status: 500 }
    )
  }
}
