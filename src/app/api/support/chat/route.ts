import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSupportSystemPrompt } from "@/lib/ai/prompts/support";
import { chatCompletionStream } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCorsHeaders, handleCorsPrelight } from "@/lib/cors";
import { z } from "zod";

const SupportChatSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
  conversationId: z.string().uuid().optional().nullable(),
  locale: z
    .string()
    .nullish()
    .transform((v) => (v?.startsWith("pt") ? "pt" : "en")),
});

const MAX_HISTORY_MESSAGES = 20;

export async function OPTIONS(req: NextRequest) {
  return handleCorsPrelight(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Rate limit
    const rl = checkRateLimit(user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const parsed = SupportChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { message, conversationId, locale } = parsed.data;

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const { data: conv, error: convErr } = await supabase
        .from("support_conversations")
        .insert({ user_id: user.id })
        .select("id")
        .single();

      if (convErr || !conv) {
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500, headers: corsHeaders }
        );
      }
      convId = conv.id;
    }

    // Save user message
    await supabase.from("support_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // Get conversation history
    const { data: history } = await supabase
      .from("support_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(MAX_HISTORY_MESSAGES);

    const previousMessages = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Build system prompt
    const systemPrompt = buildSupportSystemPrompt(locale ?? "en");

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...previousMessages,
    ];

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";

          for await (const chunk of chatCompletionStream(apiMessages, {
            maxTokens: 1024,
          })) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          controller.close();

          // Save assistant response
          await supabase.from("support_messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: fullContent,
          });
        } catch (err) {
          console.error("[support-chat] Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": convId!,
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[support-chat] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
