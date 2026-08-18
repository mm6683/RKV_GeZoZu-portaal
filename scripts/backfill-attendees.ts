/**
 * Eenmalig backfill-script voor de "nieuwe vrijwilligers onzichtbaar op
 * bestaande events"-bug.
 *
 * enrollEligibleVolunteers() (src/lib/eventHelpers.ts) draaide voorheen
 * enkel op het moment dat een event zelf werd aangemaakt/herhaald. Een
 * vrijwilliger die daarna werd toegevoegd kreeg nooit een EventAttendee-rij
 * voor events die al bestonden — en bleef dus onzichtbaar op de
 * deelnemerslijst daar, terwijl die wél correct verscheen op events die na
 * hen werden aangemaakt.
 *
 * De code-fix (enrollVolunteerInExistingEvents, aangeroepen bij het
 * aanmaken/bewerken van een vrijwilliger) voorkomt dit voortaan. Dit script
 * repareert de al bestaande productiedata: het loopt over alle actieve,
 * niet-geblokkeerde GeZoZu-vrijwilligers en vult voor elk van hen de
 * ontbrekende RESERVE-rijen aan op actieve, niet-geannuleerde, aankomende
 * events waar ze SB-gewijs voor in aanmerking komen.
 *
 * Idempotent en veilig om meermaals te draaien (skipDuplicates).
 *
 * Gebruik:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/backfill-attendees.ts
 *
 * Of, als .env al lokaal een geldige DATABASE_URL bevat (bv. via
 * `vercel env pull .env` of dezelfde Neon/Supabase/Railway-connectiestring
 * als productie):
 *   npx tsx scripts/backfill-attendees.ts
 *
 * Voeg --dry-run toe om enkel te tonen wat er zou gebeuren, zonder te
 * schrijven naar de database:
 *   npx tsx scripts/backfill-attendees.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RANK_ORDER = [
  'BASISVRIJWILLIGER',
  'NDPV',
  'EERSTEHULPVERLENER',
  'EVENTHULPVERLENER',
  'SPOED',
  'DGH',
  'VERPLEEGKUNDIGE',
  'DOKTER',
  'ADJUNCT',
  'AFDELINGSVERANTWOORDELIJKE',
] as const

function getHighestRankIndex(ranks: string[] | null | undefined): number {
  if (!ranks?.length) return -1
  return Math.max(-1, ...ranks.map(r => RANK_ORDER.indexOf(r as any)))
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [volunteers, events] = await Promise.all([
    prisma.volunteer.findMany({
      where: { isBlocked: false, hoofdentiteit: { contains: 'GENK-ZONHOVEN' } },
      select: { id: true, volledigeNaam: true, ranks: true },
    }),
    prisma.event.findMany({
      where: { isActief: true, isCancelled: false, datum: { gte: startOfToday } },
      select: { id: true, naam: true, minRank: true },
    }),
  ])

  console.log(`${volunteers.length} vrijwilligers, ${events.length} aankomende events.`)

  // Welke (eventId, volunteerId) combinaties bestaan al?
  const existing = await prisma.eventAttendee.findMany({
    where: { eventId: { in: events.map(e => e.id) } },
    select: { eventId: true, volunteerId: true },
  })
  const existingSet = new Set(existing.map(a => `${a.eventId}:${a.volunteerId}`))

  const toCreate: { eventId: string; volunteerId: string; status: 'RESERVE' }[] = []

  for (const v of volunteers) {
    const rankIndex = getHighestRankIndex(v.ranks)
    for (const e of events) {
      const eligible = !e.minRank || rankIndex >= RANK_ORDER.indexOf(e.minRank as any)
      if (!eligible) continue
      const key = `${e.id}:${v.id}`
      if (existingSet.has(key)) continue
      toCreate.push({ eventId: e.id, volunteerId: v.id, status: 'RESERVE' })
    }
  }

  console.log(`${toCreate.length} ontbrekende attendee-rijen gevonden.`)

  if (toCreate.length === 0) {
    console.log('Niks te doen — alles is al in orde.')
    return
  }

  // Klein overzicht per event, handig om te controleren vóór je effectief schrijft
  const perEvent = new Map<string, number>()
  for (const row of toCreate) perEvent.set(row.eventId, (perEvent.get(row.eventId) ?? 0) + 1)
  perEvent.forEach((count, eventId) => {
    const naam = events.find(e => e.id === eventId)?.naam ?? eventId
    console.log(`  · ${naam}: +${count}`)
  })

  if (dryRun) {
    console.log('\n--dry-run: er is niets weggeschreven naar de database.')
    return
  }

  const result = await prisma.eventAttendee.createMany({
    data: toCreate,
    skipDuplicates: true,
  })
  console.log(`\n${result.count} attendee-rijen aangemaakt.`)
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
