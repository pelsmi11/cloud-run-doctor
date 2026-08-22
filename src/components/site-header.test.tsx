import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders brand and evidence badge", () => {
    render(<SiteHeader />);
    expect(screen.getByText("Cloud Run Doctor")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });
});
