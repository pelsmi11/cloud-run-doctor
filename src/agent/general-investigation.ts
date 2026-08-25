import type {
  InvestigationAdapters,
  InvestigationResult,
  PatternResult,
} from "@/interface";
import type { InvestigationScope } from "@/mcp/argument-policy";
import type { Evidence } from "@/mcp/evidence-mapper";

export const classifyPattern = (
  evidence: Evidence[],
  truncated: boolean
): PatternResult => {
  let reptile = 0;
  let outage = 0;
  let unknown = 0;

  for (const entry of evidence) {
    const isReptile =
      entry.databaseCode === "23503" ||
      entry.errorType === "ForeignKeyViolation" ||
      entry.petTypeCode === "REPTILE";
    const isOutage =
      entry.httpStatus === 503 || entry.errorType === "DatabaseUnavailableError";

    if (isOutage) outage += 1;
    else if (isReptile) reptile += 1;
    else unknown += 1;
  }

  const knownTotal = reptile + outage;
  let dominant: PatternResult["dominant"] = "no-dominant";
  if (knownTotal >= 2) {
    if (reptile > outage) dominant = "reptile";
    else if (outage > reptile) dominant = "outage";
    else dominant = "mixed";
  } else if (knownTotal === 1) {
    dominant = "mixed";
  }

  return {
    reptile,
    outage,
    unknown,
    knownTotal,
    dominant,
    confidenceReduced: truncated || unknown > knownTotal,
    truncated,
  };
};

export const investigateGeneral = async (
  scope: InvestigationScope,
  adapters: InvestigationAdapters,
  signal?: AbortSignal
): Promise<InvestigationResult> => {
  if (scope.query.kind !== "general") {
    throw new Error("Invalid scope for general investigation");
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
