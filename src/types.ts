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
// research_query
// ============================================================================

export const ResearchQueryInputSchema = z.object({
  action: z.enum(['status', 'overlap', 'stats', 'search']),
  techniqueId: z.string().optional(),
  query: z.string().optional(),
  status: z.enum(['implemented', 'planned', 'not-started', 'rejected', 'all']).optional(),
  threshold: z.number().min(0).max(1).optional(),
});

export const ResearchQueryResponseSchema = z.object({
  action: z.string(),
  success: z.boolean(),
  data: z.unknown(),
});

export type ResearchQueryResponse = z.infer<typeof ResearchQueryResponseSchema>;

// ============================================================================
// research_synthesize
// ============================================================================

export const ResearchSynthesizeInputSchema = z.object({
  topic: z.string().optional(),
});

const TechniqueAlignmentSchema = z.object({
  technique: z.string(),
  status: z.enum(['implemented', 'partial', 'not-started']),
  canonicalPath: z.string().optional(),
  improvementHint: z.string().optional(),
});

const QualityDistributionSchema = z.object({
  avgScore: z.number(),
  high: z.number(),
  medium: z.number(),
  low: z.number(),
});

const ClusterSynthesisSchema = z.object({
  topic: z.string(),
  paperCount: z.number(),
  papers: z.array(z.string()),
  commonThemes: z.array(z.string()),
  keyInsights: z.array(z.string()),
  techniques: z.array(z.string()),
  implementationOpportunities: z.array(z.string()),
  gaps: z.array(z.string()),
  alignedTechniques: z.array(TechniqueAlignmentSchema),
  qualityDistribution: QualityDistributionSchema,
});

const AlignmentSummarySchema = z.object({
  implemented: z.number(),
  partial: z.number(),
  notStarted: z.number(),
  total: z.number(),
  topOpportunities: z.array(z.string()),
});

const FeatureGateStatusSchema = z.object({
  envVar: z.string(),
  defaultValue: z.string(),
  description: z.string(),
  linkedTechniqueCount: z.number(),
});

export const ResearchSynthesizeResponseSchema = z.object({
  clusters: z.array(ClusterSynthesisSchema),
  totalPapers: z.number(),
  topicCount: z.number(),
  crossCuttingThemes: z.array(z.string()),
  alignmentSummary: AlignmentSummarySchema,
  featureGates: z.array(FeatureGateStatusSchema),
});

export type ResearchSynthesizeResponse = z.infer<typeof ResearchSynthesizeResponseSchema>;
export type ClusterSynthesis = z.infer<typeof ClusterSynthesisSchema>;

// ============================================================================
// research_add_source
// ============================================================================

export const ResearchAddSourceInputSchema = z.object({
  url: z.string().min(1).max(500),
  name: z.string().min(1).max(200),
  type: z.enum([
    'product_docs',
    'specification',
    'research_blog',
    'code_analysis',
    'open_source_repo',
  ]),
  vendor: z.string().max(100).optional(),
  topics: z.array(z.string().max(50)).max(5).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  quality_signals: z
    .object({
      stars_at_review: z.number().nonnegative().optional(),
      language: z.string().max(50).optional(),
      has_tests: z.boolean().optional(),
      has_docs: z.boolean().optional(),
      has_paper: z.boolean().optional(),
    })
    .optional(),
  techniques_extracted: z.array(z.string().max(100)).max(5).optional(),
  verdict: z
    .enum(['adopted', 'partially_adopted', 'rejected', 'monitoring', 'planned'])
    .optional(),
  verdict_notes: z.string().max(500).optional(),
  dryRun: z.boolean().optional(),
});

export const ResearchAddSourceResponseSchema = z.object({
  success: z.boolean(),
  sourceId: z.string(),
  name: z.string(),
  quality_score: z.number(),
  evidence_tier: z.enum(['high', 'medium', 'low']),
  message: z.string(),
  dryRun: z.boolean(),
});

export type ResearchAddSourceResponse = z.infer<typeof ResearchAddSourceResponseSchema>;

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
}
