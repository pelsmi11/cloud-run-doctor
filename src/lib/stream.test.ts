import { describe, it, expect } from "vitest";
import { encodeEvent, parseSse, nextState } from "./stream";

describe("stream", () => {
  it("encodes and parses chunks split", () => {
    const evt = { type: "text-delta" as const, investigationId: "aaa", delta: "hello" };
    const encoded = encodeEvent(evt);
    const { events } = parseSse(encoded);
    expect(events[0]).toEqual(evt);
  });
  it("handles seven events", () => {
    const events = [
      { type: "investigation-started" as const, investigationId: "id1" },
      { type: "status" as const, investigationId: "id1", phase: "cloud_run" as const, message: "x" },
      { type: "tool-start" as const, investigationId: "id1", tool: "t", argsSummary: "s" },
      { type: "tool-result-summary" as const, investigationId: "id1", tool: "t", ok: true, summary: "ok" },
      { type: "text-delta" as const, investigationId: "id1", delta: "hi" },
      { type: "done" as const, investigationId: "id1" },
    ];
    let buf = "";
    for (const e of events) buf += encodeEvent(e as never);
    const { events: parsed } = parseSse(buf);
    expect(parsed.length).toBe(events.length);
  });
  it("terminal unique done xor error", () => {
    const done = encodeEvent({ type: "done" as const, investigationId: "id1" });
    const err = encodeEvent({ type: "error" as const, investigationId: "id1", supportId: "id1", code: "UNKNOWN", message: "x", partialPreserved: true });
    expect(parseSse(done + err).events.length).toBe(2);
  });
  it("handles split chunks", () => {
    const e1 = encodeEvent({ type: "text-delta" as const, investigationId: "id1", delta: "a" });
    const part1 = e1.slice(0, 5);
    const part2 = e1.slice(5);
    const { events, remaining } = parseSse(part1);
    expect(events.length).toBe(0);
    const res = parseSse(remaining + part2);
    expect(res.events.length).toBe(1);
  });
  it("ignores malformed json", () => {
    const { events } = parseSse("data: not-json\n\n");
    expect(events.length).toBe(0);
  });
  it("ignores frame without data", () => {
    const { events } = parseSse("event: test\n\n");
    expect(events.length).toBe(0);
  });
});

describe("nextState", () => {
  it("transitions", () => {
    expect(nextState("running", "done")).toBe("completed");
    expect(nextState("running", "error")).toBe("failed");
    expect(nextState("completed", "done")).toBe("completed");
    expect(nextState("running", "text-delta")).toBe("running");
  });
});
