"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

export function Message({ from, children, className, ...props }: { from: "user" | "assistant"; children: React.ReactNode } & React.ComponentProps<"div">) {
  const isUser = from === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start", className)} {...props}>
      <div className={cn(isUser ? "max-w-[78%]" : "w-full max-w-[88%]")}>{children}</div>
    </div>
  );
}

export function MessageContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

export function MessageResponse({ children, className, ...props }: React.ComponentProps<"div">) {
  const text = typeof children === "string" ? children : String(children ?? "");
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)} {...props}>
      <Streamdown plugins={{ code }} isAnimating={false} className="prose-headings:font-semibold prose-h2:mt-4 prose-p:my-2">
        {text}
      </Streamdown>
    </div>
  );
}
