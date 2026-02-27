"use server";

import { verifyAdmin } from "@/lib/admin-auth";
import { getServiceClient } from "@/lib/admin-auth";

/* ─── Types ─── */

export type AdminTicketRow = {
  id: string;
  ticket_number: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_name: string | null;
};

export type AdminTicketDetail = AdminTicketRow & {
  replies: {
    id: string;
    content: string;
    is_admin: boolean;
    attachment_url: string | null;
    created_at: string;
    author_email: string;
  }[];
};

export type TicketStats = {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
};

/* ─── Get ticket stats ─── */

export async function getAdminTicketStats(): Promise<TicketStats> {
  await verifyAdmin();
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("status");

  if (error) {
    console.error("[admin-tickets] Stats error:", error);
    return { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 };
  }

  const rows = data as { status: string }[];
  return {
    total: rows.length,
    open: rows.filter((r) => r.status === "open").length,
    in_progress: rows.filter((r) => r.status === "in_progress").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
    closed: rows.filter((r) => r.status === "closed").length,
  };
}

/* ─── List all tickets ─── */

export async function getAdminTickets(
  statusFilter?: string
): Promise<AdminTicketRow[]> {
  await verifyAdmin();
  const supabase = getServiceClient();

  let query = supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, category, priority, status, description, created_at, updated_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: tickets, error } = await query;

  if (error) {
    console.error("[admin-tickets] List error:", error);
    return [];
  }

  if (!tickets || tickets.length === 0) return [];

  // Fetch user emails
  const userIds = [...new Set(tickets.map((t: { user_id: string }) => t.user_id))];
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const userMap = new Map<string, { email: string; name: string | null }>();
  if (users?.users) {
    for (const u of users.users) {
      userMap.set(u.id, {
        email: u.email ?? "unknown",
        name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
      });
    }
  }

  return tickets.map((t: Record<string, unknown>) => ({
    id: t.id as string,
    ticket_number: t.ticket_number as number,
    subject: t.subject as string,
    category: t.category as string,
    priority: t.priority as string,
    status: t.status as string,
    description: t.description as string,
    created_at: t.created_at as string,
    updated_at: t.updated_at as string,
    user_email: userMap.get(t.user_id as string)?.email ?? "unknown",
    user_name: userMap.get(t.user_id as string)?.name ?? null,
  }));
}

/* ─── Get ticket detail with replies ─── */

export async function getAdminTicketDetail(
  ticketId: string
): Promise<AdminTicketDetail | null> {
  await verifyAdmin();
  const supabase = getServiceClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, category, priority, status, description, created_at, updated_at, user_id")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    console.error("[admin-tickets] Detail error:", error);
    return null;
  }

  // Get replies
  const { data: replies } = await supabase
    .from("support_ticket_replies")
    .select("id, content, is_admin, attachment_url, created_at, user_id")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  // Get user info
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const userMap = new Map<string, string>();
  if (users?.users) {
    for (const u of users.users) {
      userMap.set(u.id, u.email ?? "unknown");
    }
  }

  return {
    id: ticket.id,
    ticket_number: ticket.ticket_number,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    description: ticket.description,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    user_email: userMap.get(ticket.user_id) ?? "unknown",
    user_name: null,
    replies: (replies ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      content: r.content as string,
      is_admin: r.is_admin as boolean,
      attachment_url: (r.attachment_url as string) ?? null,
      created_at: r.created_at as string,
      author_email: userMap.get(r.user_id as string) ?? "unknown",
    })),
  };
}

/* ─── Update ticket status ─── */

export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved" | "closed"
) {
  const admin = await verifyAdmin();
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) {
    console.error("[admin-tickets] Status update error:", error);
    return { success: false, error: "Failed to update status" };
  }

  console.log(`[admin-tickets] Ticket ${ticketId} → ${status} by ${admin.email}`);
  return { success: true };
}

/* ─── Reply to ticket ─── */

export async function replyToTicket(ticketId: string, content: string, attachmentUrl?: string) {
  const admin = await verifyAdmin();
  const supabase = getServiceClient();

  if (!content.trim() || content.length > 5000) {
    return { success: false, error: "Invalid reply content" };
  }

  const insertData: Record<string, unknown> = {
    ticket_id: ticketId,
    user_id: admin.id,
    is_admin: true,
    content: content.trim(),
  };
  if (attachmentUrl) {
    insertData.attachment_url = attachmentUrl;
  }

  const { error } = await supabase.from("support_ticket_replies").insert(insertData);

  if (error) {
    console.error("[admin-tickets] Reply error:", error);
    return { success: false, error: "Failed to send reply" };
  }

  // Auto-update ticket to in_progress if it was open
  await supabase
    .from("support_tickets")
    .update({ status: "in_progress", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("status", "open");

  console.log(`[admin-tickets] Reply on ticket ${ticketId} by ${admin.email}`);
  return { success: true };
}
