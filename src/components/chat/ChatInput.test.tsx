import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  it("disables empty and enables with text", async () => {
    const user = userEvent.setup();
    const onSend = () => {};
    render(<ChatInput onSend={onSend} />);
    const input = screen.getByLabelText("Mensaje para el Doctor");
    const button = screen.getByLabelText("Enviar mensaje");
    expect(button).toBeDisabled();
    await user.type(input, "hello");
    expect(button).toBeEnabled();
  });
  it("trims and blocks empty", async () => {
    const user = userEvent.setup();
    let sent: string | null = null;
    render(<ChatInput onSend={(m) => (sent = m)} />);
    const input = screen.getByLabelText("Mensaje para el Doctor");
    await user.type(input, "   ");
    await user.click(screen.getByLabelText("Enviar mensaje"));
    expect(sent).toBeNull();
  });
  it("shows disabled state when prop disabled", () => {
    render(<ChatInput onSend={() => {}} disabled />);
    expect(screen.getByLabelText("Mensaje para el Doctor")).toBeDisabled();
    expect(screen.getByLabelText("Enviar mensaje")).toBeDisabled();
  });
  it("shows character count", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={() => {}} />);
    const input = screen.getByLabelText("Mensaje para el Doctor");
    await user.type(input, "hello");
    expect(screen.getByText("5/4000")).toBeInTheDocument();
  });
});
