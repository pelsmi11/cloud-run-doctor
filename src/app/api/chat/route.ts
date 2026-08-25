import { NextResponse } from "next/server";

import { runInvestigation } from "@/agent/runner";
import { getEnv } from "@/lib/env";
import { chatRequestSchema, classifyQuery } from "@/lib/validation";
import {
  createInvestigationScope,
  type InvestigationScope,
} from "@/mcp/argument-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const invalidReasonToCode = (
  reason: "malformed-identifier" | "multiple-identifiers" | "mixed-identifier-types"
): string => {
  if (reason === "malformed-identifier") return "MALFORMED_IDENTIFIER";
  if (reason === "multiple-identifiers") return "MULTIPLE_IDENTIFIERS";
  return "MIXED_IDENTIFIER_TYPES";
};

export const POST = async (request?: Request): Promise<Response> => {
  const doctorRequestId = crypto.randomUUID();
  const supportId = doctorRequestId;

  if (!request || typeof request.json !== "function") {
    return NextResponse.json(
      { errorCode: "INVALID_MESSAGE", message: "Invalid request", supportId },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { errorCode: "INVALID_MESSAGE", message: "Invalid JSON", supportId },
      { status: 400 }
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const errorCode = firstIssue.message.includes("at most 4000")
      ? "MESSAGE_TOO_LONG"
      : "INVALID_MESSAGE";
    return NextResponse.json(
      { errorCode, message: firstIssue.message, supportId },
      { status: 400 }
    );
  }

  const classification = classifyQuery(parsed.data.message);
  if (classification.kind === "invalid") {
    return NextResponse.json(
      {
        errorCode: invalidReasonToCode(classification.reason),
        message: "Provide a single valid identifier per investigation",
        supportId,
      },
      { status: 400 }
    );
  }

  try {
    getEnv();
  } catch {
    return NextResponse.json(
      {
        errorCode: "CONFIG_ERROR",
        message: "Cloud Run Doctor configuration is invalid",
        supportId,
      },
      { status: 500 }
    );
  }

  const scopeResult = createInvestigationScope(parsed.data.message);
  if ("kind" in scopeResult && scopeResult.kind === "invalid") {
    return NextResponse.json(
      { errorCode: "INVALID_MESSAGE", message: "Invalid query", supportId },
      { status: 400 }
    );
  }

  const stream = await runInvestigation({
    scope: scopeResult as InvestigationScope,
    doctorRequestId,
    message: parsed.data.message,
    locale: parsed.data.locale,
    signal: request.signal,
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Doctor-Request-Id": doctorRequestId,
      "X-Support-Id": supportId,
    },
  });
};
