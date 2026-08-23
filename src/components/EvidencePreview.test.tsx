import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { EvidencePreview } from "./EvidencePreview";

describe("EvidencePreview", () => {
  it("renders evidence card", () => {
    renderWithIntl(<EvidencePreview />);
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText(/PET_REGISTRATION_STARTED/)).toBeInTheDocument();
  });

  it("renders next step alert", () => {
    renderWithIntl(<EvidencePreview />);
    expect(screen.getByText("Next step")).toBeInTheDocument();
  });
});
