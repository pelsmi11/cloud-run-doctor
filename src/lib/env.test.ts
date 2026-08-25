import { describe, it, expect, beforeEach } from "vitest";
import { envSchema, getEnv, resetEnvCache } from "./env";

describe("env", () => {
  beforeEach(() => {
    resetEnvCache();
  });

  it("parses defaults", () => {
    const parsed = envSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.GOOGLE_GENAI_USE_ENTERPRISE).toBe("TRUE");
      expect(parsed.data.GOOGLE_CLOUD_PROJECT).toBe("pawpass-gdg-demo");
      expect(parsed.data.LOG_DEFAULT_WINDOW_MIN).toBe(60);
      expect(parsed.data.LOG_MAX_ENTRIES).toBe(20);
    }
  });

  it("rejects HTTP url", () => {
    const parsed = envSchema.safeParse({ MCP_CLOUD_RUN_URL: "http://run.googleapis.com/mcp" });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty url", () => {
    const parsed = envSchema.safeParse({ MCP_CLOUD_RUN_URL: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects url with credentials", () => {
    const parsed = envSchema.safeParse({ MCP_CLOUD_RUN_URL: "https://user:pass@run.googleapis.com/mcp" });
    expect(parsed.success).toBe(false);
  });

  it("rejects url with fragment", () => {
    const parsed = envSchema.safeParse({ MCP_LOGGING_URL: "https://logging.googleapis.com/mcp#frag" });
    expect(parsed.success).toBe(false);
  });

  it("accepts only LOW", () => {
    const ok = envSchema.safeParse({ DOCTOR_THINKING_LEVEL: "LOW" });
    expect(ok.success).toBe(true);
    const bad = envSchema.safeParse({ DOCTOR_THINKING_LEVEL: "MEDIUM" });
    expect(bad.success).toBe(false);
  });

  it("validates ranges 60/20 and 1440/100", () => {
    expect(envSchema.safeParse({ LOG_DEFAULT_WINDOW_MIN: 60, LOG_MAX_ENTRIES: 20 }).success).toBe(true);
    expect(envSchema.safeParse({ LOG_DEFAULT_WINDOW_MIN: 0 }).success).toBe(false);
    expect(envSchema.safeParse({ LOG_MAX_ENTRIES: 101 }).success).toBe(false);
    expect(envSchema.safeParse({ SESSION_LOG_WINDOW_MIN: 1440, SESSION_LOG_MAX_ENTRIES: 100 }).success).toBe(true);
    expect(envSchema.safeParse({ SESSION_LOG_MAX_ENTRIES: 501 }).success).toBe(false);
  });

  it("ignores GOOGLE_API_KEY", () => {
    const parsed = envSchema.safeParse({ GOOGLE_API_KEY: "fake" });
    expect(parsed.success).toBe(true);
  });

  it("getEnv fails on invalid config", () => {
    const orig = process.env.LOG_MAX_ENTRIES;
    process.env.LOG_MAX_ENTRIES = "9999";
    resetEnvCache();
    expect(() => getEnv()).toThrow();
    if (orig === undefined) delete process.env.LOG_MAX_ENTRIES;
    else process.env.LOG_MAX_ENTRIES = orig;
    resetEnvCache();
  });
});
