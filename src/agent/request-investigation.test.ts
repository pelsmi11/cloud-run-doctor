import { describe, expect, it, vi } from "vitest";

import type { InvestigationAdapters } from "@/interface";
import { createInvestigationScope, type InvestigationScope } from "@/mcp/argument-policy";

import { investigateRequest } from "./request-investigation";

describe("request investigation", () => {
  it("uses the 60 minute window and returns normalized Evidence", async () => {
    const adapters: InvestigationAdapters = {
      getService: vi.fn().mockResolvedValue({ source: "cloud_run", ready: true }),
      queryLogs: vi.fn().mockResolvedValue({
        evidence: [
          {
            source: "logging",
            requestId: "123e4567-e89b-12d3-a456-426614174000",
            httpStatus: 500,
          },
        ],
        truncated: false,
      }),
    };
    const scope = createInvestigationScope(
      "123e4567-e89b-12d3-a456-426614174000"
    ) as InvestigationScope;

    const result = await investigateRequest(scope, adapters);

    expect(result.windowMinutes).toBe(60);
    expect(result.maxEntries).toBe(20);
    expect(result.evidence).toHaveLength(1);
  });
});
