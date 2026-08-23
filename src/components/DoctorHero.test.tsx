import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DoctorHero } from "./DoctorHero";

describe("DoctorHero", () => {
  it("renders title and actions", () => {
    renderWithIntl(<DoctorHero />);
    expect(screen.getByText(/Clear diagnosis for Cloud Run/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Investigate/i })).toBeInTheDocument();
  });

  it("renders severity badges", () => {
    renderWithIntl(<DoctorHero />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("renders recommendation alert", () => {
    renderWithIntl(<DoctorHero />);
    expect(screen.getByText("Recommendation")).toBeInTheDocument();
  });

  it("renders the Spanish translation", () => {
    renderWithIntl(<DoctorHero />, "es");
    expect(screen.getByText("Diagnósticos claros para Cloud Run")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Investigar" })).toBeInTheDocument();
  });
});
