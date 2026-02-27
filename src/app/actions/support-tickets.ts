"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(200).trim(),
  category: z.enum(["bug", "feature", "billing", "account", "other"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  description: z.string().min(20).max(5000).trim(),
});

const ReplySchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1).max(5000).trim(),
  attachmentUrl: z.string().url().optional(),
});

type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export async function createTicket(input: CreateTicketInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CreateTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { subject, category, priority, description } = parsed.data;

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      subject,
      category,
      priority,
      description,
    })
    .select("id, ticket_number")
    .single();

  if (error) {
    console.error("[createTicket] Error:", error);
    return { success: false, error: "Failed to create ticket" };
  }

  // TODO: Send notification email to admin via Resend

  return { success: true, ticketId: ticket.id, ticketNumber: ticket.ticket_number };
}

export async function getUserTickets() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, category, priority, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return tickets ?? [];
}

export async function getTicketDetail(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, category, priority, status, description, created_at, updated_at")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) return null;

  const { data: replies } = await supabase
    .from("support_ticket_replies")
    .select("id, content, is_admin, attachment_url, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return { ...ticket, replies: replies ?? [] };
}

export async function replyToUserTicket(input: {
  ticketId: string;
  content: string;
  attachmentUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = ReplySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { ticketId, content, attachmentUrl } = parsed.data;

  // Verify ticket belongs to user and is not closed
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  if (ticket.status === "closed") {
    return { success: false, error: "Ticket is closed" };
  }

  // Insert reply
  const insertData: Record<string, unknown> = {
    ticket_id: ticketId,
    user_id: user.id,
    is_admin: false,
    content: content.trim(),
  };
  if (attachmentUrl) {
    insertData.attachment_url = attachmentUrl;
  }

  const { error } = await supabase
    .from("support_ticket_replies")
    .insert(insertData);

  if (error) {
    console.error("[replyToUserTicket] Error:", error);
    return { success: false, error: "Failed to send reply" };
  }

  // If ticket was resolved, reopen it
  const newStatus = ticket.status === "resolved" ? "open" : ticket.status;
  await supabase
    .from("support_tickets")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return { success: true };
}

export async function cancelTicket(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify ticket belongs to user and is cancellable
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("id", ticketId)
    .eq("user_id", user.id)
    .single();

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  if (ticket.status === "closed" || ticket.status === "resolved") {
    return { success: false, error: "Ticket already closed" };
  }

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[cancelTicket] Error:", error);
    return { success: false, error: "Failed to cancel ticket" };
  }

  return { success: true };
}
