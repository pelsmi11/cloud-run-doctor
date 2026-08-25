import { FunctionTool, LlmAgent } from "@google/adk";
import { z } from "zod";

import type { InvestigationResult } from "@/interface";
import { getEnv } from "@/lib/env";
import type { InvestigationScope } from "@/mcp/argument-policy";

import { DOCTOR_INSTRUCTION } from "./instruction";

export const createDoctorAgent = (
  scope: InvestigationScope,
  result: InvestigationResult,
  locale: "es" | "en"
): LlmAgent => {
  const env = getEnv();
  const investigateTool = new FunctionTool({
    name: "investigate",
    description:
      "Return the normalized, read-only PawPass evidence for the current server-owned investigation scope.",
    parameters: z.object({}),
    execute: async () => ({
      scopeKind: scope.query.kind,
      cloudRun: result.cloudRun,
      evidence: result.evidence,
      truncated: result.truncated,
      pattern: result.pattern,
      windowMinutes: result.windowMinutes,
      maxEntries: result.maxEntries,
    }),
  });

  return new LlmAgent({
    name: "cloud_run_doctor",
    model: env.DOCTOR_MODEL,
    instruction: `${DOCTOR_INSTRUCTION}\nRespond in ${
      locale === "es" ? "Spanish" : "English"
    }.`,
    tools: [investigateTool],
    generateContentConfig: {
      thinkingConfig: {
        thinkingLevel: env.DOCTOR_THINKING_LEVEL,
      },
    },
  });
};
