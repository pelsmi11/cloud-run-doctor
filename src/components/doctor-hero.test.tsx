import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DoctorHero } from "./doctor-hero";

describe("DoctorHero", () => {
  it("renders title and actions", () => {
    render(<DoctorHero />);
    expect(screen.getByText(/Clear diagnosis for Cloud Run/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Investigate/i })).toBeInTheDocument();
  });

  it("renders severity badges", () => {
    render(<DoctorHero />);
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("renders recommendation alert", () => {
    render(<DoctorHero />);
    expect(screen.getByText("Recommendation")).toBeInTheDocument();
  });
});
