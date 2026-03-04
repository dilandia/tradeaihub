"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * /auth/refresh — Client-side session refresh page.
 *
 * Middleware redirects here when the access token is expired.
 * The Supabase browser client automatically refreshes using the
 * refresh_token stored in cookies. No 502 risk because this runs
 * in the browser, not in the Edge Runtime middleware.
 *
 * Flow:
 *   expired token → middleware → /auth/refresh?next=/dashboard
 *   → getSession() refreshes silently → redirect to next
 *   → if refresh fails → redirect to /login (emergencyClearAndRedirect)
 */
export default function AuthRefreshPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";

    // Sanitize next to prevent open redirect
    const safePath =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session && !error) {
        // Session refreshed (or still valid) — continue
        router.replace(safePath);
      } else {
        // Refresh failed — clear everything and go to login
        supabase.auth.signOut().finally(() => {
          router.replace("/login");
        });
      }
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">
          Verificando sessão...
        </p>
      </div>
    </div>
  );
}
