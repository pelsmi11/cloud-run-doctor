import { getEnv } from "@/lib/env";
import { classifyQuery } from "@/lib/validation";

export interface InvestigationScope {
  readonly project: "pawpass-gdg-demo";
  readonly region: "us-central1";
  readonly service: "pawpass";
  readonly query:
    | { readonly kind: "request"; readonly requestId: string; readonly windowMinutes: number; readonly maxEntries: number }
    | { readonly kind: "session"; readonly sessionId: string; readonly windowMinutes: number; readonly maxEntries: number }
    | { readonly kind: "general"; readonly windowMinutes: number; readonly maxEntries: number };
}

export function createInvestigationScope(message: string): InvestigationScope | { kind: "invalid"; reason: string } {
  const classification = classifyQuery(message);
  if (classification.kind === "invalid") {
    return { kind: "invalid", reason: classification.reason };
  }
  if (classification.kind === "general") {
    const env = getEnv();
    return {
      project: "pawpass-gdg-demo",
      region: "us-central1",
      service: "pawpass",
      query: {
        kind: "general",
        windowMinutes: env.LOG_DEFAULT_WINDOW_MIN,
        maxEntries: env.LOG_MAX_ENTRIES,
      },
    };
  }
  if (classification.kind === "request") {
    const env = getEnv();
    return {
      project: "pawpass-gdg-demo",
      region: "us-central1",
      service: "pawpass",
      query: {
        kind: "request",
        requestId: classification.requestId,
        windowMinutes: env.LOG_DEFAULT_WINDOW_MIN,
        maxEntries: env.LOG_MAX_ENTRIES,
      },
    };
  }
  if (classification.kind === "session") {
    const env = getEnv();
    return {
      project: "pawpass-gdg-demo",
      region: "us-central1",
      service: "pawpass",
      query: {
        kind: "session",
        sessionId: classification.sessionId,
        windowMinutes: env.SESSION_LOG_WINDOW_MIN,
        maxEntries: env.SESSION_LOG_MAX_ENTRIES,
      },
    };
  }
  // fallback
  return { kind: "invalid", reason: "unknown" };
}

// Policy builds final arguments exclusively from scope+config, rejects overrides
export interface LoggingArgs {
  project: string;
  filter: string;
  windowMinutes: number;
  maxEntries: number;
}

export interface CloudRunArgs {
  project: string;
  region: string;
  service: string;
}

export function buildLoggingArgs(scope: InvestigationScope): LoggingArgs {
  const base = `resource.type="cloud_run_revision" AND resource.labels.service_name="pawpass"`;
  if (scope.query.kind === "request") {
    return {
      project: scope.project,
      filter: `${base} AND jsonPayload.requestId="${scope.query.requestId}"`,
      windowMinutes: scope.query.windowMinutes,
      maxEntries: scope.query.maxEntries,
    };
  }
  if (scope.query.kind === "session") {
    return {
      project: scope.project,
      filter: `${base} AND jsonPayload.sessionId="${scope.query.sessionId}"`,
      windowMinutes: scope.query.windowMinutes,
      maxEntries: scope.query.maxEntries,
    };
  }
  // general
  return {
    project: scope.project,
    filter: `${base} AND severity>=ERROR`,
    windowMinutes: scope.query.windowMinutes,
    maxEntries: scope.query.maxEntries,
  };
}

export function buildCloudRunArgs(scope: InvestigationScope): CloudRunArgs {
  // Always server-owned constants
  return {
    project: scope.project,
    region: scope.region,
    service: scope.service,
  };
}

// Revalidate immediately before tools/call – rejects any external overrides
export function revalidateLoggingArgs(args: LoggingArgs, scope: InvestigationScope): LoggingArgs {
  const expected = buildLoggingArgs(scope);
  if (args.project !== expected.project) throw new Error("Invalid project override");
  if (args.filter !== expected.filter) throw new Error("Invalid filter override");
  if (args.windowMinutes !== expected.windowMinutes) throw new Error("Invalid window override");
  if (args.maxEntries !== expected.maxEntries) throw new Error("Invalid limit override");
  return expected;
}

export function revalidateCloudRunArgs(args: CloudRunArgs, scope: InvestigationScope): CloudRunArgs {
  const expected = buildCloudRunArgs(scope);
  if (args.project !== expected.project) throw new Error("Invalid project override");
  if (args.region !== expected.region) throw new Error("Invalid region override");
  if (args.service !== expected.service) throw new Error("Invalid service override");
  return expected;
}

// Reject any free-form filter from model
export function assertNoModelFilter(modelFilter: unknown): void {
  if (modelFilter !== undefined && modelFilter !== null) {
    throw new Error("Model filter rejected");
  }
}
