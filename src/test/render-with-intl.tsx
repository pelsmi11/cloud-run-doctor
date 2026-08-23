import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import en from "../../messages/en.json";
import es from "../../messages/es.json";

const messages = { en, es } as const;

export const renderWithIntl = (
  ui: ReactElement,
  locale: keyof typeof messages = "en",
  options?: Omit<RenderOptions, "wrapper">,
): ReturnType<typeof render> => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
      </NextIntlClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...options });
};
