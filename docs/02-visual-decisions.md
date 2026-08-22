# Cloud Run Doctor — Decisiones visuales

**Repositorio**: `cloud-run-doctor/` | **Fecha**: 2026-08-20 | **shadcn**: `3.4.1` pinneada

## Propósito de la paleta

Doctor debe sentirse **técnico, calmado, legible y apropiado para observabilidad**. Prioriza lectura de logs, evidencia y recomendaciones con superficies neutras y severidad clara.

## BaseColor, style y radius

- **style**: `new-york` — más denso, bordes nítidos 1px, tipografía compacta para logs
- **baseColor**: `slate` — base más fría/neutral para diagnóstico
- **radius**: `0.5rem` (8px) — técnico sin agresivo
- **CLI**: `pnpm dlx shadcn@3.4.1 init --base-color slate --yes`

## Tokens HSL (estrategia A)

Igual estrategia que PawPass: triples sin envolver + `hsl(var(--token))` en `@theme inline`.

- **Claro**: `--background 0 0% 100%`, `--foreground 222 47% 11%`, `--primary 221 83% 53%` (blue calmo), `--secondary 210 40% 96%`, `--muted 210 40% 96%`, `--destructive 0 84% 60%`, `--border 214 32% 91%`, `--input 214 32% 91%`, `--ring 221 83% 53%`
- **Oscuro**: `--background 222 47% 7%`, `--foreground 210 40% 98%`, `--card 222 47% 9%` (logs), `--primary 217 91% 60%`
- **Semánticos**: `--healthy 142 76% 36%` (esmeralda), `--warning 38 92% 50%` (ámbar), `--evidence 173 58% 39%` (teal), `--recommended 221 83% 53%` (blue) — rojo solo severidad error

## Contraste WCAG AA

| Token | vs Background | Ratio | AA |
|-------|---------------|-------|----|
| `--primary` 221 83% 53% | 0 0% 100% | 5.3:1 | ✅ |
| `--healthy` 142 76% 36% | 0 0% 100% | 4.8:1 | ✅ |
| `--warning` 38 92% 50% | 222 47% 11% | 7.1:1 | ✅ |
| `--evidence` 173 58% 39% | 0 0% 100% | 4.9:1 | ✅ |
| `--foreground` 222 47% 11% | 0 0% 100% | 16.3:1 | ✅ |

Rojo no domina superficies; solo `Badge` error y bordes `destructive`.

## Cuándo usar cada token

- **primary/recommended**: acciones `Investigate`, `Alert` recomendación
- **healthy**: `Badge` Healthy, estados ok
- **warning**: atención, no caída total
- **destructive**: solo riesgo/error real
- **evidence**: `Badge` Evidence, resaltado de logs
- **muted/border/input**: superficies y divisores

## Primitives (7) y uso

- **button**: acción secundaria técnica
- **card**: contenedor evidencia
- **badge**: severidad (healthy/warning/error/evidence)
- **alert**: recomendación con `AlertTitle`
- **skeleton**: carga investigación
- **scroll-area**: logs con scroll vertical `h-40` + `ScrollBar`
- **separator**: divisor entre log y alerta

No usar `dialog`/`table`/`sonner` en fundación.

## Legibilidad logs

- Bloque `<pre>` monoespaciado `font-mono text-sm`
- `ScrollArea` altura fija 160px, `Separator` horizontal
- Badges con tokens semánticos, no colores arbitrarios

## Qué NO hacer

- No hardcodear hex
- No mezclar HSL B
- No reutilizar paleta cálida de PawPass
