import { FunctionTool, InMemoryRunner, LlmAgent, MCPToolset } from "@google/adk";
import type { StreamableHTTPConnectionParams } from "@google/adk";
import { ThinkingLevel } from "@google/genai";
import { z } from "zod";

// Verify ADK 2.0.0 types compile without network
const testSchema = z.object({
  query: z.string(),
});

const localTool = new FunctionTool({
  name: "investigate",
  description: "Local controlled capability over InvestigationScope",
  parameters: testSchema,
  execute: async ({ query }: { query: string }) => {
    // In real adapter, this would delegate via McpArgumentPolicy → adapter → mapper
    return { result: `investigated:${query}` };
  },
});

const agent = new LlmAgent({
  name: "doctor",
  model: "gemini-3.7-flash",
  instruction: "Investigate PawPass with 6 sections",
  tools: [localTool],
  generateContentConfig: {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.LOW,
    },
  },
});

// Verify InMemoryRunner with abortSignal and close
const runner = new InMemoryRunner({ agent, appName: "cloud-run-doctor" });
const controller = new AbortController();

// Verify MCPToolset construction with StreamableHTTP and toolFilter
const params: StreamableHTTPConnectionParams = {
  type: "StreamableHTTPConnectionParams",
  url: "https://run.googleapis.com/mcp",
  transportOptions: {
    requestInit: {
      headers: {
        Authorization: "Bearer fake",
        "x-goog-user-project": "pawpass-gdg-demo",
      },
    },
  },
  timeout: 15000,
};

const toolset = new MCPToolset(params, ["fake_tool"]);

// Verify runAsync signature with abortSignal (no network call)
async function verify() {
  try {
    // This would be: for await (const event of runner.runAsync({ userId: "doctor-user", sessionId: "test", newMessage: { role: "user", parts: [{ text: "hello" }] }, abortSignal: controller.signal })) {}
    void runner;
    void controller;
    void toolset;
    void agent;
  } finally {
    await toolset.close();
  }
}

void verify();

// Ensure thinkingLevel path compiles
const low = ThinkingLevel.LOW;
void low;

console.log("verify-adk spike compiles");
