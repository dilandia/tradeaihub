import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPool } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";

const CRON_SECRET = process.env.CRON_SECRET;
const DAYS_THRESHOLD = 30;

function isValidCronSecret(provided: string | null): boolean {
  if (!CRON_SECRET || !provided) return false;
  const a = Buffer.from(CRON_SECRET);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Cleanup ticket attachments from local filesystem for tickets
 * resolved/closed more than 30 days ago.
 *
 * The attachment_url in the DB is kept (shows expired placeholder on frontend).
 * Only the actual file in public/uploads/ is deleted to free space.
 *
 * Run via cron: GET /api/cron/ticket-cleanup?secret=...
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!isValidCronSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD);

  // Find tickets resolved/closed more than 30 days ago
  const { rows: tickets, rowCount: ticketRowCount } = await pool.query(
    `SELECT id FROM support_tickets
     WHERE status IN ('resolved', 'closed') AND updated_at < $1`,
    [cutoffDate.toISOString()]
  );

  if (!ticketRowCount || tickets.length === 0) {
    return NextResponse.json({
      message: "No tickets to cleanup",
      ticketsFound: 0,
    });
  }

  const ticketIds = tickets.map((t: { id: string }) => t.id);

  // Find replies with attachments for those tickets
  const placeholders = ticketIds.map((_: string, i: number) => `$${i + 1}`).join(", ");
  const { rows: replies } = await pool.query(
    `SELECT id, attachment_url, ticket_id
     FROM support_ticket_replies
     WHERE ticket_id IN (${placeholders}) AND attachment_url IS NOT NULL`,
    ticketIds
  );

  if (!replies || replies.length === 0) {
    return NextResponse.json({
      message: "No attachments to cleanup",
      ticketsFound: ticketIds.length,
      attachmentsFound: 0,
    });
  }

  let deletedCount = 0;
  let errorCount = 0;

  const uploadsDir = join(process.cwd(), "public", "uploads");

  for (const reply of replies) {
    // Extract filesystem path from public URL
    // URL format: /uploads/{userId}/{ticketId}/{filename}
    const url = reply.attachment_url as string;
    const uploadsPrefix = "/uploads/";
    if (!url.startsWith(uploadsPrefix)) continue;

    const relativePath = url.substring(uploadsPrefix.length);
    const filePath = join(uploadsDir, relativePath);

    try {
      await unlink(filePath);
      deletedCount++;
    } catch (deleteError) {
      console.error(
        `[ticket-cleanup] Failed to delete ${filePath}:`,
        deleteError
      );
      errorCount++;
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
