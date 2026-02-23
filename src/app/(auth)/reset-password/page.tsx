import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return <ResetPasswordForm message={message} />;
}
