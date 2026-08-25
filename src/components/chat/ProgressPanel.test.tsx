import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressPanel } from "./ProgressPanel";

describe("ProgressPanel", () => {
  it("renders phase", () => {
    render(<ProgressPanel phase="investigating" tool="cloud_run:list" summary="Ready" />);
    expect(screen.getByText("Iniciando")).toBeInTheDocument();
  });
  it("returns null without phase", () => {
    const { container } = render(<ProgressPanel />);
    expect(container.textContent).toBe("");
  });
});
