#!/usr/bin/env tsx
/**
 * Run the research pipeline against a live nexus-agents MCP server.
 *
 * Prerequisites:
 *   - nexus-agents MCP server running
 *   - Environment: NEXUS_LIVE=true
 *
 * Usage:
 *   NEXUS_LIVE=true npx tsx src/run-live.ts
 *   NEXUS_LIVE=true REPORT_FORMAT=json npx tsx src/run-live.ts
 */

import { runResearchPipeline } from './pipeline.js';
import { generateReport } from './reporter.js';
import { isLiveMode } from './live-caller.js';
import type { ReportFormat } from './reporter.js';
import type { ToolCaller } from './pipeline.js';

async function main(): Promise<void> {
  if (!isLiveMode()) {
    console.error('Set NEXUS_LIVE=true to run against a live MCP server.');
    console.error('Usage: NEXUS_LIVE=true npx tsx src/run-live.ts');
    process.exit(1);
  }

  let caller: ToolCaller;
  try {
    const bridgePath = './live-bridge.js';
    const mod: Record<string, unknown> = await import(bridgePath);
    const factory = mod['createMcpCaller'] as (() => Promise<ToolCaller>) | undefined;
    if (typeof factory !== 'function') {
      throw new Error('live-bridge.ts must export createMcpCaller()');
    }
    caller = await factory();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`Failed to load live bridge: ${msg}`);
    console.error('Create src/live-bridge.ts that exports createMcpCaller().');
    process.exit(1);
  }

  console.log('Running research-to-action pipeline against live MCP server...\n');

  const topic = process.env['RESEARCH_TOPIC'] ?? 'multi-agent orchestration';
  const result = await runResearchPipeline(caller, { topic });

  const format = (process.env['REPORT_FORMAT'] ?? 'text') as ReportFormat;
  console.log(generateReport(result, format));

  const hasFailures = result.errors.length > 0;
  process.exit(hasFailures ? 1 : 0);
}

void main();
