"use client";

import { useLocale } from "next-intl";
import { Sparkles } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Card, CardHeader } from "@/components/ui/card";
import { useChatStream } from "@/hooks/useChatStream";

import { ChatInput } from "./ChatInput";
import { ProgressPanel } from "./ProgressPanel";
import { StreamdownRenderer } from "./StreamdownRenderer";

export const ChatView = () => {
  const locale = useLocale() === "en" ? "en" : "es";
  const { messages, isInvestigating, sendMessage } = useChatStream();

  return (
    <Card className="flex h-[65vh] min-h-[520px] max-h-[720px] flex-col overflow-hidden border shadow-sm">
      <CardHeader className="shrink-0 flex-row items-center justify-between space-y-0 border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-medium">Doctor</p>
            <p className="text-xs text-muted-foreground">
              {isInvestigating ? "Investigando evidencia..." : "Listo · pawpass-gdg-demo"}
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-healthy" />
          Streaming SSE
        </span>
      </CardHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Conversation className="relative flex min-h-0 flex-1 flex-col">
          <ConversationContent className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4">
              {messages.length === 0 ? (
                <ConversationEmptyState
                  icon={<Sparkles className="size-10 text-primary" />}
                  title="¿Qué está pasando con PawPass?"
                  description="Pregunta por un requestId, un sessionId o haz una pregunta general. El Doctor consulta evidencia real de Cloud Run y Logging y nunca inventa logs."
                />
              ) : (
                messages.map((message) => (
                  <Message
                    from={message.role === "doctor" ? "assistant" : "user"}
                    key={message.id}
                  >
                    <MessageContent>
                      {message.role === "doctor" && message.progress ? (
                        <ProgressPanel {...message.progress} />
                      ) : null}
                      {message.role === "doctor" ? (
                        <StreamdownRenderer
                          markdown={message.content}
                          isStreaming={
                            message.state === "investigating" || message.state === "partial"
                          }
                        />
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      )}
                      {message.supportId ? (
                        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                          supportId: {message.supportId}
                        </p>
                      ) : null}
                    </MessageContent>
                  </Message>
                ))
              )}
            </div>
          </ConversationContent>
          <ConversationScrollButton className="bottom-4" />
        </Conversation>

        <div className="shrink-0 border-t bg-background p-3 sm:p-4">
          <ChatInput
            disabled={isInvestigating}
            onSend={(message) => sendMessage(message, locale)}
          />
        </div>
      </div>
    </Card>
  );
};
