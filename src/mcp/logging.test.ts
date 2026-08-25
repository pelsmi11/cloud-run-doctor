import { describe, expect, it, vi } from "vitest";

import { createInvestigationScope, type InvestigationScope } from "./argument-policy";
import type { McpToolClient } from "./client";
import { createLoggingAdapter } from "./logging";

const NOW = new Date("2026-08-25T05:00:00.000Z");

const createFakeClient = (...payloads: unknown[]): McpToolClient => {
  const callTool = vi.fn();
  for (const payload of payloads) {
    callTool.mockResolvedValueOnce({
      content: [{ type: "text", text: JSON.stringify(payload) }],
    });
  }
  return {
    callTool,
    close: vi.fn().mockResolvedValue(undefined),
  };
};

describe("Logging MCP adapter", () => {
  it("calls list_log_entries with server-owned arguments and returns sanitized Evidence", async () => {
    const client = createFakeClient({
      entries: [
        {
          timestamp: "2026-08-25T04:45:56.301381Z",
          resource: {
            labels: { service_name: "pawpass", location: "us-central1" },
          },
          jsonPayload: {
            event: "PET_REGISTRATION_FAILED",
            requestId: "f6792d84-9ad2-4b1b-bb6d-e0f1308241ac",
            sessionId: "af9b8f78-3a3d-46a4-ae46-73ccebce4b09",
            httpStatus: 503,
            errorType: "DatabaseUnavailableError",
            ownerName: "must-not-cross-the-mapper",
          },
        },
      ],
    });
    const adapter = await createLoggingAdapter({ client, now: () => NOW });
    const scope = createInvestigationScope("what is happening") as InvestigationScope;

    const result = await adapter.queryLogs(scope);

    expect(client.callTool).toHaveBeenCalledWith(
      "list_log_entries",
      {
        resourceNames: ["projects/pawpass-gdg-demo"],
        filter:
          'resource.type="cloud_run_revision" AND resource.labels.service_name="pawpass" AND severity>=ERROR AND timestamp>="2026-08-25T04:00:00.000Z"',
        orderBy: "timestamp desc",
        pageSize: 20,
      },
      undefined
    );
    expect(result).toEqual({
      evidence: [
        {
          source: "logging",
          observedAt: "2026-08-25T04:45:56.301381Z",
          service: "pawpass",
          region: "us-central1",
          requestId: "f6792d84-9ad2-4b1b-bb6d-e0f1308241ac",
          sessionId: "af9b8f78-3a3d-46a4-ae46-73ccebce4b09",
          event: "PET_REGISTRATION_FAILED",
          httpStatus: 503,
          errorType: "DatabaseUnavailableError",
        },
      ],
      truncated: false,
    });
    expect(JSON.stringify(result)).not.toContain("ownerName");
    await adapter.close();
    expect(client.close).toHaveBeenCalledOnce();
  });

  it("continues an empty Logging page without exposing its private token", async () => {
    const client = createFakeClient(
      { entries: [], nextPageToken: "private-token" },
      {
        entries: [
          {
            timestamp: "2026-08-25T04:45:56.301381Z",
            resource: {
              labels: { service_name: "pawpass", location: "us-central1" },
            },
            jsonPayload: { httpStatus: 201 },
          },
        ],
      }
    );
    const adapter = await createLoggingAdapter({ client, now: () => NOW });
    const scope = createInvestigationScope(
      "sessionId: 123e4567-e89b-12d3-a456-426614174000"
    ) as InvestigationScope;

    const result = await adapter.queryLogs(scope);
    const [, firstArgs] = vi.mocked(client.callTool).mock.calls[0];
    const [, continuationArgs] = vi.mocked(client.callTool).mock.calls[1];

    expect(firstArgs).toMatchObject({
      orderBy: "timestamp asc",
      pageSize: 100,
    });
    expect(String(firstArgs.filter)).toContain(
      'timestamp>="2026-08-24T05:00:00.000Z"'
    );
    expect(continuationArgs).toMatchObject({
      ...firstArgs,
      pageToken: "private-token",
    });
    expect(result).toMatchObject({
      evidence: [{ source: "logging", httpStatus: 201 }],
      truncated: false,
    });
    expect(JSON.stringify(result)).not.toContain("private-token");
  });

  it("stops bounded empty-page continuation and reports uncertainty", async () => {
    const client = createFakeClient(
      { entries: [], nextPageToken: "private-token-1" },
      { entries: [], nextPageToken: "private-token-2" },
      { entries: [], nextPageToken: "private-token-3" },
      { entries: [], nextPageToken: "private-token-4" }
    );
    const adapter = await createLoggingAdapter({ client, now: () => NOW });
    const scope = createInvestigationScope("what is happening") as InvestigationScope;

    const result = await adapter.queryLogs(scope);

    expect(client.callTool).toHaveBeenCalledTimes(4);
    expect(result).toEqual({ evidence: [], truncated: true });
    expect(JSON.stringify(result)).not.toContain("private-token");
  });
});
