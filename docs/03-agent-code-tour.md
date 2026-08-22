# Cloud Run Doctor — Tour del código

**Repositorio**: `cloud-run-doctor/` | **Fecha**: 2026-08-20 | **Estado**: fundación (sin lógica de agente)

Este documento explica archivo por archivo los módulos importantes, sus dependencias y el flujo de una investigación futura. En fundación las carpetas `agent/` y `mcp/` están reservadas con `README.md`.

## Estructura relevante

```
cloud-run-doctor/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/chat/route.ts
├── components/
│   ├── ui/ (7 primitives)
│   ├── site-header.tsx
│   ├── doctor-hero.tsx
│   └── evidence-preview.tsx
├── agent/ (reservado)
├── mcp/ (reservado)
└── lib/
    ├── utils.ts
    └── format.ts
```

## Recorrido archivo por archivo

### 1. `src/app/layout.tsx`

- **Responsabilidad**: layout raíz. Carga fuentes `Geist`/`Geist_Mono` con `next/font/google`, define `metadata`, aplica `globals.css` y clases `antialiased`, envuelve `children` en `<html lang="en">`.
- **Depende de**: `next/font/google`, `./globals.css`
- **Llamado por**: Next.js App Router (no se importa manualmente)
- **Pruebas**: `src/app/layout.test.tsx` verifica que renderiza `children`
- **Notas**: comentarios/JSDoc en inglés; no contiene lógica de negocio

### 2. `src/app/globals.css`

- **Responsabilidad**: tokens semánticos HSL estrategia A (`--background: 0 0% 100%` + `@theme inline --color-background: hsl(var(--background))`), modo claro/oscuro `.dark`, `radius` 0.5rem, imports `tailwindcss`/`tw-animate-css`
- **Depende de**: Tailwind v4, `@theme inline`
- **Usado por**: todos los `ui/*` y placeholders vía `bg-background`/`text-foreground` etc.
- **Validación**: `grep --background` triple + `hsl(var(--background))` + `pnpm build` verde

### 3. `src/app/page.tsx`

- **Responsabilidad**: home placeholder. Compone `SiteHeader` + `DoctorHero` + `EvidencePreview` en columna con `max-w-5xl` y `gap-8`. Sin estado ni fetch.
- **Depende de**: `@/components/site-header`, `@/components/doctor-hero`, `@/components/evidence-preview`
- **Testeado por**: `src/app/page.test.tsx` (renderiza 3 placeholders)
- **Futuro**: seguirá siendo entrypoint; en SPEC-004 se añadirá estado de chat si hace falta

### 4. `src/app/api/chat/route.ts`

- **Responsabilidad**: endpoint placeholder para chat del Doctor. Exporta `runtime = "nodejs"` y `POST` que responde `501` con mensaje en español.
- **Depende de**: `next/server` `NextResponse`
- **Llamado por**: `DoctorHero` futuro (fetch) y tests
- **Evolución**: en SPEC-004 importará `src/agent/runner.ts` y ejecutará `LlmAgent` con `MCPToolset`; mantendrá `runtime nodejs` y validación de entrada

### 5. `src/components/ui/*` (7 primitives)

- **Archivos**: `button.tsx`, `card.tsx`, `badge.tsx`, `alert.tsx`, `skeleton.tsx`, `scroll-area.tsx`, `separator.tsx` (generados por `shadcn@3.4.1`)
- **Responsabilidad**: primitives accesibles con `class-variance-authority` y `cn()`. Usan tokens `bg-primary`/`text-primary-foreground` etc., sin hex hardcodeado.
- **Depende de**: `@/lib/utils` `cn`, `class-variance-authority`, `@radix-ui/*`, `lucide-react`
- **Usado por**: placeholders y futuro chat/evidence-card
- **Verificación**: `ls src/components/ui | wc -l` =7, `grep -r "bg-\[#" ` vacío, `pnpm build` verde

### 6. `src/components/site-header.tsx`

- **Responsabilidad**: header técnico con título y `Badge` evidence
- **Depende de**: `@/components/ui/badge`
- **Testeado por**: `site-header.test.tsx`

