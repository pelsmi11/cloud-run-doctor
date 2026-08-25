import { InMemoryRunner, StreamingMode } from "@google/adk";

import type { InvestigationAdapters, InvestigationResult } from "@/interface";
import { createLogger } from "@/lib/logger";
import { encodeEvent, type SseEvent } from "@/lib/stream";
import type { InvestigationScope } from "@/mcp/argument-policy";
import {
  createCloudRunAdapter,
  type CloudRunAdapter,
} from "@/mcp/cloud-run";
import { createSafeSummary } from "@/mcp/evidence-mapper";
import { createLoggingAdapter, type LoggingAdapter } from "@/mcp/logging";

import { createDoctorAgent } from "./doctor.agent";
import { investigateGeneral } from "./general-investigation";
import { investigateRequest } from "./request-investigation";
import { investigateSession } from "./session-investigation";

export interface RunnerOptions {
  scope: InvestigationScope;
  doctorRequestId: string;
  message: string;
  locale: "es" | "en";
  signal?: AbortSignal;
}

interface DiagnosisOptions extends RunnerOptions {
  result: InvestigationResult;
}

type DiagnosisStreamer = (
  options: DiagnosisOptions
) => AsyncIterable<string>;

interface RunnerDependencies {
  createCloudRunAdapter?: () => Promise<CloudRunAdapter>;
  createLoggingAdapter?: () => Promise<LoggingAdapter>;
  streamDiagnosis?: DiagnosisStreamer;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extractEventText = (event: unknown): string => {
  if (!isRecord(event) || !isRecord(event.content) || !Array.isArray(event.content.parts)) {
    return "";
  }

  return event.content.parts
    .filter(isRecord)
    .filter((part) => part.thought !== true && typeof part.text === "string")
    .map((part) => String(part.text))
    .join("");
};

const selectDelta = (emitted: string, incoming: string): string => {
  if (!incoming) return "";
  if (incoming.startsWith(emitted)) return incoming.slice(emitted.length);
  if (emitted.endsWith(incoming)) return "";
  return incoming;
};

export const streamDiagnosisWithAdk = async function* (
  options: DiagnosisOptions
): AsyncGenerator<string> {
  const { doctorRequestId, locale, message, result, scope, signal } = options;
  const appName = "cloud-run-doctor";
  const userId = "doctor-user";
  const agent = createDoctorAgent(scope, result, locale);
  const runner = new InMemoryRunner({ agent, appName });
  const session = await runner.sessionService.createSession({
    appName,
    userId,
    sessionId: doctorRequestId,
  });
  let emitted = "";

  for await (const event of runner.runAsync({
    userId,
    sessionId: session.id,
    newMessage: { role: "user", parts: [{ text: message }] },
    abortSignal: signal,
    runConfig: { streamingMode: StreamingMode.SSE },
  })) {
    const incoming = extractEventText(event);
    const delta = selectDelta(emitted, incoming);
    if (delta) {
      emitted += delta;
      yield delta;
    }
  }

  if (!emitted.trim()) {
    throw new Error("Gemini returned no diagnosis");
  }
};

const executeStrategy = async (
  scope: InvestigationScope,
  adapters: InvestigationAdapters,
  signal?: AbortSignal
): Promise<InvestigationResult> => {
  if (scope.query.kind === "request") {
    return investigateRequest(scope, adapters, signal);
  }
  if (scope.query.kind === "session") {
    return investigateSession(scope, adapters, signal);
  }
  return investigateGeneral(scope, adapters, signal);
};

const toSafeError = (
  error: unknown,
  locale: "es" | "en"
): { code: string; message: string } => {
  const internal = error instanceof Error ? error.message : "";
  const isSpanish = locale === "es";

  if (/permission|forbidden|403/i.test(internal)) {
    return {
      code: "PERMISSION_DENIED",
      message: isSpanish
        ? "El Doctor no tiene permisos suficientes para completar la investigación."
        : "The Doctor does not have enough permission to complete the investigation.",
    };
  }
  if (/credential|authentication|unauthorized|401/i.test(internal)) {
    return {
      code: "AUTH_UNAVAILABLE",
      message: isSpanish
        ? "No fue posible usar las credenciales locales de Google Cloud."
        : "Google Cloud local credentials were unavailable.",
    };
  }
  if (/timeout|timed out/i.test(internal)) {
    return {
      code: "INTEGRATION_TIMEOUT",
      message: isSpanish
        ? "Una integración agotó el tiempo de espera. Intenta nuevamente."
        : "An integration timed out. Please try again.",
    };
  }
  if (/Logging MCP call failed/i.test(internal)) {
    return {
      code: "LOGGING_UNAVAILABLE",
      message: isSpanish
        ? "Cloud Logging no respondió. Intenta nuevamente y usa el supportId si continúa."
        : "Cloud Logging did not respond. Try again and use the supportId if it continues.",
    };
  }
  if (/Logging evidence validation failed|Invalid Logging MCP response/i.test(internal)) {
    return {
      code: "LOGGING_RESPONSE_INVALID",
      message: isSpanish
        ? "Cloud Logging respondió con datos que el Doctor no pudo validar."
        : "Cloud Logging returned data that the Doctor could not validate.",
    };
  }
  return {
    code: "INTEGRATION_ERROR",
    message: isSpanish
      ? "No se pudo completar la investigación. Usa el supportId para revisar el error."
      : "The investigation could not be completed. Use the supportId to review the error.",
  };
};

export const runInvestigation = async (
  options: RunnerOptions,
  dependencies: RunnerDependencies = {}
): Promise<ReadableStream<Uint8Array>> => {
  const {
    createCloudRunAdapter: createCloudRun = createCloudRunAdapter,
    createLoggingAdapter: createLogging = createLoggingAdapter,
    streamDiagnosis = streamDiagnosisWithAdk,
  } = dependencies;
  const { doctorRequestId, locale, scope, signal } = options;
  const logger = createLogger(doctorRequestId);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let cloudRunAdapter: CloudRunAdapter | undefined;
      let loggingAdapter: LoggingAdapter | undefined;
      let cancelled = signal?.aborted === true;
      let partialPreserved = false;
      const onAbort = () => {
        cancelled = true;
      };
      const send = (event: SseEvent) => {
        if (!cancelled) {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        }
      };

      signal?.addEventListener("abort", onAbort);
      send({
        type: "investigation-started",
        investigationId: doctorRequestId,
        timestamp: new Date().toISOString(),
      });

      if (cancelled) {
        controller.close();
        return;
      }

      const adapters: InvestigationAdapters = {
        getService: async (activeScope, activeSignal) => {
          send({
            type: "status",
            investigationId: doctorRequestId,
            phase: "cloud_run",
            message: locale === "es" ? "Consultando Cloud Run" : "Checking Cloud Run",
          });
          send({
            type: "tool-start",
            investigationId: doctorRequestId,
            tool: "cloud_run:get_service",
            argsSummary: `service=${activeScope.service}, region=${activeScope.region}`,
          });
          cloudRunAdapter ??= await createCloudRun();
          const evidence = await cloudRunAdapter.getService(activeScope, activeSignal);
          send({
            type: "tool-result-summary",
            investigationId: doctorRequestId,
            tool: "cloud_run:get_service",
            ok: true,
            summary: evidence.ready ? "Ready" : "Not Ready",
          });
          return evidence;
        },
        queryLogs: async (activeScope, activeSignal) => {
          send({
            type: "status",
            investigationId: doctorRequestId,
            phase: "logging",
            message:
              locale === "es" ? "Buscando registros en Logging" : "Searching Cloud Logging",
          });
          send({
            type: "tool-start",
            investigationId: doctorRequestId,
            tool: "logging:list_log_entries",
            argsSummary: `scope=${activeScope.query.kind}, window=${activeScope.query.windowMinutes}m, limit=${activeScope.query.maxEntries}`,
          });
          loggingAdapter ??= await createLogging();
          const result = await loggingAdapter.queryLogs(activeScope, activeSignal);
          const summary = createSafeSummary(result.evidence, result.truncated);
          send({
            type: "tool-result-summary",
            investigationId: doctorRequestId,
            tool: "logging:list_log_entries",
            ok: true,
            summary,
            truncated: result.truncated,
          });
          logger.info("logging_query_completed", { summary });
          return result;
        },
      };

      try {
        const result = await executeStrategy(scope, adapters, signal);
        if (cancelled || signal?.aborted) return;

        send({
          type: "status",
          investigationId: doctorRequestId,
          phase: "analyzing",
          message: locale === "es" ? "Analizando evidencia" : "Analyzing evidence",
        });
        send({
          type: "status",
          investigationId: doctorRequestId,
          phase: "generating",
          message: locale === "es" ? "Generando diagnóstico" : "Generating diagnosis",
        });

        for await (const delta of streamDiagnosis({ ...options, result })) {
          if (cancelled || signal?.aborted) return;
          partialPreserved = true;
          send({
            type: "text-delta",
            investigationId: doctorRequestId,
            delta,
          });
        }

        send({
          type: "done",
          investigationId: doctorRequestId,
          truncated: result.truncated,
          timestamp: new Date().toISOString(),
        });
        logger.info("investigation_completed", {
          summary: createSafeSummary(result.evidence, result.truncated),
        });
      } catch (error) {
        if (cancelled || signal?.aborted) return;
        const safe = toSafeError(error, locale);
        logger.error("investigation_failed", { summary: safe.code });
        send({
          type: "error",
          investigationId: doctorRequestId,
          supportId: doctorRequestId,
          code: safe.code,
          message: safe.message,
          partialPreserved,
          timestamp: new Date().toISOString(),
        });
      } finally {
        signal?.removeEventListener("abort", onAbort);
        await Promise.allSettled([
          cloudRunAdapter?.close(),
          loggingAdapter?.close(),
        ]);
        controller.close();
      }
    },
  });
};
