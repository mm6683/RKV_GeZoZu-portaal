// ── Organisatorische rang (van laag naar hoog) ────────────────────────────
// Toegewezen door admins, toekomstige import via RKV functies

export type VolunteerRank =
  | 'BASISVRIJWILLIGER'
  | 'EERSTEHULPVERLENER'
  | 'EVENTHULPVERLENER'
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
  EERSTEHULPVERLENER: {
    rank: 'EERSTEHULPVERLENER',
    label: 'Eerstehulpverlener',
    color: '#F59E0B',
    textColor: '#fff',
    priority: 2,
  },
  EVENTHULPVERLENER: {
    rank: 'EVENTHULPVERLENER',
    label: 'Eventhulpverlener',
    color: '#F97316',
    textColor: '#fff',
    priority: 3,
  },
  DGH: {
    rank: 'DGH',
    label: 'DGH',
    color: '#008AB7',
    textColor: '#fff',
    priority: 4,
  },
  VERPLEEGKUNDIGE: {
    rank: 'VERPLEEGKUNDIGE',
    label: 'Verpleegkundige',
    color: '#8CAA2E',
    textColor: '#fff',
    priority: 5,
  },
  DOKTER: {
    rank: 'DOKTER',
    label: 'Dokter',
    color: '#EC2127',
    textColor: '#fff',
    priority: 6,
  },
  ADJUNCT: {
    rank: 'ADJUNCT',
    label: 'Adjunct',
    color: '#94A3B8',
    textColor: '#fff',
    priority: 7,
  },
  AFDELINGSVERANTWOORDELIJKE: {
    rank: 'AFDELINGSVERANTWOORDELIJKE',
    label: 'Afdelingsverantwoordelijke',
    color: '#f3a400',
    textColor: '#fff',
    priority: 8,
  },
}

export const RANK_ORDER: VolunteerRank[] = [
  'BASISVRIJWILLIGER',
  'EERSTEHULPVERLENER',
  'EVENTHULPVERLENER',
  'DGH',
  'VERPLEEGKUNDIGE',
  'DOKTER',
  'ADJUNCT',
  'AFDELINGSVERANTWOORDELIJKE',
]

export function getRankConfig(rank: VolunteerRank | string): RankConfig {
  return VOLUNTEER_RANKS[rank as VolunteerRank] ?? VOLUNTEER_RANKS.BASISVRIJWILLIGER
}

// ── Kwalificatie badges (medisch/training — apart van rang) ───────────────
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
