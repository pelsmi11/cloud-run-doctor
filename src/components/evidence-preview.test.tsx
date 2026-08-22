import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidencePreview } from "./evidence-preview";

describe("EvidencePreview", () => {
  it("renders evidence card", () => {
    render(<EvidencePreview />);
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText(/PET_REGISTRATION_STARTED/)).toBeInTheDocument();
  });

  it("renders next step alert", () => {
    render(<EvidencePreview />);
    expect(screen.getByText("Next step")).toBeInTheDocument();
  });
});
