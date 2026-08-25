import { describe, it, expect } from "vitest";
import { classifyQuery, chatRequestSchema } from "./validation";

const uuid = "123e4567-e89b-12d3-a456-426614174000";
const uuid2 = "123e4567-e89b-12d3-a456-426614174001";

describe("chatRequestSchema", () => {
  it("validates message 1..4000", () => {
    expect(chatRequestSchema.safeParse({ message: "hello" }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ message: "" }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ message: "   " }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ message: "a".repeat(4000) }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ message: "a".repeat(4001) }).success).toBe(false);
  });
  it("validates locale", () => {
    expect(chatRequestSchema.safeParse({ message: "hi", locale: "es" }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ message: "hi", locale: "en" }).success).toBe(true);
    expect(chatRequestSchema.safeParse({ message: "hi", locale: "fr" as unknown as string }).success).toBe(false);
  });
});

describe("classifyQuery", () => {
  it("isolated UUID → request", () => {
    expect(classifyQuery(uuid)).toEqual({ kind: "request", requestId: uuid });
  });
  it("requestId: UUID → request", () => {
    expect(classifyQuery(`requestId: ${uuid}`)).toMatchObject({ kind: "request" });
  });
  it("support id UUID → request", () => {
    expect(classifyQuery(`support id ${uuid}`)).toMatchObject({ kind: "request" });
  });
  it("sessionId=UUID → session", () => {
    expect(classifyQuery(`sessionId=${uuid}`)).toMatchObject({ kind: "session" });
  });
  it("SESSION UUID → session", () => {
    expect(classifyQuery(`SESSION ${uuid}`)).toMatchObject({ kind: "session" });
  });
  it("same UUID repeated → single", () => {
    const res = classifyQuery(`${uuid} ${uuid}`);
    expect(res).toMatchObject({ kind: "request", requestId: uuid });
  });
  it("two different UUIDs → invalid multiple", () => {
    expect(classifyQuery(`${uuid} ${uuid2}`)).toEqual({ kind: "invalid", reason: "multiple-identifiers" });
  });
  it("request + session labels → invalid mixed", () => {
    expect(classifyQuery(`requestId: ${uuid} sessionId: ${uuid2}`)).toEqual({ kind: "invalid", reason: "mixed-identifier-types" });
  });
  it("label with malformed → invalid malformed", () => {
    expect(classifyQuery(`requestId: not-a-uuid`)).toEqual({ kind: "invalid", reason: "malformed-identifier" });
  });
  it("no UUID nor label → general", () => {
    expect(classifyQuery("¿qué está pasando con PawPass?")).toEqual({ kind: "general" });
  });
  it("label >20 chars from UUID → not linked, isolated UUID wins", () => {
    const spaced = `requestId:                     ${uuid}`; // >20 spaces
    expect(classifyQuery(spaced)).toMatchObject({ kind: "request" });
  });
  it("handles multiline mixed and malformed", () => {
    expect(classifyQuery(`requestId: ${uuid}\nsession: ${uuid2}`)).toEqual({
      kind: "invalid",
      reason: "mixed-identifier-types",
    });
    expect(classifyQuery(`session: not-uuid`)).toEqual({ kind: "invalid", reason: "malformed-identifier" });
  });
  it("invalid → would be zero integrations (checked via classification)", () => {
    const res = classifyQuery(`${uuid} ${uuid2}`);
    expect(res.kind).toBe("invalid");
  });
});
