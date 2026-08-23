import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EVIDENCE_PREVIEW } from "@/utils/constant";
import { useTranslations } from "next-intl";

/**
 * Evidence preview placeholder for Cloud Run Doctor.
 * Uses ScrollArea, Separator and mono block to demo observability legibility.
 */
export const EvidencePreview = () => {
  const t = useTranslations("Evidence");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-40 rounded border bg-muted p-4">
          <pre className="font-mono text-sm text-foreground">
            {EVIDENCE_PREVIEW}
          </pre>
        </ScrollArea>
        <Separator />
        <Alert>
          <AlertTitle>{t("nextStep")}</AlertTitle>
          <AlertDescription>{t("checkLogging")}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
