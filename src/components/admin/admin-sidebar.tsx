"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Zap,
  Mail,
  MessageSquare,
  Gift,
  Settings,
  Shield,
  ArrowLeft,
  Share2,
  Ticket,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/ai-credits", label: "AI Credits", icon: Zap },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/affiliates", label: "Affiliates", icon: Share2 },
  { href: "/admin/referrals", label: "Referrals", icon: Gift },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/system", label: "System", icon: Settings },
];

interface AdminSidebarProps {
  userEmail: string;
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed left-4 top-4 z-[110] flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[105] bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close admin menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-[106] flex h-full flex-col border-r border-border bg-card transition-all duration-200 lg:relative lg:z-40",
          collapsed ? "lg:w-16" : "lg:w-64",
          "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-border",
            collapsed ? "justify-center px-2 py-4" : "gap-2 px-5 py-4"
          )}
        >
          <Shield className="h-5 w-5 shrink-0 text-indigo-400" />
          {!collapsed && (
            <span className="text-lg font-semibold text-foreground">Admin</span>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 space-y-1 overflow-y-auto py-4",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/overview" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-colors",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden border-t border-border px-3 py-2 lg:block">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4 shrink-0" />
                <span className="ml-3">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-border py-4",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {!collapsed && (
            <p className="mb-3 truncate px-3 text-xs text-muted-foreground">
              {userEmail}
            </p>
          )}
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Back to App" : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2"
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
