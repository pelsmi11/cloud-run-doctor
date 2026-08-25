import type { InvestigationAdapters, InvestigationResult } from "@/interface";
import type { InvestigationScope } from "@/mcp/argument-policy";

import { classifyPattern } from "./general-investigation";

export const investigateSession = async (
  scope: InvestigationScope,
  adapters: InvestigationAdapters,
  signal?: AbortSignal
): Promise<InvestigationResult> => {
  if (scope.query.kind !== "session") {
    throw new Error("Invalid scope for session investigation");
  }

  const cloudRun = await adapters.getService(scope, signal);
  const logging = await adapters.queryLogs(scope, signal);
  const evidence = [...logging.evidence].sort((left, right) =>
    (left.observedAt ?? "").localeCompare(right.observedAt ?? "")
  );

  return {
    scopeKind: scope.query.kind,
    cloudRun,
    evidence,
    truncated: logging.truncated,
    pattern: classifyPattern(evidence, logging.truncated),
    windowMinutes: scope.query.windowMinutes,
    maxEntries: scope.query.maxEntries,
  };
};
