import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import proxy, { config } from "./proxy";

vi.mock("next-intl/middleware", () => ({
  default: () => (request: NextRequest) =>
    new Response(null, {
      status: 307,
      headers: { location: new URL("/en", request.nextUrl).toString() },
    }),
}));

describe("i18n proxy", () => {
  const matches = (pathname: string) =>
    new RegExp(`^${config.matcher}$`).test(pathname);
  const request = (pathname: string) =>
    ({ nextUrl: new URL(pathname, "http://localhost") }) as NextRequest;

  it("redirects the unprefixed root to English", () => {
    const response = proxy(request("/"));

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("http://localhost/en");
  });

  it("lets unsupported locale segments reach the localized layout", () => {
    expect(proxy(request("/fr"))).toBeUndefined();
  });

  it("matches pages but excludes APIs, Next resources and static files", () => {
    expect(matches("/en")).toBe(true);
    expect(matches("/es/diagnosis")).toBe(true);
    expect(matches("/api/chat")).toBe(false);
    expect(matches("/_next/static/app.js")).toBe(false);
    expect(matches("/favicon.ico")).toBe(false);
  });
});
