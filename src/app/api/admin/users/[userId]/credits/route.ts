import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getPool } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin (throws redirect if not admin)
    const admin = await verifyAdmin();

    const { userId } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    if (typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "Amount must be a non-zero number" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM admin_modify_credits($1, $2, $3, $4)`,
      [admin.id, userId, amount, reason.trim()]
    );
    const data = rows[0] ?? null;

    console.log(
      `[ADMIN AUDIT] Credits adjusted by ${admin.email}: user=${userId} amount=${amount} reason="${reason}"`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Credit adjustment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
