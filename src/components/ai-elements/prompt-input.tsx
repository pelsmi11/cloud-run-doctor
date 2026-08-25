"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

export interface PromptInputMessage {
  text: string;
  files?: FileList;
}

export function PromptInput({
  children,
  onSubmit,
  className,
  ...props
}: {
  children: React.ReactNode;
  onSubmit: (message: PromptInputMessage) => void;
} & Omit<React.ComponentProps<"form">, "onSubmit">) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = (formData.get("text") as string) || "";
    onSubmit({ text });
  };
  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} {...props}>
      {children}
    </form>
  );
}

export function PromptInputTextarea({
  value,
  onChange,
  placeholder,
  className,
  ...props
}: React.ComponentProps<typeof Textarea> & { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) {
  return (
    <Textarea
      name="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("min-h-[48px] max-h-[120px] resize-none pr-12", className)}
      {...props}
    />
  );
}

export function PromptInputSubmit({
  status,
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { status: "ready" | "streaming" | "submitted"; disabled?: boolean }) {
  const isStreaming = status === "streaming" || status === "submitted";
  return (
    <Button type="submit" size="icon" aria-label="Enviar mensaje" disabled={disabled || isStreaming} className={cn("h-8 w-8", className)} {...props}>
      {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  );
}
