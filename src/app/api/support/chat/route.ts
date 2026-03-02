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
const MAX_ASSISTANT_REPLIES = 3;

export async function OPTIONS(req: NextRequest) {
  return handleCorsPrelight(req.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  try {
    const supabase = await createClient();
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error) user = data.user;
    } catch {
      // Auth check failed silently — user remains null
    }

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

    // Get conversation history (before saving user message, to count replies)
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

    // Count assistant replies so far
    const assistantReplies = previousMessages.filter((m) => m.role === "assistant").length;

    // Save user message
    await supabase.from("support_messages").insert({
      conversation_id: convId,
      role: "user",
      content: message,
    });

    // If max replies reached, return ticket redirect message (no AI call)
    if (assistantReplies >= MAX_ASSISTANT_REPLIES) {
      const isPt = (locale ?? "en").startsWith("pt");
      const limitMsg = isPt
        ? "Parece que sua dúvida precisa de atenção mais detalhada. Por favor, abra um ticket de suporte para que nossa equipe possa te ajudar diretamente. Você pode fazer isso clicando em \"Tickets\" aqui na página de Suporte. Obrigado pela paciência!"
        : "It looks like your question needs more detailed attention. Please open a support ticket so our team can help you directly. You can do that by clicking \"Tickets\" here on the Support page. Thank you for your patience!";

      // Save the redirect message
      await supabase.from("support_messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: limitMsg,
      });

      const encoder = new TextEncoder();
      const limitStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(limitMsg));
          controller.close();
        },
      });

      return new Response(limitStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Conversation-Id": convId!,
          "X-Chat-Limited": "true",
          ...corsHeaders,
        },
      });
    }

    // Build system prompt
    const systemPrompt = buildSupportSystemPrompt(locale ?? "en", assistantReplies);

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...previousMessages,
      { role: "user" as const, content: message },
    ];

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        try {
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

          // Save partial content so conversation history stays consistent
          if (fullContent.length > 0) {
            try {
              await supabase.from("support_messages").insert({
                conversation_id: convId,
                role: "assistant",
                content: fullContent + "\n\n[Response interrupted]",
              });
            } catch {
              // Ignore save errors during stream failure
            }
          }

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
