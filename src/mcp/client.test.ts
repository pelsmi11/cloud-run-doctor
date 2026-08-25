import { describe, expect, it } from "vitest";

import { extractMcpJsonPayload } from "./client";

describe("MCP client payload extraction", () => {
  it("extracts JSON from a text content block", () => {
    expect(
      extractMcpJsonPayload({
        content: [{ type: "text", text: JSON.stringify({ entries: [] }) }],
      })
    ).toEqual({ entries: [] });
  });

  it("rejects MCP errors without exposing their payload", () => {
    expect(() =>
      extractMcpJsonPayload({ isError: true, content: [{ type: "text", text: "secret" }] })
    ).toThrow("MCP tool returned an error");
  });

  it("rejects non-JSON text safely", () => {
    expect(() =>
      extractMcpJsonPayload({ content: [{ type: "text", text: "not-json" }] })
    ).toThrow("MCP response has no JSON payload");
  });
});
