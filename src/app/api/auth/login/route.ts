import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Gebruikersnaam is verplicht.' }, { status: 400 })
  }

  const raw = email.trim()

  // Bepaal hoe de identifier opgezocht wordt:
  //   bevat '@'          → volledig e-mailadres         → zoek op emailWerk
  //   bevat '.' maar geen '@' → voornaam.achternaam-notatie
  //                          → construeer voornaam.achternaam@vrijwilliger.rodekruis.be
  //   geen '.' en geen '@'   → RKV-ID (bijv. 08121600162) → zoek op rkvId
  let whereClause: Record<string, string>
  if (raw.includes('@')) {
    whereClause = { emailWerk: raw.toLowerCase() }
  } else if (raw.includes('.')) {
    whereClause = { emailWerk: `${raw.toLowerCase()}@vrijwilliger.rodekruis.be` }
  } else {
    whereClause = { rkvId: raw }
  }

  const volunteer = await prisma.volunteer.findFirst({
    where: { ...whereClause, isBlocked: false },
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
