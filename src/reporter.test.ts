/**
 * Tests for the report formatter.
 */

import { describe, it, expect } from 'vitest';
import { generateReport } from './reporter.js';
import type { PipelineResult } from './types.js';
import { MOCK_ANALYZE_GAPS } from './fixtures/mock-responses.js';

const SAMPLE_RESULT: PipelineResult = {
  papers: [
    { title: 'Paper A', url: 'https://arxiv.org/abs/2501.12345', source: 'arxiv', relevance: 0.92, addResult: { success: true, paperId: 'arxiv-2501.12345' } },
    { title: 'Paper B', url: 'https://arxiv.org/abs/2502.67890', source: 'arxiv', relevance: 0.81 },
  ],
  analysis: MOCK_ANALYZE_GAPS,
  decision: {
    topic: 'multi-agent orchestration',
    papersFound: 3,
    papersAdded: 1,
    gapAnalysis: 'Search for papers on agent memory persistence; Add lifecycle management research',
    voteDecision: 'approved',
    voteApproval: 83.3,
    memoryStored: true,
  },
  errors: [],
};

const ERROR_RESULT: PipelineResult = {
  papers: [],
  analysis: null,
  decision: {
    topic: 'test',
    papersFound: 0,
    papersAdded: 0,
    gapAnalysis: 'skipped',
    voteDecision: 'rejected',
    voteApproval: 16.7,
    memoryStored: false,
  },
  errors: ['analyze failed: timeout', 'memory failed: backend down'],
};

describe('generateReport', () => {
  describe('markdown format', () => {
    it('includes title and summary table', () => {
      const report = generateReport(SAMPLE_RESULT, 'markdown');
      expect(report).toContain('# Research Pipeline: multi-agent orchestration');
      expect(report).toContain('| Papers Found | 3 |');
      expect(report).toContain('| Vote Decision | approved |');
      expect(report).toContain('| Memory Stored | Yes |');
    });

    it('includes papers section', () => {
      const report = generateReport(SAMPLE_RESULT, 'markdown');
      expect(report).toContain('## Papers');
      expect(report).toContain('**Paper A**');
      expect(report).toContain('`added`');
      expect(report).toContain('92% relevant');
    });

    it('includes analysis and recommendations', () => {
      const report = generateReport(SAMPLE_RESULT, 'markdown');
      expect(report).toContain('## Analysis (gaps)');
      expect(report).toContain('### Recommendations');
      expect(report).toContain('Search for papers');
    });

    it('includes errors when present', () => {
      const report = generateReport(ERROR_RESULT, 'markdown');
      expect(report).toContain('## Errors');
      expect(report).toContain('analyze failed: timeout');
    });

    it('omits papers section when empty', () => {
      const report = generateReport(ERROR_RESULT, 'markdown');
      expect(report).not.toContain('## Papers');
    });

    it('defaults to markdown format', () => {
      const report = generateReport(SAMPLE_RESULT);
      expect(report).toContain('# Research Pipeline');
    });
  });

  describe('json format', () => {
    it('produces valid JSON', () => {
      const report = generateReport(SAMPLE_RESULT, 'json');
      const parsed = JSON.parse(report) as PipelineResult;
      expect(parsed.decision.topic).toBe('multi-agent orchestration');
      expect(parsed.papers).toHaveLength(2);
    });
  });

  describe('text format', () => {
    it('includes key metrics', () => {
      const report = generateReport(SAMPLE_RESULT, 'text');
      expect(report).toContain('Papers found: 3');
      expect(report).toContain('Papers added: 1');
      expect(report).toContain('Vote: approved (83.3%)');
      expect(report).toContain('Memory stored: true');
    });

    it('lists papers with relevance and status', () => {
      const report = generateReport(SAMPLE_RESULT, 'text');
      expect(report).toContain('Paper A');
      expect(report).toContain('92%');
      expect(report).toContain('[added]');
    });

    it('shows errors', () => {
      const report = generateReport(ERROR_RESULT, 'text');
      expect(report).toContain('Errors:');
      expect(report).toContain('memory failed: backend down');
    });
  });
});
