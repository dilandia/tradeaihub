"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { MessageCircle, Ticket, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SupportChat } from "@/components/settings/support-chat";
import { SupportTickets } from "@/components/settings/support-tickets";

type ActivePanel = "chat" | "ticket" | null;

export function SupportSection() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  function handleCardClick(panel: ActivePanel) {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("support.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("support.subtitle")}</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Live Chat Card */}
        <SupportCard
          icon={MessageCircle}
          title={t("support.liveChat")}
          description={t("support.liveChatDesc")}
          badge={t("support.liveChatBadge")}
          buttonLabel={activePanel === "chat" ? t("support.ticketBack") : t("support.startChat")}
          isActive={activePanel === "chat"}
          onClick={() => handleCardClick("chat")}
        />

        {/* Open Ticket Card */}
        <SupportCard
          icon={Ticket}
          title={t("support.openTicket")}
          description={t("support.openTicketDesc")}
          badge={t("support.ticketBadge")}
          buttonLabel={activePanel === "ticket" ? t("support.ticketBack") : t("support.createTicket")}
          isActive={activePanel === "ticket"}
          onClick={() => handleCardClick("ticket")}
        />

        {/* Documentation Card */}
        <SupportCard
          icon={BookOpen}
          title={t("support.docs")}
          description={t("support.docsDesc")}
          badge={t("support.docsBadge")}
          buttonLabel={t("support.viewDocs")}
          isActive={false}
          onClick={() => router.push("/docs")}
        />
      </div>

      {/* Dynamic Panel Area */}
      {activePanel === "chat" && <SupportChat />}
      {activePanel === "ticket" && <SupportTickets />}
    </div>
  );
}

/* ─── Support Card ─── */

type SupportCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge: string;
  buttonLabel: string;
  isActive: boolean;
  onClick: () => void;
};

function SupportCard({
  icon: Icon,
  title,
  description,
  badge,
  buttonLabel,
  isActive,
  onClick,
}: SupportCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card p-5 transition-colors",
        isActive ? "border-score" : "border-border hover:border-score"
      )}
    >
      {/* Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-score/10">
        <Icon className="h-6 w-6 text-score" />
      </div>

      {/* Badge */}
      <span className="mb-2 w-fit rounded-full bg-score/10 px-2 py-0.5 text-xs font-medium text-score">
        {badge}
      </span>

      {/* Content */}
      <h3 className="mb-1 text-base font-semibold">{title}</h3>
      <p className="mb-4 flex-1 text-sm text-muted-foreground">{description}</p>

      {/* Button */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-score text-white"
            : "bg-score text-white hover:bg-score/90"
        )}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
