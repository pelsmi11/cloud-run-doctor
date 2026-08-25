import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders content", () => {
    render(<MessageBubble role="user" content="hello" />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
  it("copies with clipboard", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    render(<MessageBubble role="doctor" content="diag" supportId="aaa" />);
    await user.click(screen.getByLabelText("Copy message"));
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });
  it("handles clipboard missing", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MessageBubble role="doctor" content="diag" />);
    await user.click(screen.getByLabelText("Copy message"));
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
    Object.defineProperty(navigator, "clipboard", { value: { writeText: vi.fn() }, configurable: true });
  });
});
