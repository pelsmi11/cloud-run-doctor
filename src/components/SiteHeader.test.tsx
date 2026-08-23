import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  it("renders brand and evidence badge", () => {
    renderWithIntl(<SiteHeader />);
    expect(screen.getByText("Cloud Run Doctor")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Switch to English" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Switch to Spanish" })).toHaveAttribute(
      "href",
      "/es",
    );
  });
});
