import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/agent/runner", () => ({
  runInvestigation: vi.fn(),
}));
vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(),
}));

import { runInvestigation } from "@/agent/runner";
import { getEnv } from "@/lib/env";

import { POST } from "./route";

const createSseStream = () =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          'data: {"type":"investigation-started","investigationId":"test"}\n\n' +
            'data: {"type":"done","investigationId":"test"}\n\n'
        )
      );
      controller.close();
    },
  });

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.mocked(runInvestigation).mockResolvedValue(createSseStream());
    vi.mocked(getEnv).mockReturnValue({} as never);
  });

  it("returns a safe 400 response when no request is provided", async () => {
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe("INVALID_MESSAGE");
    expect(body.supportId).toBeDefined();
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty message without invoking integrations", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "   " }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe("INVALID_MESSAGE");
    expect(body.supportId).toBeDefined();
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON without invoking integrations", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "INVALID_MESSAGE" });
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it("returns MESSAGE_TOO_LONG for more than 4000 characters", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "x".repeat(4001) }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: "MESSAGE_TOO_LONG" });
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it("returns 400 for multiple identifiers without invoking integrations", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message:
          "123e4567-e89b-12d3-a456-426614174000 123e4567-e89b-12d3-a456-426614174001",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errorCode).toBe("MULTIPLE_IDENTIFIERS");
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it.each([
    ["requestId: not-a-uuid", "MALFORMED_IDENTIFIER"],
    [
      "requestId: 123e4567-e89b-12d3-a456-426614174000 sessionId: 123e4567-e89b-12d3-a456-426614174001",
      "MIXED_IDENTIFIER_TYPES",
    ],
  ])("returns the precise invalid classification for %s", async (message, errorCode) => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode });
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it("returns a safe configuration error before starting SSE", async () => {
    vi.mocked(getEnv).mockImplementation(() => {
      throw new Error("secret configuration detail");
    });
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "What is happening?" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({ errorCode: "CONFIG_ERROR" });
    expect(JSON.stringify(body)).not.toContain("secret configuration detail");
    expect(runInvestigation).not.toHaveBeenCalled();
  });

  it("starts the real investigation stream for a valid request", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "¿Qué está pasando con PawPass?", locale: "es" }),
      headers: { "Content-Type": "application/json", Cookie: "ignored=value" },
    });

    const response = await POST(request);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(response.headers.get("X-Doctor-Request-Id")).toBe(
      response.headers.get("X-Support-Id")
    );
    expect(text.indexOf("investigation-started")).toBeLessThan(text.indexOf("done"));
    expect(runInvestigation).toHaveBeenCalledOnce();
    expect(vi.mocked(runInvestigation).mock.calls[0][0]).toMatchObject({
      message: "¿Qué está pasando con PawPass?",
      locale: "es",
      scope: { project: "pawpass-gdg-demo", region: "us-central1", service: "pawpass" },
    });
  });
});
