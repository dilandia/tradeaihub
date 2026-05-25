"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.tradeaihub.com";

function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("rate_limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed") ||
    lower.includes("verify your email")
  ) {
    return "Please confirm your email first. Check your inbox for the confirmation link.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already_registered") ||
    lower.includes("already exists") ||
    lower.includes("user already exists")
  ) {
    return "This email is already registered. Try logging in instead.";
  }
  if (
    lower.includes("invalid") &&
    (lower.includes("credentials") || lower.includes("password") || lower.includes("email"))
  ) {
    return "Invalid email or password. Please try again.";
  }
  if (lower.includes("signups not allowed") || lower.includes("signup_disabled")) {
    return "New registrations are temporarily disabled. Please try again later.";
  }
  return message;
}

export async function signIn(formData: FormData): Promise<never> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?message=" + encodeURIComponent("Email e senha são obrigatórios."));
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed.";
    redirect("/login?message=" + encodeURIComponent(friendlyAuthError(message)));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData): Promise<never> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string) || "";

  if (!email || !password) {
    redirect("/register?message=" + encodeURIComponent("Email e senha são obrigatórios."));
  }

  try {
    await auth.api.signUpEmail({
      body: { email, password, name: fullName },
      headers: await headers(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    redirect("/register?message=" + encodeURIComponent(friendlyAuthError(message)));
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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string) || "";

  if (!email || !password) {
    return { success: false, error: "Email e senha são obrigatórios." };
  }

  try {
    await auth.api.signUpEmail({
      body: { email, password, name: fullName },
      headers: await headers(),
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    const lower = message.toLowerCase();
    const isAlreadyRegistered =
      lower.includes("already exists") ||
      lower.includes("already registered") ||
      lower.includes("user already exists");
    const isRateLimit = lower.includes("rate limit") || lower.includes("rate_limit");
    return {
      success: false,
      error: friendlyAuthError(message),
      code: isAlreadyRegistered
        ? "EMAIL_ALREADY_REGISTERED"
        : isRateLimit
          ? "RATE_LIMIT"
          : undefined,
    };
  }
}

export async function resendConfirmationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Email is required." };
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email, callbackURL: `${APP_URL}/dashboard` },
      headers: await headers(),
    });
  } catch (err) {
    console.error("[resendConfirmationEmail] Error:", err);
  }

  // Always return success for security (don't reveal if email exists)
  return { success: true };
}

export async function requestPasswordReset(formData: FormData): Promise<{ success: boolean }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${APP_URL}/reset-password`,
      },
      headers: await headers(),
    });
  } catch (err) {
    console.error("[requestPasswordReset] Error:", err);
  }

  // Always return success for security (don't reveal if email exists)
  return { success: true };
}

export async function updatePassword(formData: FormData): Promise<never> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const token = formData.get("token") as string;

  if (!password || password.length < 6) {
    redirect(
      "/reset-password?message=" + encodeURIComponent("Password must be at least 6 characters.")
    );
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?message=" + encodeURIComponent("Passwords do not match."));
  }

  if (!token) {
    redirect(
      "/reset-password?message=" +
        encodeURIComponent("Invalid or expired reset link. Please request a new one.")
    );
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: password, token },
      headers: await headers(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to reset password.";
    redirect("/reset-password?message=" + encodeURIComponent(message));
  }

  redirect("/login?message=" + encodeURIComponent("Password updated successfully! Please log in."));
}

export async function signOut(): Promise<never> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch {
    // Ignore errors — redirect anyway
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
