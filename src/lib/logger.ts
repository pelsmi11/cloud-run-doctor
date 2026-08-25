export interface LogEvidence {
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

export interface LogSummary {
  summary: string;
  truncated?: boolean;
}

type AllowedLogInput = LogEvidence | LogEvidence[] | LogSummary;

const allowedEvidenceKeys = new Set([
  "source",
  "observedAt",
  "service",
  "region",
  "ready",
  "status",
  "requestId",
  "sessionId",
  "event",
  "route",
  "httpStatus",
  "errorType",
  "databaseCode",
  "petTypeCode",
  "durationMs",
  "truncated",
]);

function isEvidence(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const rec = obj as Record<string, unknown>;
  if (!("source" in rec)) return false;
  if (rec["source"] !== "cloud_run" && rec["source"] !== "logging") return false;
  // Check only allowed keys
  for (const k of Object.keys(rec)) {
    if (!allowedEvidenceKeys.has(k)) return false;
  }
  return true;
}

function sanitizeEvidence(ev: LogEvidence): LogEvidence {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(ev as unknown as Record<string, unknown>)) {
    if (allowedEvidenceKeys.has(k)) {
      out[k] = (ev as unknown as Record<string, unknown>)[k];
    }
  }
  return out as unknown as LogEvidence;
}

export interface StructuredLog {
  severity: "INFO" | "WARN" | "ERROR";
  message: string;
  doctorRequestId: string;
  supportId: string;
  investigationId: string;
  evidence?: LogEvidence | LogEvidence[];
  summary?: string;
  truncated?: boolean;
  durationMs?: number;
}

export function createLogger(doctorRequestId: string) {
  const supportId = doctorRequestId;
  const investigationId = doctorRequestId;

  function log(entry: { severity: StructuredLog["severity"]; message: string; evidence?: AllowedLogInput; summary?: string; durationMs?: number }) {
    const base: StructuredLog = {
      severity: entry.severity,
      message: entry.message,
      doctorRequestId,
      supportId,
      investigationId,
    };
    if (entry.evidence !== undefined) {
      if (Array.isArray(entry.evidence)) {
        const sanitized = entry.evidence.filter(isEvidence).map(sanitizeEvidence);
        base.evidence = sanitized as LogEvidence[];
      } else if (typeof entry.evidence === "object" && entry.evidence !== null && "summary" in entry.evidence) {
        // LogSummary
        base.summary = String((entry.evidence as LogSummary).summary).slice(0, 300);
        if ("truncated" in entry.evidence) base.truncated = Boolean((entry.evidence as LogSummary).truncated);
      } else if (isEvidence(entry.evidence)) {
        base.evidence = sanitizeEvidence(entry.evidence as LogEvidence);
      } else {
        // Reject unknown payloads, log only safe error without raw
        base.summary = "invalid evidence rejected";
      }
    }
    if (entry.summary) base.summary = entry.summary.slice(0, 300);
    if (entry.durationMs !== undefined) base.durationMs = entry.durationMs;
    // Never log tokens, cookies, headers, DATABASE_URL, raw payloads
    console.log(JSON.stringify(base));
  }

  return {
    info: (msg: string, opts?: { evidence?: AllowedLogInput; summary?: string; durationMs?: number }) =>
      log({ severity: "INFO", message: msg, ...opts }),
    warn: (msg: string, opts?: { evidence?: AllowedLogInput; summary?: string }) =>
      log({ severity: "WARN", message: msg, ...opts }),
    error: (msg: string, opts?: { evidence?: AllowedLogInput; summary?: string }) =>
      log({ severity: "ERROR", message: msg, ...opts }),
  };
}

// For tests: validate that logger only accepts Evidence
export function isValidLogInput(input: unknown): boolean {
  if (Array.isArray(input)) return input.every(isEvidence);
  if (typeof input === "object" && input !== null && "summary" in (input as Record<string, unknown>)) return true;
  return isEvidence(input);
}
