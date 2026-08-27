# Cloud Run Doctor

Aplicación Next.js App Router para diagnosticar PawPass usando observabilidad de Google Cloud. La interfaz está localizada en inglés y español con `next-intl`. El flujo real combina una investigación controlada por el servidor, clientes MCP de solo lectura y un agente ADK que redacta el diagnóstico a partir de evidencia normalizada.

## Requisitos

- Node.js `20.19.x LTS` (compatible con 22)
- pnpm `11.9.0` (pin en `packageManager`)

## Instalación

```bash
pnpm install --frozen-lockfile
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint .` |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:unit` / `test:coverage` | Vitest + V8 80% |
| `verify` | `pnpm typecheck && pnpm test:coverage` |
| `prepare` | `node .husky/install.mjs` |

## Estructura

```
cloud-run-doctor/
├── src/
│   ├── app/
│   │   ├── [locale]/layout.tsx, [locale]/page.tsx (rutas `/en` y `/es`)
│   │   ├── globals.css (tokens HSL técnicos, hsl(var(--)))
│   │   └── api/chat/route.ts (POST del chat, runtime nodejs y respuesta SSE)
│   ├── i18n/ (routing, request y navegación localizada)
│   ├── proxy.ts (redirección `/` → `/en`, excluye APIs/assets)
│   ├── components/
│   │   ├── ui/ (button, card, badge, alert, skeleton, scroll-area, separator — 7)
│   │   ├── index.ts (barrel de componentes propios)
│   │   └── SiteHeader.tsx, DoctorHero.tsx, EvidencePreview.tsx, LocaleSwitcher.tsx
│   ├── agent/ (runner, estrategias de investigación y agente ADK)
│   ├── mcp/ (autenticación, política de argumentos, clientes y mappers)
│   ├── interface/ (tipos compartidos y augmentations de next-intl)
│   ├── utils/
│   │   ├── constant/ (constantes propias)
│   │   └── functions/ (cn, format y funciones puras)
│   └── lib/utils.ts (shim compatible para shadcn)
├── docs/
│   ├── 02-visual-decisions.md
│   └── 03-agent-code-tour.md
├── .husky/
└── components.json (style new-york, baseColor slate, shadcn@3.4.1)
```

## Documentación

- `docs/02-visual-decisions.md` — paleta técnica y tokens `healthy`/`evidence`/`recommended`
- `docs/03-agent-code-tour.md` — flujo resumido del agente real y mapa de archivos principales
- `docs/mcp-tools-observed.md` — herramientas MCP observadas y fecha de verificación

## Flujo real del agente

```text
ChatView → useChatStream → POST /api/chat
  → validación y clasificación de la consulta
  → InvestigationScope controlado por el servidor
  → Cloud Run MCP (get_service) + Cloud Logging MCP (list_log_entries)
  → Evidence normalizada y clasificación determinista
  → LlmAgent de ADK + Gemini para redactar el diagnóstico
  → SSE → interfaz
```

El modelo no elige el proyecto, la región, el servicio ni filtros libres. El servidor crea esos argumentos, valida las respuestas MCP y limita la evidencia antes de entregarla al agente. En la ruta productiva, MCP se consume directamente mediante `@modelcontextprotocol/sdk`; `MCPToolset` solamente aparece en el spike de verificación de ADK.

### Funciones importantes por etapa

| Etapa | Función principal | Archivo | Responsabilidad |
| --- | --- | --- | --- |
| UI y envío | `ChatView`, `useChatStream` | `src/components/chat/ChatView.tsx`, `src/hooks/useChatStream.ts` | Envía `{ message, locale }`, abre el `POST` y consume SSE. |
| Entrada HTTP | `POST` | `src/app/api/chat/route.ts` | Valida la petición, clasifica la consulta y crea la respuesta `text/event-stream`. |
| Clasificación y alcance | `chatRequestSchema`, `classifyQuery`, `createInvestigationScope` | `src/lib/validation.ts`, `src/mcp/argument-policy.ts` | Decide `request`, `session` o `general` y fija los parámetros server-owned. |
| Orquestación | `runInvestigation`, `executeStrategy` | `src/agent/runner.ts` | Emite progreso, elige la estrategia y coordina la investigación. |
| Consulta MCP | `createCloudRunAdapter`, `createLoggingAdapter` | `src/mcp/cloud-run.ts`, `src/mcp/logging.ts` | Llama `get_service` y `list_log_entries` con argumentos revalidados. |
| Normalización | `mapEvidenceCollection`, `normalizeLoggingEntry`, `normalizeCloudRunService` | `src/mcp/evidence-mapper.ts` | Convierte respuestas externas en `Evidence` segura y limitada. |
| Clasificación | `classifyPattern` | `src/agent/general-investigation.ts` | Calcula los patrones conocidos y la confianza reducida. |
| Diagnóstico ADK | `createDoctorAgent`, `streamDiagnosisWithAdk` | `src/agent/doctor.agent.ts`, `src/agent/runner.ts` | Entrega la evidencia al agente y transmite la explicación de Gemini. |

El detalle de cada función y el orden de llamadas está en [`docs/03-agent-code-tour.md`](docs/03-agent-code-tour.md).

## Verificación

```bash
pnpm typecheck
pnpm test:coverage  # offline, sin Gemini/MCP
pnpm verify
pnpm build
```

## Internacionalización

- Locales soportados: `en` y `es`; inglés es el predeterminado.
- Todas las páginas usan prefijo obligatorio y `/` redirige a `/en`.
- El selector `EN / ES` conserva la ruta actual.
- Las APIs no llevan prefijo de locale y devuelven códigos estables, no texto localizado.

El proyecto no consulta una base de datos directamente: diagnostica a partir del estado de Cloud Run y de los registros de Cloud Logging. La interfaz visible está disponible en inglés y español.
