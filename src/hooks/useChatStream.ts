"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { parseSse } from "@/lib/stream";

export interface ChatProgress {
  phase: string;
  tool?: string;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "doctor";
  content: string;
  state: "sent" | "investigating" | "partial" | "complete" | "error" | "cancelled";
  investigationId?: string;
  supportId?: string;
  progress?: ChatProgress;
}

const updateLastDoctorMessage = (
  messages: ChatMessage[],
  update: (message: ChatMessage) => ChatMessage
): ChatMessage[] => {
  const index = messages.findLastIndex((message) => message.role === "doctor");
  if (index < 0) return messages;
  return messages.map((message, currentIndex) =>
    currentIndex === index ? update(message) : message
  );
};

export const useChatStream = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const localeRef = useRef<"es" | "en">("es");
  const startedForRef = useRef<string | null>(null);

  const sendMessage = useCallback(
    (message: string, locale: "es" | "en" = "es") => {
      const trimmed = message.trim();
      if (!trimmed || trimmed.length > 4000 || isInvestigating) return;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: trimmed,
          state: "sent",
        },
        {
          id: crypto.randomUUID(),
          role: "doctor",
          content: "",
          state: "investigating",
          progress: { phase: "investigating" },
        },
      ]);
      setIsInvestigating(true);
      setPendingMessage(trimmed);
      localeRef.current = locale;
    },
    [isInvestigating]
  );

  useEffect(() => {
    if (!pendingMessage || startedForRef.current === pendingMessage) return;

    const message = pendingMessage;
    const locale = localeRef.current;
    const controller = new AbortController();
    startedForRef.current = message;
    abortRef.current = controller;
    setPendingMessage(null);

    const consume = async () => {
      let terminalReceived = false;
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, locale }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = (await response.json().catch(() => ({}))) as {
            message?: string;
            supportId?: string;
          };
          setMessages((current) =>
            updateLastDoctorMessage(current, (doctor) => ({
              ...doctor,
              state: "error",
              content: body.message ?? "No se pudo completar la consulta.",
              supportId: body.supportId,
            }))
          );
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parsed = parseSse(buffer);
          buffer = parsed.remaining;

          for (const event of parsed.events) {
            if (event.type === "investigation-started") {
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  investigationId: event.investigationId,
                  supportId: event.investigationId,
                }))
              );
            } else if (event.type === "status") {
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  progress: { phase: event.phase, summary: event.message },
                }))
              );
            } else if (event.type === "tool-start") {
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  progress: {
                    phase: event.tool.startsWith("cloud_run") ? "cloud_run" : "logging",
                    tool: event.tool,
                    summary: event.argsSummary,
                  },
                }))
              );
            } else if (event.type === "tool-result-summary") {
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  progress: {
                    phase: event.tool.startsWith("cloud_run") ? "cloud_run" : "logging",
                    tool: event.tool,
                    summary: event.summary,
                  },
                }))
              );
            } else if (event.type === "text-delta") {
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  content: doctor.content + event.delta,
                  state: "partial",
                }))
              );
            } else if (event.type === "done") {
              terminalReceived = true;
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  state: "complete",
                  progress: { phase: "complete" },
                }))
              );
            } else if (event.type === "error") {
              terminalReceived = true;
              setMessages((current) =>
                updateLastDoctorMessage(current, (doctor) => ({
                  ...doctor,
                  state: "error",
                  content: doctor.content
                    ? `${doctor.content}\n\n> **Error:** ${event.message}`
                    : `> **Error:** ${event.message}`,
                  supportId: event.supportId,
                  progress: { phase: "error", summary: event.code },
                }))
              );
            }
          }
        }

        if (!terminalReceived && !controller.signal.aborted) {
          setMessages((current) =>
            updateLastDoctorMessage(current, (doctor) => ({
              ...doctor,
              state: "error",
              content: doctor.content || "La conexión terminó antes de completar la investigación.",
            }))
          );
        }
      } catch (error) {
        const cancelled =
          controller.signal.aborted ||
          (typeof error === "object" &&
            error !== null &&
            "name" in error &&
            error.name === "AbortError");
        setMessages((current) =>
          updateLastDoctorMessage(current, (doctor) => ({
            ...doctor,
            state: cancelled ? "cancelled" : "error",
            content:
              doctor.content ||
              (cancelled ? "Investigación cancelada." : "No se pudo completar la consulta."),
            progress: { phase: cancelled ? "cancelled" : "error" },
          }))
        );
      } finally {
        setIsInvestigating(false);
        startedForRef.current = null;
        abortRef.current = null;
      }
    };

    void consume();
  }, [pendingMessage]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPendingMessage(null);
    setIsInvestigating(false);
    startedForRef.current = null;
  }, []);

  return { messages, isInvestigating, sendMessage, cancel };
};
