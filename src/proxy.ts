import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const proxy = (request: NextRequest) => {
  const firstSegment = request.nextUrl.pathname.split("/")[1];
  const isUnsupportedLocale =
    /^[a-z]{2}(?:-[A-Z]{2})?$/.test(firstSegment) &&
    !routing.locales.some((locale) => locale === firstSegment);

  if (isUnsupportedLocale) {
    return;
  }

  return handleI18nRouting(request);
};

export default proxy;

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
