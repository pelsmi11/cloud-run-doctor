import { describe, expect, it, vi } from "vitest";

import { createInvestigationScope, type InvestigationScope } from "./argument-policy";
import type { McpToolClient } from "./client";
import { createCloudRunAdapter } from "./cloud-run";

describe("Cloud Run MCP adapter", () => {
  it("calls get_service with fixed scope and maps the Ready condition", async () => {
    const client: McpToolClient = {
      callTool: vi.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: "projects/pawpass-gdg-demo/locations/us-central1/services/pawpass",
              terminalCondition: { type: "Ready", state: "CONDITION_SUCCEEDED" },
              template: { containers: [{ env: [{ name: "SECRET", value: "hidden" }] }] },
            }),
          },
        ],
      }),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = await createCloudRunAdapter({
      client,
      now: () => new Date("2026-08-25T05:00:00.000Z"),
    });
    const scope = createInvestigationScope("hello") as InvestigationScope;

    const result = await adapter.getService(scope);

    expect(client.callTool).toHaveBeenCalledWith(
      "get_service",
      {
        name: "pawpass",
        project: "pawpass-gdg-demo",
        region: "us-central1",
      },
      undefined
    );
    expect(result).toEqual({
      source: "cloud_run",
      observedAt: "2026-08-25T05:00:00.000Z",
      service: "pawpass",
      region: "us-central1",
      ready: true,
      status: "CONDITION_SUCCEEDED",
    });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    await adapter.close();
    expect(client.close).toHaveBeenCalledOnce();
  });
});
