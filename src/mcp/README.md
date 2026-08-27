# MCP en Cloud Run Doctor

Este directorio contiene la integración productiva con los servidores MCP administrados de Google Cloud.

- `auth.ts` obtiene credenciales ADC con `GoogleAuth` y añade `x-goog-user-project`.
- `client.ts` usa `@modelcontextprotocol/sdk` con transporte Streamable HTTP, allowlist y timeout.
- `argument-policy.ts` crea y revalida argumentos controlados por el servidor.
- `cloud-run.ts` consulta `get_service` en Cloud Run MCP.
- `logging.ts` consulta `list_log_entries` en Cloud Logging MCP.
- `evidence-mapper.ts` convierte payloads MCP no confiables en `Evidence` validada.

La ruta productiva usa el SDK MCP directamente desde los adaptadores. `MCPToolset` solamente se comprueba en `scripts/verify-adk.ts`; no es el camino de ejecución del POST del chat. Todas las herramientas activas son de solo lectura y están limitadas por allowlists explícitas.
