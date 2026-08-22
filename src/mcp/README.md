# MCP — reservado

Este directorio está reservado para los clientes MCP en SPEC-004.

Estructura prevista:

- `auth.ts` — `getMcpHeaders` con `GoogleAuth` y `x-goog-user-project`
- `cloud-run.ts` — `cloudRunToolset` (Streamable HTTP)
- `logging.ts` — `loggingToolset`
- `monitoring.ts` — `monitoringToolset` (MVP 2)

Todos los toolsets serán de solo lectura con allowlist explícita.
