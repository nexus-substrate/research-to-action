/**
 * Mock responses for research-to-action pipeline tests.
 *
 * Each mock matches the LIVE Zod schema defined in types.ts.
 */

import type { DiscoverResponse, AddResponse, AnalyzeResponse, VoteResponse, MemoryQueryResponse } from '../types.js';

// ============================================================================
// research_discover
// ============================================================================

export const MOCK_DISCOVER_RESPONSE: DiscoverResponse = {
  topic: 'multi-agent orchestration',
  sourcesQueried: ['arxiv', 'semantic_scholar'],
  failedSources: [],
  items: [
    {
      source: 'arxiv',
      title: 'Adaptive Multi-Agent Task Routing with Bandit Algorithms',
      url: 'https://arxiv.org/abs/2501.12345',
      description: 'Proposes LinUCB-based routing for multi-agent systems.',
      alreadyInRegistry: false,
      discoveredAt: '2026-02-13',
      relevanceScore: 0.92,
    },
    {
      source: 'arxiv',
      title: 'Consensus Protocols for AI Agent Collaboration',
      url: 'https://arxiv.org/abs/2502.67890',
      description: 'Surveys voting strategies for multi-agent decision making.',
      alreadyInRegistry: false,
      discoveredAt: '2026-02-13',
      relevanceScore: 0.87,
    },
    {
      source: 'semantic_scholar',
      title: 'Graph-Based Workflow Execution in LLM Pipelines',
      url: 'https://semanticscholar.org/paper/abc123',
      description: 'DAG-based execution with checkpointing and rollback.',
      alreadyInRegistry: true,
      discoveredAt: '2026-02-13',
      relevanceScore: 0.81,
    },
  ],
  totalFound: 3,
  alreadyInRegistry: 1,
  newItems: 2,
};

export const MOCK_DISCOVER_EMPTY: DiscoverResponse = {
  topic: 'quantum teleportation cooking recipes',
  sourcesQueried: ['arxiv'],
  failedSources: [],
  items: [],
  totalFound: 0,
  alreadyInRegistry: 0,
  newItems: 0,
};

export const MOCK_DISCOVER_WITH_FAILURES: DiscoverResponse = {
  topic: 'agent memory systems',
  sourcesQueried: ['arxiv', 'github'],
  failedSources: ['github'],
  items: [
    {
      source: 'arxiv',
      title: 'Reflective Memory Retrieval for Conversational Agents',
      url: 'https://arxiv.org/abs/2503.11111',
      description: 'LRU-cached reflective retrieval for agent memory.',
      alreadyInRegistry: false,
      discoveredAt: '2026-02-13',
      relevanceScore: 0.75,
    },
  ],
  totalFound: 1,
  alreadyInRegistry: 0,
  newItems: 1,
};

// ============================================================================
// research_add
// ============================================================================

export const MOCK_ADD_SUCCESS: AddResponse = {
  success: true,
  paperId: 'arxiv-2501.12345',
  title: 'Adaptive Multi-Agent Task Routing with Bandit Algorithms',
  message: 'Paper added to registry.',
  dryRun: false,
};

export const MOCK_ADD_DRY_RUN: AddResponse = {
  success: true,
  paperId: 'arxiv-2502.67890',
  title: 'Consensus Protocols for AI Agent Collaboration',
  message: '[DRY RUN] Would add paper: Consensus Protocols for AI Agent Collaboration',
  dryRun: true,
};

export const MOCK_ADD_FAILURE: AddResponse = {
  success: false,
  paperId: 'arxiv-9999.99999',
  title: '',
  message: 'arXiv ID not found.',
  dryRun: false,
};

// ============================================================================
// research_analyze
// ============================================================================

export const MOCK_ANALYZE_GAPS: AnalyzeResponse = {
  focus: 'gaps',
  success: true,
  analysis: {
    techniquesWithoutPapers: ['memory-persistence', 'agent-lifecycle'],
    underResearchedTopics: ['cross-session-state'],
  },
  recommendations: [
    'Search for papers on agent memory persistence',
    'Add lifecycle management research',
  ],
};

