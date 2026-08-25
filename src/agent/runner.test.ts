import { describe, expect, it, vi } from "vitest";

import type { InvestigationResult } from "@/interface";
import { createInvestigationScope, type InvestigationScope } from "@/mcp/argument-policy";

import { createDoctorAgent } from "./doctor.agent";
import { runInvestigation } from "./runner";

const REQUEST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const createResult = (scope: InvestigationScope): InvestigationResult => ({
  scopeKind: scope.query.kind,
  cloudRun: { source: "cloud_run", service: "pawpass", ready: true },
  evidence: [{ source: "logging", httpStatus: 503 }],
  truncated: false,
  pattern: {
    reptile: 0,
    outage: 1,
    unknown: 0,
    knownTotal: 1,
    dominant: "mixed",
    confidenceReduced: false,
    truncated: false,
  },
  windowMinutes: scope.query.windowMinutes,
  maxEntries: scope.query.maxEntries,
});

const readStream = async (stream: ReadableStream<Uint8Array>): Promise<string> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return output;
    output += decoder.decode(value, { stream: true });
  }
};

describe("ADK investigation runner", () => {
  it("creates one LlmAgent with LOW and one closed capability", () => {
    const scope = createInvestigationScope("hello") as InvestigationScope;
    const agent = createDoctorAgent(scope, createResult(scope), "es");

    expect(agent.model).toBe("gemini-3.7-flash");
    expect(agent.tools).toHaveLength(1);
    expect(agent.tools[0]).toHaveProperty("name", "investigate");
    expect(
      (agent as unknown as {
        generateContentConfig: { thinkingConfig: { thinkingLevel: unknown } };
      }).generateContentConfig.thinkingConfig.thinkingLevel
    ).toBeDefined();
  });

  it("streams real adapter summaries before the diagnosis and closes clients", async () => {
    const scope = createInvestigationScope("hello") as InvestigationScope;
    const closeCloudRun = vi.fn().mockResolvedValue(undefined);
    const closeLogging = vi.fn().mockResolvedValue(undefined);
    const stream = await runInvestigation(
      {
        scope,
        doctorRequestId: REQUEST_ID,
        message: "hello",
        locale: "es",
      },
      {
        createCloudRunAdapter: async () => ({
          getService: vi.fn().mockResolvedValue({
            source: "cloud_run",
            service: "pawpass",
            ready: true,
          }),
          close: closeCloudRun,
        }),
        createLoggingAdapter: async () => ({
          queryLogs: vi.fn().mockResolvedValue({
            evidence: [{ source: "logging", httpStatus: 503 }],
            truncated: false,
          }),
          close: closeLogging,
        }),
        streamDiagnosis: async function* () {
          yield "## Estado observado\n";
          yield "PawPass está Ready.";
        },
      }
    );

    const output = await readStream(stream);

    expect(output.indexOf("investigation-started")).toBeLessThan(
      output.indexOf("cloud_run:get_service")
    );
    expect(output).toContain("logging:list_log_entries");
    expect(output).toContain("## Estado observado");
    expect(output).toContain('"type":"done"');
    expect(output).not.toContain("ownerName");
    expect(closeCloudRun).toHaveBeenCalledOnce();
    expect(closeLogging).toHaveBeenCalledOnce();
  });

  it("emits one safe terminal error when an adapter fails", async () => {
    const scope = createInvestigationScope("hello") as InvestigationScope;
    const stream = await runInvestigation(
      {
        scope,
        doctorRequestId: REQUEST_ID,
        message: "hello",
        locale: "es",
      },
      {
        createCloudRunAdapter: async () => ({
          getService: vi.fn().mockRejectedValue(new Error("PERMISSION_DENIED raw secret")),
          close: vi.fn().mockResolvedValue(undefined),
        }),
      }
    );

    const output = await readStream(stream);

    expect(output.match(/\"type\":\"error\"/g)).toHaveLength(1);
    expect(output).toContain("PERMISSION_DENIED");
    expect(output).toContain(REQUEST_ID);
    expect(output).not.toContain("raw secret");
    expect(output).not.toContain('"type":"done"');
  });

  it("closes without a terminal event when already aborted", async () => {
    const scope = createInvestigationScope("hello") as InvestigationScope;
    const controller = new AbortController();
    controller.abort();

    const stream = await runInvestigation({
      scope,
      doctorRequestId: REQUEST_ID,
      message: "hello",
      locale: "en",
      signal: controller.signal,
    });

    expect(await readStream(stream)).toBe("");
  });
});
