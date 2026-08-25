export type McpServerName = "cloud_run" | "logging";

export interface McpAllowlist {
  server: McpServerName;
  verifiedOn: string; // YYYY-MM-DD UTC
  tools: readonly string[];
  readonly: true;
}

export const CLOUD_RUN_ALLOWLIST: McpAllowlist = {
  server: "cloud_run",
  verifiedOn: "2026-08-25",
  tools: ["get_service", "list_services"],
  readonly: true as const,
};

export const LOGGING_ALLOWLIST: McpAllowlist = {
  server: "logging",
  verifiedOn: "2026-08-25",
  tools: ["list_log_entries"],
  readonly: true as const,
};

export const ALLOWLISTS = [CLOUD_RUN_ALLOWLIST, LOGGING_ALLOWLIST] as const;
