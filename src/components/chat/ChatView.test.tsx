import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useLocale: () => "es" }));
vi.mock("@/hooks/useChatStream", () => ({ useChatStream: vi.fn() }));

import { useChatStream } from "@/hooks/useChatStream";

import { ChatView } from "./ChatView";

describe("ChatView", () => {
  it("renders the empty chat", () => {
    vi.mocked(useChatStream).mockReturnValue({
      messages: [],
      isInvestigating: false,
      sendMessage: vi.fn(),
      cancel: vi.fn(),
    });

    render(<ChatView />);

    expect(screen.getByText("¿Qué está pasando con PawPass?")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensaje para el Doctor")).toBeInTheDocument();
  });

  it("renders observable progress and streamed Markdown", () => {
    vi.mocked(useChatStream).mockReturnValue({
      messages: [
        { id: "1", role: "user", content: "hello", state: "sent" },
        {
          id: "2",
          role: "doctor",
          content: "## Estado observado\nPawPass está Ready",
          state: "partial",
          supportId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
          progress: {
            phase: "logging",
            tool: "logging:list_log_entries",
            summary: "8 entries found",
          },
        },
      ],
      isInvestigating: true,
      sendMessage: vi.fn(),
      cancel: vi.fn(),
    });

    render(<ChatView />);

    expect(screen.getByText("Logging")).toBeInTheDocument();
    expect(screen.getByText("Estado observado")).toBeInTheDocument();
    expect(screen.getByText(/supportId:/)).toBeInTheDocument();
  });
});
