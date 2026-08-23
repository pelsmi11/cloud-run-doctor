"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const LocaleSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");

  return (
    <nav aria-label={t("label")} className="flex items-center gap-1 text-xs">
      {routing.locales.map((targetLocale) => (
        <Link
          key={targetLocale}
          href={pathname}
          locale={targetLocale}
          aria-current={locale === targetLocale ? "page" : undefined}
          aria-label={t("switchTo", { language: t(targetLocale) })}
          className="rounded px-2 py-1 font-medium uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          {targetLocale}
        </Link>
      ))}
    </nav>
  );
};
