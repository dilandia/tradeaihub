"use client";

import { CalendarClock } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { JBlankedCalendar } from "@/components/economic-calendar/jblanked-calendar";

export function EconomicEventsContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-score/5 via-transparent to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.15),transparent)]" />
        <div className="relative px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-score/20 ring-1 ring-score/30">
              <CalendarClock className="h-6 w-6 text-score" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("economicEvents.title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                {t("economicEvents.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <JBlankedCalendar />
        </div>
      </div>
    </div>
  );
}
