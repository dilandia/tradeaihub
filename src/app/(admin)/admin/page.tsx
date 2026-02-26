import { Metadata } from "next";
import Link from "next/link";
import { Activity, Users, Ticket } from "lucide-react";
import { verifyAdmin } from "@/lib/admin-auth";
import { getAdminTicketStats } from "@/app/actions/admin-tickets";

export const metadata: Metadata = {
  title: "Admin – Trade AI Hub",
};

const NAV_ITEMS = [
  {
    href: "/admin/system",
    icon: Activity,
    title: "System Health",
    description: "Database stats, security status, Guardian monitor",
  },
  {
    href: "/admin/affiliates",
    icon: Users,
    title: "Affiliates",
    description: "Applications, commissions, withdrawals",
  },
  {
    href: "/admin/tickets",
    icon: Ticket,
    title: "Support Tickets",
    description: "User support requests and replies",
    badge: null as number | null,
  },
];

export default async function AdminIndexPage() {
  await verifyAdmin();

  const ticketStats = await getAdminTicketStats();
  const openCount = ticketStats.open + ticketStats.in_progress;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Trade AI Hub administration panel
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const showBadge = item.href === "/admin/tickets" && openCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-indigo-500"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                <Icon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {showBadge && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                      {openCount} open
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
