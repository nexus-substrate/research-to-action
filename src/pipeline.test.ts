/**
 * Tests for the research-to-action pipeline — multi-tool composition.
 */

import { describe, it, expect, vi } from 'vitest';
import type { ToolCaller } from './pipeline.js';
import {
  discoverPapers,
  addPapers,
  analyzeResearch,
  voteOnDirection,
  storeInMemory,
  toPrioritizedPapers,
  buildDecision,
  runResearchPipeline,
  withTimeout,
  ToolCallTimeoutError,
} from './pipeline.js';
import type { PipelineConfig } from './types.js';
import {
  MOCK_DISCOVER_RESPONSE,
  MOCK_DISCOVER_EMPTY,
  MOCK_ADD_SUCCESS,
  MOCK_ADD_DRY_RUN,
  MOCK_ANALYZE_GAPS,
  MOCK_VOTE_APPROVED,
  MOCK_VOTE_REJECTED,
  MOCK_MEMORY_FOUND,
  MOCK_MEMORY_EMPTY,
} from './fixtures/mock-responses.js';

// ---------------------------------------------------------------------------
// Helper: mock ToolCaller
// ---------------------------------------------------------------------------

function mockCaller(
  responses: Record<string, unknown>,
): ToolCaller & { calls: Array<{ tool: string; args: Record<string, unknown> }> } {
  const calls: Array<{ tool: string; args: Record<string, unknown> }> = [];
  return {
    calls,
    call: vi.fn(async (tool: string, args: Record<string, unknown>) => {
      calls.push({ tool, args });
      const response = responses[tool];
      if (response === undefined) throw new Error(`Unexpected tool: ${tool}`);
      return response;
    }),
  };
}

// ---------------------------------------------------------------------------
// Individual steps
// ---------------------------------------------------------------------------

describe('discoverPapers', () => {
  it('calls research_discover and parses response', async () => {
    const caller = mockCaller({ research_discover: MOCK_DISCOVER_RESPONSE });
    const result = await discoverPapers(caller, 'multi-agent orchestration', 5);
    expect(result.items).toHaveLength(3);
    expect(result.topic).toBe('multi-agent orchestration');
    expect(caller.calls[0]?.args).toEqual({ topic: 'multi-agent orchestration', maxResults: 5 });
  });

  it('handles empty results', async () => {
    const caller = mockCaller({ research_discover: MOCK_DISCOVER_EMPTY });
    const result = await discoverPapers(caller, 'nothing');
    expect(result.items).toHaveLength(0);
    expect(result.totalFound).toBe(0);
  });
});

describe('addPapers', () => {
  it('adds new papers with arxiv URLs', async () => {
    const caller = mockCaller({ research_add: MOCK_ADD_SUCCESS });
    const results = await addPapers(caller, MOCK_DISCOVER_RESPONSE, true);
    // 2 of 3 items are not alreadyInRegistry and have arxiv URLs
    expect(results).toHaveLength(2);
    expect(caller.calls).toHaveLength(2);
  });

  it('skips when addToRegistry is false', async () => {
    const caller = mockCaller({});
    const results = await addPapers(caller, MOCK_DISCOVER_RESPONSE, false);
    expect(results).toHaveLength(0);
    expect(caller.calls).toHaveLength(0);
  });

  it('handles empty discover results', async () => {
    const caller = mockCaller({});
    const results = await addPapers(caller, MOCK_DISCOVER_EMPTY, true);
    expect(results).toHaveLength(0);
  });

  it('skips items already in registry', async () => {
    const caller = mockCaller({ research_add: MOCK_ADD_SUCCESS });
    // MOCK_DISCOVER_RESPONSE has 1 item alreadyInRegistry=true
    const results = await addPapers(caller, MOCK_DISCOVER_RESPONSE, true);
    expect(results).toHaveLength(2); // 3 items minus 1 already in registry
  });
});

describe('analyzeResearch', () => {
  it('calls research_analyze with focus and topic', async () => {
    const caller = mockCaller({ research_analyze: MOCK_ANALYZE_GAPS });
    const result = await analyzeResearch(caller, 'gaps', 'routing');
    expect(result.focus).toBe('gaps');
    expect(caller.calls[0]?.args).toEqual({ focus: 'gaps', topic: 'routing' });
  });

  it('omits topic when not provided', async () => {
    const caller = mockCaller({ research_analyze: MOCK_ANALYZE_GAPS });
    await analyzeResearch(caller, 'gaps');
    expect(caller.calls[0]?.args).toEqual({ focus: 'gaps' });
  });
});

