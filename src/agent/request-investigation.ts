import type { InvestigationAdapters, InvestigationResult } from "@/interface";
import type { InvestigationScope } from "@/mcp/argument-policy";

import { classifyPattern } from "./general-investigation";

export const investigateRequest = async (
  scope: InvestigationScope,
  adapters: InvestigationAdapters,
  signal?: AbortSignal
): Promise<InvestigationResult> => {
  if (scope.query.kind !== "request") {
    throw new Error("Invalid scope for request investigation");
  }

  const cloudRun = await adapters.getService(scope, signal);
  const logging = await adapters.queryLogs(scope, signal);

  return {
    scopeKind: scope.query.kind,
    cloudRun,
    evidence: logging.evidence,
    truncated: logging.truncated,
    pattern: classifyPattern(logging.evidence, logging.truncated),
    windowMinutes: scope.query.windowMinutes,
    maxEntries: scope.query.maxEntries,
  };
};
