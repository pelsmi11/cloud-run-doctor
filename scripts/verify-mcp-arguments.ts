import { createInvestigationScope, buildLoggingArgs, buildCloudRunArgs } from "../src/mcp/argument-policy";

async function main() {
  const cases = [
    "123e4567-e89b-12d3-a456-426614174000",
    "sessionId: 123e4567-e89b-12d3-a456-426614174000",
    "what is happening with PawPass?",
  ];
  for (const msg of cases) {
    const scope = createInvestigationScope(msg);
    if ("kind" in scope && scope.kind === "invalid") {
      console.log(`Message: ${msg} => invalid ${(scope as { reason: string }).reason}`);
      continue;
    }
    const s = scope as import("../src/mcp/argument-policy").InvestigationScope;
    const logging = buildLoggingArgs(s);
    const run = buildCloudRunArgs(s);
    console.log(`Message: ${msg}`);
    console.log(`  Scope: ${s.query.kind} ${JSON.stringify(s.query)}`);
    console.log(`  Logging filter: ${logging.filter.slice(0, 100)} window=${logging.windowMinutes} max=${logging.maxEntries}`);
    console.log(`  CloudRun: ${run.service} ${run.region} project=${run.project}`);
    // Verify no model args are used – all from scope
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
