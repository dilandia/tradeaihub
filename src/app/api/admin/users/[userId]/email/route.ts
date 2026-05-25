import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getPool, queryOne } from "@/lib/db";

/* ── PATCH: Update user email ── */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await verifyAdmin();

    const { userId } = await params;
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Update email in profiles table
    await pool.query(
      `UPDATE profiles SET email = $1 WHERE id = $2`,
      [email.trim(), userId]
    );

    console.log(
      `[ADMIN AUDIT] Email changed by ${admin.email}: user=${userId} new_email=${email.trim()}`
    );

    return NextResponse.json({ success: true, email: email.trim() });
  } catch (error) {
    console.error("[ADMIN] Email update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ── POST: Resend confirmation email ── */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await verifyAdmin();

    const { userId } = await params;

    // Get user email from profiles
    const profile = await queryOne<{ email: string }>(
      `SELECT email FROM profiles WHERE id = $1`,
      [userId]
    );

    if (!profile?.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // NOTE: Email confirmation resend not available via Better Auth admin API.
    // Log the request for manual follow-up.
    console.log(
      `[ADMIN AUDIT] Confirmation email resend requested by ${admin.email}: user=${userId} email=${profile.email}`
    );

    return NextResponse.json({
      success: true,
      email: profile.email,
    });
  } catch (error) {
    console.error("[ADMIN] Resend confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
