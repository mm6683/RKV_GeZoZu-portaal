import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { volunteerId, status, opmerking } = await req.json()

  // Status is optioneel geworden: een aanroep kan enkel de opmerking bijwerken
  // (bv. vanuit het opmerkingveld) zonder de beschikbaarheid te wijzigen.
  if (status !== undefined && !['RESERVE', 'JA', 'ONBESCHIKBAAR'].includes(status)) {
    return NextResponse.json({ error: 'Ongeldige status' }, { status: 400 })
  }
  if (opmerking !== undefined && typeof opmerking !== 'string') {
    return NextResponse.json({ error: 'Ongeldige opmerking' }, { status: 400 })
  }

  // Enkel jezelf, of eender wie als je admin bent — dit geldt zowel voor de
  // beschikbaarheidsstatus als voor de opmerking (admins mogen ieders
  // opmerking bekijken/bewerken).
  if (!session.isAdmin && volunteerId !== session.volunteerId) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const trimmedOpmerking = typeof opmerking === 'string' ? opmerking.trim().slice(0, 500) : undefined

  const attendee = await prisma.eventAttendee.upsert({
    where: { eventId_volunteerId: { eventId: params.id, volunteerId } },
    update: {
      updatedById: session.volunteerId,
      ...(status !== undefined && { status }),
      ...(trimmedOpmerking !== undefined && { opmerking: trimmedOpmerking || null }),
    },
    create: {
      eventId: params.id,
      volunteerId,
      status: status ?? 'RESERVE',
      opmerking: trimmedOpmerking || null,
      updatedById: session.volunteerId,
    },
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

// DELETE — verwijder een externe vrijwilliger van een event (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const { volunteerId } = await req.json()

  // Enkel externe deelnemers mogen verwijderd worden
  const attendee = await prisma.eventAttendee.findUnique({
    where: { eventId_volunteerId: { eventId: params.id, volunteerId } },
  })
  if (!attendee) return NextResponse.json({ error: 'Deelnemer niet gevonden' }, { status: 404 })
  if (!attendee.isExternal) return NextResponse.json({ error: 'Enkel externe vrijwilligers kunnen verwijderd worden' }, { status: 403 })

  await prisma.eventAttendee.delete({
    where: { eventId_volunteerId: { eventId: params.id, volunteerId } },
  })

  return NextResponse.json({ success: true })
}
