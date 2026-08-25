"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  role: "user" | "doctor";
  content: string;
  supportId?: string;
}

export function MessageBubble({ role, content, supportId }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = supportId ? `${content}\nSupportId: ${supportId}` : content;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: keep selectable text, show feedback
      setCopied(false);
      alert("Could not copy — please select text manually");
    }
  };

  return (
    <div className={role === "user" ? "bg-primary text-primary-foreground p-3 rounded" : "bg-muted p-3 rounded"}>
      <div className="whitespace-pre-wrap selectable">{content}</div>
      <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy message">
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
