import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { SessionData } from '@/lib/session'

const SESSION_OPTS = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'gezozu_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true },
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTS)
  session.destroy()
  return res
}
