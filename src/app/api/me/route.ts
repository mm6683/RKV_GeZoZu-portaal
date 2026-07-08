import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { getHighestQual } from '@/lib/ranks'
import { hasEventStarted } from '@/lib/eventHelpers'

export async function GET() {
  try {
    const session = await getSession()
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { id: session.volunteerId },
      include: {
        qualifications: true,
        functions: { where: { status: { not: 'Inactief' } } },
        attendances: {
          where: {
            status: 'JA',
            event: { datum: { gte: new Date(new Date().getFullYear(), 0, 1) } },
          },
          include: { event: { select: { datum: true, beginUur: true } } },
        },
      },
    })

    if (!volunteer) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

    // Enkel shifts die al bezig zijn of al voorbij zijn tellen mee, geen
    // toekomstige events waar je je enkel op hebt aangemeld.
    const shiftenDitJaar = volunteer.attendances.filter(
      a => hasEventStarted(a.event.datum, a.event.beginUur)
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
      qualifications: volunteer.qualifications,
      functions: volunteer.functions,
    })
  } catch {
    return NextResponse.json({ error: 'Server fout' }, { status: 500 })
  }
}
