import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DoctorHero } from "./DoctorHero";

describe("DoctorHero", () => {
  it("renders title and actions", () => {
    renderWithIntl(<DoctorHero />);
    expect(screen.getByText("Clear diagnosis for Cloud Run")).toBeInTheDocument();
    expect(screen.getAllByText("Solo lectura").length).toBeGreaterThanOrEqual(1);
  });

  it("renders feature cards", () => {
    renderWithIntl(<DoctorHero />);
    expect(screen.getByText("Evidencia real")).toBeInTheDocument();
    expect(screen.getByText("Streaming")).toBeInTheDocument();
    expect(screen.getByText(/Allowlist/)).toBeInTheDocument();
  });

  it("renders feature details", () => {
    renderWithIntl(<DoctorHero />);
    expect(screen.getByText("Evidencia real")).toBeInTheDocument();
    expect(screen.getByText(/Allowlist/)).toBeInTheDocument();
  });

  it("renders the Spanish translation", () => {
    renderWithIntl(<DoctorHero />, "es");
    expect(screen.getByText("Diagnósticos claros para Cloud Run")).toBeInTheDocument();
  });
});
