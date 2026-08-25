import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { getMcpHeaders } from "./auth";

export interface McpToolClient {
  callTool: (
    name: string,
    args: Record<string, unknown>,
    signal?: AbortSignal
  ) => Promise<unknown>;
  close: () => Promise<void>;
}

interface McpToolClientOptions {
  url: string;
  scopes: string[];
  allowedTools: readonly string[];
  timeoutMs?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const extractMcpJsonPayload = (result: unknown): unknown => {
  if (!isRecord(result)) {
    throw new Error("Invalid MCP response");
  }
  if (result.isError === true) {
    throw new Error("MCP tool returned an error");
  }
  if (isRecord(result.structuredContent)) {
    return result.structuredContent;
  }
  if (!Array.isArray(result.content)) {
    throw new Error("MCP response has no content");
  }

  for (const block of result.content) {
    if (!isRecord(block) || block.type !== "text" || typeof block.text !== "string") {
      continue;
    }
    try {
      return JSON.parse(block.text) as unknown;
    } catch {
      // Continue to the next text block without exposing its contents.
    }
  }

  throw new Error("MCP response has no JSON payload");
};

export const createMcpToolClient = async ({
  url,
  scopes,
  allowedTools,
  timeoutMs = 15_000,
}: McpToolClientOptions): Promise<McpToolClient> => {
  const headers = await getMcpHeaders(scopes);
  const client = new Client({ name: "cloud-run-doctor", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers },
  });

  try {
    await client.connect(transport);
  } catch (error) {
    await client.close().catch(() => undefined);
    throw error;
  }

  return {
    callTool: async (name, args, signal) => {
      if (!allowedTools.includes(name)) {
        throw new Error("MCP tool is not allowlisted");
      }
      return client.callTool(
        { name, arguments: args },
        undefined,
        { signal, timeout: timeoutMs, maxTotalTimeout: timeoutMs }
      );
    },
    close: async () => {
      await client.close();
    },
  };
};
