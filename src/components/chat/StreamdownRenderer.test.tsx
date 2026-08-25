import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreamdownRenderer } from "./StreamdownRenderer";

describe("StreamdownRenderer", () => {
  it("renders markdown", () => {
    render(<StreamdownRenderer markdown="# hello" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
  it("sanitizes javascript: url", () => {
    render(<StreamdownRenderer markdown="[x](javascript:alert(1))" />);
    const link = screen.queryByRole("link");
    // should be sanitized to # or not have javascript:
    if (link) expect(link.getAttribute("href")).not.toContain("javascript:");
  });
  it("handles incomplete markdown", () => {
    render(<StreamdownRenderer markdown="```\ncode" isStreaming />);
    expect(document.body.textContent).toContain("code");
  });
});
