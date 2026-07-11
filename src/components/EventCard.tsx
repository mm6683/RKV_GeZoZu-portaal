'use client'
import { useRouter } from 'next/navigation'
import type { AttendStatus } from '@/types'

interface Props {
  id: string
  naam: string
  datum: string
  beginUur: string
  eindUur: string
  plaats: string
  minHulpverleners: number
  aantalJa: number
  isAdmin?: boolean
  myStatus?: AttendStatus | null
}

// Enkel JA/ONBESCHIKBAAR zijn een bewuste keuze — RESERVE is de automatische
// standaard voor iedereen (zie enrollEligibleVolunteers) en zou op elke
// kaart verschijnen als we die ook zouden tonen, wat geen nuttige info geeft.
const MY_STATUS_CONFIG: Partial<Record<AttendStatus, { label: string; bg: string }>> = {
  JA:            { label: '✓ aanwezig',     bg: '#8CAA2E' },
  ONBESCHIKBAAR: { label: '✗ onbeschikbaar', bg: '#EC2127' },
}

export default function EventCard({
  id, naam, datum, beginUur, eindUur, plaats,
  minHulpverleners, aantalJa, isAdmin, myStatus,
}: Props) {
  const myStatusConfig = myStatus ? MY_STATUS_CONFIG[myStatus] : undefined
  const router = useRouter()
  const d = new Date(datum)
  const today = new Date(); today.setHours(0,0,0,0)
  const eventDay = new Date(d); eventDay.setHours(0,0,0,0)
  const isToday = eventDay.getTime() === today.getTime()
  const isTomorrow = eventDay.getTime() === today.getTime() + 86400000

  const genoeg = aantalJa >= minHulpverleners

  const dagLabel = isToday ? 'Vandaag'
    : isTomorrow ? 'Morgen'
    : d.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <button
      onClick={() => router.push(`/events/${id}`)}
      className="w-full text-left card hover:shadow-card-hover transition-shadow group mb-3"
    >
      <div className="flex items-center gap-4">
        {/* Datum blok */}
        <div className={`flex-shrink-0 w-16 text-center rounded-xl py-2 ${isToday ? 'bg-rkv-red text-white' : 'bg-rkv-gray text-rkv-teal-dark'}`}>
          <div className="text-2xl font-bold leading-tight">{d.getDate()}</div>
          <div className="text-xs font-medium uppercase">
            {d.toLocaleDateString('nl-BE', { month: 'short' })}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isToday && <span className="badge bg-rkv-red text-white text-xs">Vandaag</span>}
            {isTomorrow && <span className="badge bg-rkv-teal text-white text-xs">Morgen</span>}
            {myStatusConfig && (
              <span
                className="badge text-white text-xs rounded-full"
                style={{ backgroundColor: myStatusConfig.bg }}
              >
                {myStatusConfig.label}
              </span>
            )}
          </div>
          <h3 className="font-bold text-rkv-teal-dark text-base leading-tight truncate group-hover:text-rkv-red transition-colors">
            {naam}
          </h3>
          <p className="text-sm text-rkv-teal mt-0.5">
            🕐 {beginUur} – {eindUur} &nbsp;·&nbsp; 📍 {plaats}
          </p>
        </div>

        {/* Hulpverleners teller */}
        <div className="flex-shrink-0 text-right">
          <div
            className="text-lg font-bold"
            style={{ color: genoeg ? '#8CAA2E' : '#EC2127' }}
          >
            {aantalJa}/{minHulpverleners}
          </div>
          <div className="text-xs text-rkv-teal">aanwezig</div>
        </div>

        <span className="text-rkv-teal group-hover:text-rkv-red transition-colors">›</span>
      </div>
    </button>
  )
}
