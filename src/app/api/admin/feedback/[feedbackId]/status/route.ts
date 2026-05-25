import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;

    // Verify admin
    await verifyAdmin();

    const body = await request.json();
    const { status, admin_notes } = body;

    if (!status || !["new", "reviewed", "resolved"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM admin_update_feedback($1, $2, $3)`,
      [feedbackId, status, admin_notes || ""]
    );

    if (!rows) {
      return NextResponse.json(
        { error: "Failed to update feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
