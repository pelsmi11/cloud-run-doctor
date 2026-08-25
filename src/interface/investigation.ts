import type { InvestigationScope } from "@/mcp/argument-policy";
import type { Evidence } from "@/mcp/evidence-mapper";

export interface PatternResult {
  reptile: number;
  outage: number;
  unknown: number;
  knownTotal: number;
  dominant: "reptile" | "outage" | "mixed" | "no-dominant";
  confidenceReduced: boolean;
  truncated: boolean;
}

export interface InvestigationResult {
  scopeKind: InvestigationScope["query"]["kind"];
  cloudRun: Evidence;
  evidence: Evidence[];
  truncated: boolean;
  pattern: PatternResult;
  windowMinutes: number;
  maxEntries: number;
}

export interface InvestigationAdapters {
  getService: (
    scope: InvestigationScope,
    signal?: AbortSignal
  ) => Promise<Evidence>;
  queryLogs: (
    scope: InvestigationScope,
    signal?: AbortSignal
  ) => Promise<{ evidence: Evidence[]; truncated: boolean }>;
}
