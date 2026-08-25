import { ThinkingLevel } from "@google/genai";
import { z } from "zod";

function isHttpsWithoutCredsOrFragment(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (url.hash) return false;
    if (!url.host) return false;
    return true;
  } catch {
    return false;
  }
}

const urlSchema = (defaultUrl: string) =>
  z
    .string()
    .default(defaultUrl)
    .refine((v) => v.trim().length > 0, { message: "URL must not be empty" })
    .refine(isHttpsWithoutCredsOrFragment, {
      message: "URL must be HTTPS without credentials or fragment",
    });

export const envSchema = z.object({
  GOOGLE_GENAI_USE_ENTERPRISE: z
    .enum(["TRUE"])
    .default("TRUE"),
  GOOGLE_CLOUD_PROJECT: z.string().default("pawpass-gdg-demo"),
  GOOGLE_CLOUD_LOCATION: z.string().default("global"),
  DOCTOR_MODEL: z.string().default("gemini-3.7-flash"),
  DOCTOR_THINKING_LEVEL: z
    .string()
    .default("LOW")
    .refine((v) => v === "LOW", { message: "DOCTOR_THINKING_LEVEL must be exactly LOW" })
    .transform(() => ThinkingLevel.LOW),
  PAWPASS_SERVICE: z.string().default("pawpass"),
  PAWPASS_REGION: z.string().default("us-central1"),
  MCP_CLOUD_RUN_URL: urlSchema("https://run.googleapis.com/mcp"),
  MCP_LOGGING_URL: urlSchema("https://logging.googleapis.com/mcp"),
  MONITORING_MCP_ENABLED: z
    .enum(["true", "false", "TRUE", "FALSE"])
    .default("false")
    .transform((v) => v.toLowerCase() === "true")
    .pipe(z.boolean())
    .or(z.boolean().default(false)),
  LOG_DEFAULT_WINDOW_MIN: z.coerce.number().int().min(1).max(1440).default(60),
  LOG_MAX_ENTRIES: z.coerce.number().int().min(1).max(100).default(20),
  SESSION_LOG_WINDOW_MIN: z.coerce.number().int().min(1).max(1440).default(1440),
  SESSION_LOG_MAX_ENTRIES: z.coerce.number().int().min(1).max(500).default(100),
});

export type Env = z.infer<typeof envSchema>;

// Lazy parsing to avoid side effects at import
let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  // Ignore accidental GOOGLE_API_KEY
  const raw = { ...process.env };
  // Delete accidental key if present so Zod doesn't see it
  // We simply don't include it in schema, so it's ignored
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration: ${msg}`);
  }
  cached = parsed.data as Env;
  return cached;
}

// For tests to reset
export function resetEnvCache(): void {
  cached = null;
}

// Eager export for convenience but lazy via getter
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    const e = getEnv();
    return (e as unknown as Record<string | symbol, unknown>)[prop];
  },
});
