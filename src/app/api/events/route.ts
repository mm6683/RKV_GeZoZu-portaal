import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { z } from 'zod'
import { enrollEligibleVolunteers } from '@/lib/eventHelpers'

// GET — alle opkomende events (deze maand + alle volgende maanden/jaren).
// De frontend groepeert dit zelf per maand ("deze maand" + dropdown andere
// maanden) en de kalender heeft hierdoor ook toegang tot volgende maanden.
export async function GET() {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const events = await prisma.event.findMany({
    where: { isActief: true, isCancelled: false, datum: { gte: startOfToday } },
    // Binnen eenzelfde dag sorteren op startuur i.p.v. (impliciet) alfabetisch
    orderBy: [{ datum: 'asc' }, { beginUur: 'asc' }],
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
  'BASISVRIJWILLIGER','NDPV','EERSTEHULPVERLENER','EVENTHULPVERLENER','SPOED','DGH',
  'VERPLEEGKUNDIGE','DOKTER','ADJUNCT','AFDELINGSVERANTWOORDELIJKE',
] as const

const EventSchema = z.object({
  naam: z.string().min(2),
  datum: z.string(),
  beginUur: z.string().regex(/^\d{2}:\d{2}$/),
  eindUur:  z.string().regex(/^\d{2}:\d{2}$/),
  eindDatum: z.string().optional(),
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
      beginUur: d.beginUur, eindUur: d.eindUur,
      eindDatum: d.eindDatum ? new Date(d.eindDatum) : null,
      plaats: d.plaats,
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

  // Alle GeZoZu vrijwilligers als RESERVE toevoegen, maar enkel boven de minimum-SB
  await enrollEligibleVolunteers(event.id, d.minRank ?? null)

  return NextResponse.json(event, { status: 201 })
}
