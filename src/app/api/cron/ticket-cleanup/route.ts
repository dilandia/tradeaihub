import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const CRON_SECRET = process.env.CRON_SECRET;
const DAYS_THRESHOLD = 30;

function isValidCronSecret(provided: string | null): boolean {
  if (!CRON_SECRET || !provided) return false;
  const a = Buffer.from(CRON_SECRET);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Cleanup ticket attachments from Storage for tickets
 * resolved/closed more than 30 days ago.
 *
 * The attachment_url in the DB is kept (shows expired placeholder on frontend).
 * Only the actual file in Supabase Storage is deleted to free space.
 *
 * Run via cron: GET /api/cron/ticket-cleanup?secret=...
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!isValidCronSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD);

  // Find tickets resolved/closed more than 30 days ago
  const { data: tickets, error: ticketError } = await supabase
    .from("support_tickets")
    .select("id")
    .in("status", ["resolved", "closed"])
    .lt("updated_at", cutoffDate.toISOString());

  if (ticketError || !tickets || tickets.length === 0) {
    return NextResponse.json({
      message: "No tickets to cleanup",
      ticketsFound: 0,
    });
  }

  const ticketIds = tickets.map((t: { id: string }) => t.id);

  // Find replies with attachments for those tickets
  const { data: replies } = await supabase
    .from("support_ticket_replies")
    .select("id, attachment_url, ticket_id")
    .in("ticket_id", ticketIds)
    .not("attachment_url", "is", null);

  if (!replies || replies.length === 0) {
    return NextResponse.json({
      message: "No attachments to cleanup",
      ticketsFound: ticketIds.length,
      attachmentsFound: 0,
    });
  }

  let deletedCount = 0;
  let errorCount = 0;

  for (const reply of replies) {
    // Extract storage path from public URL
    // URL format: https://{ref}.supabase.co/storage/v1/object/public/ticket-attachments/{path}
    const url = reply.attachment_url as string;
    const bucketPrefix = "/ticket-attachments/";
    const pathIndex = url.indexOf(bucketPrefix);
    if (pathIndex === -1) continue;

    const storagePath = url.substring(pathIndex + bucketPrefix.length);

    const { error: deleteError } = await supabase.storage
      .from("ticket-attachments")
      .remove([storagePath]);

    if (deleteError) {
      console.error(
        `[ticket-cleanup] Failed to delete ${storagePath}:`,
        deleteError
      );
      errorCount++;
    } else {
      deletedCount++;
    }
  }

  console.log(
    `[ticket-cleanup] Cleaned ${deletedCount} attachments from ${ticketIds.length} tickets (${errorCount} errors)`
  );

  return NextResponse.json({
    message: "Cleanup complete",
    ticketsFound: ticketIds.length,
    attachmentsDeleted: deletedCount,
    errors: errorCount,
  });
}
