import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/chat", () => {
  it("returns 501 placeholder", async () => {
    const response = await POST();
    expect(response.status).toBe(501);
    const body = await response.json();
    expect(body).toEqual({ errorCode: "DOCTOR_NOT_IMPLEMENTED" });
  });
});
