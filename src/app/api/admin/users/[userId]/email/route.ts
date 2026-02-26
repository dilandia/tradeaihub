import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin-auth";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

function getAdminAuth() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdminRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const isAdmin =
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.role === "super_admin";

  return isAdmin ? user : null;
}

/* ── PATCH: Update user email ── */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await verifyAdminRequest();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const adminClient = getAdminAuth();

    // Update email in auth.users
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      { email: email.trim(), email_confirm: true }
    );

    if (authError) {
      console.error("[ADMIN] Failed to update auth email:", authError);
      return NextResponse.json(
        { error: authError.message ?? "Failed to update email" },
        { status: 400 }
      );
    }

    // Update email in profiles table
    const serviceClient = getServiceClient();
    await serviceClient
      .from("profiles")
      .update({ email: email.trim() })
      .eq("id", userId);

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
    const admin = await verifyAdminRequest();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;

    // Get user email from profiles
    const serviceClient = getServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Resend confirmation email
    const adminClient = getAdminAuth();
    const { error: resendError } = await adminClient.auth.resend({
      type: "signup",
      email: profile.email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.tradeaihub.com"}/auth/callback`,
      },
    });

    if (resendError) {
      console.error("[ADMIN] Failed to resend confirmation:", resendError);
      return NextResponse.json(
        { error: resendError.message ?? "Failed to resend confirmation email" },
        { status: 400 }
      );
    }

    console.log(
      `[ADMIN AUDIT] Confirmation email resent by ${admin.email}: user=${userId} email=${profile.email}`
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
