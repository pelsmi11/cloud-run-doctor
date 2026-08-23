import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render-with-intl";
import Page from "./page";

describe("localized page", () => {
  it("renders Doctor placeholders in English", () => {
    renderWithIntl(<Page />);
    expect(screen.getByText("Cloud Run Doctor")).toBeInTheDocument();
    expect(screen.getByText(/Clear diagnosis for Cloud Run/i)).toBeInTheDocument();
    expect(screen.getAllByText("Evidence").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Doctor placeholders in Spanish", () => {
    renderWithIntl(<Page />, "es");
    expect(screen.getByText(/Diagnósticos claros para Cloud Run/i)).toBeInTheDocument();
    expect(screen.getAllByText("Evidencia").length).toBeGreaterThanOrEqual(1);
  });
});
