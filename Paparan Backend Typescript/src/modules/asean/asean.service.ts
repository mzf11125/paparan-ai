import { Injectable } from '@nestjs/common';
import { AseanSimulatorAgent } from '@modules/agents/asean-simulator/asean-simulator.agent';
import { KnowledgeGraphService } from '@modules/tools/knowledge-graph/knowledge-graph.service';

/**
 * ASEAN member states data
 */
const ASEAN_COUNTRIES = [
  { code: 'ID', name: 'Indonesia', population: 273000000, gdp: 1186000000000, capital: 'Jakarta' },
  { code: 'MY', name: 'Malaysia', population: 32000000, gdp: 372000000000, capital: 'Kuala Lumpur' },
  { code: 'SG', name: 'Singapore', population: 5700000, gdp: 397000000000, capital: 'Singapore' },
  { code: 'TH', name: 'Thailand', population: 71000000, gdp: 505000000000, capital: 'Bangkok' },
  { code: 'PH', name: 'Philippines', population: 109000000, gdp: 394000000000, capital: 'Manila' },
  { code: 'VN', name: 'Vietnam', population: 97000000, gdp: 366000000000, capital: 'Hanoi' },
  { code: 'MM', name: 'Myanmar', population: 54000000, gdp: 63000000000, capital: 'Naypyidaw' },
  { code: 'KH', name: 'Cambodia', population: 16000000, gdp: 26000000000, capital: 'Phnom Penh' },
  { code: 'LA', name: 'Laos', population: 7200000, gdp: 19000000000, capital: 'Vientiane' },
  { code: 'BN', name: 'Brunei', population: 440000, gdp: 12000000000, capital: 'Bandar Seri Begawan' },
];

/**
 * ASEAN Community Pillars
 */
const ASEAN_PILLARS = [
  {
    id: 'APSC',
    name: 'ASEAN Political-Security Community',
    description: 'Peaceful, secure, and resilient environment',
    goals: ['Rule of law', 'Conflict resolution', 'Maritime cooperation', 'Counter-terrorism'],
  },
  {
    id: 'AEC',
    name: 'ASEAN Economic Community',
    description: 'Cohesive, responsive, competitive, and integrated economy',
    goals: ['Single market', 'Economic integration', 'Competitive region', 'Connected ASEAN'],
  },
  {
    id: 'ASCC',
    name: 'ASEAN Socio-Cultural Community',
    description: 'People-oriented and socially responsible',
    goals: ['Human development', 'Social welfare', 'Environmental protection', 'Cultural exchange'],
  },
];

@Injectable()
export class AseanService {
  constructor(
    private aseanSimulator: AseanSimulatorAgent,
    private knowledgeGraph: KnowledgeGraphService,
  ) {}

  async simulate(scenario: string, affectedPillars?: string[]) {
    return this.aseanSimulator.executeSafe(
      {
        scenario,
        affectedPillars,
      },
      { userId: 'system' },
    );
  }

  async queryKnowledgeGraph(query: string) {
    return this.knowledgeGraph.query(query);
  }

  /**
   * Get all ASEAN member states
   */
  async getCountries() {
    return ASEAN_COUNTRIES;
  }

  /**
   * Get ASEAN community pillars
   */
  async getPillars() {
    return ASEAN_PILLARS;
  }

  /**
   * Simulate voting scenario
   */
  async simulateVoting(scenario: string, proposal: string) {
    return this.aseanSimulator.simulateVoting(scenario, proposal);
  }

  /**
   * Identify potential compromises
   */
  async identifyCompromises(scenario: string, positions?: any[]) {
    if (!positions) {
      // First get positions from simulation
      const simResult = await this.simulate(scenario);
      positions = simResult.data?.positions || [];
    }

    return this.aseanSimulator.identifyCompromises(scenario, positions);
  }

  /**
   * Get historical precedents
   */
  async getHistoricalPrecedents(scenario: string) {
    return this.aseanSimulator.analyzeHistoricalPrecedents(scenario);
  }

  /**
   * Generate talking points
   */
  async generateTalkingPoints(scenario: string, targetCountry?: string) {
    return this.aseanSimulator.generateTalkingPoints(scenario, targetCountry || 'Indonesia');
  }

  /**
   * Assess regional impact
   */
  async assessRegionalImpact(scenario: string, outcome: string) {
    return this.aseanSimulator.assessRegionalImpact(scenario, outcome);
  }
}
