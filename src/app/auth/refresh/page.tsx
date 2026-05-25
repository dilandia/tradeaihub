"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "@/lib/auth-client";

/**
 * /auth/refresh — Session check page.
 *
 * Better Auth handles token refresh automatically via its session management.
 * This page simply checks if the user has an active session and redirects
 * to `next` if so, or to /login if not.
 *
 * Flow:
 *   no/expired session → middleware → /auth/refresh?next=/dashboard
 *   → getSession() checks session → redirect to next (or /login)
 */
export default function AuthRefreshPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard";

    // Sanitize next to prevent open redirect
    const safePath =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    getSession().then(({ data, error }) => {
      if (data?.session && !error) {
        // Session active — continue
        router.replace(safePath);
      } else {
        // No session — redirect to login
        router.replace("/login");
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
