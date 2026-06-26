import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { SessionData, SESSION_OPTIONS } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS)

  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const { currentPassword, newPassword, confirmPassword } = await req.json()

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'Alle velden zijn verplicht.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Nieuw wachtwoord moet minstens 8 tekens zijn.' }, { status: 400 })
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Nieuwe wachtwoorden komen niet overeen.' }, { status: 400 })
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: session.volunteerId },
    select: { passwordHash: true },
  })

  if (!volunteer?.passwordHash) {
    return NextResponse.json({ error: 'Geen wachtwoord ingesteld.' }, { status: 400 })
  }

  const correct = await bcrypt.compare(currentPassword, volunteer.passwordHash)
  if (!correct) {
    return NextResponse.json({ error: 'Huidig wachtwoord is fout.' }, { status: 401 })
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.volunteer.update({
    where: { id: session.volunteerId },
    data: { passwordHash: newHash, passwordSetAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
