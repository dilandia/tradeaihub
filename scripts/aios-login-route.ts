import { NextRequest, NextResponse } from 'next/server'
import { sealData } from 'iron-session'

export async function POST(req: NextRequest) {
  try {
    const text = await req.text()
    let password = ''
    try {
      const body = JSON.parse(text)
      password = typeof body?.password === 'string' ? body.password : ''
    } catch (parseErr) {
      console.error('[auth/login] Invalid JSON:', parseErr)
      return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
    }
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
