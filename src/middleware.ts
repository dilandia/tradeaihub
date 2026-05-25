// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const rawHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host') ||
    request.nextUrl.hostname ||
    '';
  const host = rawHost.split(':')[0];

  const isProdLandingDomain =
    host === 'tradeaihub.com' || host === 'www.tradeaihub.com';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  const isApiRoute = path.startsWith('/api/');
  const isAuthPage =
    path === '/login' ||
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/reset-password' ||
    path === '/auth/refresh';
  const isAuthCallback = path.startsWith('/api/auth/');

  const isSelfAuthApi =
    path.startsWith('/api/cron/') ||
    path.startsWith('/api/webhooks/') ||
    path.startsWith('/api/stripe/webhook') ||
    path === '/api/affiliates/apply' ||
    path === '/api/health' ||
    path.startsWith('/api/auth/');

  // Affiliate tracking: ?aff=CODE sets a 30-day httpOnly cookie
  const rawAffCode = request.nextUrl.searchParams.get('aff');
  const affiliateCode = rawAffCode?.toUpperCase();
  if (affiliateCode && /^[A-Z0-9-]{6,30}$/.test(affiliateCode)) {
    const cleanUrl = new URL(request.nextUrl);
    cleanUrl.searchParams.delete('aff');
    const redirectResponse = NextResponse.redirect(cleanUrl);
    const isProd = request.nextUrl.hostname.includes('tradeaihub.com');
    redirectResponse.cookies.set('affiliate_ref', affiliateCode, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      ...(isProd ? { domain: '.tradeaihub.com' } : {}),
      maxAge: 30 * 24 * 60 * 60,
    });
    return redirectResponse;
  }

  // Landing domain — redireciona para app
  if (isProdLandingDomain) {
    if (path === '/') {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = '/landing-internal';
      return NextResponse.rewrite(rewriteUrl);
    }
    if (isAuthPage) {
      return NextResponse.redirect(new URL(path, 'https://app.tradeaihub.com'));
    }
  }

  // Self-auth APIs — always pass through
  if (isSelfAuthApi) {
    return NextResponse.next();
  }

  // Static assets — pass through
  if (
    path.startsWith('/_next/') ||
    path.startsWith('/favicon') ||
    path.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Get session via Better Auth (reads cookie, no network call to auth server)
  let session: Awaited<ReturnType<typeof auth.api.getSession>> = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch {
    // Session read failed — treat as unauthenticated
  }

  if (!session?.user) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isLocalhost && path === '/') {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = '/landing-internal';
      return NextResponse.rewrite(rewriteUrl);
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Usuário autenticado
  const user = session.user;

  if (isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin protection
  if (path.startsWith('/admin')) {
    const role = (user as { role?: string }).role;
    const isAdmin = role === 'admin' || role === 'super_admin';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)',
  ],
};