describe('voteOnDirection', () => {
  it('calls consensus_vote and parses', async () => {
    const caller = mockCaller({ consensus_vote: MOCK_VOTE_APPROVED });
    const result = await voteOnDirection(caller, 'Test proposal');
    expect(result.decision).toBe('approved');
  });

  it('passes strategy when provided', async () => {
    const caller = mockCaller({ consensus_vote: MOCK_VOTE_REJECTED });
    await voteOnDirection(caller, 'Bad idea', 'supermajority');
    expect(caller.calls[0]?.args).toEqual({ proposal: 'Bad idea', strategy: 'supermajority' });
  });
});

describe('storeInMemory', () => {
  it('calls memory_query and parses', async () => {
    const caller = mockCaller({ memory_query: MOCK_MEMORY_FOUND });
    const result = await storeInMemory(caller, 'research decision');
    expect(result.results).toHaveLength(2);
  });

  it('handles empty memory', async () => {
    const caller = mockCaller({ memory_query: MOCK_MEMORY_EMPTY });
    const result = await storeInMemory(caller, 'nothing');
    expect(result.count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('toPrioritizedPapers', () => {
  it('maps discover items with add results', () => {
    const papers = toPrioritizedPapers(MOCK_DISCOVER_RESPONSE, [MOCK_ADD_SUCCESS]);
    expect(papers).toHaveLength(3);
    expect(papers[0]?.addResult?.success).toBe(true);
    expect(papers[0]?.addResult?.paperId).toBe('arxiv-2501.12345');
    expect(papers[2]?.addResult).toBeUndefined();
  });

  it('handles empty inputs', () => {
    const papers = toPrioritizedPapers(MOCK_DISCOVER_EMPTY, []);
    expect(papers).toHaveLength(0);
  });

  it('preserves relevance scores', () => {
    const papers = toPrioritizedPapers(MOCK_DISCOVER_RESPONSE, []);
    expect(papers[0]?.relevance).toBe(0.92);
    expect(papers[2]?.relevance).toBe(0.81);
  });

  it('includes URL from discover items', () => {
    const papers = toPrioritizedPapers(MOCK_DISCOVER_RESPONSE, []);
    expect(papers[0]?.url).toContain('arxiv.org');
  });
});

describe('buildDecision', () => {
  it('builds complete decision', () => {
    const config: PipelineConfig = { topic: 'test', addToRegistry: true };
    const decision = buildDecision(
      config,
      MOCK_DISCOVER_RESPONSE,
      [MOCK_ADD_SUCCESS],
      MOCK_ANALYZE_GAPS,
      MOCK_VOTE_APPROVED,
      true,
    );
    expect(decision.topic).toBe('test');
    expect(decision.papersFound).toBe(3);
    expect(decision.papersAdded).toBe(1);
    expect(decision.voteDecision).toBe('approved');
    expect(decision.memoryStored).toBe(true);
  });

  it('handles null analysis', () => {
    const config: PipelineConfig = { topic: 'test' };
    const decision = buildDecision(
      config,
      MOCK_DISCOVER_EMPTY,
      [],
      null,
      MOCK_VOTE_REJECTED,
      false,
    );
    expect(decision.gapAnalysis).toBe('skipped');
    expect(decision.papersFound).toBe(0);
  });

  it('counts only successful non-dryrun adds', () => {
    const config: PipelineConfig = { topic: 'test' };
    const decision = buildDecision(
      config,
      MOCK_DISCOVER_RESPONSE,
      [MOCK_ADD_SUCCESS, MOCK_ADD_DRY_RUN],
      null,
      MOCK_VOTE_APPROVED,
      true,
    );
    expect(decision.papersAdded).toBe(1); // Only MOCK_ADD_SUCCESS counts
  });
});

// ---------------------------------------------------------------------------
// Full pipeline
// ---------------------------------------------------------------------------

describe('runResearchPipeline', () => {
  it('chains all 5 tools in sequence', async () => {
    const caller = mockCaller({
      research_discover: MOCK_DISCOVER_RESPONSE,
      research_add: MOCK_ADD_SUCCESS,
      research_analyze: MOCK_ANALYZE_GAPS,
      consensus_vote: MOCK_VOTE_APPROVED,
      memory_query: MOCK_MEMORY_FOUND,
    });

    const config: PipelineConfig = {
      topic: 'multi-agent orchestration',
      addToRegistry: true,
      analysisFocus: 'gaps',
      storeInMemory: true,
    };

    const result = await runResearchPipeline(caller, config);

    expect(result.papers).toHaveLength(3);
    expect(result.analysis).not.toBeNull();
    expect(result.decision.voteDecision).toBe('approved');
    expect(result.decision.memoryStored).toBe(true);
    expect(result.errors).toHaveLength(0);

    // Verify tool call order
    const toolOrder = caller.calls.map((c) => c.tool);
    expect(toolOrder[0]).toBe('research_discover');
    expect(toolOrder[1]).toBe('research_add');
    expect(toolOrder[2]).toBe('research_add');
    expect(toolOrder[3]).toBe('research_analyze');
    expect(toolOrder[4]).toBe('consensus_vote');
    expect(toolOrder[5]).toBe('memory_query');
  });

  it('skips add when addToRegistry is false', async () => {
    const caller = mockCaller({
      research_discover: MOCK_DISCOVER_RESPONSE,
      research_analyze: MOCK_ANALYZE_GAPS,
      consensus_vote: MOCK_VOTE_APPROVED,
      memory_query: MOCK_MEMORY_FOUND,
    });

    const config: PipelineConfig = {
      topic: 'test',
      addToRegistry: false,
    };

    const result = await runResearchPipeline(caller, config);
    expect(result.decision.papersAdded).toBe(0);
    expect(caller.calls.every((c) => c.tool !== 'research_add')).toBe(true);
  });

  it('captures analyze failure without stopping pipeline', async () => {
    const caller: ToolCaller = {
      call: async (tool: string) => {
        if (tool === 'research_analyze') throw new Error('analyze timeout');
        if (tool === 'research_discover') return MOCK_DISCOVER_EMPTY;
        if (tool === 'consensus_vote') return MOCK_VOTE_APPROVED;
        if (tool === 'memory_query') return MOCK_MEMORY_FOUND;
        throw new Error(`Unexpected: ${tool}`);
      },
    };

    const result = await runResearchPipeline(caller, { topic: 'test' });
    expect(result.analysis).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('analyze failed');
    expect(result.decision.voteDecision).toBe('approved');
  });

  it('captures memory failure without stopping pipeline', async () => {
    const caller: ToolCaller = {
      call: async (tool: string) => {
        if (tool === 'research_discover') return MOCK_DISCOVER_EMPTY;
        if (tool === 'research_analyze') return MOCK_ANALYZE_GAPS;
        if (tool === 'consensus_vote') return MOCK_VOTE_APPROVED;
        if (tool === 'memory_query') throw new Error('memory backend down');
        throw new Error(`Unexpected: ${tool}`);
      },
    };

    const result = await runResearchPipeline(caller, { topic: 'test' });
    expect(result.decision.memoryStored).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('memory failed');
  });

  it('skips memory when storeInMemory is false', async () => {
    const caller = mockCaller({
      research_discover: MOCK_DISCOVER_EMPTY,
      research_analyze: MOCK_ANALYZE_GAPS,
      consensus_vote: MOCK_VOTE_APPROVED,
    });

    const result = await runResearchPipeline(caller, {
      topic: 'test',
      storeInMemory: false,
    });

    expect(result.decision.memoryStored).toBe(false);
    expect(caller.calls.every((c) => c.tool !== 'memory_query')).toBe(true);
  });

  it('builds proposal from discover + analyze results', async () => {
    const caller = mockCaller({
      research_discover: MOCK_DISCOVER_RESPONSE,
      research_analyze: MOCK_ANALYZE_GAPS,
      consensus_vote: MOCK_VOTE_APPROVED,
      memory_query: MOCK_MEMORY_FOUND,
    });

    await runResearchPipeline(caller, { topic: 'multi-agent' });

    const voteCall = caller.calls.find((c) => c.tool === 'consensus_vote');
    const proposal = voteCall?.args['proposal'] as string;
    expect(proposal).toContain('multi-agent');
    expect(proposal).toContain('3 papers');
    expect(proposal).toContain('2 new');
  });
});

// ---------------------------------------------------------------------------
// withTimeout
// ---------------------------------------------------------------------------

describe('withTimeout', () => {
  it('rejects with ToolCallTimeoutError when the call hangs', async () => {
    const hanging: ToolCaller = {
      call: () => new Promise<unknown>(() => {}), // never settles
    };
    const bounded = withTimeout(hanging, 10);
    await expect(bounded.call('research_discover', {})).rejects.toBeInstanceOf(
      ToolCallTimeoutError,
    );
  });

  it('passes through a fast result before the timeout fires', async () => {
    const fast: ToolCaller = {
      call: async () => ({ ok: true }),
    };
    const bounded = withTimeout(fast, 1000);
    await expect(bounded.call('research_discover', {})).resolves.toEqual({ ok: true });
  });

  it('propagates the underlying error', async () => {
    const failing: ToolCaller = {
      call: async () => {
        throw new Error('backend exploded');
      },
    };
    const bounded = withTimeout(failing, 1000);
    await expect(bounded.call('consensus_vote', {})).rejects.toThrow('backend exploded');
  });

  it('aborts the signal when the timeout fires', async () => {
    let captured: AbortSignal | undefined;
    const hanging: ToolCaller = {
      call: (_tool, args) => {
        captured = args['signal'] as AbortSignal;
        return new Promise<unknown>(() => {}); // never settles
      },
    };
    const bounded = withTimeout(hanging, 10);
    await expect(bounded.call('memory_query', {})).rejects.toBeInstanceOf(
      ToolCallTimeoutError,
    );
    expect(captured?.aborted).toBe(true);
  });
});
