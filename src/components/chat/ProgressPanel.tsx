"use client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Cloud, Search, Brain, FileText } from "lucide-react";

interface Props {
  phase?: string;
  tool?: string;
  summary?: string;
}

const phaseConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  investigating: { label: "Iniciando", icon: Loader2, color: "text-muted-foreground" },
  partial: { label: "Analizando", icon: Brain, color: "text-primary" },
  cloud_run: { label: "Cloud Run", icon: Cloud, color: "text-evidence" },
  logging: { label: "Logging", icon: Search, color: "text-evidence" },
  analyzing: { label: "Analizando", icon: Brain, color: "text-primary" },
  generating: { label: "Generando", icon: FileText, color: "text-primary" },
  complete: { label: "Completado", icon: FileText, color: "text-healthy" },
};

export function ProgressPanel({ phase, tool, summary }: Props) {
  if (!phase) return null;
  const cfg = phaseConfig[phase] ?? { label: phase, icon: Loader2, color: "text-muted-foreground" };
  const Icon = cfg.icon;
  const isActive = phase === "investigating" || phase === "partial" || phase === "cloud_run" || phase === "logging";

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="gap-1.5 bg-background font-normal">
        <Icon className={`h-3 w-3 ${isActive ? "animate-spin" : ""} ${cfg.color}`} />
        {cfg.label}
      </Badge>
      {tool && <span className="hidden text-muted-foreground sm:inline">· {tool}</span>}
      {summary && <span className="hidden truncate text-muted-foreground sm:inline">· {summary}</span>}
    </div>
  );
}
