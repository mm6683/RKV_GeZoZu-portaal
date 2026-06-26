import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { getHighestQual } from '@/lib/ranks'

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
        },
      },
    })

    if (!volunteer) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

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
      rank: volunteer.rank,
      highestQual: getHighestQual(volunteer.qualifications),
      shiftenDitJaar: volunteer.attendances.length,
      qualifications: volunteer.qualifications,
      functions: volunteer.functions,
    })
  } catch {
    return NextResponse.json({ error: 'Server fout' }, { status: 500 })
  }
}
