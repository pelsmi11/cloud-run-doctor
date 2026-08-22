# Cloud Run Doctor

Aplicación Next.js App Router para diagnosticar PawPass vía observabilidad de Google Cloud. En fundación es un placeholder técnico, calmado y legible sin agente ni MCP.

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
│   │   ├── layout.tsx, page.tsx (SiteHeader + DoctorHero + EvidencePreview)
│   │   ├── globals.css (tokens HSL técnicos, hsl(var(--)))
│   │   └── api/chat/route.ts (placeholder 501, runtime nodejs)
│   ├── components/
│   │   ├── ui/ (button, card, badge, alert, skeleton, scroll-area, separator — 7)
│   │   └── site-header.tsx, doctor-hero.tsx, evidence-preview.tsx
│   ├── agent/ (reservado README)
│   ├── mcp/ (reservado README)
│   └── lib/
│       ├── utils.ts
│       └── format.ts
├── docs/
│   ├── 02-visual-decisions.md
│   └── 03-agent-code-tour.md
├── .husky/
└── components.json (style new-york, baseColor slate, shadcn@3.4.1)
```

## Documentación

- `docs/02-visual-decisions.md` — paleta técnica y tokens `healthy`/`evidence`/`recommended`
- `docs/03-agent-code-tour.md` — recorrido archivo por archivo y flujo `pregunta→handler→runner→LlmAgent→MCPToolset→respuesta`

## Verificación

```bash
pnpm typecheck
pnpm test:coverage  # offline, sin Gemini/MCP
pnpm verify
pnpm build
```

Fundación sin Gemini, ADK, MCP real, Neon ni lógica de negocio. Respuestas visibles del Doctor en español.
