import { describe, it, expect } from "vitest";
import { createInvestigationScope, buildLoggingArgs, revalidateLoggingArgs } from "./argument-policy";

const uuid = "123e4567-e89b-12d3-a456-426614174000";
const uuid2 = "123e4567-e89b-12d3-a456-426614174001";

describe("McpArgumentPolicy", () => {
  it("scope readonly project/region/service not overwritable", () => {
    const scope = createInvestigationScope(uuid) as import("./argument-policy").InvestigationScope;
    expect(scope.project).toBe("pawpass-gdg-demo");
    expect(scope.region).toBe("us-central1");
    expect(scope.service).toBe("pawpass");
    const args = buildLoggingArgs(scope);
    expect(() => revalidateLoggingArgs({ ...args, project: "evil" }, scope)).toThrow();
  });
  it("rejects model filter", () => {
    const scope = createInvestigationScope(uuid) as import("./argument-policy").InvestigationScope;
    const args = buildLoggingArgs(scope);
    expect(args.filter).toContain("jsonPayload.requestId");
  });
  it("exact filters request/session/general", () => {
    const req = createInvestigationScope(`requestId: ${uuid}`) as import("./argument-policy").InvestigationScope;
    expect(buildLoggingArgs(req).filter).toContain(uuid);
    const sess = createInvestigationScope(`sessionId: ${uuid}`) as import("./argument-policy").InvestigationScope;
    expect(buildLoggingArgs(sess).filter).toContain("sessionId");
    const gen = createInvestigationScope("what is happening") as import("./argument-policy").InvestigationScope;
    expect(buildLoggingArgs(gen).filter).toContain("severity>=ERROR");
  });
  it("limits 60/20 and 1440/100", () => {
    const req = createInvestigationScope(uuid) as import("./argument-policy").InvestigationScope;
    expect(req.query.windowMinutes).toBe(60);
    expect(req.query.maxEntries).toBe(20);
    const sess = createInvestigationScope(`session ${uuid}`) as import("./argument-policy").InvestigationScope;
    expect(sess.query.windowMinutes).toBe(1440);
    expect(sess.query.maxEntries).toBe(100);
  });
  it("invalid multiple identifiers", () => {
    const res = createInvestigationScope(`${uuid} ${uuid2}`);
    expect((res as { kind: string }).kind).toBe("invalid");
  });
});
