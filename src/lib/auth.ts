// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import bcryptjs from 'bcryptjs';

const scrypt = promisify(scryptCb);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// CamelCasePlugin converts camelCase field names → snake_case SQL columns automatically
const db = new Kysely({
  dialect: new PostgresDialect({ pool }),
  plugins: [new CamelCasePlugin()],
});

// Scrypt params matching better-auth defaults; maxmem must be explicit for Node.js
const SCRYPT_PARAMS = { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 } as const;

// Custom password hashing using scrypt (same params as better-auth default)
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(Buffer.from(password.normalize('NFKC')), salt, 64, SCRYPT_PARAMS)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

// Custom verifier: handles both bcrypt (migrated from Supabase) and scrypt (new)
async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  // bcrypt hashes start with $2a$ or $2b$
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcryptjs.compare(password, hash);
  }

  // scrypt format: "salt:key"
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;

  try {
    const targetKey = (await scrypt(
      Buffer.from(password.normalize('NFKC')),
      salt,
      64,
      SCRYPT_PARAMS,
    )) as Buffer;
    return targetKey.toString('hex') === key;
  } catch {
    return false;
  }
}

export const auth = betterAuth({
  database: kyselyAdapter(db, { type: 'postgres' }),

  // Mapear para nossas tabelas com prefixo better_auth_
  user: {
    modelName: 'better_auth_user',
    additionalFields: {
      role: { type: 'string', defaultValue: 'user' },
    },
  },
  session: { modelName: 'better_auth_session' },
  account: { modelName: 'better_auth_account' },
  verification: { modelName: 'better_auth_verification' },

  advanced: {
    // Usar UUIDs como IDs de usuário (compatível com FKs existentes)
    generateId: () => crypto.randomUUID(),
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
    sendResetPassword: async ({ user, url }) => {
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
