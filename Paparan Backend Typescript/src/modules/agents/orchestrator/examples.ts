/**
 * Orchestrator Usage Examples
 *
 * This file demonstrates how to use the OrchestratorService to generate policy briefs
 * with various configurations and agent chains.
 */

import { OrchestratorService } from '@modules/agents/orchestrator/orchestrator.service';
import { RouteType } from '@models/types/agent.types';

/**
 * Example 1: Basic policy brief generation
 *
 * The orchestrator will automatically classify the topic, determine the route,
 * and execute the appropriate agent chain.
 */
async function generateBasicBrief(orchestrator: OrchestratorService) {
  const brief = await orchestrator.generateBrief({
    topic: 'Indonesia economic growth strategy 2025',
    region: 'Indonesia',
    userId: 'user-123',
  });

  console.log('Generated Brief:', brief.title);
  console.log('Classification:', brief.classification);
  console.log('Summary:', brief.summary);
  console.log('Key Developments:', brief.keyDevelopments.length);
  console.log('Recommendations:', brief.recommendations.length);

  return brief;
}

/**
 * Example 2: Generate brief with specific route
 *
 * Force the orchestrator to use a specific route instead of auto-detecting.
 */
async function generateBriefWithRoute(orchestrator: OrchestratorService) {
  const brief = await orchestrator.generateBrief({
    topic: 'Digital economy development',
    region: 'Indonesia',
    userId: 'user-123',
    options: {
      route: 'bappenas',  // Force Bappenas route
    },
  });

  return brief;
}

/**
 * Example 3: Generate brief with RPJMN alignment
 *
 * For Indonesian policy topics, include RPJMN 2025-2029 alignment analysis.
 */
async function generateBriefWithRPJMN(orchestrator: OrchestratorService) {
  const brief = await orchestrator.generateBrief({
    topic: 'Education quality improvement in rural areas',
    region: 'Indonesia',
    userId: 'user-123',
    options: {
      route: 'bappenas',
      includeRPJMN: true,  // Add RPJMN alignment scoring
      includeRDTII: true,   // Add regulatory context
    },
  });

  if (brief.rpjmnAlignment) {
    console.log('RPJMN Pillar:', brief.rpjmnAlignment.pillar);
    console.log('Alignment Score:', brief.rpjmnAlignment.score);
    console.log('Rationale:', brief.rpjmnAlignment.rationale);
  }

  if (brief.regulatoryContext) {
    console.log('Regulations Found:', brief.regulatoryContext.regulations?.length || 0);
  }

  return brief;
}

/**
 * Example 4: Generate ASEAN brief with simulation
 *
 * For ASEAN-related topics, simulate country positions and consensus likelihood.
 */
async function generateASEANBrief(orchestrator: OrchestratorService) {
  const brief = await orchestrator.generateBrief({
    topic: 'ASEAN digital trade agreement',
    userId: 'user-123',
    options: {
      route: 'asean',
      simulateASEAN: true,  // Add ASEAN simulation
    },
  });

  if (brief.aseanSimulation) {
    console.log('Consensus Likelihood:', brief.aseanSimulation.outcome.consensusLikelihood);
    console.log('Expected Outcome:', brief.aseanSimulation.outcome.outcome);
    console.log('Country Positions:', brief.aseanSimulation.positions?.length || 0);
  }

  return brief;
}

/**
 * Example 5: Stream brief generation
 *
 * Get real-time updates as the brief is being generated.
 */
async function streamBriefGeneration(orchestrator: OrchestratorService) {
  const stream = orchestrator.streamBrief({
    topic: 'Climate change mitigation policy',
    region: 'Indonesia',
    userId: 'user-123',
  });

  for await (const update of stream) {
    console.log(`[${update.stage}] ${update.content}`);

    if (update.done) {
      console.log('Stage complete!');
    }

    if (update.stage === 'done') {
      console.log('Final Brief:', update.data?.brief);
      break;
    }
  }
}

/**
 * Example 6: Parallel agent execution
 *
 * Execute multiple agents simultaneously and collect all results.
 */
async function executeAgentsInParallel(orchestrator: OrchestratorService) {
  const context = {
    userId: 'user-123',
    region: 'Indonesia',
  };

  const results = await orchestrator.executeParallel(
    ['researcher', 'analyst'],
    { topic: 'Fiscal policy analysis' },
    context,
  );

  console.log('Researcher Result:', results.get('researcher')?.success);
  console.log('Analyst Result:', results.get('analyst')?.success);

  // Process combined results
  const researchData = results.get('researcher')?.data;
  const analysisData = results.get('analyst')?.data;

  return {
    research: researchData,
    analysis: analysisData,
  };
}

