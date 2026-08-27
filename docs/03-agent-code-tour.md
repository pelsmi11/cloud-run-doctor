# Cloud Run Doctor — flujo real del agente

Este documento resume el recorrido productivo de una pregunta. Para decisiones visuales y verificaciones MCP, consulta los documentos enlazados desde el `README.md`.

## Flujo en una vista

```text
Usuario
  → ChatInput / ChatView
  → useChatStream
  → POST /api/chat
  → validación + clasificación
  → InvestigationScope server-owned
  → Cloud Run MCP + Cloud Logging MCP
  → Evidence normalizada
  → classifier determinista
  → LlmAgent de ADK + Gemini
  → eventos SSE
  → respuesta renderizada
```

La idea central es que el modelo redacta sobre evidencia ya recopilada; no decide libremente qué proyecto, servicio, región o filtro consultar.

## Mapa rápido de funciones y archivos

| Paso | Funciones importantes | Archivo |
| --- | --- | --- |
| 1. Enviar y recibir | `ChatView`, `useChatStream`, `parseSse` | `src/components/chat/ChatView.tsx`, `src/hooks/useChatStream.ts`, `src/lib/stream.ts` |
| 2. Aceptar el POST | `POST`, `invalidReasonToCode` | `src/app/api/chat/route.ts` |
| 3. Validar y clasificar | `chatRequestSchema`, `classifyQuery`, `createInvestigationScope` | `src/lib/validation.ts`, `src/mcp/argument-policy.ts` |
| 4. Investigar | `runInvestigation`, `executeStrategy` | `src/agent/runner.ts` |
| 5. Elegir estrategia | `investigateRequest`, `investigateSession`, `investigateGeneral` | `src/agent/request-investigation.ts`, `src/agent/session-investigation.ts`, `src/agent/general-investigation.ts` |
| 6. Consultar Google Cloud | `createCloudRunAdapter`, `getService`, `createLoggingAdapter`, `queryLogs` | `src/mcp/cloud-run.ts`, `src/mcp/logging.ts` |
| 7. Proteger la llamada MCP | `buildCloudRunArgs`, `buildLoggingArgs`, `revalidateCloudRunArgs`, `revalidateLoggingArgs`, `createMcpToolClient` | `src/mcp/argument-policy.ts`, `src/mcp/client.ts` |
| 8. Autenticar y normalizar | `getMcpHeaders`, `extractMcpJsonPayload`, `mapEvidenceCollection` | `src/mcp/auth.ts`, `src/mcp/client.ts`, `src/mcp/evidence-mapper.ts` |
| 9. Clasificar y redactar | `classifyPattern`, `createDoctorAgent`, `streamDiagnosisWithAdk` | `src/agent/general-investigation.ts`, `src/agent/doctor.agent.ts`, `src/agent/runner.ts` |
| 10. Emitir resultado | `encodeEvent`, `nextState` | `src/lib/stream.ts` |

Las funciones de la tabla son los puntos de entrada relevantes; helpers como `normalizeAuthHeaders`, `normalizeLoggingEntry`, `normalizeCloudRunService`, `createSafeSummary` y `toSafeError` apoyan esas etapas.

## 1. Entrada y POST

`ChatInput` recoge el texto y `ChatView` llama a `useChatStream().sendMessage()`. El hook hace un único `fetch` a `/api/chat`, envía `{ message, locale }` y usa `parseSse()` para consumir la respuesta como SSE.

En `src/app/api/chat/route.ts`, la función `POST()`:

1. genera `doctorRequestId` y lo reutiliza como `supportId`;
2. valida JSON, mensaje e idioma con `chatRequestSchema`;
3. usa `classifyQuery()` para clasificar la pregunta como `request`, `session` o `general`;
4. rechaza identificadores mal formados, múltiples o mezclados sin llamar a Google Cloud;
5. usa `createInvestigationScope()` para crear un `InvestigationScope` con proyecto, región, servicio, ventana y límite controlados por el servidor;
6. llama a `runInvestigation()` y devuelve `text/event-stream`.

## 2. Investigación controlada

`runInvestigation()` en `src/agent/runner.ts` selecciona una estrategia mediante `executeStrategy()` según el alcance:

- `request-investigation.ts` para un request ID;
- `session-investigation.ts` para una sesión, ordenando la evidencia cronológicamente;
- `general-investigation.ts` para errores generales.

Las tres funciones (`investigateRequest()`, `investigateSession()` e `investigateGeneral()`) consultan primero el estado del servicio y después los logs. El runner emite progreso SSE, conserva el mismo identificador de correlación y cierra los adaptadores al terminar.

## 3. Datos de Google Cloud mediante MCP

