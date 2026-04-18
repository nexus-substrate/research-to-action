/**
 * research-to-action — Research-driven decision pipeline.
 *
 * Chains: research_discover → research_add → research_analyze → consensus_vote → memory_query
 */

export {
  DiscoverInputSchema,
  DiscoverResponseSchema,
  AddInputSchema,
  AddResponseSchema,
  AnalyzeInputSchema,
  AnalyzeResponseSchema,
  VoteInputSchema,
  VoteResponseSchema,
  MemoryQueryInputSchema,
  MemoryQueryResponseSchema,
  ResearchQueryInputSchema,
  ResearchQueryResponseSchema,
  ResearchSynthesizeInputSchema,
  ResearchSynthesizeResponseSchema,
  ResearchAddSourceInputSchema,
  ResearchAddSourceResponseSchema,
} from './types.js';

export type {
  DiscoverResponse,
  DiscoveredItem,
  AddResponse,
  AnalyzeResponse,
  VoteResponse,
  MemoryQueryResponse,
  MemoryResult,
  ResearchQueryResponse,
  ResearchSynthesizeResponse,
  ClusterSynthesis,
  ResearchAddSourceResponse,
  PrioritizedPaper,
  ResearchDecision,
  PipelineResult,
  PipelineConfig,
} from './types.js';

export {
  discoverPapers,
  addPapers,
  analyzeResearch,
  voteOnDirection,
  storeInMemory,
  toPrioritizedPapers,
  buildDecision,
  runResearchPipeline,
} from './pipeline.js';

export type { ToolCaller } from './pipeline.js';

export { generateReport } from './reporter.js';

export type { ReportFormat } from './reporter.js';

export { createLiveCaller, isLiveMode } from './live-caller.js';
