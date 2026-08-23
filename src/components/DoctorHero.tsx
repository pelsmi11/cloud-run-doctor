import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

/**
 * Hero section for Cloud Run Doctor.
 * Demonstrates technical palette and severity tokens.
 */
export const DoctorHero = () => {
  const t = useTranslations("Hero");
  const severity = useTranslations("Severity");

  return (
    <section className="space-y-6 rounded-lg border bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="max-w-prose text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary">{t("investigate")}</Button>
        <Badge className="bg-healthy text-white">{severity("healthy")}</Badge>
        <Badge className="bg-warning text-white">{severity("warning")}</Badge>
        <Badge variant="destructive">{severity("error")}</Badge>
        <Badge className="bg-evidence text-white">{severity("evidence")}</Badge>
      </div>

      <Alert className="border-recommended/50 bg-recommended/10">
        <AlertTitle>{t("recommendation")}</AlertTitle>
        <AlertDescription>{t("placeholder")}</AlertDescription>
      </Alert>
    </section>
  );
};
