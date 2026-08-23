import { describe, expect, it } from "vitest";
import { formatBadge, pluralize } from "./format";

describe("pluralize", () => {
  it("returns singular for count 1", () => {
    expect(pluralize(1, "evidence", "evidences")).toBe("evidence");
  });

  it("returns plural for count 0", () => {
    expect(pluralize(0, "evidence", "evidences")).toBe("evidences");
  });

  it("returns plural for many", () => {
    expect(pluralize(3, "evidence", "evidences")).toBe("evidences");
  });
});

describe("formatBadge", () => {
  it("returns label without count", () => {
    expect(formatBadge("healthy")).toBe("healthy");
  });

  it("returns label with count", () => {
    expect(formatBadge("healthy", 2)).toBe("healthy (2)");
  });

  it("handles zero", () => {
    expect(formatBadge("error", 0)).toBe("error (0)");
  });
});
