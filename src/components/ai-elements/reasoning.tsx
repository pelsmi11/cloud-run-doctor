"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function Reasoning({
  children,
  isStreaming,
  className,
  ...props
}: {
  children: React.ReactNode;
  isStreaming?: boolean;
} & React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-lg border bg-muted/30", isStreaming && "border-primary/20", className)} data-streaming={isStreaming ? "true" : undefined} {...props}>
      {children}
    </div>
  );
}

export function ReasoningTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      <ChevronDown className="h-3 w-3" />
      {children ?? "Investigación"}
    </button>
  );
}

export function ReasoningContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-3 pb-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap", className)} {...props}>
      {children}
    </div>
  );
}
