export type QualType = 'ERETEKEN' | 'MEDISCH_DIPLOMA' | 'KWALIFICATIE' | 'BREVET' | 'ATTEST'
export type AttendStatus = 'RESERVE' | 'JA' | 'ONBESCHIKBAAR'

export interface VolunteerPublic {
  id: string
  rkvId: string
  voornaam: string
  naam: string
  volledigeNaam: string
  displayName: string | null
  hoofdentiteit: string
  pfpUrl: string | null
  isAdmin: boolean
  isExternal: boolean
  ranks: string[]
  qualifications: { type: QualType; naam: string; geldigTot?: string | null }[]
  functions: { functie: string; entiteit?: string | null; status?: string | null }[]
}

export interface EventPublic {
  id: string
  naam: string
  datum: string
  beginUur: string
  eindUur: string
  plaats: string
  afspreekplaats: string | null
  afspreekStraat: string | null
  afspreekNummer: string | null
  afspreekPostcode: string | null
  afspreekGemeente: string | null
  minHulpverleners: number
  opmerkingen: string | null
  isCancelled: boolean
  aantalJa: number
  attendees: AttendeePublic[]
}

export interface AttendeePublic {
  volunteerId: string
  volledigeNaam: string
  displayName: string | null
  pfpUrl: string | null
  hoofdentiteit: string
  isExternal: boolean
  ranks: string[]
  highestQual: { naam: string; type: QualType; color: string } | null
  status: AttendStatus
  opmerking: string | null
}
