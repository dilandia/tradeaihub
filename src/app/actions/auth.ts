"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.tradeaihub.com";

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email rate limit exceeded") || lower.includes("rate_limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (lower.includes("user already registered") || lower.includes("already_registered")) {
    return "This email is already registered. Try logging in instead.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Invalid email or password. Please try again.";
  }
  if (lower.includes("signups not allowed") || lower.includes("signup_disabled")) {
    return "New registrations are temporarily disabled. Please try again later.";
  }
  return message;
}

export async function signIn(formData: FormData): Promise<never> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?message=" + encodeURIComponent("Email e senha são obrigatórios."));
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?message=" + encodeURIComponent(friendlyAuthError(error.message)));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData): Promise<never> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string) || "";
  const referralCode = (formData.get("referral_code") as string) || "";

  if (!email || !password) {
    redirect("/register?message=" + encodeURIComponent("Email e senha são obrigatórios."));
  }

  const metadata: Record<string, string> = { full_name: fullName };
  if (referralCode) {
    metadata.referral_code = referralCode;
  }

  // Create user in Supabase
  // Supabase will send the confirmation email automatically
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${APP_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect("/register?message=" + encodeURIComponent(friendlyAuthError(error.message)));
  }

  revalidatePath("/", "layout");
  redirect(
    "/login?message=" +
      encodeURIComponent(
        "Cadastro realizado! Confira seu email para confirmar a conta. Se não receber em alguns minutos, verifique a pasta de spam."
      )
  );
}

type SignUpResult =
  | { success: true }
  | { success: false; error: string; code?: string };

export async function signUpWithResult(formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string) || "";
  const referralCode = (formData.get("referral_code") as string) || "";

  if (!email || !password) {
    return { success: false, error: "Email e senha são obrigatórios." };
  }

  const metadata: Record<string, string> = { full_name: fullName };
  if (referralCode) {
    metadata.referral_code = referralCode;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${APP_URL}/auth/callback`,
    },
  });

  if (error) {
    const lower = error.message.toLowerCase();
    const code = (error as { code?: string }).code?.toLowerCase() ?? "";
    const isAlreadyRegistered =
      lower.includes("user already registered") ||
      lower.includes("already_registered") ||
      code === "user_already_exists";
    const isRateLimit =
      lower.includes("email rate limit exceeded") ||
      lower.includes("rate_limit") ||
      code === "over_email_send_rate_limit";
    return {
      success: false,
      error: friendlyAuthError(error.message),
      code: isAlreadyRegistered
        ? "EMAIL_ALREADY_REGISTERED"
        : isRateLimit
          ? "RATE_LIMIT"
          : undefined,
    };
  }

  return { success: true };
}

export async function resendConfirmationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Email is required." };
  }

  const supabase = await createClient();

  await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback`,
    },
  });

  // Always return success for security (don't reveal if email exists)
  return { success: true };
}

export async function requestPasswordReset(formData: FormData): Promise<{ success: boolean }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false };
  }

  const supabase = await createClient();

  // Supabase handles sending the reset email via its built-in email system
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/reset-password`,
  });

  // Always return success for security (don't reveal if email exists)
  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<never> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    redirect("/reset-password?message=" + encodeURIComponent("Password must be at least 6 characters."));
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?message=" + encodeURIComponent("Passwords do not match."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/reset-password?message=" + encodeURIComponent(error.message));
  }

  redirect("/login?message=" + encodeURIComponent("Password updated successfully! Please log in."));
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