`createCloudRunAdapter()` en `src/mcp/cloud-run.ts` implementa `getService()`, que llama `get_service` en `https://run.googleapis.com/mcp` para consultar el servicio `pawpass` en `pawpass-gdg-demo/us-central1`.

`createLoggingAdapter()` en `src/mcp/logging.ts` implementa `queryLogs()`, que llama `list_log_entries` en `https://logging.googleapis.com/mcp`. `buildLoggingToolArguments()` construye filtros server-owned para:

- `jsonPayload.requestId`;
- `jsonPayload.sessionId`;
- o `severity>=ERROR` en una investigación general.

También añade la ventana temporal, el orden y el límite de entradas. La paginación queda acotada y se conserva un indicador `truncated` cuando la evidencia puede estar incompleta.

## 4. Frontera de seguridad y evidencia

`createInvestigationScope()`, `buildLoggingArgs()`, `buildCloudRunArgs()`, `revalidateLoggingArgs()` y `revalidateCloudRunArgs()` de `src/mcp/argument-policy.ts` construyen y revalidan los argumentos inmediatamente antes de `tools/call`. El modelo no puede sustituir proyecto, región, servicio, filtro o límite.

`createMcpToolClient()` en `src/mcp/client.ts` usa `@modelcontextprotocol/sdk` con `Client` y `StreamableHTTPClientTransport`. Su método `callTool()` comprueba la allowlist y aplica timeout; `extractMcpJsonPayload()` extrae el payload JSON.

`normalizeLoggingEntry()`, `normalizeCloudRunService()` y `mapEvidenceCollection()` en `src/mcp/evidence-mapper.ts` convierten respuestas `unknown` en `Evidence` mediante una whitelist y Zod. Solo los campos normalizados llegan al logger, al clasificador y al agente. Los payloads MCP crudos no se muestran en la interfaz ni se incluyen en errores.

## 5. Clasificación antes de Gemini

`classifyPattern()` en `src/agent/general-investigation.ts` calcula de forma determinista los contadores de:

- errores `23503`, `ForeignKeyViolation` o `REPTILE`;
- respuestas `503` o `DatabaseUnavailableError`;
- evidencia desconocida.

También determina si la confianza debe reducirse por truncamiento o evidencia insuficiente. Gemini no sustituye esta clasificación.

## 6. ADK redacta el diagnóstico

`createDoctorAgent()` en `src/agent/doctor.agent.ts` crea un único `LlmAgent` con:

- modelo configurado por `DOCTOR_MODEL`;
- instrucciones de `src/agent/instruction.ts`;
- idioma solicitado;
- nivel de pensamiento `LOW`;
- una `FunctionTool` llamada `investigate`.

La herramienta `investigate` no acepta argumentos. Devuelve el `InvestigationResult` ya calculado: estado de Cloud Run, logs normalizados, patrón y truncamiento. La instrucción exige llamarla una vez y responder con seis secciones, sin inventar hechos.

`streamDiagnosisWithAdk()` en `src/agent/runner.ts` crea un `InMemoryRunner`, una sesión identificada con `doctorRequestId` y ejecuta `runner.runAsync()`. Extrae solamente texto de los eventos de ADK y lo convierte en eventos `text-delta` de SSE.

Por eso la arquitectura es híbrida:

```text
Código determinista: alcance, permisos, MCP, validación y clasificación
ADK/Gemini: explicación narrativa basada en esa evidencia
```

## 7. Eventos que recibe el navegador

`encodeEvent()` y `parseSse()` de `src/lib/stream.ts` permiten transportar y leer estos eventos:

```text
investigation-started
status
tool-start
tool-result-summary
text-delta
error
done
```

`useChatStream()` actualiza el mensaje del Doctor conforme llegan. `StreamdownRenderer.tsx` muestra el diagnóstico Markdown de forma progresiva.

## MCP directo frente a MCPToolset

La integración productiva no añade `MCPToolset` a `LlmAgent`. Consume MCP directamente con el SDK oficial de MCP desde los adaptadores de Cloud Run y Logging.

`MCPToolset` aparece en `scripts/verify-adk.ts` como un spike para comprobar compatibilidad de tipos de ADK. No representa el camino que ejecuta el POST del chat.

## Autenticación resumida

`getMcpHeaders()` en `src/mcp/auth.ts` usa `GoogleAuth` y Application Default Credentials. `getRunScopes()` y `getLoggingScopes()` definen los scopes de solo lectura; `getMcpHeaders()` obtiene el token Bearer y añade `x-goog-user-project`.

En despliegue, `cloudbuild.yaml` asigna la cuenta de servicio de Cloud Run y desactiva el acceso no autenticado al servicio web. Los roles IAM deben existir fuera del código.
