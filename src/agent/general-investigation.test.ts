import { describe, expect, it, vi } from "vitest";

import type { InvestigationAdapters } from "@/interface";
import { createInvestigationScope, type InvestigationScope } from "@/mcp/argument-policy";

import { classifyPattern, investigateGeneral } from "./general-investigation";

describe("general investigation", () => {
  it("classifies a strict REPTILE majority", () => {
    const result = classifyPattern(
      [
        { source: "logging", databaseCode: "23503" },
        { source: "logging", errorType: "ForeignKeyViolation" },
        { source: "logging", errorType: "Other" },
      ],
      false
    );

    expect(result).toMatchObject({
      reptile: 2,
      outage: 0,
      unknown: 1,
      dominant: "reptile",
      confidenceReduced: false,
    });
  });

  it("uses both adapters and propagates truncation", async () => {
    const adapters: InvestigationAdapters = {
      getService: vi.fn().mockResolvedValue({
        source: "cloud_run",
        service: "pawpass",
        ready: true,
      }),
      queryLogs: vi.fn().mockResolvedValue({
        evidence: [{ source: "logging", httpStatus: 503 }],
        truncated: true,
      }),
    };
    const scope = createInvestigationScope("what is happening") as InvestigationScope;

    const result = await investigateGeneral(scope, adapters);

    expect(adapters.getService).toHaveBeenCalledWith(scope, undefined);
    expect(adapters.queryLogs).toHaveBeenCalledWith(scope, undefined);
    expect(result.truncated).toBe(true);
    expect(result.pattern.confidenceReduced).toBe(true);
  });
});
