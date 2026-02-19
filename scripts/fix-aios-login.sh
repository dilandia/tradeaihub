#!/bin/bash
# Corrige login do AIOS Dashboard (Next.js 15 + basePath /aios)
# Executar no VPS: bash fix-aios-login.sh

set -e
DASHBOARD_DIR="/home/takez/aios-core/dashboard"

# 1. Atualizar session.ts - adicionar path /aios
cat > "$DASHBOARD_DIR/src/lib/session.ts" << 'SESSION_EOF'
import { SessionOptions } from 'iron-session'

export interface SessionData {
  isAuthenticated: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'aios-dashboard-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/aios', // necessário para basePath
  },
}
SESSION_EOF

# 2. Reescrever rota de login - usar sealData (evita erro getIronSession no Next.js 15)
cat > "$DASHBOARD_DIR/app/api/auth/login/route.ts" << 'ROUTE_EOF'
import { NextRequest, NextResponse } from 'next/server'
import { sealData } from 'iron-session'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const expected = process.env.DASHBOARD_PASSWORD
    if (!password || !expected || password !== expected) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
    }
    const encrypted = await sealData(
      { isAuthenticated: true },
      { password: process.env.SESSION_SECRET as string, ttl: 60 * 60 * 24 * 7 }
    )
    const res = NextResponse.json({ ok: true })
    res.cookies.set('aios-dashboard-session', encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/aios',
    })
    return res
  } catch (err) {
    console.error('[auth/login]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
ROUTE_EOF

echo "Arquivos atualizados. Rebuild e restart..."
cd "$DASHBOARD_DIR" && npm run build && pm2 reload ecosystem.config.js --update-env
# 3. Nova senha (definir no ecosystem e .env.local)
NEW_PASS="TakeZ2026nova"
echo "Nova senha: $NEW_PASS"
echo "DASHBOARD_PASSWORD=$NEW_PASS" > "$DASHBOARD_DIR/.env.local"
echo "SESSION_SECRET=b14466980de346b928265eb4db0cbff34cfd4d0397d991585f831841eccf3307" >> "$DASHBOARD_DIR/.env.local"
echo "STORIES_BASE_PATH=/home/takez/aios-core/docs/stories" >> "$DASHBOARD_DIR/.env.local"
echo "AGENTS_BASE_PATH=/home/takez/aios-core/.aios-core/development/agents" >> "$DASHBOARD_DIR/.env.local"
echo "KANBAN_STATE_PATH=/home/takez/aios-core/dashboard/data/kanban-state.json" >> "$DASHBOARD_DIR/.env.local"

# Atualizar ecosystem.config.js
sed -i "s/DASHBOARD_PASSWORD: '.*'/DASHBOARD_PASSWORD: '$NEW_PASS'/" "$DASHBOARD_DIR/ecosystem.config.js"

echo "Concluído. Use a senha: $NEW_PASS"
