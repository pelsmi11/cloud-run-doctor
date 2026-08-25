# MCP Tools Observed — Cloud Run Doctor

**Project:** `pawpass-gdg-demo` | **Spec:** `004-cloud-run-doctor-diagnosis` | **verifiedOn:** `2026-08-25` UTC

This file records real `tools/list` results via `gcloud auth` + StreamableHTTP. No names invented.

## Cloud Run MCP

- **Server:** `https://run.googleapis.com/mcp`
- **verifiedOn:** `2026-08-25`
- **Transport:** StreamableHTTP with `Authorization: Bearer` + `x-goog-user-project`

| Tool | ReadOnly | Description |
|------|----------|-------------|
| `get_service` | true (readOnlyHint true, openWorldHint false) | Get info about a Cloud Run service, such as its URI and whether deploy succeeded. |
| `list_services` | true | List Cloud Run services in project/region. |
| `deploy_service_from_image` | false (destructive) | Deploy container image as Cloud Run service. **Excluded** |
| `deploy_service_from_archive` | false | Deploy from archive. **Excluded** |
| `deploy_service_from_file_contents` | false | Deploy from file contents. **Excluded** |

**Allowlist (read-only only):**
- `get_service`
- `list_services`

Verified as read-only via `annotations.readOnlyHint=true` and `destructiveHint=false`.

## Logging MCP

- **Server:** `https://logging.googleapis.com/mcp`
- **verifiedOn:** `2026-08-25`
- **Transport:** StreamableHTTP with `Authorization: Bearer` + `x-goog-user-project`

| Tool | ReadOnly | Description |
|------|----------|-------------|
| `list_log_entries` | true | Primary tool to search and retrieve log entries; filter, orderBy, pageSize, resourceNames; readOnlyHint true. |
| `list_log_names` | true | List log names in project. |
| `get_bucket` | true | Get specific log bucket. |
| `list_buckets` | true | List log buckets. |
| `get_view` | true | Get specific view on bucket. |
| `list_views` | true | List log views. |

**Allowlist for Doctor (minimal necessary):**
- `list_log_entries` (essential for all investigations)
- Additional read-only tools `list_log_names`, `list_buckets`, `get_bucket`, `get_view`, `list_views` are available but not needed for MVP1; excluded to keep minimal.

**Classification:** All listed logging tools have `readOnlyHint=true`, `destructiveHint=false`, `openWorldHint=false` — verified read-only.

## Notes

- Discovery via ADC and the MCP SDK:
  ```bash
  gcloud auth application-default login
  gcloud auth application-default set-quota-project pawpass-gdg-demo
  pnpm mcp:discover
  ```
- No write tools are allowlisted.
- Re-run before demo to update `verifiedOn`.
