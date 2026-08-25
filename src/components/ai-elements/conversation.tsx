"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Conversation({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      {children}
    </div>
  );
}

export function ConversationContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex-1 overflow-y-auto space-y-4 p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function ConversationEmptyState({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
      {icon && <div className="rounded-2xl bg-primary/10 p-4">{icon}</div>}
      <div className="max-w-md space-y-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ConversationScrollButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn("absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md", className)}
      {...props}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
}
