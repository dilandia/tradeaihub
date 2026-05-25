// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';
import { getPool } from '@/lib/db';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.tradeaihub.com';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const next = searchParams.get('next') ?? '/dashboard';

  // Better Auth usa /api/auth/verify-email para verificação
  // Este callback é mantido para compatibilidade com links antigos do Supabase
  if (token) {
    try {
      // Verificar se é um token de verificação do Better Auth
      const verifyResponse = await fetch(`${APP_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (verifyResponse.ok) {
        const data = await verifyResponse.json().catch(() => ({}));
        const email = (data as { email?: string }).email;
        if (email) {
          const pool = getPool();
          const result = await pool.query(
            'SELECT id, email FROM better_auth_user WHERE email = $1',
            [email]
          );
          const user = result.rows[0];
          if (user) {
            sendWelcomeEmail({ to: email, userName: undefined }).catch(console.error);
          }
        }
        return NextResponse.redirect(`${APP_URL}${next}`);
      }
    } catch (err) {
      console.error('[Auth Callback] Verification failed:', err);
    }
  }

  return NextResponse.redirect(
    `${APP_URL}/login?message=${encodeURIComponent('Confirme seu email novamente ou solicite um novo link.')}`
  );
}
