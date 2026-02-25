import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin =
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.role === "super_admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}

export function getServiceClient() {
  // For admin operations that bypass RLS
  const { createClient: createServiceClient } = require("@supabase/supabase-js");
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
