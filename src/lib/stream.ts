export type SseEventType =
  | "investigation-started"
  | "status"
  | "tool-start"
  | "tool-result-summary"
  | "text-delta"
  | "error"
  | "done";

export interface BaseSseEvent {
  type: SseEventType;
  investigationId: string;
  timestamp?: string;
}

export interface InvestigationStartedEvent extends BaseSseEvent {
  type: "investigation-started";
}

export interface StatusEvent extends BaseSseEvent {
  type: "status";
  phase: "cloud_run" | "logging" | "analyzing" | "generating" | "done" | "error";
  message: string;
}

export interface ToolStartEvent extends BaseSseEvent {
  type: "tool-start";
  tool: string;
  argsSummary: string;
}

export interface ToolResultSummaryEvent extends BaseSseEvent {
  type: "tool-result-summary";
  tool: string;
  ok: boolean;
  summary: string;
  truncated?: boolean;
  errorCode?: string;
}

export interface TextDeltaEvent extends BaseSseEvent {
  type: "text-delta";
  delta: string;
}

export interface ErrorEvent extends BaseSseEvent {
  type: "error";
  supportId: string;
  code: string;
  message: string;
  partialPreserved: boolean;
}

export interface DoneEvent extends BaseSseEvent {
  type: "done";
  truncated?: boolean;
}

export type SseEvent =
  | InvestigationStartedEvent
  | StatusEvent
  | ToolStartEvent
  | ToolResultSummaryEvent
  | TextDeltaEvent
  | ErrorEvent
  | DoneEvent;

export function encodeEvent(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function parseSse(buffer: string): { events: SseEvent[]; remaining: string } {
  const events: SseEvent[] = [];
  let remaining = buffer;
  let sep: number;
  while ((sep = remaining.indexOf("\n\n")) !== -1) {
    const frame = remaining.slice(0, sep);
    remaining = remaining.slice(sep + 2);
    const lines = frame.split("\n");
    let data = "";
    for (const l of lines) {
      if (l.startsWith("data:")) data += l.slice(5).trim();
    }
    if (!data) continue;
    try {
      const evt = JSON.parse(data) as SseEvent;
      events.push(evt);
    } catch {
      // ignore malformed
    }
  }
  return { events, remaining };
}

// Enforce terminal uniqueness helper
export type StreamState = "running" | "completed" | "failed" | "cancelled";

export function nextState(current: StreamState, eventType: SseEventType): StreamState {
  if (current !== "running") return current;
  if (eventType === "done") return "completed";
  if (eventType === "error") return "failed";
  return current;
}
