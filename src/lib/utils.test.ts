import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("p-2", "m-2")).toBe("p-2 m-2");
  });

  it("handles conditional classes", () => {
    expect(cn("p-2", false && "m-2", "flex")).toBe("p-2 flex");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles arrays and objects", () => {
    expect(cn(["p-2", "m-2"], { flex: true, hidden: false })).toBe("p-2 m-2 flex");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
