import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "./reasoning";

describe("Reasoning", () => {
  it("renders with streaming", () => {
    render(
      <Reasoning isStreaming>
        <ReasoningTrigger>Investigación</ReasoningTrigger>
        <ReasoningContent>Consultando Cloud Run</ReasoningContent>
      </Reasoning>
    );
    expect(screen.getByText("Investigación")).toBeInTheDocument();
    expect(screen.getByText("Consultando Cloud Run")).toBeInTheDocument();
  });
  it("renders without streaming", () => {
    render(
      <Reasoning>
        <ReasoningTrigger>Investigación</ReasoningTrigger>
        <ReasoningContent>Done</ReasoningContent>
      </Reasoning>
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});
