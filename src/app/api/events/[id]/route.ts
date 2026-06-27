import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { getHighestQual } from '@/lib/ranks'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      attendees: {
        include: { volunteer: { include: { qualifications: true } } },
        orderBy: [{ status: 'asc' }, { volunteer: { volledigeNaam: 'asc' } }],
      },
    },
  })

  if (!event) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const isPast = new Date(event.datum) < new Date(new Date().setHours(0, 0, 0, 0))
  if ((isPast || event.isCancelled) && !session.isAdmin) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  return NextResponse.json({
    id: event.id, naam: event.naam,
    datum: event.datum.toISOString(),
    beginUur: event.beginUur, eindUur: event.eindUur,
    plaats: event.plaats,
    afspreekplaats: event.afspreekplaats,
    afspreekStraat: event.afspreekStraat,
    afspreekNummer: event.afspreekNummer,
    afspreekPostcode: event.afspreekPostcode,
    afspreekGemeente: event.afspreekGemeente,
    minHulpverleners: event.minHulpverleners,
    minRank: event.minRank,
    opmerkingen: event.opmerkingen,
    isActief: event.isActief,
    isCancelled: event.isCancelled,
    aantalJa: event.attendees.filter(a => a.status === 'JA').length,
    attendees: event.attendees.map(a => ({
      volunteerId: a.volunteerId,
      volledigeNaam: a.volunteer.volledigeNaam,
      displayName: a.volunteer.displayName,
      pfpUrl: a.volunteer.pfpUrl,
      hoofdentiteit: a.volunteer.hoofdentiteit,
      isExternal: a.isExternal,
      rank: a.volunteer.rank,
      highestQual: getHighestQual(a.volunteer.qualifications),
      status: a.status,
    })),
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json()
  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      naam: body.naam,
      datum: body.datum ? new Date(body.datum) : undefined,
      beginUur: body.beginUur, eindUur: body.eindUur,
      plaats: body.plaats,
      afspreekplaats: body.afspreekplaats || null,
      afspreekStraat: body.afspreekStraat || null,
      afspreekNummer: body.afspreekNummer || null,
      afspreekPostcode: body.afspreekPostcode || null,
      afspreekGemeente: body.afspreekGemeente || null,
      minHulpverleners: body.minHulpverleners,
      minRank: body.minRank ?? null,
      opmerkingen: body.opmerkingen || null,
      isActief: body.isActief,
    },
  })
  return NextResponse.json(event)
}

// DELETE — archiveren (zachte verwijdering)
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  await prisma.event.update({ where: { id: params.id }, data: { isActief: false } })
  return NextResponse.json({ success: true })
}
