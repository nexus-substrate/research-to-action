/**
 * Report formatter for research-to-action pipeline results.
 */

import type { PipelineResult } from './types.js';

export type ReportFormat = 'markdown' | 'json' | 'text';

export function generateReport(
  result: PipelineResult,
  format: ReportFormat = 'markdown',
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2);
    case 'text':
      return formatText(result);
    case 'markdown':
      return formatMarkdown(result);
  }
}

function formatText(r: PipelineResult): string {
  const lines: string[] = [
    `Research Pipeline Report: ${r.decision.topic}`,
    `Papers found: ${r.decision.papersFound}`,
    `Papers added: ${r.decision.papersAdded}`,
    `Vote: ${r.decision.voteDecision} (${r.decision.voteApproval}%)`,
    `Memory stored: ${r.decision.memoryStored}`,
  ];

  if (r.papers.length > 0) {
    lines.push('', 'Papers:');
    for (const p of r.papers) {
      const status = p.addResult ? ` [${p.addResult.success ? 'added' : 'failed'}]` : '';
      const rel = p.relevance !== undefined ? ` (${(p.relevance * 100).toFixed(0)}%)` : '';
      lines.push(`  - ${p.title}${rel}${status}`);
    }
  }

  if (r.analysis) {
    lines.push('', `Analysis (${r.analysis.focus}):`);
    if (r.analysis.recommendations.length > 0) {
      for (const rec of r.analysis.recommendations) {
        lines.push(`  - ${rec}`);
      }
    }
  }

  if (r.errors.length > 0) {
    lines.push('', 'Errors:');
    for (const e of r.errors) {
      lines.push(`  - ${e}`);
    }
  }

  return lines.join('\n');
}

function formatMarkdown(r: PipelineResult): string {
  const lines: string[] = [
    `# Research Pipeline: ${r.decision.topic}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Papers Found | ${r.decision.papersFound} |`,
    `| Papers Added | ${r.decision.papersAdded} |`,
    `| Vote Decision | ${r.decision.voteDecision} |`,
    `| Approval | ${r.decision.voteApproval}% |`,
    `| Memory Stored | ${r.decision.memoryStored ? 'Yes' : 'No'} |`,
  ];

  if (r.papers.length > 0) {
    lines.push('', '## Papers', '');
    for (const p of r.papers) {
      const badge = p.addResult ? ` \`${p.addResult.success ? 'added' : 'failed'}\`` : '';
      const rel = p.relevance !== undefined ? ` — ${(p.relevance * 100).toFixed(0)}% relevant` : '';
      lines.push(`- **${p.title}**${rel}${badge}`);
    }
  }

  if (r.analysis) {
    lines.push('', `## Analysis (${r.analysis.focus})`, '');
    if (r.analysis.recommendations.length > 0) {
      lines.push('### Recommendations', '');
      for (const rec of r.analysis.recommendations) {
        lines.push(`1. ${rec}`);
      }
    }
  }

  if (r.errors.length > 0) {
    lines.push('', '## Errors', '');
    for (const e of r.errors) {
      lines.push(`- ${e}`);
    }
  }

  return lines.join('\n');
}
