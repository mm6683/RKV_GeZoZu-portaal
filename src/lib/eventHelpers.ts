import prisma from '@/lib/db'
import { RANK_ORDER, getHighestRankIndex } from '@/lib/ranks'

// ── Auto-enrollment ────────────────────────────────────────────────────────
// Voegt alle GeZoZu-vrijwilligers die aan de minimum-SB voldoen toe als
// RESERVE aan een (nieuw of herhaald) event. Gedeeld tussen event-creatie
// en event-herhaling zodat het gedrag altijd consistent is.
export async function enrollEligibleVolunteers(eventId: string, minRank: string | null) {
  const minRankIndex = minRank ? RANK_ORDER.indexOf(minRank as any) : -1

  const gezozu = await prisma.volunteer.findMany({
    where: { isBlocked: false, hoofdentiteit: { contains: 'GENK-ZONHOVEN' } },
    select: { id: true, ranks: true },
  })

  const eligible = minRankIndex >= 0
    ? gezozu.filter(v => getHighestRankIndex(v.ranks) >= minRankIndex)
    : gezozu

  if (eligible.length === 0) return

  await prisma.eventAttendee.createMany({
    data: eligible.map(v => ({ eventId, volunteerId: v.id, status: 'RESERVE' as const })),
    skipDuplicates: true,
  })
}

// ── Auto-enrollment (omgekeerde richting) ──────────────────────────────────
// Voegt één vrijwilliger als RESERVE toe aan alle bestaande, actieve,
// niet-geannuleerde events (vandaag of later) waar die vrijwilliger voor in
// aanmerking komt. Nodig omdat enrollEligibleVolunteers hierboven enkel
// draait op het moment dat een event zelf wordt aangemaakt/herhaald — een
// vrijwilliger die daarna wordt toegevoegd (of wiens SB/afdeling/blokkering
// nadien verandert) kreeg zonder dit nooit een attendee-record voor reeds
// bestaande events, en bleef dus onzichtbaar op de deelnemerslijst daar.
export async function enrollVolunteerInExistingEvents(volunteerId: string) {
  const volunteer = await prisma.volunteer.findUnique({
    where: { id: volunteerId },
    select: { isBlocked: true, hoofdentiteit: true, ranks: true },
  })
  if (!volunteer) return
  if (volunteer.isBlocked) return
  if (!volunteer.hoofdentiteit?.includes('GENK-ZONHOVEN')) return

  const volunteerRankIndex = getHighestRankIndex(volunteer.ranks)

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const events = await prisma.event.findMany({
    where: { isActief: true, isCancelled: false, datum: { gte: startOfToday } },
    select: { id: true, minRank: true },
  })

  const eligibleEventIds = events
    .filter(e => !e.minRank || volunteerRankIndex >= RANK_ORDER.indexOf(e.minRank as any))
    .map(e => e.id)

  if (eligibleEventIds.length === 0) return

  await prisma.eventAttendee.createMany({
    data: eligibleEventIds.map(eventId => ({ eventId, volunteerId, status: 'RESERVE' as const })),
    skipDuplicates: true,
  })
}

// ── "Is dit shift al bezig of voorbij?" ────────────────────────────────────
// Combineert de datum (dag) met het beginUur ("HH:MM") tot één tijdstip.
// Gebruikt setUTCHours omdat datum als UTC-middernacht wordt opgeslagen
// (afkomstig van een date-only input), zodat dit consistent blijft met
// hoe datums elders in de app worden opgebouwd/weergegeven.
export function getEventStart(datum: Date | string, beginUur: string): Date {
  const d = new Date(datum)
  const [h, m] = beginUur.split(':').map(Number)
  d.setUTCHours(h || 0, m || 0, 0, 0)
  return d
}

export function hasEventStarted(datum: Date | string, beginUur: string, now: Date = new Date()): boolean {
  return getEventStart(datum, beginUur).getTime() <= now.getTime()
}
