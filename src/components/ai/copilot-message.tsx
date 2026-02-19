"use client";

import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiResponseContent } from "./ai-response-content";
import { useLanguage } from "@/contexts/language-context";

type Props = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

function formatTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function CopilotMessage({ role, content, timestamp }: Props) {
  const { locale } = useLanguage();
  const timeStr = formatTime(timestamp, locale ?? "en");

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[85%] rounded-2xl rounded-br-md px-5 py-3.5 shadow-sm",
            "bg-gradient-to-br from-violet-500/15 to-violet-600/10 text-foreground",
            "border border-violet-500/20"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">{timeStr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 text-violet-600 dark:text-violet-400">
        <Zap className="h-4 w-4" aria-hidden />
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-bl-md border border-border bg-card/90 px-5 py-4 shadow-sm"
        )}
      >
        <AiResponseContent content={content} className="text-sm leading-relaxed" />
        <p className="mt-2 text-[10px] text-muted-foreground">{timeStr}</p>
      </div>
    </div>
  );
}
