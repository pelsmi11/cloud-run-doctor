import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useChatStream } from "./useChatStream";

const INVESTIGATION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const TestComponent = () => {
  const { messages, isInvestigating, sendMessage, cancel } = useChatStream();
  const doctor = messages.findLast((message) => message.role === "doctor");

  return (
    <div>
      <div data-testid="investigating">{isInvestigating ? "yes" : "no"}</div>
      <div data-testid="count">{messages.length}</div>
      <div data-testid="state">{doctor?.state ?? "none"}</div>
      <div data-testid="content">{doctor?.content ?? ""}</div>
      <div data-testid="support">{doctor?.supportId ?? ""}</div>
      <div data-testid="progress">{JSON.stringify(doctor?.progress ?? {})}</div>
      <button onClick={() => sendMessage("hello", "es")}>send</button>
      <button onClick={() => sendMessage("   ", "es")}>empty</button>
      <button onClick={() => sendMessage("x".repeat(4001), "es")}>long</button>
      <button onClick={cancel}>cancel</button>
    </div>
  );
};

const createSseResponse = (events: object[]): Response =>
  new Response(
    events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""),
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useChatStream", () => {
  it("consumes the complete observable SSE protocol", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse([
          {
            type: "investigation-started",
            investigationId: INVESTIGATION_ID,
            timestamp: "2026-08-25T00:00:00.000Z",
          },
          {
            type: "status",
            investigationId: INVESTIGATION_ID,
            phase: "cloud_run",
            message: "Consultando Cloud Run",
          },
          {
            type: "tool-start",
            investigationId: INVESTIGATION_ID,
            tool: "cloud_run:get_service",
            argsSummary: "service=pawpass",
          },
          {
            type: "tool-result-summary",
            investigationId: INVESTIGATION_ID,
            tool: "logging:list_log_entries",
            ok: true,
            summary: "2 entries found",
          },
          {
            type: "text-delta",
            investigationId: INVESTIGATION_ID,
            delta: "Hello ",
          },
          {
            type: "text-delta",
            investigationId: INVESTIGATION_ID,
            delta: "world",
          },
          {
            type: "done",
            investigationId: INVESTIGATION_ID,
            truncated: false,
            timestamp: "2026-08-25T00:00:01.000Z",
          },
        ])
      )
    );

    render(<TestComponent />);
    await user.click(screen.getByText("send"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("complete"));
    expect(screen.getByTestId("content")).toHaveTextContent("Hello world");
    expect(screen.getByTestId("support")).toHaveTextContent(INVESTIGATION_ID);
    expect(screen.getByTestId("progress")).toHaveTextContent('"phase":"complete"');
    expect(screen.getByTestId("investigating")).toHaveTextContent("no");
  });

  it("preserves partial content when a terminal SSE error arrives", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse([
          {
            type: "text-delta",
            investigationId: INVESTIGATION_ID,
            delta: "Partial evidence",
          },
          {
            type: "error",
            investigationId: INVESTIGATION_ID,
            supportId: INVESTIGATION_ID,
            code: "PERMISSION_DENIED",
            message: "Permission denied",
            partialPreserved: true,
            timestamp: "2026-08-25T00:00:01.000Z",
          },
        ])
      )
    );

    render(<TestComponent />);
    await user.click(screen.getByText("send"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    expect(screen.getByTestId("content")).toHaveTextContent("Partial evidence");
    expect(screen.getByTestId("content")).toHaveTextContent("Permission denied");
    expect(screen.getByTestId("support")).toHaveTextContent(INVESTIGATION_ID);
    expect(screen.getByTestId("progress")).toHaveTextContent("PERMISSION_DENIED");
  });

  it("renders a terminal SSE error when no partial content exists", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createSseResponse([
          {
            type: "error",
            investigationId: INVESTIGATION_ID,
            supportId: INVESTIGATION_ID,
            code: "INTEGRATION_TIMEOUT",
            message: "Integration timed out",
            partialPreserved: false,
            timestamp: "2026-08-25T00:00:01.000Z",
          },
        ])
      )
    );

    render(<TestComponent />);
    await user.click(screen.getByText("send"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    expect(screen.getByTestId("content")).toHaveTextContent("> **Error:** Integration timed out");
  });

  it("shows the safe JSON error returned before streaming starts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          { message: "Invalid request", supportId: INVESTIGATION_ID },
          { status: 400 }
        )
      )
    );

    render(<TestComponent />);
    await user.click(screen.getByText("send"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    expect(screen.getByTestId("content")).toHaveTextContent("Invalid request");
    expect(screen.getByTestId("support")).toHaveTextContent(INVESTIGATION_ID);
  });

  it("reports a connection that closes without a terminal event", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 200 })));

    render(<TestComponent />);
    await user.click(screen.getByText("send"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    expect(screen.getByTestId("content")).toHaveTextContent(
      "La conexión terminó antes de completar la investigación."
    );
  });

  it("cancels an active request without converting it to a failure", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    render(<TestComponent />);
    await user.click(screen.getByText("send"));
    await waitFor(() => expect(screen.getByTestId("investigating")).toHaveTextContent("yes"));
    await user.click(screen.getByText("cancel"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("cancelled"));
    expect(screen.getByTestId("content")).toHaveTextContent("Investigación cancelada.");
    expect(screen.getByTestId("progress")).toHaveTextContent("cancelled");
  });

  it("converts an unexpected network rejection to a safe error", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("private network detail")));

    render(<TestComponent />);
    await user.click(screen.getByText("send"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    expect(screen.getByTestId("content")).toHaveTextContent(
      "No se pudo completar la consulta."
    );
    expect(screen.getByTestId("content")).not.toHaveTextContent("private network detail");
  });

  it("ignores empty, oversized, and concurrent submissions", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));

    render(<TestComponent />);
    await user.click(screen.getByText("empty"));
    await user.click(screen.getByText("long"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await user.click(screen.getByText("send"));
    await user.click(screen.getByText("send"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(fetch).toHaveBeenCalledOnce();
  });
});
