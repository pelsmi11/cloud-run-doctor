import { z } from "zod";
import type { InvestigationScope } from "./argument-policy";

export interface Evidence {
  source: "cloud_run" | "logging";
  observedAt?: string;
  service?: string;
  region?: string;
  ready?: boolean;
  status?: string;
  requestId?: string;
  sessionId?: string;
  event?: string;
  route?: string;
  httpStatus?: number;
  errorType?: string;
  databaseCode?: string;
  petTypeCode?: string;
  durationMs?: number;
  truncated?: boolean;
}

const evidenceSchema = z.object({
  source: z.enum(["cloud_run", "logging"]),
  observedAt: z.string().datetime({ offset: true }).optional(),
  service: z.string().max(63).optional(),
  region: z.string().max(32).optional(),
  ready: z.boolean().optional(),
  status: z.string().max(64).optional(),
  requestId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  event: z.string().max(128).optional(),
  route: z.string().max(256).optional(),
  httpStatus: z.number().int().optional(),
  errorType: z.string().max(128).optional(),
  databaseCode: z.string().max(16).optional(),
  petTypeCode: z.string().max(30).optional(),
  durationMs: z.number().optional(),
  truncated: z.boolean().optional(),
}).strict();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const copyIfDefined = (
  target: Record<string, unknown>,
  key: string,
  value: unknown
): void => {
  if (value !== undefined && value !== null) {
    target[key] = value;
  }
};

export const normalizeLoggingEntry = (rawEntry: unknown): Evidence => {
  if (!isRecord(rawEntry)) {
    throw new Error("Invalid Logging entry");
  }

  const resource = isRecord(rawEntry.resource) ? rawEntry.resource : {};
  const labels = isRecord(resource.labels) ? resource.labels : {};
  const jsonPayload = isRecord(rawEntry.jsonPayload) ? rawEntry.jsonPayload : {};
  const httpRequest = isRecord(rawEntry.httpRequest) ? rawEntry.httpRequest : {};
  const normalized: Record<string, unknown> = { source: "logging" };

  copyIfDefined(normalized, "observedAt", rawEntry.timestamp);
  copyIfDefined(normalized, "service", labels.service_name);
  copyIfDefined(normalized, "region", labels.location);
  copyIfDefined(normalized, "status", jsonPayload.status);
  copyIfDefined(normalized, "requestId", jsonPayload.requestId);
  copyIfDefined(normalized, "sessionId", jsonPayload.sessionId);
  copyIfDefined(normalized, "event", jsonPayload.event);
  copyIfDefined(normalized, "route", jsonPayload.route);
  copyIfDefined(
    normalized,
    "httpStatus",
    jsonPayload.httpStatus ?? httpRequest.status
  );
  copyIfDefined(normalized, "errorType", jsonPayload.errorType);
  copyIfDefined(normalized, "databaseCode", jsonPayload.databaseCode);
  copyIfDefined(normalized, "petTypeCode", jsonPayload.petTypeCode);
  copyIfDefined(normalized, "durationMs", jsonPayload.durationMs);

  return mapSingleEvidence(normalized);
};

export const normalizeCloudRunService = (
  rawService: unknown,
  scope: InvestigationScope,
  observedAt: string
): Evidence => {
  if (!isRecord(rawService)) {
    throw new Error("Invalid Cloud Run service response");
  }

  const conditions = Array.isArray(rawService.conditions)
    ? rawService.conditions.filter(isRecord)
    : [];
  const terminalCondition = isRecord(rawService.terminalCondition)
    ? rawService.terminalCondition
    : undefined;
  const readyCondition =
    terminalCondition?.type === "Ready"
      ? terminalCondition
      : conditions.find((condition) => condition.type === "Ready");
  const state = readyCondition?.state ?? readyCondition?.status;
  const ready =
    state === true || state === "True" || state === "CONDITION_SUCCEEDED";

  return mapSingleEvidence({
    source: "cloud_run",
    observedAt,
    service: scope.service,
    region: scope.region,
    ready,
    status: typeof state === "string" ? state : ready ? "Ready" : "NotReady",
  });
};

function sanitizeRaw(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null) throw new Error("Invalid evidence payload");
  const raw = input as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  const keys = ["source", "observedAt", "service", "region", "ready", "status", "requestId", "sessionId", "event", "route", "httpStatus", "errorType", "databaseCode", "petTypeCode", "durationMs", "truncated"];
  for (const k of keys) {
    if (k in raw) allowed[k] = raw[k];
  }
  // Discard nested unknown properties: we already only copy top level allowed, nested unknown not relevant
  // But if any allowed value is object, reject
  for (const [k, v] of Object.entries(allowed)) {
    if (v !== null && typeof v === "object") {
      throw new Error(`Invalid evidence field object: ${k}`);
    }
  }
  return allowed;
}

export function mapSingleEvidence(raw: unknown): Evidence {
  const sanitized = sanitizeRaw(raw);
  const parsed = evidenceSchema.safeParse(sanitized);
  if (!parsed.success) {
    // Do not include raw in error
    throw new Error("Evidence validation failed");
  }
  return parsed.data as Evidence;
}

export interface MapCollectionResult {
  evidence: Evidence[];
  truncated: boolean;
}

export function mapEvidenceCollection(
  rawEntries: unknown[],
  scope: InvestigationScope,
  opts?: { hasNextPageToken?: boolean }
): MapCollectionResult {
  const rawCount = rawEntries.length;
  const scopeLimit = scope.query.maxEntries;
  const absoluteRawLimit = 500;
  const hasNextPageToken = opts?.hasNextPageToken === true;

  if (rawCount > absoluteRawLimit) {
    throw new Error("Protocol error: rawCount exceeds absolute limit");
  }

  // Validate each entry via mapper (will throw on field limit)
  const allEvidence: Evidence[] = rawEntries.map((r) => mapSingleEvidence(r));

  // Determine truncated per FR-024
  let truncated = false;
  if (rawCount <= absoluteRawLimit) {
    truncated = hasNextPageToken || rawCount >= scopeLimit;
  }

  // Output never exceeds scopeLimit
  let output = allEvidence;
  if (allEvidence.length > scopeLimit) {
    // Deterministic normalization: first scopeLimit ordered asc if required
    // For session, ensure asc order; for now assume input already ordered, take first scopeLimit
    output = allEvidence.slice(0, scopeLimit);
    truncated = true;
  } else if (truncated && allEvidence.length === scopeLimit) {
    // already true
  } else if (rawCount < scopeLimit && !hasNextPageToken) {
    truncated = false;
  }

  // If truncated due to hasNextPageToken, ensure flag
  if (hasNextPageToken) truncated = true;

  // Add truncated flag to each? No, result truncated indicates collection truncated
  // Evidence individual truncated field is for mapper's own truncated indicator, not collection
  return { evidence: output, truncated };
}

export function createSafeSummary(evidence: Evidence[], truncated: boolean): string {
  let summary = `${evidence.length} entries found`;
  if (truncated) summary += ", truncated";
  const reptile = evidence.filter((e) => e.databaseCode === "23503" || e.errorType === "ForeignKeyViolation" || e.petTypeCode === "REPTILE").length;
  if (reptile > 0) summary += `, ${reptile} with REPTILE/23503`;
  return summary.slice(0, 300);
}

// Ensure no JSON.stringify(rawPayload) in errors – we never include raw
