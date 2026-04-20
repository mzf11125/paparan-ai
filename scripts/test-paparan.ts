/**
 * Test Paparan Generation with GLM
 * Run with: npx tsx scripts/test-paparan.ts
 */

import dotenv from 'dotenv'
import { generatePaparan, expandQuery } from '../src/lib/paparan.js'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testExpandQuery() {
  console.log('\n🔍 Testing Query Expansion...\n')
  console.log('Topic: "Indonesia nickel export policy ASEAN 2026"\n')

  try {
    const queries = await expandQuery('Indonesia nickel export policy', 'ASEAN')
    console.log('Generated queries:')
    queries.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q}`)
    })
    return queries
  } catch (error) {
    console.error('❌ Query expansion failed:', error)
    throw error
  }
}

async function testPaparanGeneration() {
  console.log('\n\n📝 Testing Paparan Generation...\n')
  console.log('This may take 30-60 seconds...\n')

  const startTime = Date.now()

  try {
    const paparan = await generatePaparan({
      topic: 'Indonesia nickel export policy impact on ASEAN',
      region: 'ASEAN',
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log(`\n✅ Paparan generated in ${duration}s\n`)
    console.log('=' .repeat(60))
    console.log('EXECUTIVE SUMMARY')
    console.log('='.repeat(60))
    paparan.executiveSummary.forEach((point, i) => {
      console.log(`  ${i + 1}. ${point}`)
    })

    console.log('\n' + '='.repeat(60))
    console.log('CURRENT SITUATION')
    console.log('='.repeat(60))
    console.log(paparan.currentSituation.slice(0, 300) + '...')

    console.log('\n' + '='.repeat(60))
    console.log(`KEY DEVELOPMENTS (${paparan.keyDevelopments.length})`)
    console.log('='.repeat(60))
    paparan.keyDevelopments.slice(0, 3).forEach((dev, i) => {
      console.log(`  ${i + 1}. [${dev.deltaType}] [${dev.impactLevel}] ${dev.description.slice(0, 100)}...`)
    })

    console.log('\n' + '='.repeat(60))
    console.log(`STRATEGIC IMPLICATIONS`)
    console.log('='.repeat(60))
    console.log(paparan.strategicImplications.slice(0, 200) + '...')

    console.log('\n' + '='.repeat(60))
    console.log(`RECOMMENDED ACTIONS (${paparan.recommendedActions.length})`)
    console.log('='.repeat(60))
    paparan.recommendedActions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.slice(0, 80)}...`)
    })

    console.log('\n' + '='.repeat(60))
    console.log(`SOURCES (${paparan.sources.length})`)
    console.log('='.repeat(60))
    paparan.sources.slice(0, 5).forEach((source, i) => {
      console.log(`  ${i + 1}. [${source.type}] ${source.title}`)
    })

    console.log('\n✅ Test completed successfully!\n')

    return paparan
  } catch (error) {
    console.error('\n❌ Paparan generation failed:', error)
    throw error
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('PAPARAN.AI - GLM Integration Test')
  console.log('='.repeat(60))

  try {
    // Test 1: Query expansion
    await testExpandQuery()

    // Test 2: Full paparan generation
    await testPaparanGeneration()

    console.log('=' .repeat(60))
    console.log('ALL TESTS PASSED ✅')
    console.log('='.repeat(60) + '\n')

    process.exit(0)
  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('TESTS FAILED ❌')
    console.error('='.repeat(60) + '\n')
    process.exit(1)
  }
}

main()
