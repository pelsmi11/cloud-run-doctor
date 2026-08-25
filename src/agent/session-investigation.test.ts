import { describe, expect, it, vi } from "vitest";

import type { InvestigationAdapters } from "@/interface";
import { createInvestigationScope, type InvestigationScope } from "@/mcp/argument-policy";

import { investigateSession } from "./session-investigation";

describe("session investigation", () => {
  it("uses the 24 hour window and orders evidence chronologically", async () => {
    const adapters: InvestigationAdapters = {
      getService: vi.fn().mockResolvedValue({ source: "cloud_run", ready: true }),
      queryLogs: vi.fn().mockResolvedValue({
        evidence: [
          { source: "logging", observedAt: "2026-08-25T05:00:00.000Z" },
          { source: "logging", observedAt: "2026-08-25T04:00:00.000Z" },
        ],
        truncated: false,
      }),
    };
    const scope = createInvestigationScope(
      "sessionId: 123e4567-e89b-12d3-a456-426614174000"
    ) as InvestigationScope;

    const result = await investigateSession(scope, adapters);

    expect(result.windowMinutes).toBe(1440);
    expect(result.maxEntries).toBe(100);
    expect(result.evidence.map((entry) => entry.observedAt)).toEqual([
      "2026-08-25T04:00:00.000Z",
      "2026-08-25T05:00:00.000Z",
    ]);
  });
});
