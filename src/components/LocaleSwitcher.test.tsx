import { screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render-with-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    locale,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    locale: string;
  }) => createElement("a", { href: `/${locale}${href}`, ...props }, children),
  usePathname: () => "/diagnosis/REQ-789",
}));

describe("LocaleSwitcher", () => {
  it("preserves the current route and marks the active locale", () => {
    renderWithIntl(<LocaleSwitcher />);

    expect(screen.getByRole("link", { name: "Switch to English" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Switch to Spanish" })).toHaveAttribute(
      "href",
      "/es/diagnosis/REQ-789",
    );
  });
});
