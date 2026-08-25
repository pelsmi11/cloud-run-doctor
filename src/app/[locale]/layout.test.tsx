import { describe, expect, it, vi } from "vitest";

import RootLayout, { generateMetadata, generateStaticParams } from "./layout";

vi.mock("next-intl/server", () => ({
  getMessages: vi.fn(async () => ({})),
  getTranslations: vi.fn(
    async ({ locale }: { locale: string; namespace: string }) =>
      (key: "title" | "description") =>
        ({
          en: {
            title: "Cloud Run Doctor",
            description: "Clear, evidence-based diagnostics for Cloud Run services.",
          },
          es: {
            title: "Cloud Run Doctor",
            description: "Diagnósticos claros y basados en evidencia para servicios de Cloud Run.",
          },
        })[locale]?.[key],
  ),
}));

describe("localized root layout", () => {
  it("pre-renders every supported locale", () => {
    expect(generateStaticParams()).toEqual([{ locale: "es" }, { locale: "en" }]);
  });

  it.each([
    ["en", "Cloud Run Doctor", "Clear, evidence-based diagnostics for Cloud Run services."],
    ["es", "Cloud Run Doctor", "Diagnósticos claros y basados en evidencia para servicios de Cloud Run."],
  ])("generates %s metadata", async (locale, title, description) => {
    await expect(
      generateMetadata({ children: null, params: Promise.resolve({ locale }) }),
    ).resolves.toEqual({ title, description });
  });

  it("returns no metadata for an unsupported locale", async () => {
    await expect(
      generateMetadata({ children: null, params: Promise.resolve({ locale: "fr" }) }),
    ).resolves.toEqual({});
  });

  it.each(["en", "es"])("sets html lang to %s", async (locale) => {
    const tree = await RootLayout({
      children: <main />,
      params: Promise.resolve({ locale }),
    });

    expect(tree.props.lang).toBe(locale);
  });
});
