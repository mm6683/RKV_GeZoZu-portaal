import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { password, confirmPassword } = await req.json()

  // Valideer pending sessie
  const reqSession = await getIronSession<SessionData>(req, new NextResponse(), SESSION_OPTIONS)
  const pendingId = reqSession.pendingVolunteerId
  if (!pendingId) {
    return NextResponse.json({ error: 'Sessie verlopen. Probeer opnieuw in te loggen.' }, { status: 401 })
  }

  // Valideer wachtwoord
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Wachtwoord moet minstens 8 tekens zijn.' }, { status: 400 })
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Wachtwoorden komen niet overeen.' }, { status: 400 })
  }

  const volunteer = await prisma.volunteer.findUnique({ where: { id: pendingId } })
  if (!volunteer) {
    return NextResponse.json({ error: 'Account niet gevonden.' }, { status: 404 })
  }

  // Hash en sla op
  const passwordHash = await bcrypt.hash(password, 12)
  const updated = await prisma.volunteer.update({
    where: { id: pendingId },
    data: { passwordHash, passwordSetAt: new Date() },
  })

  // Volledige sessie aanmaken
  const res = NextResponse.json({
    success: true,
    volunteer: { id: updated.id, naam: updated.volledigeNaam, isAdmin: updated.isAdmin },
  })

  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS)
  session.volunteerId        = updated.id
  session.rkvId              = updated.rkvId
  session.naam               = updated.volledigeNaam
  session.isAdmin            = updated.isAdmin
  session.isAuthenticated    = true
  session.pendingVolunteerId = undefined
  await session.save()

  return res
}
