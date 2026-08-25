import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageResponse } from "./message";

describe("MessageResponse", () => {
  it("renders markdown", () => {
    render(<MessageResponse>## Hello</MessageResponse>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