/**
 * Example 7: Sequential agent execution
 *
 * Execute agents in sequence, passing output from one to the next.
 */
async function executeAgentsSequentially(orchestrator: OrchestratorService) {
  const context = { userId: 'user-123' };

  // Define the agent chain
  const chain = [
    {
      agent: 'researcher',
      // Use default input
    },
    {
      agent: 'analyst',
      // Transform researcher output for analyst
      inputMapper: (prevResult: any) => ({
        research: prevResult,
        topic: 'Economic growth strategy',
      }),
    },
  ];

  const result = await orchestrator.executeSequential(
    chain,
    { topic: 'Economic growth strategy' },
    context,
  );

  console.log('Final Result:', result.data);
  return result;
}

/**
 * Example 8: Get orchestrator state and route information
 */
function exploreOrchestrator(orchestrator: OrchestratorService) {
  // Get available routes
  const routes = orchestrator.getAvailableRoutes();
  console.log('Available Routes:', routes);
  // Output: ['bappenas', 'financial', 'asean', 'default']

  // Get registered agents
  const agents = orchestrator.getRegisteredAgents();
  console.log('Registered Agents:', agents);
  // Output: ['researcher', 'analyst', 'gov_intel', ...]

  // Create initial state for a topic
  const state = orchestrator.createInitialState(
    'Sustainable development goals',
    'user-123',
    'Indonesia',
  );

  console.log('Initial State:', {
    topic: state.topic,
    region: state.region,
    messagesCount: state.messages.length,
  });
}

/**
 * Example 9: Generate brief with financial focus
 *
 * For financial and economic policy topics.
 */
async function generateFinancialBrief(orchestrator: OrchestratorService) {
  const brief = await orchestrator.generateBrief({
    topic: 'Monetary policy and inflation control',
    userId: 'user-123',
    options: {
      route: 'financial',
      includeRDTII: true,  // Include banking regulations
    },
  });

  console.log('Financial Brief Generated:', brief.title);
  console.log('Risk Level:', brief.keyDevelopments[0]?.significance);

  return brief;
}

/**
 * Example 10: Handle errors gracefully
 */
async function generateWithErrorHandling(orchestrator: OrchestratorService) {
  try {
    const brief = await orchestrator.generateBrief({
      topic: 'Complex policy topic requiring deep analysis',
      userId: 'user-123',
      options: {
        includeRPJMN: true,
        includeRDTII: true,
        simulateASEAN: true,
      },
    });

    return brief;
  } catch (error) {
    console.error('Brief generation failed:', error.message);

    // Implement fallback logic
    // For example, generate a simpler brief without optional enhancements

    return await orchestrator.generateBrief({
      topic: 'Complex policy topic requiring deep analysis',
      userId: 'user-123',
      options: {
        // Skip optional enhancements that might have failed
        includeRPJMN: false,
        includeRDTII: false,
        simulateASEAN: false,
      },
    });
  }
}

/**
 * Example: Complete workflow
 *
 * Demonstrate a complete policy brief generation workflow.
 */
async function completeWorkflow(orchestrator: OrchestratorService, topic: string) {
  console.log('=== Policy Brief Generation Workflow ===\n');
  console.log(`Topic: ${topic}\n`);

  // Step 1: Stream the generation process
  console.log('Step 1: Generating brief...');
  await streamBriefGeneration(orchestrator);

  // Step 2: Generate with all enhancements
  console.log('\nStep 2: Generating enhanced brief...');
  const brief = await orchestrator.generateBrief({
    topic,
    userId: 'user-123',
    options: {
      includeRPJMN: true,
      includeRDTII: true,
    },
  });

  // Step 3: Output results
  console.log('\n=== Results ===');
  console.log('Title:', brief.title);
  console.log('Classification:', brief.classification);
  console.log('Summary:', brief.summary);

  if (brief.rpjmnAlignment) {
    console.log('RPJMN Alignment:', brief.rpjmnAlignment);
  }

  if (brief.regulatoryContext) {
    console.log('Regulations:', brief.regulatoryContext.regulations?.length || 0);
  }

  console.log('Key Developments:', brief.keyDevelopments.map(d => d.title));
  console.log('Recommendations:', brief.recommendations.map(r => r.action));

  return brief;
}

// Export examples for use in other modules
export const OrchestratorExamples = {
  generateBasicBrief,
  generateBriefWithRoute,
  generateBriefWithRPJMN,
  generateASEANBrief,
  streamBriefGeneration,
  executeAgentsInParallel,
  executeAgentsSequentially,
  exploreOrchestrator,
  generateFinancialBrief,
  generateWithErrorHandling,
  completeWorkflow,
};
