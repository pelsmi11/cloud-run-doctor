import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { ShieldCheck, Search, Zap } from "lucide-react";

export const DoctorHero = () => {
  const t = useTranslations("Hero");

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
              {t("title")}
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              {t("description")}
            </CardDescription>
          </div>
          <Badge className="gap-1.5 bg-evidence text-white shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Solo lectura
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Search className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Evidencia real</p>
              <p className="text-xs text-muted-foreground">Cloud Run + Logging vía MCP</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-healthy/10 text-healthy">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Solo lectura</p>
              <p className="text-xs text-muted-foreground">Allowlist + IAM mínimo</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning">
              <Zap className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Streaming</p>
              <p className="text-xs text-muted-foreground">SSE + Streamdown</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
