import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "./page";

describe("Page", () => {
  it("renders Doctor placeholders", () => {
    render(<Page />);
    expect(screen.getByText("Cloud Run Doctor")).toBeInTheDocument();
    expect(screen.getByText(/Clear diagnosis for Cloud Run/i)).toBeInTheDocument();
    expect(screen.getAllByText("Evidence").length).toBeGreaterThanOrEqual(1);
  });
});
