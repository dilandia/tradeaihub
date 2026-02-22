"use server";

import { createClient } from "@/lib/supabase/server";

/* ─── Types ─── */

export type FeedbackType = "bug" | "feature" | "improvement" | "other";

export type FeedbackRow = {
  id: string;
  type: FeedbackType;
  rating: number | null;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
};

export type SubmitFeedbackInput = {
  type: FeedbackType;
  rating: number | null;
  message: string;
  pageUrl: string | null;
  userAgent: string | null;
};

/* ─── Mutations ─── */

export async function submitFeedback(
  input: SubmitFeedbackInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate message length
  if (!input.message || input.message.trim().length < 10) {
    return { success: false, error: "Message must be at least 10 characters" };
  }

  // Validate type
  const validTypes: FeedbackType[] = ["bug", "feature", "improvement", "other"];
  if (!validTypes.includes(input.type)) {
    return { success: false, error: "Invalid feedback type" };
  }

  // Validate rating if provided
  if (input.rating !== null && (input.rating < 1 || input.rating > 5)) {
    return { success: false, error: "Rating must be between 1 and 5" };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    type: input.type,
    rating: input.rating,
    message: input.message.trim(),
    page_url: input.pageUrl,
    user_agent: input.userAgent,
  });

  if (error) {
    console.error("[feedback] submitFeedback error:", error.message);
    return { success: false, error: "Failed to submit feedback" };
  }

  return { success: true };
}

/* ─── Queries ─── */

export async function getUserFeedback(): Promise<FeedbackRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("feedback")
    .select("id, type, rating, message, page_url, user_agent, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[feedback] getUserFeedback error:", error.message);
    return [];
  }

  return (data ?? []) as FeedbackRow[];
}
