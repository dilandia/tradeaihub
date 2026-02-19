import { NextRequest, NextResponse } from "next/server";
import { getConversationMessages, updateConversationTitle } from "@/lib/ai/copilot-conversations";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await getConversationMessages(id, user.id);
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[AI Copilot conversation messages]", err);
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { title } = body;
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ok = await updateConversationTitle(id, title, user.id);
    if (!ok) {
      return NextResponse.json({ error: "Failed to update title" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[AI Copilot update title]", err);
    return NextResponse.json({ error: "Failed to update title" }, { status: 500 });
  }
}
