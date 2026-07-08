import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import prisma from '@/lib/db'
import { z } from 'zod'
import { enrollEligibleVolunteers } from '@/lib/eventHelpers'

const RepeatSchema = z.object({
  datum: z.string().min(1),
})

// POST — dupliceer een bestaand event naar een andere datum (admin only).
// Alle velden (tijden, locatie, min. hulpverleners, minimum-SB, opmerkingen)
// worden overgenomen. Bij een event dat over meerdere dagen loopt (eindDatum)
// wordt hetzelfde aantal dagen ertussen behouden voor de nieuwe datum.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session.isAuthenticated) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  if (!session.isAdmin) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json()
  const parsed = RepeatSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ongeldige datum' }, { status: 400 })

  const original = await prisma.event.findUnique({ where: { id: params.id } })
  if (!original) return NextResponse.json({ error: 'Event niet gevonden' }, { status: 404 })

  const newDatum = new Date(parsed.data.datum)
  if (isNaN(newDatum.getTime())) {
    return NextResponse.json({ error: 'Ongeldige datum' }, { status: 400 })
  }

  // Aantal dagen tussen start en einde van het origineel behouden (overnachtingen)
  const origDatum = new Date(original.datum)
  const origEind  = original.eindDatum ? new Date(original.eindDatum) : origDatum
  const offsetDays = Math.round((origEind.getTime() - origDatum.getTime()) / 86400000)

  const newEindDatum = new Date(newDatum)
  newEindDatum.setUTCDate(newEindDatum.getUTCDate() + offsetDays)

  const created = await prisma.event.create({
    data: {
      naam: original.naam,
      datum: newDatum,
      beginUur: original.beginUur,
      eindUur: original.eindUur,
      eindDatum: offsetDays !== 0 ? newEindDatum : null,
      plaats: original.plaats,
      afspreekplaats: original.afspreekplaats,
      afspreekStraat: original.afspreekStraat,
      afspreekNummer: original.afspreekNummer,
      afspreekPostcode: original.afspreekPostcode,
      afspreekGemeente: original.afspreekGemeente,
      minHulpverleners: original.minHulpverleners,
      minRank: original.minRank,
      opmerkingen: original.opmerkingen,
      createdById: session.volunteerId,
    },
  })

  await enrollEligibleVolunteers(created.id, original.minRank)

  return NextResponse.json(created, { status: 201 })
}
