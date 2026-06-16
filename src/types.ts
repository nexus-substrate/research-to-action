/**
 * Zod schemas for research-to-action MCP tool contracts.
 *
 * Covers: research_discover, research_add, research_analyze, consensus_vote, memory_query
 * Schemas match LIVE tool responses from nexus-agents MCP server.
 */

import { z } from 'zod';

// ============================================================================
// research_discover
// ============================================================================

export const DiscoverInputSchema = z.object({
  topic: z.string().min(1).max(200),
  source: z.enum([
    'arxiv', 'github', 'google_ai', 'meta_fair', 'microsoft',
    'deepmind', 'semantic_scholar', 'papers_with_code', 'openalex', 'all',
  ]).optional(),
  maxResults: z.number().min(1).max(20).optional(),
  sinceDate: z.string().optional(),
  relevanceThreshold: z.number().min(0).max(1).optional(),
});

const DiscoveredItemSchema = z.object({
  source: z.string(),
  title: z.string(),
  url: z.string(),
  description: z.string(),
  alreadyInRegistry: z.boolean(),
  discoveredAt: z.string(),
  relevanceScore: z.number().optional(),
});

export const DiscoverResponseSchema = z.object({
  topic: z.string(),
  sourcesQueried: z.array(z.string()),
  failedSources: z.array(z.string()),
  items: z.array(DiscoveredItemSchema),
  totalFound: z.number(),
  alreadyInRegistry: z.number(),
  newItems: z.number(),
});

export type DiscoverResponse = z.infer<typeof DiscoverResponseSchema>;
export type DiscoveredItem = z.infer<typeof DiscoveredItemSchema>;

// ============================================================================
// research_add
// ============================================================================

export const AddInputSchema = z.object({
  arxivId: z.string().regex(/^\d{4}\.\d{4,5}$/),
  topic: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  dryRun: z.boolean().optional(),
});

export const AddResponseSchema = z.object({
  success: z.boolean(),
  paperId: z.string(),
  title: z.string(),
  message: z.string(),
  dryRun: z.boolean(),
});

export type AddResponse = z.infer<typeof AddResponseSchema>;

// ============================================================================
// research_analyze
// ============================================================================

export const AnalyzeInputSchema = z.object({
  focus: z.enum(['gaps', 'trends', 'priorities', 'stale', 'coverage']),
  topic: z.string().optional(),
});

export const AnalyzeResponseSchema = z.object({
  focus: z.string(),
  success: z.boolean(),
  analysis: z.unknown(),
  recommendations: z.array(z.string()),
});

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

// ============================================================================
// consensus_vote
// ============================================================================

export const VoteInputSchema = z.object({
  proposal: z.string().min(1).max(4000),
  strategy: z.enum([
    'simple_majority', 'supermajority', 'unanimous',
    'proof_of_learning', 'higher_order',
  ]).optional(),
  quickMode: z.boolean().optional(),
  simulateVotes: z.boolean().optional(),
});

const AgentVoteSchema = z.object({
  role: z.string(),
  decision: z.enum(['approve', 'reject', 'abstain']),
  confidence: z.number(),
  reasoning: z.string(),
  simulated: z.boolean(),
  error: z.boolean(),
});

export const VoteResponseSchema = z.object({
  proposal: z.string(),
  strategy: z.string(),
  decision: z.enum(['approved', 'rejected', 'pending', 'timeout']),
  approvalPercentage: z.number(),
  voteCounts: z.object({
    approve: z.number(),
    reject: z.number(),
    abstain: z.number(),
    error: z.number(),
  }),
  votes: z.array(AgentVoteSchema),
  durationMs: z.number(),
  simulateVotes: z.boolean(),
});

export type VoteResponse = z.infer<typeof VoteResponseSchema>;

// ============================================================================
// memory_query
// ============================================================================

export const MemoryQueryInputSchema = z.object({
  query: z.string().min(1).max(500),
  source: z.enum(['session', 'belief', 'agentic', 'typed', 'all']).optional(),
  limit: z.number().min(1).max(50).optional(),
});

const MemoryResultSchema = z.object({
  source: z.enum(['session', 'belief', 'agentic', 'typed']),
  type: z.string(),
  content: z.string(),
  relevance: z.number(),
  timestamp: z.string().or(z.date()),
});

export const MemoryQueryResponseSchema = z.object({
  query: z.string(),
  results: z.array(MemoryResultSchema),
  count: z.number(),
  source: z.string(),
});

export type MemoryQueryResponse = z.infer<typeof MemoryQueryResponseSchema>;
export type MemoryResult = z.infer<typeof MemoryResultSchema>;

// ============================================================================
// Pipeline types
// ============================================================================

/** A paper discovered and prioritized. */
export interface PrioritizedPaper {
  readonly title: string;
  readonly url: string;
  readonly source: string;
  readonly relevance?: number;
  readonly addResult?: { success: boolean; paperId: string };
}

/** Decision made by consensus vote. */
export interface ResearchDecision {
  readonly topic: string;
  readonly papersFound: number;
  readonly papersAdded: number;
  readonly gapAnalysis: string;
  readonly voteDecision: string;
  readonly voteApproval: number;
  readonly memoryStored: boolean;
}

/** Full pipeline result. */
export interface PipelineResult {
  readonly papers: readonly PrioritizedPaper[];
  readonly analysis: AnalyzeResponse | null;
  readonly decision: ResearchDecision;
  readonly errors: readonly string[];
}

/** Pipeline configuration. */
export interface PipelineConfig {
  readonly topic: string;
  readonly maxPapers?: number;
  readonly addToRegistry?: boolean;
  readonly analysisFocus?: 'gaps' | 'trends' | 'priorities' | 'coverage';
  readonly voteStrategy?: string;
  readonly storeInMemory?: boolean;
  /** Per-call timeout (ms) for remote tool calls. Omit to use the default. */
  readonly timeoutMs?: number;
}
