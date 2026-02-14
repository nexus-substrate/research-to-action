/**
 * Research-to-action pipeline.
 *
 * Chains: research_discover → research_add → research_analyze → consensus_vote → memory_query
 */

import {
  DiscoverResponseSchema,
  AddResponseSchema,
  AnalyzeResponseSchema,
  VoteResponseSchema,
  MemoryQueryResponseSchema,
  type DiscoverResponse,
  type AddResponse,
  type AnalyzeResponse,
  type VoteResponse,
  type MemoryQueryResponse,
  type PipelineConfig,
  type PipelineResult,
  type PrioritizedPaper,
  type ResearchDecision,
} from './types.js';

// ---------------------------------------------------------------------------
// ToolCaller interface — injectable for testing
// ---------------------------------------------------------------------------

export interface ToolCaller {
  call(tool: string, args: Record<string, unknown>): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Step 1: Discover papers
// ---------------------------------------------------------------------------

export async function discoverPapers(
  caller: ToolCaller,
  topic: string,
  maxResults?: number,
): Promise<DiscoverResponse> {
  const args: Record<string, unknown> = { topic };
  if (maxResults !== undefined) args['maxResults'] = maxResults;
  const raw = await caller.call('research_discover', args);
  return DiscoverResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Step 2: Add new papers to registry
// ---------------------------------------------------------------------------

export async function addPapers(
  caller: ToolCaller,
  discover: DiscoverResponse,
  addToRegistry: boolean,
): Promise<readonly AddResponse[]> {
  if (!addToRegistry) return [];

  // Only add items not already in registry
  const newItems = discover.items.filter((item) => !item.alreadyInRegistry);

  const results: AddResponse[] = [];
  for (const item of newItems) {
    // Extract arxiv ID from URL if source is arxiv
    const arxivMatch = /\/(\d{4}\.\d{4,5})/.exec(item.url);
    if (!arxivMatch) continue;
    const raw = await caller.call('research_add', { arxivId: arxivMatch[1] });
    results.push(AddResponseSchema.parse(raw));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Step 3: Analyze research gaps
// ---------------------------------------------------------------------------

export async function analyzeResearch(
  caller: ToolCaller,
  focus: string,
  topic?: string,
): Promise<AnalyzeResponse> {
  const args: Record<string, unknown> = { focus };
  if (topic !== undefined) args['topic'] = topic;
  const raw = await caller.call('research_analyze', args);
  return AnalyzeResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Step 4: Vote on research direction
// ---------------------------------------------------------------------------

export async function voteOnDirection(
  caller: ToolCaller,
  proposal: string,
  strategy?: string,
): Promise<VoteResponse> {
  const args: Record<string, unknown> = { proposal };
  if (strategy !== undefined) args['strategy'] = strategy;
  const raw = await caller.call('consensus_vote', args);
  return VoteResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Step 5: Store decision in memory
// ---------------------------------------------------------------------------

export async function storeInMemory(
  caller: ToolCaller,
  query: string,
): Promise<MemoryQueryResponse> {
  const raw = await caller.call('memory_query', { query });
  return MemoryQueryResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toPrioritizedPapers(
  discover: DiscoverResponse,
  addResults: readonly AddResponse[],
): readonly PrioritizedPaper[] {
  return discover.items.map((item) => {
    const arxivMatch = /\/(\d{4}\.\d{4,5})/.exec(item.url);
    const arxivId = arxivMatch?.[1];
    const addResult = addResults.find(
      (a) => arxivId && a.paperId === `arxiv-${arxivId}`,
    );
    return {
      title: item.title,
      url: item.url,
      source: item.source,
      ...(item.relevanceScore !== undefined ? { relevance: item.relevanceScore } : {}),
      ...(addResult !== undefined ? { addResult: { success: addResult.success, paperId: addResult.paperId } } : {}),
    };
  });
}

function summarizeAnalysis(analysis: AnalyzeResponse): string {
  if (typeof analysis.analysis === 'string') return analysis.analysis;
  if (analysis.recommendations.length > 0) return analysis.recommendations.join('; ');
  return JSON.stringify(analysis.analysis);
}

export function buildDecision(
  config: PipelineConfig,
  discover: DiscoverResponse,
  addResults: readonly AddResponse[],
  analysis: AnalyzeResponse | null,
  vote: VoteResponse,
  memoryStored: boolean,
): ResearchDecision {
  return {
    topic: config.topic,
    papersFound: discover.totalFound,
    papersAdded: addResults.filter((a) => a.success && !a.dryRun).length,
    gapAnalysis: analysis ? summarizeAnalysis(analysis) : 'skipped',
    voteDecision: vote.decision,
    voteApproval: vote.approvalPercentage,
    memoryStored,
  };
}

// ---------------------------------------------------------------------------
// Full pipeline
// ---------------------------------------------------------------------------

export async function runResearchPipeline(
  caller: ToolCaller,
  config: PipelineConfig,
): Promise<PipelineResult> {
  const errors: string[] = [];
  const focus = config.analysisFocus ?? 'gaps';

  // Step 1: Discover
  const discover = await discoverPapers(caller, config.topic, config.maxPapers);

  // Step 2: Add to registry
  const addResults = await addPapers(
    caller,
    discover,
    config.addToRegistry ?? false,
  );

  // Step 3: Analyze
  let analysis: AnalyzeResponse | null = null;
  try {
    analysis = await analyzeResearch(caller, focus, config.topic);
  } catch (e) {
    errors.push(`analyze failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 4: Vote
  const analysisSummary = analysis ? summarizeAnalysis(analysis) : 'No analysis available.';
  const proposal =
    `Research direction for "${config.topic}": ` +
    `Found ${discover.totalFound} papers (${discover.newItems} new). ` +
    analysisSummary;
  const vote = await voteOnDirection(caller, proposal, config.voteStrategy);

  // Step 5: Memory
  let memoryStored = false;
  if (config.storeInMemory ?? true) {
    try {
      await storeInMemory(caller, `research decision: ${config.topic}`);
      memoryStored = true;
    } catch (e) {
      errors.push(`memory failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const papers = toPrioritizedPapers(discover, addResults);
  const decision = buildDecision(config, discover, addResults, analysis, vote, memoryStored);

  return { papers, analysis, decision, errors };
}
