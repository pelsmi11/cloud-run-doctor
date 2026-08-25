"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Tool({ children, className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-lg border bg-card", className)} {...props}>{children}</div>;
}
export function ToolHeader({ children, className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 border-b px-3 py-2 text-xs font-medium", className)} {...props}>{children}</div>;
}
export function ToolContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-3 text-xs", className)} {...props}>{children}</div>;
}
export function ToolOutput({ children, className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded bg-muted p-2 text-xs", className)} {...props}>{children}</div>;
}
