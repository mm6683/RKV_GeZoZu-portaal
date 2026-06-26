import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const yesterday = new Date()
  yesterday.setHours(0, 0, 0, 0)

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { datum: { lt: yesterday } },   // voorbij
        { isCancelled: true },           // geannuleerd
      ],
    },
    orderBy: { datum: 'desc' },
    include: { attendees: { select: { status: true } } },
  })

  const mapEvent = (e: any) => ({
    id: e.id, naam: e.naam,
    datum: e.datum.toISOString(),
    beginUur: e.beginUur, eindUur: e.eindUur,
    plaats: e.plaats,
    aantalJa: e.attendees.filter((a: any) => a.status === 'JA').length,
    isActief: e.isActief,
    isCancelled: e.isCancelled,
  })

  // Gesplitst: voorbije events per jaar + annulaties
  const pastEvents = events.filter(e => !e.isCancelled)
  const annulaties = events.filter(e => e.isCancelled)

  const byYear: Record<number, any[]> = {}
  for (const e of pastEvents) {
    const year = new Date(e.datum).getFullYear()
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(mapEvent(e))
  }

  return NextResponse.json({
    byYear,
    annulaties: annulaties.map(mapEvent),
  })
}
