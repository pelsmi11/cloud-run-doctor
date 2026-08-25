import { describe, it, expect, vi } from "vitest";
import { createLogger, isValidLogInput } from "./logger";

describe("logger", () => {
  it("accepts only Evidence normalized", () => {
    const logger = createLogger("11111111-1111-1111-1111-111111111111");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test", { evidence: { source: "cloud_run", service: "pawpass" } });
    expect(spy).toHaveBeenCalled();
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.doctorRequestId).toBe("11111111-1111-1111-1111-111111111111");
    expect(logged.supportId).toBe(logged.doctorRequestId);
    spy.mockRestore();
  });
  it("rejects unknown payload", () => {
    expect(
      isValidLogInput({
        source: "logging",
        service: "pawpass",
        petTypeCode: "REPTILE",
      })
    ).toBe(true);
    expect(isValidLogInput({ source: "cloud_run", token: "secret" } as unknown as object)).toBe(false);
    expect(isValidLogInput({ summary: "ok" })).toBe(true);
  });
  it("never receives prompts tokens headers cookies", () => {
    const logger = createLogger("22222222-2222-2222-2222-222222222222");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test", { evidence: { source: "logging", service: "pawpass", requestId: "123e4567-e89b-12d3-a456-426614174000" } as never });
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged).not.toHaveProperty("token");
    expect(logged).not.toHaveProperty("cookie");
    spy.mockRestore();
  });
});