export const MOCK_ANALYZE_TRENDS: AnalyzeResponse = {
  focus: 'trends',
  success: true,
  analysis: {
    recentActivity: 'Multi-agent systems research accelerating',
    publicationRate: '60% of papers added in last 3 months',
  },
  recommendations: ['Monitor arXiv cs.MA category weekly'],
};

export const MOCK_ANALYZE_EMPTY: AnalyzeResponse = {
  focus: 'coverage',
  success: true,
  analysis: {},
  recommendations: [],
};

// ============================================================================
// consensus_vote
// ============================================================================

export const MOCK_VOTE_APPROVED: VoteResponse = {
  proposal: 'Add multi-agent routing papers to the research registry.',
  strategy: 'simple_majority',
  decision: 'approved',
  approvalPercentage: 83.3,
  voteCounts: { approve: 5, reject: 1, abstain: 0, error: 0 },
  votes: [
    { role: 'architect', decision: 'approve', confidence: 0.9, reasoning: 'Aligns with routing improvements.', simulated: false, error: false },
    { role: 'security', decision: 'approve', confidence: 0.85, reasoning: 'No security concerns.', simulated: false, error: false },
    { role: 'devex', decision: 'approve', confidence: 0.8, reasoning: 'Improves developer tooling knowledge.', simulated: false, error: false },
    { role: 'ai_ml', decision: 'approve', confidence: 0.95, reasoning: 'Directly relevant to ML pipeline.', simulated: false, error: false },
    { role: 'pm', decision: 'approve', confidence: 0.7, reasoning: 'Good research investment.', simulated: false, error: false },
    { role: 'catfish', decision: 'reject', confidence: 0.6, reasoning: 'Should prioritize implementation.', simulated: false, error: false },
  ],
  durationMs: 12500,
  simulateVotes: false,
};

export const MOCK_VOTE_REJECTED: VoteResponse = {
  proposal: 'Replace all consensus voting with coin flips.',
  strategy: 'supermajority',
  decision: 'rejected',
  approvalPercentage: 16.7,
  voteCounts: { approve: 1, reject: 5, abstain: 0, error: 0 },
  votes: [
    { role: 'architect', decision: 'reject', confidence: 0.95, reasoning: 'Unacceptable regression.', simulated: false, error: false },
    { role: 'security', decision: 'reject', confidence: 0.99, reasoning: 'Security decisions require rigor.', simulated: false, error: false },
    { role: 'devex', decision: 'reject', confidence: 0.9, reasoning: 'Non-deterministic outcomes.', simulated: false, error: false },
    { role: 'ai_ml', decision: 'reject', confidence: 0.92, reasoning: 'No learning signal from random.', simulated: false, error: false },
    { role: 'pm', decision: 'reject', confidence: 0.88, reasoning: 'Stakeholders require accountability.', simulated: false, error: false },
    { role: 'catfish', decision: 'approve', confidence: 0.5, reasoning: 'At least it would be fast.', simulated: false, error: false },
  ],
  durationMs: 11200,
  simulateVotes: false,
};

// ============================================================================
// memory_query
// ============================================================================

export const MOCK_MEMORY_FOUND: MemoryQueryResponse = {
  query: 'multi-agent routing research decisions',
  results: [
    {
      source: 'session',
      type: 'observation',
      content: 'Research pipeline approved 3 papers on multi-agent routing.',
      relevance: 0.91,
      timestamp: '2026-02-13T15:30:00-05:00',
    },
    {
      source: 'agentic',
      type: 'decision',
      content: 'Consensus vote: 5-1 approved adding routing papers to registry.',
      relevance: 0.85,
      timestamp: '2026-02-13T15:31:00-05:00',
    },
  ],
  count: 2,
  source: 'all',
};

export const MOCK_MEMORY_EMPTY: MemoryQueryResponse = {
  query: 'nonexistent topic with no matches',
  results: [],
  count: 0,
  source: 'all',
};
