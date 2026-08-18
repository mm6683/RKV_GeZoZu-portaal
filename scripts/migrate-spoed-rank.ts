/**
 * Eenmalig migratie-script voor het verwijderen van de SB "Spoed" uit
 * VolunteerRank.
 *
 * De Postgres-enum kan geen waarde verliezen die nog ergens in gebruik is:
 * als een vrijwilliger nog SPOED in zijn ranks[] heeft staan, of een event
 * nog minRank = SPOED heeft, faalt `prisma db push` zodra SPOED uit
 * prisma/schema.prisma verdwijnt.
 *
 * BELANGRIJK — VOLGORDE:
 *   1. Draai dit script EERST tegen productie, terwijl SPOED nog in het
 *      schema/de databank bestaat (dus vóór je deze branch naar main merget
 *      en de GitHub Actions workflow `prisma db push` draait).
 *   2. Merge daarna pas de schema-wijziging (SPOED weg, SPOEDVERPLEEGKUNDIGE
 *      / URGENTIE_ARTS / NDPV_D3 toegevoegd) naar main.
 *
 * Wat het doet:
 *   - Zoekt alle vrijwilligers met SPOED in ranks[] en alle events met
 *     minRank = SPOED.
 *   - Vervangt SPOED door TARGET_RANK (zie hieronder, standaard
 *     SPOEDVERPLEEGKUNDIGE — de dichtstbijzijnde nieuwe SB). Als de
 *     vrijwilliger TARGET_RANK al had, wordt SPOED gewoon verwijderd
 *     zonder duplicaat.
 *   - Pas de TARGET_RANK-constante hieronder aan als een andere SB
 *     inhoudelijk correcter is voor jullie vrijwilligers.
 *
 * Idempotent en veilig om meermaals te draaien.
 *
 * Gebruik:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-spoed-rank.ts
 *
 * Voeg --dry-run toe om enkel te tonen wat er zou gebeuren:
 *   npx tsx scripts/migrate-spoed-rank.ts --dry-run
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Naar welke SB de bestaande SPOED-toewijzingen omgezet worden.
const TARGET_RANK = 'SPOEDVERPLEEGKUNDIGE'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const [volunteers, events] = await Promise.all([
    prisma.$queryRaw<{ id: string; volledigeNaam: string; ranks: string[] }[]>`
      SELECT id, "volledigeNaam", ranks::text[] FROM "Volunteer" WHERE 'SPOED' = ANY(ranks)
    `,
    prisma.$queryRaw<{ id: string; naam: string; minRank: string | null }[]>`
      SELECT id, naam, "minRank"::text FROM "Event" WHERE "minRank" = 'SPOED'
    `,
  ])

  console.log(`${volunteers.length} vrijwilliger(s) met SB "Spoed", ${events.length} event(s) met minimum-SB "Spoed".`)

  if (volunteers.length === 0 && events.length === 0) {
    console.log('Niks te doen — SPOED wordt nergens meer gebruikt, je kan de schema-wijziging veilig deployen.')
    return
  }

  volunteers.forEach(v => console.log(`  · vrijwilliger: ${v.volledigeNaam} (${v.id})`))
  events.forEach(e => console.log(`  · event: ${e.naam} (${e.id})`))

  console.log(`\nSPOED wordt vervangen door "${TARGET_RANK}".`)

  if (dryRun) {
    console.log('\n--dry-run: er is niets weggeschreven naar de database.')
    return
  }

  for (const v of volunteers) {
    const newRanks = Array.from(new Set(v.ranks.map(r => (r === 'SPOED' ? TARGET_RANK : r))))
    await prisma.$executeRaw`
      UPDATE "Volunteer" SET ranks = ${newRanks}::"VolunteerRank"[] WHERE id = ${v.id}
    `
  }

  for (const e of events) {
    await prisma.$executeRaw`
      UPDATE "Event" SET "minRank" = ${TARGET_RANK}::"VolunteerRank" WHERE id = ${e.id}
    `
  }

  console.log(`\n${volunteers.length} vrijwilliger(s) en ${events.length} event(s) bijgewerkt.`)
  console.log('Je kan nu de schema-wijziging (SPOED verwijderd) deployen.')
}

main()
  .catch(err => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
