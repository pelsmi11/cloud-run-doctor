import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

const keys = (value: unknown, prefix = ""): string[] => {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keys(child, prefix ? `${prefix}.${key}` : key),
  );
};

describe("message catalogs", () => {
  it("keeps English and Spanish keys in sync", () => {
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });
});
