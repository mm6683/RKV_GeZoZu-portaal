// ── Organisatorische SB (Sanitaire Bekwaamheid) — van laag naar hoog ──────
// Toegewezen door admins, toekomstige import via RKV functies
// Een vrijwilliger kan meerdere SB's tegelijk hebben (zie Volunteer.ranks[])

export type VolunteerRank =
  | 'BASISVRIJWILLIGER'
  | 'NDPV'
  | 'EERSTEHULPVERLENER'
  | 'EVENTHULPVERLENER'
  | 'SPOED'
  | 'DGH'
  | 'VERPLEEGKUNDIGE'
  | 'DOKTER'
  | 'ADJUNCT'
  | 'AFDELINGSVERANTWOORDELIJKE'

export interface RankConfig {
  rank: VolunteerRank
  label: string
  color: string
  textColor: string
  priority: number
}

export const VOLUNTEER_RANKS: Record<VolunteerRank, RankConfig> = {
  BASISVRIJWILLIGER: {
    rank: 'BASISVRIJWILLIGER',
    label: 'Basisvrijwilliger',
    color: '#9CA3AF',
    textColor: '#fff',
    priority: 1,
  },
  NDPV: {
    rank: 'NDPV',
    label: 'NDPV',
    color: '#6B7280',
    textColor: '#fff',
    priority: 2,
  },
  EERSTEHULPVERLENER: {
    rank: 'EERSTEHULPVERLENER',
    label: 'Eerstehulpverlener',
    color: '#F59E0B',
    textColor: '#fff',
    priority: 3,
  },
  EVENTHULPVERLENER: {
    rank: 'EVENTHULPVERLENER',
    label: 'Eventhulpverlener',
    color: '#F97316',
    textColor: '#fff',
    priority: 4,
  },
  SPOED: {
    rank: 'SPOED',
    label: 'Spoed',
    color: '#962071',
    textColor: '#fff',
    priority: 5,
  },
  DGH: {
    rank: 'DGH',
    label: 'DGH',
    color: '#008AB7',
    textColor: '#fff',
    priority: 6,
  },
  VERPLEEGKUNDIGE: {
    rank: 'VERPLEEGKUNDIGE',
    label: 'Verpleegkundige',
    color: '#8CAA2E',
    textColor: '#fff',
    priority: 7,
  },
  DOKTER: {
    rank: 'DOKTER',
    label: 'Arts',
    color: '#EC2127',
    textColor: '#fff',
    priority: 8,
  },
  ADJUNCT: {
    rank: 'ADJUNCT',
    label: 'Adjunct',
    color: '#94A3B8',
    textColor: '#fff',
    priority: 9,
  },
  AFDELINGSVERANTWOORDELIJKE: {
    rank: 'AFDELINGSVERANTWOORDELIJKE',
    label: 'Afdelingsverantwoordelijke',
    color: '#f3a400',
    textColor: '#fff',
    priority: 10,
  },
}

export const RANK_ORDER: VolunteerRank[] = [
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
]

export function getRankConfig(rank: VolunteerRank | string): RankConfig {
  return VOLUNTEER_RANKS[rank as VolunteerRank] ?? VOLUNTEER_RANKS.BASISVRIJWILLIGER
}

// Hoogste SB uit een lijst (voor minimum-SB vergelijkingen bij meerdere SB's)
export function getHighestRankIndex(ranks: string[] | null | undefined): number {
  if (!ranks?.length) return -1
  return Math.max(-1, ...ranks.map(r => RANK_ORDER.indexOf(r as VolunteerRank)))
}

// ── Kwalificatie badges (medisch/training — apart van SB) ─────────────────
// Worden opgehaald via RKV CRM JSON APIs

export type QualificationType =
  | 'ERETEKEN'
  | 'MEDISCH_DIPLOMA'
  | 'KWALIFICATIE'
  | 'BREVET'
  | 'ATTEST'

export interface QualBadgeConfig {
  type: QualificationType
  label: string
  color: string
  textColor: string
  priority: number
}

export const QUAL_BADGES: Record<QualificationType, QualBadgeConfig> = {
  ERETEKEN:        { type: 'ERETEKEN',        label: 'Ereteken',        color: '#f3a400', textColor: '#fff', priority: 5 },
  MEDISCH_DIPLOMA: { type: 'MEDISCH_DIPLOMA', label: 'Medisch Diploma', color: '#962071', textColor: '#fff', priority: 4 },
  KWALIFICATIE:    { type: 'KWALIFICATIE',    label: 'Kwalificatie',    color: '#008AB7', textColor: '#fff', priority: 3 },
  BREVET:          { type: 'BREVET',          label: 'Brevet',          color: '#8CAA2E', textColor: '#fff', priority: 2 },
  ATTEST:          { type: 'ATTEST',          label: 'Attest',          color: '#81A6AB', textColor: '#fff', priority: 1 },
}

export function getHighestQual(quals: Array<{ type: string; naam: string }>) {
  if (!quals?.length) return null
  let best: { type: string; naam: string; priority: number } | null = null
  for (const q of quals) {
    const cfg = QUAL_BADGES[q.type as QualificationType]
    if (!cfg) continue
    if (!best || cfg.priority > best.priority) best = { ...q, priority: cfg.priority }
  }
  if (!best) return null
  const cfg = QUAL_BADGES[best.type as QualificationType]
  return { naam: best.naam, type: best.type as QualificationType, color: cfg.color, textColor: cfg.textColor, label: cfg.label }
}
