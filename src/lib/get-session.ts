// src/lib/get-session.ts
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import type { User } from '@/lib/auth';

export interface SessionResult {
  user: User | null;
  session: { id: string; expiresAt: Date } | null;
}

export async function getServerSession(): Promise<SessionResult> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    if (!session) return { user: null, session: null };
    return {
      user: session.user as User,
      session: session.session,
    };
  } catch {
    return { user: null, session: null };
  }
}

export async function requireSession(): Promise<{ user: User; session: { id: string; expiresAt: Date } }> {
  const result = await getServerSession();
  if (!result.user) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }
  return result as { user: User; session: { id: string; expiresAt: Date } };
}
