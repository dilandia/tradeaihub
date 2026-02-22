import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; ref?: string }>;
}) {
  const { message, ref } = await searchParams;

  return <RegisterForm message={message} referralCode={ref} />;
}
