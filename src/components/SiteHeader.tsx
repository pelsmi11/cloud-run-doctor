import { Badge } from "@/components/ui/badge";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useTranslations } from "next-intl";

export const SiteHeader = () => {
  const t = useTranslations("Header");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">✓</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            Cloud Run Doctor
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-healthy animate-pulse" />
            {t("evidence")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden text-xs font-normal sm:inline-flex">
            pawpass-gdg-demo · us-central1
          </Badge>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
};
