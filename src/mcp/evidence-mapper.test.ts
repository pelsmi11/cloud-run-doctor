import { describe, it, expect } from "vitest";
import { mapSingleEvidence, mapEvidenceCollection } from "./evidence-mapper";
import type { InvestigationScope } from "./argument-policy";

const uuid = "123e4567-e89b-12d3-a456-426614174000";

const baseScope: InvestigationScope = {
  project: "pawpass-gdg-demo",
  region: "us-central1",
  service: "pawpass",
  query: { kind: "request", requestId: uuid, windowMinutes: 60, maxEntries: 20 },
};

describe("evidence-mapper", () => {
  it("maps valid payload", () => {
    const ev = mapSingleEvidence({ source: "cloud_run", service: "pawpass", observedAt: "2026-08-24T10:30:00Z" });
    expect(ev.service).toBe("pawpass");
  });
  it("discards unknown field", () => {
    const ev = mapSingleEvidence({ source: "cloud_run", token: "secret", service: "pawpass" } as unknown as Record<string, unknown>);
    expect((ev as unknown as Record<string, unknown>).token).toBeUndefined();
    expect(ev.service).toBe("pawpass");
  });
  it("limits max-1/max/max+1", () => {
    const ok63 = "a".repeat(63);
    expect(() => mapSingleEvidence({ source: "logging", service: ok63 })).not.toThrow();
    expect(() => mapSingleEvidence({ source: "logging", service: "a".repeat(64) })).toThrow();
    expect(() => mapSingleEvidence({ source: "logging", event: "a".repeat(128) })).not.toThrow();
    expect(() => mapSingleEvidence({ source: "logging", event: "a".repeat(129) })).toThrow();
  });
  it("validates UUID and ISO", () => {
    expect(() => mapSingleEvidence({ source: "logging", requestId: "not-uuid" } as unknown as object)).toThrow();
    expect(() => mapSingleEvidence({ source: "logging", observedAt: "2026-08-24" } as unknown as object)).toThrow();
    expect(() => mapSingleEvidence({ source: "logging", observedAt: "2026-08-24T10:30:00Z" } as unknown as object)).not.toThrow();
  });
  it("collection truncated logic", () => {
    const scope20 = { ...baseScope, query: { kind: "request" as const, requestId: (baseScope.query as { requestId: string }).requestId, windowMinutes: 60, maxEntries: 20 } } as unknown as InvestigationScope;
    const entries19 = Array.from({ length: 19 }, (_, i) => ({ source: "logging" as const, event: `e${i}` }));
    const r19 = mapEvidenceCollection(entries19, scope20);
    expect(r19.truncated).toBe(false);
    const entries20 = Array.from({ length: 20 }, () => ({ source: "logging" as const }));
    expect(mapEvidenceCollection(entries20, scope20).truncated).toBe(true);
    const entries21 = Array.from({ length: 21 }, () => ({ source: "logging" as const }));
    const r21 = mapEvidenceCollection(entries21, scope20);
    expect(r21.evidence.length).toBe(20);
    expect(r21.truncated).toBe(true);
  });
  it("500/501 and hasNextPageToken", () => {
    const scope500 = { ...baseScope, query: { kind: "session" as const, sessionId: uuid, windowMinutes: 1440, maxEntries: 500 } } as unknown as InvestigationScope;
    const entries500 = Array.from({ length: 500 }, () => ({ source: "logging" as const }));
    expect(mapEvidenceCollection(entries500, scope500).truncated).toBe(true);
    expect(mapEvidenceCollection(entries500, scope500).evidence.length).toBe(500);
    const entries501 = Array.from({ length: 501 }, () => ({ source: "logging" as const }));
    expect(() => mapEvidenceCollection(entries501 as unknown as [], scope500)).toThrow();
    const rToken = mapEvidenceCollection([{ source: "logging" }], scope500, { hasNextPageToken: true });
    expect(rToken.truncated).toBe(true);
  });
  it("error without raw", () => {
    try {
      mapSingleEvidence({ source: "logging", service: "a".repeat(100) });
    } catch (e) {
      expect(String(e)).not.toContain("a".repeat(100));
    }
  });
});
