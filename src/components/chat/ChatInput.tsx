"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const isEmpty = trimmed.length === 0;
  const isDisabled = disabled || isEmpty;

  const handleSend = () => {
    if (isDisabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta por un requestId, sessionId o '¿qué está pasando?'"
            aria-label="Mensaje para el Doctor"
            disabled={disabled}
            rows={1}
            className="min-h-[48px] max-h-[120px] resize-none pr-12 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus-visible:ring-1"
          />
          <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/60 hidden sm:block">
            {value.length > 0 && `${value.length}/4000`}
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={isDisabled}
          size="icon"
          className="h-[48px] w-[48px] shrink-0 rounded-xl cursor-pointer transition-colors disabled:opacity-40"
          aria-label="Enviar mensaje"
        >
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="hidden sm:inline">↵ Enviar · ⇧↵ nueva línea · Esc cancelar</span>
        <span className="sm:hidden">Solo lectura · no inventa logs</span>
        <span className="hidden sm:inline">
          {disabled ? "Investigando..." : "Listo para diagnosticar"}
        </span>
      </div>
    </div>
  );
}
