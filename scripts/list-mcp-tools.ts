import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { getEnv } from "../src/lib/env";
import {
  getLoggingScopes,
  getMcpHeaders,
  getRunScopes,
} from "../src/mcp/auth";

interface ObservedTool {
  name: string;
  description: string;
}

const listTools = async (
  serverName: "cloud_run" | "logging",
  serverUrl: string,
  scopes: string[]
): Promise<ObservedTool[]> => {
  const headers = await getMcpHeaders(scopes);
  const client = new Client({
    name: `cloud-run-doctor-${serverName}-discovery`,
    version: "0.1.0",
  });
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
    requestInit: { headers },
  });

  try {
    await client.connect(transport);
    const observed: ObservedTool[] = [];
    let cursor: string | undefined;

    do {
      const result = await client.listTools(cursor ? { cursor } : undefined);
      observed.push(
        ...result.tools.map((tool) => ({
          name: tool.name,
          description: tool.description ?? "No description observed",
        }))
      );
      cursor = result.nextCursor;
    } while (cursor);

    return observed;
  } finally {
    await client.close().catch(() => undefined);
  }
};

const main = async (): Promise<void> => {
  const env = getEnv();
  console.log(`Project: ${env.GOOGLE_CLOUD_PROJECT}`);
  const servers = [
    {
      name: "cloud_run" as const,
      url: env.MCP_CLOUD_RUN_URL,
      scopes: getRunScopes(),
    },
    {
      name: "logging" as const,
      url: env.MCP_LOGGING_URL,
      scopes: getLoggingScopes(),
    },
  ];

  for (const server of servers) {
    const tools = await listTools(server.name, server.url, server.scopes);
    console.log(`\n${server.name} (${new Date().toISOString()}):`);
    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description}`);
    }
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`MCP discovery failed: ${message}`);
  process.exitCode = 1;
});
