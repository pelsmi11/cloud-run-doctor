import { z } from "zod";

import { getEnv } from "@/lib/env";

import { LOGGING_ALLOWLIST } from "./allowlist";
import {
  buildLoggingArgs,
  revalidateLoggingArgs,
  type InvestigationScope,
} from "./argument-policy";
import { getLoggingScopes } from "./auth";
import {
  createMcpToolClient,
  extractMcpJsonPayload,
  type McpToolClient,
} from "./client";
import {
  mapEvidenceCollection,
  normalizeLoggingEntry,
  type Evidence,
} from "./evidence-mapper";

const loggingResponseSchema = z
  .object({
    entries: z.array(z.unknown()).default([]),
    nextPageToken: z.string().optional(),
  })
  .passthrough();

const MAX_EMPTY_PAGE_CONTINUATIONS = 3;

export interface LoggingQueryResult {
  evidence: Evidence[];
  truncated: boolean;
}

export interface LoggingAdapter {
  queryLogs: (
    scope: InvestigationScope,
    signal?: AbortSignal
  ) => Promise<LoggingQueryResult>;
  close: () => Promise<void>;
}

interface LoggingAdapterOptions {
  client?: McpToolClient;
  now?: () => Date;
}

export const buildLoggingToolArguments = (
  scope: InvestigationScope,
  now: Date
): Record<string, unknown> => {
  const args = revalidateLoggingArgs(buildLoggingArgs(scope), scope);
  const since = new Date(now.getTime() - args.windowMinutes * 60_000);

  return {
    resourceNames: [`projects/${args.project}`],
    filter: `${args.filter} AND timestamp>="${since.toISOString()}"`,
    orderBy: scope.query.kind === "session" ? "timestamp asc" : "timestamp desc",
    pageSize: args.maxEntries,
  };
};

export const createLoggingAdapter = async (
  options: LoggingAdapterOptions = {}
): Promise<LoggingAdapter> => {
  const env = getEnv();
  const client =
    options.client ??
    (await createMcpToolClient({
      url: env.MCP_LOGGING_URL,
      scopes: getLoggingScopes(),
      allowedTools: LOGGING_ALLOWLIST.tools,
    }));
  const now = options.now ?? (() => new Date());

  return {
    queryLogs: async (scope, signal) => {
      const baseArguments = buildLoggingToolArguments(scope, now());
      let pageToken: string | undefined;
      let entries: unknown[] = [];
      let emptyPageContinuations = 0;

      do {
        let result: unknown;
        try {
          result = await client.callTool(
            "list_log_entries",
            pageToken ? { ...baseArguments, pageToken } : baseArguments,
            signal
          );
        } catch {
          throw new Error("Logging MCP call failed");
        }
        const parsed = loggingResponseSchema.safeParse(
          extractMcpJsonPayload(result)
        );
        if (!parsed.success) {
          throw new Error("Invalid Logging MCP response");
        }

        entries = parsed.data.entries;
        pageToken = parsed.data.nextPageToken;
        if (entries.length === 0 && pageToken) {
          emptyPageContinuations += 1;
        }
      } while (
        entries.length === 0 &&
        pageToken &&
        emptyPageContinuations <= MAX_EMPTY_PAGE_CONTINUATIONS
      );

      let normalized: Evidence[];
      try {
        normalized = entries.map(normalizeLoggingEntry);
      } catch {
        throw new Error("Logging evidence validation failed");
      }
      return mapEvidenceCollection(normalized, scope, {
        hasNextPageToken: Boolean(pageToken),
      });
    },
    close: async () => {
      await client.close();
    },
  };
};

export const queryLogsWithScope = async (
  scope: InvestigationScope,
  raw: unknown[],
  hasToken = false
): Promise<LoggingQueryResult> => {
  const args = buildLoggingArgs(scope);
  revalidateLoggingArgs(args, scope);
  return mapEvidenceCollection(raw, scope, { hasNextPageToken: hasToken });
};
