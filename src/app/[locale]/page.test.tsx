import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render-with-intl";
import Page from "./page";

describe("localized page", () => {
  it("renders Doctor placeholders in English", () => {
    renderWithIntl(<Page />);
    expect(screen.getAllByText("Cloud Run Doctor").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Clear diagnosis for Cloud Run")).toBeInTheDocument();
    expect(screen.getByText(/Technical, calm/i)).toBeInTheDocument();
  });

  it("renders Doctor placeholders in Spanish", () => {
    renderWithIntl(<Page />, "es");
    expect(screen.getAllByText("Cloud Run Doctor").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Diagnósticos claros para Cloud Run")).toBeInTheDocument();
    expect(screen.getByText(/Técnico, sereno/i)).toBeInTheDocument();
  });
});