### 7. `src/components/doctor-hero.tsx`

- **Responsabilidad**: hero técnico con título, `Button` Investigate y badges `healthy`/`warning`/`error`/`evidence` + `Alert` recomendación
- **Depende de**: `ui/button`, `ui/badge`, `ui/alert`
- **Testeado por**: `doctor-hero.test.tsx`

### 8. `src/components/evidence-preview.tsx`

- **Responsabilidad**: preview de evidencia con `Card` + `ScrollArea` (h-40) + `<pre>` mono + `Separator` + `Alert` next step
- **Depende de**: `ui/card`, `ui/scroll-area`, `ui/separator`, `ui/alert`
- **Testeado por**: `evidence-preview.test.tsx`
- **Notas**: prioriza legibilidad `font-mono`, `h-40` scroll, no contiene datos reales de Cloud Logging

### 9. `src/lib/utils.ts`

- **Responsabilidad**: helper `cn(...ClassValue[])` que combina `clsx` + `tailwind-merge`
- **Depende de**: `clsx`, `tailwind-merge`
- **Testeado por**: `src/lib/utils.test.ts` (5 tests, 100%)

### 10. `src/lib/format.ts`

- **Responsabilidad**: helpers puros `pluralize`, `formatBadge`, `getSeverityLabel` (healthy/warning/error/evidence/recommended)
- **Testeado por**: `src/lib/format.test.ts` (12 tests, 100%)

### 11. `src/agent/` (reservado)

- **Archivos**: `README.md` (explica futura estructura)
- **Futura responsabilidad**: `doctor.agent.ts` (define `LlmAgent` con `instruction` y `tools`), `instruction.ts` (prompt SRE), `runner.ts` (ejecuta agente con `GoogleAuth` y `MCPToolset`)
- **Dependerá de**: `@google/adk`, `google-auth-library`, `../mcp/*`
- **No hay código en fundación**

### 12. `src/mcp/` (reservado)

- **Archivos**: `README.md`
- **Futura responsabilidad**: `auth.ts` (`getMcpHeaders` con `GoogleAuth` y `x-goog-user-project`), `cloud-run.ts`, `logging.ts`, `monitoring.ts` (cada uno `MCPToolset` con transporte Streamable HTTP, headers `Authorization` + `x-goog-user-project`, timeout y allowlist)
- **Dependerá de**: `google-auth-library`, `@google/adk` `MCPToolset`
- **Seguridad**: solo lectura, allowlist explícita, IAM como frontera real

## Dependencias entre archivos

```
page.tsx → site-header.tsx / doctor-hero.tsx / evidence-preview.tsx → ui/*
page.tsx → layout.tsx → globals.css → @theme inline
api/chat/route.ts → (futuro) agent/runner.ts → agent/doctor.agent.ts → mcp/* → GoogleAuth
lib/utils.ts ← ui/* (cn)
```

## Flujo de una investigación (futuro, reservado)

```
Usuario escribe pregunta en page.tsx (chat)
  → POST /api/chat { message: "REQ-789" }
    → route.ts (runtime nodejs) valida entrada
      → runner.ts crea GoogleAuth client y headers MCP
        → doctor.agent.ts (LlmAgent) con instruction SRE
          → MCPToolset Cloud Run (listar servicio pawpass)
          → MCPToolset Logging (filtrar jsonPayload.requestId="REQ-789")
          → (MVP2) MCPToolset Monitoring (request_latencies)
        → agente compone evidencia → respuesta estructurada:
          estado observado / síntoma / evidencia / causa probable / recomendación / incertidumbre
      → route.ts responde { answer, investigationId }
    → page.tsx renderiza EvidencePreview con badges de severidad
```

En fundación el flujo termina en `501` placeholder; las rutas y README garantizan que `tasks.md` pueda referenciar archivos exactos sin implementar lógica.

## Notas de idioma y estilo

- Código/comentarios/JSDoc/tests en inglés; este tour y docs en español
- No hay llamadas a Neon/Gemini/MCP reales; tests usan dobles deterministas
- Placeholders son estáticos, sin `useState`/`fetch`/`Zod`
