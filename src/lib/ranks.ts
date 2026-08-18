// ── Organisatorische SB (Sanitaire Bekwaamheid) — van laag naar hoog ──────
// Toegewezen door admins, toekomstige import via RKV functies
// Een vrijwilliger kan meerdere SB's tegelijk hebben (zie Volunteer.ranks[])

export type VolunteerRank =
  | 'BASISVRIJWILLIGER'
  | 'NDPV_D3'
  | 'NDPV'
  | 'EERSTEHULPVERLENER'
  | 'EVENTHULPVERLENER'
  | 'DGH'
  | 'VERPLEEGKUNDIGE'
  | 'SPOEDVERPLEEGKUNDIGE'
  | 'DOKTER'
  | 'URGENTIE_ARTS'
  | 'ADJUNCT'
  | 'AFDELINGSVERANTWOORDELIJKE'

export interface RankConfig {
  rank: VolunteerRank
  /** Volledige naam, zonder functiecode. */
  label: string
  /** Functiecode (bv. 'A3'), null als deze SB er geen heeft. */
  code: string | null
  /**
   * Korte weergave voor gebruik op de Event-pagina (bv. "EHV", "NDPV (D3)",
   * "Basisvrijwilliger").
   */
  abbreviation: string | null
  color: string
  textColor: string
  priority: number
}

export const VOLUNTEER_RANKS: Record<VolunteerRank, RankConfig> = {
  BASISVRIJWILLIGER: {
    rank: 'BASISVRIJWILLIGER',
    label: 'Polyvalente Basisvrijwilliger',
    code: null,
    abbreviation: 'Basisvrijwilliger',
    color: '#9CA3AF',
    textColor: '#fff',
    priority: 1,
  },
  EERSTEHULPVERLENER: {
    rank: 'EERSTEHULPVERLENER',
    label: 'Eerstehulpverlener',
    code: 'A3',
    abbreviation: 'EHV',
    color: '#F59E0B',
    textColor: '#fff',
    priority: 2,
  },
  EVENTHULPVERLENER: {
    rank: 'EVENTHULPVERLENER',
    label: 'Eventhulpverlener',
    code: 'B3',
    abbreviation: 'EVH',
    color: '#F97316',
    textColor: '#fff',
    priority: 3,
  },
  NDPV_D3: {
    rank: 'NDPV_D3',
    label: 'Ambulancier NDPV',
    code: 'D3 - Voorlopig',
    abbreviation: 'NDPV (D3)',
    color: '#9CA6B0',
    textColor: '#fff',
    priority: 4,
  },
  NDPV: {
    rank: 'NDPV',
    label: 'Ambulancier NDPV',
    code: 'D4',
    abbreviation: 'NDPV',
    color: '#6B7280',
    textColor: '#fff',
    priority: 5,
  },
  DGH: {
    rank: 'DGH',
    label: 'Dringende geneeskundige hulpverlener',
    code: 'G1',
    abbreviation: 'DGH',
    color: '#008AB7',
    textColor: '#fff',
    priority: 6,
  },
  VERPLEEGKUNDIGE: {
    rank: 'VERPLEEGKUNDIGE',
    label: 'Verpleegkundige',
    code: 'E1',
    abbreviation: 'VPK',
    color: '#8CAA2E',
    textColor: '#fff',
    priority: 7,
  },
  SPOEDVERPLEEGKUNDIGE: {
    rank: 'SPOEDVERPLEEGKUNDIGE',
    label: 'Spoedverpleegkundige',
    code: 'E3',
    abbreviation: 'Spoedverpleegkundige',
    color: '#962071',
    textColor: '#fff',
    priority: 8,
  },
  DOKTER: {
    rank: 'DOKTER',
    label: 'Arts',
    code: 'F1',
    abbreviation: 'Arts',
    color: '#EC2127',
    textColor: '#fff',
    priority: 9,
  },
  URGENTIE_ARTS: {
    rank: 'URGENTIE_ARTS',
    label: 'Urgentie-Arts',
    code: 'F2',
    abbreviation: 'Urgentie-Arts',
    color: '#A61217',
    textColor: '#fff',
    priority: 10,
  },
  ADJUNCT: {
    rank: 'ADJUNCT',
    label: 'Adjunct',
    code: null,
    abbreviation: 'Adjunct',
    color: '#94A3B8',
    textColor: '#fff',
    priority: 11,
  },
  AFDELINGSVERANTWOORDELIJKE: {
    rank: 'AFDELINGSVERANTWOORDELIJKE',
    label: 'Afdelingsverantwoordelijke',
    code: null,
    abbreviation: 'Afdelingsverantwoordelijke',
    color: '#f3a400',
    textColor: '#fff',
    priority: 12,
  },
}

export const RANK_ORDER: VolunteerRank[] = [
  'BASISVRIJWILLIGER',
  'EERSTEHULPVERLENER',
  'EVENTHULPVERLENER',
  'NDPV_D3',
  'NDPV',
  'DGH',
  'VERPLEEGKUNDIGE',
  'SPOEDVERPLEEGKUNDIGE',
  'DOKTER',
  'URGENTIE_ARTS',
  'ADJUNCT',
  'AFDELINGSVERANTWOORDELIJKE',
]

export function getRankConfig(rank: VolunteerRank | string): RankConfig {
  return VOLUNTEER_RANKS[rank as VolunteerRank] ?? VOLUNTEER_RANKS.BASISVRIJWILLIGER
}

// Volledige naam + functiecode, voor overal buiten de Event-pagina
// (bv. "Eerstehulpverlener (A3)"). Zonder code (Basisvrijwilliger, Adjunct,
// Afdelingsverantwoordelijke) wordt enkel de naam getoond.
export function getRankLabel(rank: VolunteerRank | string): string {
  const cfg = getRankConfig(rank)
  return cfg.code ? `${cfg.label} (${cfg.code})` : cfg.label
}

// Korte weergave voor de Event-pagina. Geeft altijd tekst terug (in
// tegenstelling tot cfg.abbreviation, dat null kan zijn) — bedoeld voor
// plekken waar één enkele SB-waarde getoond wordt (bv. "Minimum SB").
export function getRankEventLabel(rank: VolunteerRank | string): string {
  const cfg = getRankConfig(rank)
  return cfg.abbreviation ?? cfg.label
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
