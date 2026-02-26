import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/send";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.tradeaihub.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Send welcome email after successful email confirmation
      const user = data?.session?.user;
      if (user?.email) {
        sendWelcomeEmail({
          to: user.email,
          userName: user.user_metadata?.full_name || undefined,
        }).catch((err) => {
          console.error("[Auth Callback] Welcome email failed:", err);
        });
      }

      return NextResponse.redirect(`${APP_URL}${next}`);
    }

    console.error("[Auth Callback] Code exchange failed:", error.message);
  }

  // If code exchange fails or no code, redirect to login with error
  return NextResponse.redirect(
    `${APP_URL}/login?message=${encodeURIComponent("Email confirmation failed. Please try again or request a new confirmation email.")}`
  );
}
