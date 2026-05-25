'use server';

// auth.ts (raiz do projeto)
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function signIn(formData: FormData): Promise<never> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/login?message=' + encodeURIComponent('Email e senha são obrigatórios.'));
  }

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
      asResponse: true,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const msg = (body as { message?: string }).message || 'Email ou senha incorretos.';
      redirect('/login?message=' + encodeURIComponent(msg));
    }
  } catch {
    redirect('/login?message=' + encodeURIComponent('Erro ao fazer login. Tente novamente.'));
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signUp(formData: FormData): Promise<never> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = (formData.get('full_name') as string) || '';

  if (!email || !password) {
    redirect('/register?message=' + encodeURIComponent('Email e senha são obrigatórios.'));
  }

  try {
    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName },
      headers: await headers(),
      asResponse: true,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const msg = (body as { message?: string }).message || 'Erro ao criar conta.';
      redirect('/register?message=' + encodeURIComponent(msg));
    }
  } catch {
    redirect('/register?message=' + encodeURIComponent('Erro ao criar conta. Tente novamente.'));
  }

  revalidatePath('/', 'layout');
  redirect('/login?message=' + encodeURIComponent('Confira seu email para confirmar a conta.'));
}

export async function signOut(): Promise<never> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch {
    // Ignora erro no signOut
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}
