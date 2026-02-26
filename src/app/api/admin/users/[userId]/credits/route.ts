import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin =
      user.app_metadata?.role === "admin" ||
      user.app_metadata?.role === "super_admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient.rpc("admin_modify_credits", {
      p_admin_id: user.id,
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason.trim(),
    });

    if (error) {
      console.error("Failed to modify credits:", error);
      return NextResponse.json(
        { error: error.message ?? "Failed to modify credits" },
        { status: 400 }
      );
    }

    console.log(
      `[ADMIN AUDIT] Credits adjusted by ${user.email}: user=${userId} amount=${amount} reason="${reason}"`
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
