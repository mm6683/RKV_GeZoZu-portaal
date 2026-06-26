import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'E-mailadres is verplicht.' }, { status: 400 })
  }

  const q = email.trim().toLowerCase()

  // Zoek op emailWerk (primair) OF rkvId (secundair)
  const volunteer = await prisma.volunteer.findFirst({
    where: {
      OR: [
        { emailWerk: q },
        { rkvId: email.trim() },
      ],
      isBlocked: false,
    },
  })

  if (!volunteer) {
    return NextResponse.json({ error: 'Geen account gevonden.' }, { status: 401 })
  }

  if (!volunteer.passwordHash) {
    const res = NextResponse.json({ firstTime: true })
    const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS)
    session.pendingVolunteerId = volunteer.id
    await session.save()
    return res
  }

  if (!password) {
    return NextResponse.json({ error: 'Wachtwoord is verplicht.' }, { status: 400 })
  }

  const correct = await bcrypt.compare(password, volunteer.passwordHash)
  if (!correct) {
    return NextResponse.json({ error: 'Fout wachtwoord.' }, { status: 401 })
  }

  const res = NextResponse.json({
    success: true,
    volunteer: { id: volunteer.id, naam: volunteer.volledigeNaam, isAdmin: volunteer.isAdmin },
  })

  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS)
  session.volunteerId     = volunteer.id
  session.rkvId           = volunteer.rkvId
  session.naam            = volunteer.volledigeNaam
  session.isAdmin         = volunteer.isAdmin
  session.isAuthenticated = true
  await session.save()

  return res
}
