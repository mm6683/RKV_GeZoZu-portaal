import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { getHighestQual } from '@/lib/ranks'
import { hasEventStarted } from '@/lib/eventHelpers'

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  // Niet-admins mogen enkel hun eigen profiel opvragen
  if (!session.isAdmin && params.id !== session.volunteerId) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: params.id },
    include: {
      qualifications: { orderBy: { type: 'asc' } },
      functions: { where: { status: { not: 'Inactief' } }, orderBy: { startdatum: 'desc' } },
      attendances: {
        where: { status: 'JA' },
        include: { event: { select: { id: true, naam: true, datum: true, plaats: true, beginUur: true } } },
        orderBy: { event: { datum: 'desc' } },
        take: 50,
      },
    },
  })

  if (!volunteer) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const now = new Date()
  // Enkel shifts die al bezig zijn of al voorbij zijn tellen mee, geen
  // toekomstige events waar je je enkel op hebt aangemeld.
  const shiftenDitJaar = volunteer.attendances.filter(
    a => new Date(a.event.datum).getFullYear() === now.getFullYear()
      && hasEventStarted(a.event.datum, a.event.beginUur, now)
  ).length

  return NextResponse.json({
    id: volunteer.id,
    rkvId: volunteer.rkvId,
    voornaam: volunteer.voornaam,
    naam: volunteer.naam,
    volledigeNaam: volunteer.volledigeNaam,
    displayName: volunteer.displayName,
    hoofdentiteit: volunteer.hoofdentiteit,
    pfpUrl: volunteer.pfpUrl,
    isAdmin: volunteer.isAdmin,
    isExternal: volunteer.isExternal,
    ranks: volunteer.ranks,
    highestQual: getHighestQual(volunteer.qualifications),
    shiftenDitJaar,
    totalShiften: volunteer.attendances.length,
    qualifications: volunteer.qualifications,
    functions: volunteer.functions,
    recentShiften: volunteer.attendances.slice(0, 10).map(a => ({
      eventId: a.event.id,
      naam: a.event.naam,
      datum: a.event.datum,
      plaats: a.event.plaats,
    })),
    lastSync: volunteer.lastSync,
  })
}
