import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { volunteerId, status } = await req.json()

  if (!['RESERVE', 'JA', 'ONBESCHIKBAAR'].includes(status)) {
    return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  if (!session.isAdmin && volunteerId !== session.volunteerId) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const attendee = await prisma.eventAttendee.upsert({
    where: { eventId_volunteerId: { eventId: params.id, volunteerId } },
    update: { status, updatedById: session.volunteerId },
    create: { eventId: params.id, volunteerId, status, updatedById: session.volunteerId },
  })

  return NextResponse.json(attendee)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const { volunteerId } = await req.json()
  const volunteer = await prisma.volunteer.findUnique({ where: { id: volunteerId } })
  if (!volunteer) return NextResponse.json({ error: 'Vrijwilliger niet gevonden' }, { status: 404 })

  const attendee = await prisma.eventAttendee.upsert({
    where: { eventId_volunteerId: { eventId: params.id, volunteerId } },
    update: {},
    create: { eventId: params.id, volunteerId, status: 'RESERVE', isExternal: true },
  })

  return NextResponse.json(attendee, { status: 201 })
}
