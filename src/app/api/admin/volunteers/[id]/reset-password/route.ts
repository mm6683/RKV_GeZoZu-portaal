import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  // Mag eigen wachtwoord niet resetten via deze route
  if (params.id === session.volunteerId) {
    return NextResponse.json(
      { error: 'Gebruik "Wachtwoord wijzigen" om je eigen wachtwoord aan te passen.' },
      { status: 400 }
    )
  }

  await prisma.volunteer.update({
    where: { id: params.id },
    data: {
      passwordHash:  null,
      passwordSetAt: null,
    },
  })

  return NextResponse.json({ success: true })
}
