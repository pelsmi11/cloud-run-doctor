# Cloud Run Doctor — Code Tour

**Repo:** `cloud-run-doctor/` | **Spec:** `004-cloud-run-doctor-diagnosis` | **Date:** 2026-08-24
**Stack:** Next.js 16.3.1 `runtime=nodejs`, ADK 2.0.0, Gemini `gemini-3.7-flash` `ThinkingLevel.LOW`, MCP Streamable HTTP, Streamdown 2.5.0

## Flow

```
question → QueryClassification (validation.ts) → InvestigationScope (argument-policy.ts) → LlmAgent (doctor.agent.ts) → local capability → McpArgumentPolicy → adapter MCP (cloud-run.ts/logging.ts) → MCP raw unknown → Evidence mapper (evidence-mapper.ts) → classifier/result → LlmAgent → SSE (stream.ts) → Streamdown (StreamdownRenderer.tsx) → UI
```

ToolFilter limits names; McpArgumentPolicy validates args server-owned before `tools/call`. Evidence never exceeds `scopeLimit`; `hasNextPageToken` never leaves mapper.

## File-by-file

- `src/lib/env.ts` — Zod FR-048 canonical config, HTTPS without creds/fragment, ranges 60/20 & 1440/100, `ThinkingLevel.LOW` enum via `generateContentConfig.thinkingConfig.thinkingLevel`, lazy `getEnv()` no side effects at import, ignores `GOOGLE_API_KEY`.
- `src/lib/validation.ts` — `chatRequestSchema` 1..4000 + `locale es|en`, `QueryClassification` 9-step FR-040: labels `\b(?:request\s*id|support\s*id)\b` / `\b(?:session\s*id|session)\b` case-insensitive ≤20 chars `[:=#-]`, priority: malformed→mixed→multiple→deduplicate→session/request→isolated→general, `invalid`→400 no MCP.
- `src/lib/logger.ts` — accepts only `Evidence` normalized or `LogSummary`, never raw MCP, tokens, cookies, headers, `DATABASE_URL`; sanitizes to JSON with `doctorRequestId===supportId===investigationId`.
- `src/lib/stream.ts` — SSE `data: JSON\n\n` with 7 events: `investigation-started` first before Gemini/MCP, `status`, `tool-start`, `tool-result-summary` (≤300 chars), `text-delta`, `error` (fatal only, with `supportId`), `done`; `abort→cancelled` no terminal; `parseSse` handles split chunks.
- `src/mcp/auth.ts` — `GoogleAuth` with `run.readonly`/`logging.read`, `Authorization` + `x-goog-user-project`, no token persistence, refresh via `getRequestHeaders()`.
- `src/mcp/argument-policy.ts` — `InvestigationScope` immutable `pawpass-gdg-demo/us-central1/pawpass` + variant 60/20 or 1440/100, `buildLoggingArgs`/`buildCloudRunArgs` from server-owned, `revalidate*` before `tools/call`, rejects model overrides.
- `src/mcp/evidence-mapper.ts` — `unknown→Evidence` whitelist, per-field maxima 63/32/64/128/256/128/16, `observedAt` `datetime({offset:true})`, `verifiedOn` `YYYY-MM-DD`, `rawCount` vs `scopeLimit` vs `500`, `truncated = hasNextPageToken||rawCount>=scopeLimit`, output ≤`scopeLimit`, `500/500→true`, `501→error`, `nextPageToken` private.
- `src/mcp/allowlist.ts` — `McpAllowlist` with `verifiedOn` per server, empty until real `tools/list`, `toolFilter` string[].
- `src/mcp/cloud-run.ts` / `logging.ts` — adapters with ADC, timeout 15000, `toolFilter` real, revalidate before `tools/call`, `unknown→Evidence`, `MCPToolset.close()` in `finally`, transport injectable for tests.
- `src/mcp/index.ts` — barrel.
- `src/agent/instruction.ts` — SRE 6 sections, no invention, `23503` fact vs desync probable.
- `src/agent/doctor.agent.ts` — single `LlmAgent` `doctor`, model `gemini-3.7-flash`, `ThinkingLevel.LOW`, one `FunctionTool` `investigate` closed over `Scope`, schema no sensitive args, never `MCPToolset`.
- `src/agent/runner.ts` — `InMemoryRunner` per request, `runInvestigation` streams SSE: `investigation-started` first, `status`/`tool-*` from Evidence, `text-delta` Gemini narrative, `done` vs `error` exclusive, `abort→cancelled` without terminal, `close()` in `finally`.
- `src/agent/request-investigation.ts` / `session-investigation.ts` / `general-investigation.ts` — local capabilities closed over scope, use policy→adapter→mapper→`Evidence` sorted asc for session, `classifyPattern` pure outside Gemini, `confidenceReduced` from `truncated`.
- `src/app/api/chat/route.ts` — `runtime=nodejs`, `maxDuration=300`, generates `doctorRequestId` before parse, `supportId===investigationId===doctorRequestId`, Zod + `QueryClassification` `invalid`→400 JSON no SSE/MCP, otherwise `runInvestigation` → `text/event-stream` with required headers, ignores `Cookie`.
- `src/hooks/useChatStream.ts` — client `isInvestigating` before first `await` via sync state + `useEffect` observing `pendingMessage`, single `fetch` even with StrictMode, blocked second send, `AbortController`, `cancelled` keeps partial, no `flushSync`.
- `src/components/chat/ChatView.tsx` — history in memory of current locale instance, selector disabled `investigating`/`partial`, re-enabled after terminal, change after terminal → empty conversation, no `localStorage`.
- `src/components/chat/ChatInput.tsx` — textarea + button, trim, Enter, blocked when empty/disabled, no queue.
- `src/components/chat/ProgressPanel.tsx` — `status`/`tool-start`/`tool-result-summary` only from Evidence, no CoT.
- `src/components/chat/MessageBubble.tsx` — copy via `navigator.clipboard.writeText` with fallback (no `execCommand`), selectable.
- `src/components/chat/StreamdownRenderer.tsx` — `Streamdown` 2.5.0 + `@streamdown/code` 1.1.1, `parseIncompleteMarkdown`, `urlTransform` https/http only.
- `src/components/ui/textarea.tsx` / `sonner.tsx` — shadcn primitives.
- `src/i18n/routing.ts` — `locales ["es","en"]`, `defaultLocale "es"`, `localePrefix always`.
- `src/app/globals.css` — `@import "streamdown/styles.css"` + `@source` for Streamdown, HSL slate tokens.
- `scripts/verify-adk.ts` — spike compiles ADK types, `FunctionTool` local, `MCPToolset` StreamableHTTP, `ThinkingLevel.LOW`, `InMemoryRunner` abortSignal; no network.
- `scripts/list-mcp-tools.ts` / `verify-mcp-arguments.ts` — manual outside `pnpm verify`, record `verifiedOn`.

## Security

- `toolFilter` limits names; `McpArgumentPolicy` enforces args server-owned.
- Payload MCP `unknown` → mapper → `Evidence` before Gemini/logs/SSE/UI.
- IAM runtime `run.viewer/logging.viewer/mcp.toolUser/aiplatform.user`, operator `run.invoker`, `owner/editor/run.admin` prohibited.
