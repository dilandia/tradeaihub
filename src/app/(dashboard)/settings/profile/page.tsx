import { Metadata } from "next";
import { getProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/settings/profile-form";
import { ProfilePageHeader } from "@/components/settings/profile-page-header";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Perfil – TakeZ",
};

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <ProfilePageHeader />
      <ProfileForm profile={profile} />
    </div>
  );
}
