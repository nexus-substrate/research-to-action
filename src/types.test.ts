/**
 * Tests for Zod schema validation — all 5 MCP tool contracts.
 * Schemas match LIVE nexus-agents MCP server responses.
 */

import { describe, it, expect } from 'vitest';
import {
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
import {
  MOCK_DISCOVER_RESPONSE,
  MOCK_DISCOVER_EMPTY,
  MOCK_DISCOVER_WITH_FAILURES,
  MOCK_ADD_SUCCESS,
  MOCK_ADD_DRY_RUN,
  MOCK_ADD_FAILURE,
  MOCK_ANALYZE_GAPS,
  MOCK_ANALYZE_TRENDS,
  MOCK_ANALYZE_EMPTY,
  MOCK_VOTE_APPROVED,
  MOCK_VOTE_REJECTED,
  MOCK_MEMORY_FOUND,
  MOCK_MEMORY_EMPTY,
  MOCK_QUERY_STATS,
  MOCK_QUERY_SEARCH,
  MOCK_QUERY_STATUS,
  MOCK_QUERY_OVERLAP_MISSING_ID,
  MOCK_SYNTHESIZE_FULL,
  MOCK_SYNTHESIZE_EMPTY,
  MOCK_ADD_SOURCE_SUCCESS,
  MOCK_ADD_SOURCE_DRY_RUN,
  MOCK_ADD_SOURCE_DUPLICATE,
} from './fixtures/mock-responses.js';

// ============================================================================
// research_discover
// ============================================================================

describe('DiscoverInputSchema', () => {
  it('accepts valid input', () => {
    const result = DiscoverInputSchema.safeParse({ topic: 'multi-agent systems' });
    expect(result.success).toBe(true);
  });

  it('accepts full input with all optional fields', () => {
    const result = DiscoverInputSchema.safeParse({
      topic: 'routing algorithms',
      source: 'arxiv',
      maxResults: 10,
      sinceDate: '2025-01-01',
      relevanceThreshold: 0.7,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty topic', () => {
    const result = DiscoverInputSchema.safeParse({ topic: '' });
    expect(result.success).toBe(false);
  });

  it('rejects topic over 200 chars', () => {
    const result = DiscoverInputSchema.safeParse({ topic: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source', () => {
    const result = DiscoverInputSchema.safeParse({ topic: 'test', source: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('DiscoverResponseSchema', () => {
  it('parses full response with items', () => {
    const result = DiscoverResponseSchema.safeParse(MOCK_DISCOVER_RESPONSE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(3);
      expect(result.data.totalFound).toBe(3);
      expect(result.data.sourcesQueried).toContain('arxiv');
      expect(result.data.newItems).toBe(2);
    }
  });

  it('parses empty response', () => {
    const result = DiscoverResponseSchema.safeParse(MOCK_DISCOVER_EMPTY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(0);
      expect(result.data.newItems).toBe(0);
    }
  });

  it('parses response with failed sources', () => {
    const result = DiscoverResponseSchema.safeParse(MOCK_DISCOVER_WITH_FAILURES);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failedSources).toContain('github');
      expect(result.data.items).toHaveLength(1);
    }
  });

  it('validates item fields', () => {
    const result = DiscoverResponseSchema.safeParse(MOCK_DISCOVER_RESPONSE);
    expect(result.success).toBe(true);
    if (result.success) {
      const item = result.data.items[0];
      expect(item).toBeDefined();
      if (item) {
        expect(item.source).toBe('arxiv');
        expect(item.url).toContain('arxiv.org');
        expect(item.alreadyInRegistry).toBe(false);
        expect(item.relevanceScore).toBe(0.92);
      }
    }
  });
});

// ============================================================================
// research_add
// ============================================================================

describe('AddInputSchema', () => {
  it('accepts valid arxiv ID', () => {
    const result = AddInputSchema.safeParse({ arxivId: '2501.12345' });
    expect(result.success).toBe(true);
  });

  it('accepts with optional fields', () => {
    const result = AddInputSchema.safeParse({
      arxivId: '2501.12345',
      topic: 'routing',
      priority: 'P1',
      dryRun: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid arxiv ID format', () => {
    const result = AddInputSchema.safeParse({ arxivId: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid priority', () => {
    const result = AddInputSchema.safeParse({ arxivId: '2501.12345', priority: 'P5' });
    expect(result.success).toBe(false);
  });
});

describe('AddResponseSchema', () => {
  it('parses success response', () => {
    const result = AddResponseSchema.safeParse(MOCK_ADD_SUCCESS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.success).toBe(true);
      expect(result.data.paperId).toContain('arxiv-');
    }
  });

  it('parses dry run response', () => {
    const result = AddResponseSchema.safeParse(MOCK_ADD_DRY_RUN);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dryRun).toBe(true);
      expect(result.data.message).toContain('DRY RUN');
    }
  });

  it('parses failure response', () => {
    const result = AddResponseSchema.safeParse(MOCK_ADD_FAILURE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.success).toBe(false);
    }
  });
});

// ============================================================================
// research_analyze
// ============================================================================

describe('AnalyzeInputSchema', () => {
  it('accepts valid focus', () => {
    const result = AnalyzeInputSchema.safeParse({ focus: 'gaps' });
    expect(result.success).toBe(true);
  });

  it('accepts all focus values', () => {
    for (const focus of ['gaps', 'trends', 'priorities', 'stale', 'coverage']) {
      expect(AnalyzeInputSchema.safeParse({ focus }).success).toBe(true);
    }
  });

  it('rejects invalid focus', () => {
    const result = AnalyzeInputSchema.safeParse({ focus: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('AnalyzeResponseSchema', () => {
  it('parses gaps response with recommendations', () => {
    const result = AnalyzeResponseSchema.safeParse(MOCK_ANALYZE_GAPS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recommendations).toHaveLength(2);
      expect(result.data.success).toBe(true);
    }
  });

  it('parses trends response', () => {
    const result = AnalyzeResponseSchema.safeParse(MOCK_ANALYZE_TRENDS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus).toBe('trends');
    }
  });

  it('parses empty analysis', () => {
    const result = AnalyzeResponseSchema.safeParse(MOCK_ANALYZE_EMPTY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recommendations).toHaveLength(0);
    }
  });

  it('accepts analysis as any shape (unknown)', () => {
    const result = AnalyzeResponseSchema.safeParse({
      focus: 'gaps',
      success: true,
      analysis: 'plain string analysis',
      recommendations: [],
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// consensus_vote
// ============================================================================

describe('VoteInputSchema', () => {
  it('accepts minimal input', () => {
    const result = VoteInputSchema.safeParse({ proposal: 'Test proposal.' });
    expect(result.success).toBe(true);
  });

  it('accepts all strategies', () => {
    for (const strategy of ['simple_majority', 'supermajority', 'unanimous', 'proof_of_learning', 'higher_order']) {
      const r = VoteInputSchema.safeParse({ proposal: 'Test', strategy });
      expect(r.success).toBe(true);
    }
  });

  it('rejects empty proposal', () => {
    const result = VoteInputSchema.safeParse({ proposal: '' });
    expect(result.success).toBe(false);
  });

  it('rejects proposal over 4000 chars', () => {
    const result = VoteInputSchema.safeParse({ proposal: 'x'.repeat(4001) });
    expect(result.success).toBe(false);
  });
});

describe('VoteResponseSchema', () => {
  it('parses approved response', () => {
    const result = VoteResponseSchema.safeParse(MOCK_VOTE_APPROVED);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.decision).toBe('approved');
      expect(result.data.votes).toHaveLength(6);
      expect(result.data.voteCounts.approve).toBe(5);
    }
  });

  it('parses rejected response', () => {
    const result = VoteResponseSchema.safeParse(MOCK_VOTE_REJECTED);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.decision).toBe('rejected');
      expect(result.data.approvalPercentage).toBeLessThan(50);
    }
  });
});

// ============================================================================
// memory_query
// ============================================================================

describe('MemoryQueryInputSchema', () => {
  it('accepts valid query', () => {
    const result = MemoryQueryInputSchema.safeParse({ query: 'research decisions' });
    expect(result.success).toBe(true);
  });

  it('accepts all sources', () => {
    for (const source of ['session', 'belief', 'agentic', 'typed', 'all']) {
      const r = MemoryQueryInputSchema.safeParse({ query: 'test', source });
      expect(r.success).toBe(true);
    }
  });

  it('rejects empty query', () => {
    const result = MemoryQueryInputSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  it('rejects query over 500 chars', () => {
    const result = MemoryQueryInputSchema.safeParse({ query: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('MemoryQueryResponseSchema', () => {
  it('parses found results', () => {
    const result = MemoryQueryResponseSchema.safeParse(MOCK_MEMORY_FOUND);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.results).toHaveLength(2);
      expect(result.data.count).toBe(2);
      expect(result.data.source).toBe('all');
    }
  });

  it('parses empty result', () => {
    const result = MemoryQueryResponseSchema.safeParse(MOCK_MEMORY_EMPTY);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.results).toHaveLength(0);
      expect(result.data.count).toBe(0);
    }
  });

  it('validates result fields', () => {
    const result = MemoryQueryResponseSchema.safeParse(MOCK_MEMORY_FOUND);
    expect(result.success).toBe(true);
    if (result.success) {
      const match = result.data.results[0];
      expect(match).toBeDefined();
      if (match) {
        expect(match.source).toBe('session');
        expect(match.type).toBe('observation');
        expect(match.relevance).toBeGreaterThan(0);
      }
    }
  });
});

// ============================================================================
// research_query
// ============================================================================

describe('ResearchQueryInputSchema', () => {
  it('accepts all four actions', () => {
    for (const action of ['status', 'overlap', 'stats', 'search']) {
      expect(ResearchQueryInputSchema.safeParse({ action }).success).toBe(true);
    }
  });

  it('rejects invalid action', () => {
    expect(ResearchQueryInputSchema.safeParse({ action: 'invalid' }).success).toBe(false);
  });

  it('accepts overlap action with techniqueId and threshold', () => {
    const r = ResearchQueryInputSchema.safeParse({
      action: 'overlap',
      techniqueId: 'linucb-routing',
      threshold: 0.5,
    });
    expect(r.success).toBe(true);
  });

  it('rejects threshold out of range', () => {
    expect(
      ResearchQueryInputSchema.safeParse({ action: 'overlap', techniqueId: 'x', threshold: 1.5 })
        .success
    ).toBe(false);
    expect(
      ResearchQueryInputSchema.safeParse({ action: 'overlap', techniqueId: 'x', threshold: -0.1 })
        .success
    ).toBe(false);
  });

  it('accepts all status filter values', () => {
    for (const status of ['implemented', 'planned', 'not-started', 'rejected', 'all']) {
      expect(
        ResearchQueryInputSchema.safeParse({ action: 'status', status }).success
      ).toBe(true);
    }
  });

  it('rejects invalid status filter', () => {
    expect(
      ResearchQueryInputSchema.safeParse({ action: 'status', status: 'bogus' }).success
    ).toBe(false);
  });

  it('requires action field', () => {
    expect(ResearchQueryInputSchema.safeParse({}).success).toBe(false);
  });
});

describe('ResearchQueryResponseSchema', () => {
  it('parses stats response', () => {
    const r = ResearchQueryResponseSchema.safeParse(MOCK_QUERY_STATS);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.action).toBe('stats');
      expect(r.data.success).toBe(true);
    }
  });

  it('parses search response', () => {
    const r = ResearchQueryResponseSchema.safeParse(MOCK_QUERY_SEARCH);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.action).toBe('search');
    }
  });

  it('parses status response', () => {
    const r = ResearchQueryResponseSchema.safeParse(MOCK_QUERY_STATUS);
    expect(r.success).toBe(true);
  });

  it('parses error response (missing techniqueId for overlap)', () => {
    const r = ResearchQueryResponseSchema.safeParse(MOCK_QUERY_OVERLAP_MISSING_ID);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.success).toBe(false);
    }
  });

  it('accepts data as unknown shape', () => {
    const r = ResearchQueryResponseSchema.safeParse({
      action: 'stats',
      success: true,
      data: 'string data is fine',
    });
    expect(r.success).toBe(true);
  });
});

// ============================================================================
// research_synthesize
// ============================================================================

describe('ResearchSynthesizeInputSchema', () => {
  it('accepts empty input', () => {
    expect(ResearchSynthesizeInputSchema.safeParse({}).success).toBe(true);
  });

  it('accepts topic filter', () => {
    expect(
      ResearchSynthesizeInputSchema.safeParse({ topic: 'multi-agent-routing' }).success
    ).toBe(true);
  });

  it('rejects non-string topic', () => {
    expect(ResearchSynthesizeInputSchema.safeParse({ topic: 42 }).success).toBe(false);
  });
});

describe('ResearchSynthesizeResponseSchema', () => {
  it('parses full synthesis with clusters', () => {
    const r = ResearchSynthesizeResponseSchema.safeParse(MOCK_SYNTHESIZE_FULL);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.clusters).toHaveLength(1);
      expect(r.data.totalPapers).toBe(2);
      expect(r.data.alignmentSummary.implemented).toBe(1);
      expect(r.data.crossCuttingThemes).toContain('bandit-algorithms');
    }
  });

  it('parses empty synthesis', () => {
    const r = ResearchSynthesizeResponseSchema.safeParse(MOCK_SYNTHESIZE_EMPTY);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.clusters).toHaveLength(0);
      expect(r.data.totalPapers).toBe(0);
    }
  });

  it('validates cluster alignedTechniques', () => {
    const r = ResearchSynthesizeResponseSchema.safeParse(MOCK_SYNTHESIZE_FULL);
    expect(r.success).toBe(true);
    if (r.success) {
      const cluster = r.data.clusters[0];
      expect(cluster).toBeDefined();
      if (cluster) {
        expect(cluster.alignedTechniques).toHaveLength(2);
        expect(cluster.alignedTechniques[0]?.status).toBe('implemented');
      }
    }
  });

  it('rejects invalid alignment status', () => {
    const bad = {
      ...MOCK_SYNTHESIZE_FULL,
      clusters: [
        {
          ...MOCK_SYNTHESIZE_FULL.clusters[0],
          alignedTechniques: [{ technique: 't', status: 'bogus' }],
        },
      ],
    };
    expect(ResearchSynthesizeResponseSchema.safeParse(bad).success).toBe(false);
  });
});

// ============================================================================
// research_add_source
// ============================================================================

describe('ResearchAddSourceInputSchema', () => {
  it('accepts minimal input', () => {
    const r = ResearchAddSourceInputSchema.safeParse({
      url: 'https://github.com/owner/repo',
      name: 'My Repo',
      type: 'open_source_repo',
    });
    expect(r.success).toBe(true);
  });

  it('accepts all source types', () => {
    for (const type of [
      'product_docs',
      'specification',
      'research_blog',
      'code_analysis',
      'open_source_repo',
    ]) {
      const r = ResearchAddSourceInputSchema.safeParse({
        url: 'https://example.com',
        name: 'n',
        type,
      });
      expect(r.success).toBe(true);
    }
  });

  it('rejects invalid source type', () => {
    expect(
      ResearchAddSourceInputSchema.safeParse({
        url: 'https://example.com',
        name: 'n',
        type: 'podcast',
      }).success
    ).toBe(false);
  });

  it('accepts all verdict values', () => {
    for (const verdict of ['adopted', 'partially_adopted', 'rejected', 'monitoring', 'planned']) {
      const r = ResearchAddSourceInputSchema.safeParse({
        url: 'https://example.com',
        name: 'n',
        type: 'research_blog',
        verdict,
      });
      expect(r.success).toBe(true);
    }
  });

  it('rejects empty url', () => {
    expect(
      ResearchAddSourceInputSchema.safeParse({
        url: '',
        name: 'n',
        type: 'research_blog',
      }).success
    ).toBe(false);
  });

  it('rejects empty name', () => {
    expect(
      ResearchAddSourceInputSchema.safeParse({
        url: 'https://example.com',
        name: '',
        type: 'research_blog',
      }).success
    ).toBe(false);
  });

  it('rejects more than 5 topics', () => {
    expect(
      ResearchAddSourceInputSchema.safeParse({
        url: 'https://example.com',
        name: 'n',
        type: 'research_blog',
        topics: ['a', 'b', 'c', 'd', 'e', 'f'],
      }).success
    ).toBe(false);
  });

  it('rejects more than 10 tags', () => {
    expect(
      ResearchAddSourceInputSchema.safeParse({
        url: 'https://example.com',
        name: 'n',
        type: 'research_blog',
        tags: Array(11).fill('x'),
      }).success
    ).toBe(false);
  });

  it('accepts full input with quality_signals', () => {
    const r = ResearchAddSourceInputSchema.safeParse({
      url: 'https://github.com/owner/repo',
      name: 'Repo',
      type: 'open_source_repo',
      vendor: 'OrgName',
      topics: ['routing', 'consensus'],
      tags: ['multi-agent', 'typescript'],
      quality_signals: {
        stars_at_review: 120,
        language: 'TypeScript',
        has_tests: true,
        has_docs: true,
        has_paper: false,
      },
      techniques_extracted: ['linucb'],
      verdict: 'adopted',
      verdict_notes: 'Integrated via composite-router.',
      dryRun: false,
    });
    expect(r.success).toBe(true);
  });
});

describe('ResearchAddSourceResponseSchema', () => {
  it('parses success response', () => {
    const r = ResearchAddSourceResponseSchema.safeParse(MOCK_ADD_SOURCE_SUCCESS);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.success).toBe(true);
      expect(r.data.evidence_tier).toBe('high');
      expect(r.data.quality_score).toBe(8);
    }
  });

  it('parses dry run response', () => {
    const r = ResearchAddSourceResponseSchema.safeParse(MOCK_ADD_SOURCE_DRY_RUN);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.dryRun).toBe(true);
      expect(r.data.evidence_tier).toBe('medium');
      expect(r.data.message).toContain('DRY RUN');
    }
  });

  it('parses duplicate-source failure', () => {
    const r = ResearchAddSourceResponseSchema.safeParse(MOCK_ADD_SOURCE_DUPLICATE);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.success).toBe(false);
      expect(r.data.message).toContain('already exists');
    }
  });

  it('rejects invalid evidence_tier', () => {
    const bad = { ...MOCK_ADD_SOURCE_SUCCESS, evidence_tier: 'unknown' };
    expect(ResearchAddSourceResponseSchema.safeParse(bad).success).toBe(false);
  });
});
