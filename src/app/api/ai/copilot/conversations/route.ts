import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listConversations } from "@/lib/ai/copilot-conversations";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await listConversations(user.id, 20);
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[AI Copilot conversations]", err);
    return NextResponse.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}
