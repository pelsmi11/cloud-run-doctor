"use client";
import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

interface Props {
  markdown: string;
  isStreaming?: boolean;
}

export function StreamdownRenderer({ markdown, isStreaming }: Props) {
  if (!markdown.trim()) return null;

  const urlTransform = (url: string) => {
    try {
      const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "https://example.com");
      if (u.protocol === "https:" || u.protocol === "http:") return url;
      return "#";
    } catch {
      return "#";
    }
  };

  return (
    <div className="streamdown-wrapper max-w-none text-sm leading-relaxed">
      <Streamdown
        plugins={{ code }}
        parseIncompleteMarkdown={!!isStreaming}
        isAnimating={!!isStreaming}
        urlTransform={urlTransform}
        className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:mt-4 prose-h2:mb-2 prose-p:my-2 prose-table:my-3 prose-th:bg-muted prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5"
      >
        {markdown}
      </Streamdown>
    </div>
  );
}
