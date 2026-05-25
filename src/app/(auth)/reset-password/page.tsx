import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; token?: string }>;
}) {
  const { message, token } = await searchParams;

  return <ResetPasswordForm message={message} token={token} />;
}
