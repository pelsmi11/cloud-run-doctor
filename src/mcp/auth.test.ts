import { describe, it, expect, vi } from "vitest";

vi.mock("google-auth-library", () => ({
  GoogleAuth: class {
    constructor(public opts: unknown) {}
    async getClient() {
      return {
        async getRequestHeaders() {
          return { Authorization: "Bearer fake" };
        },
      };
    }
  },
}));

import {
  getMcpHeaders,
  getRunScopes,
  getLoggingScopes,
  normalizeAuthHeaders,
} from "./auth";

describe("mcp auth", () => {
  it("returns Authorization and x-goog-user-project", async () => {
    process.env.GOOGLE_CLOUD_PROJECT = "pawpass-gdg-demo";
    const headers = await getMcpHeaders(getRunScopes());
    expect(headers.Authorization).toBe("Bearer fake");
    expect(headers["x-goog-user-project"]).toBe("pawpass-gdg-demo");
  });
  it("preserves Authorization from the Headers object returned by GoogleAuth", () => {
    const headers = new Headers({ Authorization: "Bearer adc-token" });

    expect(normalizeAuthHeaders(headers)).toEqual({
      authorization: "Bearer adc-token",
    });
  });
  it("scopes are readonly", () => {
    expect(getRunScopes()).toEqual(["https://www.googleapis.com/auth/run.readonly"]);
    expect(getLoggingScopes()).toEqual(["https://www.googleapis.com/auth/logging.read"]);
  });
});
