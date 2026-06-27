import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { z } from 'zod'
import { RANK_ORDER } from '@/lib/ranks'

// GET — opkomende events deze maand
export async function GET() {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const events = await prisma.event.findMany({
    where: { isActief: true, isCancelled: false, datum: { gte: startOfToday, lte: endOfMonth } },
    orderBy: { datum: 'asc' },
    include: { attendees: { select: { status: true } } },
  })

  return NextResponse.json(events.map(e => ({
    id: e.id, naam: e.naam,
    datum: e.datum.toISOString(),
    beginUur: e.beginUur, eindUur: e.eindUur,
    plaats: e.plaats,
    minHulpverleners: e.minHulpverleners,
    aantalJa: e.attendees.filter(a => a.status === 'JA').length,
  })))
}

const VALID_RANKS = [
  'BASISVRIJWILLIGER','EERSTEHULPVERLENER','EVENTHULPVERLENER','DGH',
  'VERPLEEGKUNDIGE','DOKTER','ADJUNCT','AFDELINGSVERANTWOORDELIJKE',
] as const

const EventSchema = z.object({
  naam: z.string().min(2),
  datum: z.string(),
  beginUur: z.string().regex(/^\d{2}:\d{2}$/),
  eindUur:  z.string().regex(/^\d{2}:\d{2}$/),
  plaats:   z.string().min(2),
  afspreekplaats:   z.string().optional(),
  afspreekStraat:   z.string().optional(),
  afspreekNummer:   z.string().optional(),
  afspreekPostcode: z.string().optional(),
  afspreekGemeente: z.string().optional(),
  minHulpverleners: z.number().int().min(1).default(2),
  minRank: z.enum(VALID_RANKS).nullable().optional(),
  opmerkingen: z.string().optional(),
})

// POST — nieuw event (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json()
  const parsed = EventSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 })

  const d = parsed.data
  const event = await prisma.event.create({
    data: {
      naam: d.naam, datum: new Date(d.datum),
      beginUur: d.beginUur, eindUur: d.eindUur, plaats: d.plaats,
      afspreekplaats: d.afspreekplaats || null,
      afspreekStraat: d.afspreekStraat || null,
      afspreekNummer: d.afspreekNummer || null,
      afspreekPostcode: d.afspreekPostcode || null,
      afspreekGemeente: d.afspreekGemeente || null,
      minHulpverleners: d.minHulpverleners,
      minRank: d.minRank ?? null,
      opmerkingen: d.opmerkingen || null,
      createdById: session.volunteerId,
    },
  })

  // Alle GeZoZu vrijwilligers als RESERVE toevoegen, maar enkel boven de minimumrang
  const minRankIndex = d.minRank ? RANK_ORDER.indexOf(d.minRank) : -1
  const gezozu = await prisma.volunteer.findMany({
    where: { isBlocked: false, hoofdentiteit: { contains: 'GENK-ZONHOVEN' } },
    select: { id: true, rank: true },
  })
  const eligible = minRankIndex >= 0
    ? gezozu.filter(v => RANK_ORDER.indexOf(v.rank) >= minRankIndex)
    : gezozu

  if (eligible.length > 0) {
    await prisma.eventAttendee.createMany({
      data: eligible.map(v => ({ eventId: event.id, volunteerId: v.id, status: 'RESERVE' as const })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json(event, { status: 201 })
}
