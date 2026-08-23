# Cloud Run Doctor

Aplicación Next.js App Router para diagnosticar PawPass vía observabilidad de Google Cloud. La interfaz está localizada en inglés y español con `next-intl`; en fundación es un placeholder técnico, calmado y legible sin agente ni MCP.

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
│   │   └── api/chat/route.ts (placeholder 501 con `errorCode`, runtime nodejs)
│   ├── i18n/ (routing, request y navegación localizada)
│   ├── proxy.ts (redirección `/` → `/en`, excluye APIs/assets)
│   ├── components/
│   │   ├── ui/ (button, card, badge, alert, skeleton, scroll-area, separator — 7)
│   │   ├── index.ts (barrel de componentes propios)
│   │   └── SiteHeader.tsx, DoctorHero.tsx, EvidencePreview.tsx, LocaleSwitcher.tsx
│   ├── agent/ (reservado README)
│   ├── mcp/ (reservado README)
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
- `docs/03-agent-code-tour.md` — recorrido archivo por archivo y flujo `pregunta→handler→runner→LlmAgent→MCPToolset→respuesta`

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

Fundación sin Gemini, ADK, MCP real, Neon ni lógica de negocio. La interfaz visible está disponible en inglés y español.
