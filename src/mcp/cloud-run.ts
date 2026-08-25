import { getEnv } from "@/lib/env";

import { CLOUD_RUN_ALLOWLIST } from "./allowlist";
import {
  buildCloudRunArgs,
  revalidateCloudRunArgs,
  type InvestigationScope,
} from "./argument-policy";
import { getRunScopes } from "./auth";
import {
  createMcpToolClient,
  extractMcpJsonPayload,
  type McpToolClient,
} from "./client";
import { normalizeCloudRunService, type Evidence } from "./evidence-mapper";

export interface CloudRunAdapter {
  getService: (
    scope: InvestigationScope,
    signal?: AbortSignal
  ) => Promise<Evidence>;
  close: () => Promise<void>;
}

interface CloudRunAdapterOptions {
  client?: McpToolClient;
  now?: () => Date;
}

export const createCloudRunAdapter = async (
  options: CloudRunAdapterOptions = {}
): Promise<CloudRunAdapter> => {
  const env = getEnv();
  const client =
    options.client ??
    (await createMcpToolClient({
      url: env.MCP_CLOUD_RUN_URL,
      scopes: getRunScopes(),
      allowedTools: CLOUD_RUN_ALLOWLIST.tools,
    }));
  const now = options.now ?? (() => new Date());

  return {
    getService: async (scope, signal) => {
      const args = revalidateCloudRunArgs(buildCloudRunArgs(scope), scope);
      const result = await client.callTool(
        "get_service",
        { name: args.service, project: args.project, region: args.region },
        signal
      );
      return normalizeCloudRunService(
        extractMcpJsonPayload(result),
        scope,
        now().toISOString()
      );
    },
    close: async () => {
      await client.close();
    },
  };
};
