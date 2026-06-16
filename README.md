# research-to-action

Research-driven decision pipeline for [nexus-agents](https://github.com/williamzujkowski/nexus-agents). Chains 5 MCP tools into an automated research workflow.

## Pipeline

```
research_discover → research_add → research_analyze → consensus_vote → memory_query
```

1. **Discover** papers on a topic from arXiv, GitHub, Semantic Scholar
2. **Add** discovered papers to the research registry
3. **Analyze** the registry for gaps, trends, and priorities
4. **Vote** on research direction using multi-model consensus
5. **Store** the decision in memory for cross-session persistence

## Quick start

```bash
pnpm install
pnpm test        # Run 75 unit tests
pnpm typecheck   # TypeScript strict mode
pnpm build       # Compile to dist/
```

## Usage as a library

```typescript
import { runResearchPipeline, generateReport } from 'research-to-action';
import type { ToolCaller } from 'research-to-action';

const caller: ToolCaller = {
  call: async (tool, args) => await mcpClient.callTool(tool, args),
};

const result = await runResearchPipeline(caller, {
  topic: 'multi-agent orchestration',
});

console.log(generateReport(result, 'markdown'));
```

## MCP tools covered

| Tool | Purpose | Safety |
|------|---------|--------|
| `research_discover` | Find papers from external sources | Read-only search |
| `research_add` | Add papers to registry | Uses `dryRun=true` by default |
| `research_analyze` | Analyze registry for gaps/trends | Read-only analysis |
| `consensus_vote` | Multi-model voting on direction | Simulated votes in test mode |
| `memory_query` | Query memory for stored decisions | Read-only query |

## Report formats

- **markdown** — Tables with discovery results, vote outcomes, and final decision
- **json** — Full pipeline result as structured JSON
- **text** — Compact terminal output

## Project structure

```
src/
  types.ts              # Zod schemas matching live MCP responses
  fixtures/
    mock-responses.ts   # Mock data for all 5 tools
  pipeline.ts           # Research pipeline (discover → add → analyze → vote → store)
  reporter.ts           # Report formatter (markdown/json/text)
  index.ts              # Public API exports
```

## License

MIT
