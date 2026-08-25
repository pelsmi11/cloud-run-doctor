"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function CodeBlock({ children, className, ...props }: React.ComponentProps<"pre">) {
  return (
    <pre className={cn("rounded-lg border bg-muted p-3 text-xs overflow-x-auto", className)} {...props}>
      <code>{children}</code>
    </pre>
  );
}
