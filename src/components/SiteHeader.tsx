import { Badge } from "@/components/ui/badge";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useTranslations } from "next-intl";

/**
 * Site header for Cloud Run Doctor.
 * Technical, calm and diagnostic — slate base with slate tokens.
 */
export const SiteHeader = () => {
  const t = useTranslations("Header");

  return (
    <header className="flex items-center justify-between border-b bg-card px-6 py-4">
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Cloud Run Doctor
      </span>
      <div className="flex items-center gap-3">
        <Badge className="bg-evidence text-white">{t("evidence")}</Badge>
        <LocaleSwitcher />
      </div>
    </header>
  );
};
