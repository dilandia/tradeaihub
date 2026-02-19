import { Metadata } from "next";
import { getSecurityInfo } from "@/app/actions/security";
import { SecurityForm } from "@/components/settings/security-form";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Segurança – TakeZ",
};

export default async function SecurityPage() {
  const info = await getSecurityInfo();
  if (!info) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Segurança</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie sua senha, sessões e configurações de segurança.
        </p>
      </div>
      <SecurityForm info={info} />
    </div>
  );
}
