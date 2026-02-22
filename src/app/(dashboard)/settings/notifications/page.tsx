import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPrefs } from "@/app/actions/notifications";
import { NotificationsForm } from "@/components/settings/notifications-form";

export const metadata: Metadata = {
  title: "Notifications – TakeZ",
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prefs = await getNotificationPrefs();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Notifications
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your email notification preferences.
        </p>
      </div>
      <NotificationsForm initialPrefs={prefs} />
    </div>
  );
}
