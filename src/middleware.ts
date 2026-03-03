import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    // SAFETY NET: If middleware crashes for ANY reason, never return 500.
    // Clear all auth cookies and redirect to /login so the user can start fresh.
    // This prevents the 502 that Cloudflare shows when origin returns 500.
    console.error("[Middleware] Unhandled crash, emergency redirect:", error);

    const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
    if (isApiRoute) {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }

    const emergencyRedirect = NextResponse.redirect(
      new URL("/login", request.url)
    );
    // Delete ALL supabase auth cookies
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith("sb-")) {
        emergencyRedirect.cookies.delete(name);
      }
    });
    // Nuclear: clear cache + cookies + storage for this origin
    emergencyRedirect.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
    return emergencyRedirect;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
