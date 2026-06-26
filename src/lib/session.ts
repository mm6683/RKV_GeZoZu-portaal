import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export interface SessionData {
  volunteerId: string
  rkvId: string
  naam: string
  isAdmin: boolean
  isAuthenticated: boolean
  pendingVolunteerId?: string   // ingesteld tijdens first-time wachtwoord flow
}

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'gezozu_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    sameSite: 'strict' as const,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), SESSION_OPTIONS)
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession()
  if (!session.isAuthenticated) throw new Error('UNAUTHORIZED')
  return session
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireAuth()
  if (!session.isAdmin) throw new Error('FORBIDDEN')
  return session
}
