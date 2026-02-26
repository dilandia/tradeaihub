import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { verifyAdmin } from "@/lib/admin-auth";
import { getAdminTicketDetail } from "@/app/actions/admin-tickets";
import { TicketDetailClient } from "@/components/admin/ticket-detail-client";

export const metadata: Metadata = {
  title: "Ticket Detail – Admin",
};

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifyAdmin();
  const { id } = await params;
  const ticket = await getAdminTicketDetail(id);

  if (!ticket) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Ticket not found</p>
        <Link
          href="/admin/tickets"
          className="flex items-center gap-1 text-sm text-indigo-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/tickets"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      <TicketDetailClient ticket={ticket} />
    </div>
  );
}
