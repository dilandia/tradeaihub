// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
  // Pass pool directly — better-auth detects 'connect' method → PostgresDialect
  database: pool,
  // Mapear para nossas tabelas com prefixo better_auth_
  user: {
    tableName: 'better_auth_user',
    additionalFields: {
      role: { type: 'string', defaultValue: 'user' },
    },
  },
  session: { tableName: 'better_auth_session' },
  account: { tableName: 'better_auth_account' },
  verification: { tableName: 'better_auth_verification' },

  advanced: {
    // Usar UUIDs como IDs de usuário (compatível com FKs existentes)
    generateId: () => crypto.randomUUID(),
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Importar e usar Resend para reset de senha
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Trade AI Hub <noreply@tradeaihub.com>',
        to: user.email,
        subject: 'Redefinir sua senha — Trade AI Hub',
        html: `<p>Clique <a href="${url}">aqui</a> para redefinir sua senha.</p>`,
      });
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Trade AI Hub <noreply@tradeaihub.com>',
        to: user.email,
        subject: 'Confirme seu email — Trade AI Hub',
        html: `<p>Clique <a href="${url}">aqui</a> para confirmar seu email.</p>`,
      });
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Trade AI Hub <noreply@tradeaihub.com>',
          to: email,
          subject: 'Seu link de acesso — Trade AI Hub',
          html: `<p>Clique <a href="${url}">aqui</a> para acessar sua conta.</p>`,
        });
      },
    }),
    // MUST be last — handles cookie setting in Next.js server actions
    nextCookies(),
  ],

  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'https://app.tradeaihub.com',
    'http://localhost:3000',
    'https://dev.tradeaihub.com',
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
