'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import VolunteerAvatar from '@/components/VolunteerAvatar'
import RankBadge from '@/components/RankBadge'
import StatusBadge from '@/components/StatusBadge'
import { RANK_ORDER, getRankConfig, getHighestRankIndex } from '@/lib/ranks'
import type { AttendStatus } from '@/types'

export default function EventDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [me, setMe]       = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showExternDropdown, setShowExternDropdown] = useState(false)
  const [externSearch, setExternSearch] = useState('')
  const [allVolunteers, setAllVolunteers] = useState<any[]>([])
  const [showRepeat, setShowRepeat] = useState(false)
  const [repeatDate, setRepeatDate] = useState('')
  const [repeating, setRepeating] = useState(false)
  const [repeatResult, setRepeatResult] = useState<any>(null)
  const [repeatError, setRepeatError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [meRes, evRes] = await Promise.all([fetch('/api/me'), fetch(`/api/events/${id}`)])
    if (meRes.status === 401) { router.push('/login'); return }
    setMe(await meRes.json())
    if (evRes.ok) setEvent(await evRes.json())
    setLoading(false)
  }

  async function loadExternals() {
    const res = await fetch('/api/admin/volunteers')
    const data = await res.json()
    setAllVolunteers(Array.isArray(data) ? data : [])
  }

  async function setStatus(volunteerId: string, status: AttendStatus) {
    setStatusLoading(volunteerId)
    await fetch(`/api/events/${id}/attendees`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId, status }),
    })
    await loadData()
    setStatusLoading(null)
  }

  async function addExtern(volunteerId: string) {
    await fetch(`/api/events/${id}/attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId }),
    })
    setShowExternDropdown(false)
    setExternSearch('')
    await loadData()
  }

  async function handleRepeat() {
    if (!repeatDate) return
    setRepeating(true); setRepeatError(null); setRepeatResult(null)
    const res = await fetch(`/api/events/${id}/repeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datum: repeatDate }),
    })
    const data = await res.json()
    if (res.ok) {
      setRepeatResult(data)
      setRepeatDate('')
    } else {
      setRepeatError(data.error || 'Herhalen mislukt.')
    }
    setRepeating(false)
  }

  async function handleCancel() {
    if (!confirm(`Ben je zeker dat je "${event?.naam}" wil annuleren? Het event wordt verplaatst naar de annulaties.`)) return
    setCancelling(true)
    await fetch(`/api/events/${id}/cancel`, { method: 'POST' })
    router.push('/dashboard')
  }

  async function removeExternal(volunteerId: string) {
    if (!confirm('Ben je zeker dat je deze externe vrijwilliger van het event wil verwijderen?')) return
    await fetch(`/api/events/${id}/attendees`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId }),
    })
    await loadData()
  }

  function downloadICS() {
    // Escape special characters for ICS text values
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

    // Fold a "PROP:value" line to the RFC 5545 75-octet limit.
    // Lines that aren't folded (and instead run on forever) are one of the
    // main reasons Google Calendar's single-file "open .ics" launcher
    // chokes with a generic error, even though the file still opens fine
    // in more forgiving tools/desktop apps.
    const fold = (line: string) => {
      const CRLF_SP = '\r\n '
      let out = ''
      let bytes = 0
      for (const ch of line) {
        const chLen = new TextEncoder().encode(ch).length
        if (bytes + chLen > 74) {
          out += CRLF_SP
          bytes = 0
        }
        out += ch
        bytes += chLen
      }
      return out
    }

    // Build DTSTART / DTEND — use eindDatum for end date so overnight events are correct.
    // These are wall-clock times, so they're tagged with TZID=Europe/Brussels (with the
    // matching VTIMEZONE block below) rather than left "floating" — floating times get
    // reinterpreted using whatever timezone the *viewing device* happens to be in.
    const startDateStr = event.datum.substring(0, 10).replace(/-/g, '')
    const endDateStr   = (event.eindDatum || event.datum).substring(0, 10).replace(/-/g, '')
    const dtStart = `${startDateStr}T${event.beginUur.replace(':', '')}00`
    const dtEnd   = `${endDateStr}T${event.eindUur.replace(':', '')}00`

    // DTSTAMP is a REQUIRED property on every VEVENT (RFC 5545 §3.6.1) — it's not the
    // event's start time, it's "when was this ICS generated". Google Calendar's launcher
    // is strict about this and fails silently (well — with "Failed to launch event")
    // when it's missing, which is exactly what was happening here.
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    // Build description with afspreekplaats + opmerkingen
    const descLines: string[] = []
    if (event.afspreekplaats) descLines.push(`Afspreekplaats: ${event.afspreekplaats}`)
    if (event.afspreekStraat || event.afspreekGemeente) {
      const adres = [
        event.afspreekStraat && event.afspreekNummer
          ? `${event.afspreekStraat} ${event.afspreekNummer}`
          : event.afspreekStraat,
        [event.afspreekPostcode, event.afspreekGemeente].filter(Boolean).join(', '),
      ].filter(Boolean).join(', ')
      if (adres) descLines.push(`Adres: ${adres}`)
    }
    if (event.opmerkingen) descLines.push(`\nOpmerkingen: ${event.opmerkingen}`)

    // Build location field
    const location = [event.plaats, event.afspreekGemeente].filter(Boolean).join(', ')

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RKV GeZoZu//GeZoZu Portaal//NL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      // Standard EU DST rule (last Sunday of March / last Sunday of October),
      // which also applies to Belgium — lets DTSTART/DTEND below use a TZID
      // safely without depending on the viewing calendar already knowing it.
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Brussels',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE',
      'BEGIN:VEVENT',
      `UID:${event.id}@gezozu.rodekruis.be`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART;TZID=Europe/Brussels:${dtStart}`,
      `DTEND;TZID=Europe/Brussels:${dtEnd}`,
      `SUMMARY:${esc(event.naam)}`,
      `DESCRIPTION:${esc(descLines.join('\n'))}`,
      `LOCATION:${esc(location)}`,
      'ORGANIZER;CN=Rode Kruis Vlaanderen:mailto:noreply@rodekruis.be',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ]

    // Fold every content line, then join with CRLF and end with a trailing
    // CRLF — both are required by the spec and some parsers are strict about it.
    const ics = lines.map(fold).join('\r\n') + '\r\n'

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${event.naam.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-rkv-gray flex items-center justify-center">
      <p className="text-rkv-teal">Event niet gevonden of geen toegang.</p>
    </div>
  )

  const datum     = new Date(event.datum)
  const eindDatum = event.eindDatum ? new Date(event.eindDatum) : datum
  const isOvernight = eindDatum.toDateString() !== datum.toDateString()
  const myAttendance = event.attendees?.find((a: any) => a.volunteerId === me?.id)
  const sortByMeThenAvailable = (a: any, b: any) => {
    const aIsMe = a.volunteerId === me?.id
    const bIsMe = b.volunteerId === me?.id
    if (aIsMe !== bIsMe) return aIsMe ? -1 : 1
    const aAvailable = a.status === 'JA'
    const bAvailable = b.status === 'JA'
    if (aAvailable !== bAvailable) return aAvailable ? -1 : 1
    return 0
  }
  const intern = (event.attendees?.filter((a: any) => !a.isExternal) ?? []).slice().sort(sortByMeThenAvailable)
  const extern = (event.attendees?.filter((a: any) => a.isExternal) ?? []).slice().sort(sortByMeThenAvailable)
  const filteredVolunteers = allVolunteers.filter(v =>
    !event.attendees?.find((a: any) => a.volunteerId === v.id) &&
    v.volledigeNaam.toLowerCase().includes(externSearch.toLowerCase())
  )

  // Adres samengesteld voor kaart
  const adresParts = [
    event.afspreekStraat && event.afspreekNummer
      ? `${event.afspreekStraat} ${event.afspreekNummer}`
      : event.afspreekStraat,
    event.afspreekPostcode,
    event.afspreekGemeente,
    'België',
  ].filter(Boolean).join(', ')
  const mapsUrl = adresParts && adresParts !== 'België'
    ? `https://maps.google.com/maps?q=${encodeURIComponent(adresParts)}&output=embed`
    : null

  // Minimum SB controle — hoogste van je SB's telt mee
  const myRankIndex  = getHighestRankIndex(me?.ranks)
  const minRankIndex = event.minRank ? RANK_ORDER.indexOf(event.minRank) : -1
  const isBelowMinRank = !me?.isAdmin && !myAttendance && minRankIndex >= 0 && myRankIndex < minRankIndex

  // Status knoppen: JA | ONBESCHIKBAAR | RESERVE (reserve rechts)
  const STATUS_BTNS: { status: AttendStatus; label: string; activeColor: string }[] = [
    { status: 'JA',            label: '✓ Aanwezig',     activeColor: '#8CAA2E' },
    { status: 'ONBESCHIKBAAR', label: '✗ Onbeschikbaar', activeColor: '#EC2127' },
    { status: 'RESERVE',       label: '● Reserve',       activeColor: '#81A6AB' },
  ]

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me?.volledigeNaam} pfpUrl={me?.pfpUrl} isAdmin={me?.isAdmin} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <button onClick={() => router.push('/dashboard')} className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red">
          ‹ Terug
        </button>

        {/* ── Event info ──────────────────────────────────────── */}
        <div className="card">
          {event.isCancelled && (
            <div className="bg-rkv-red/10 border border-rkv-red/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-rkv-red font-bold">⚠️ Dit event is geannuleerd</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 bg-cta-blue text-white text-sm font-medium rounded-lg px-3 py-1 mb-3">
                📅 {datum.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h1 className="text-2xl font-bold text-rkv-teal-dark">{event.naam}</h1>
            </div>
            {me?.isAdmin && !event.isCancelled && (
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => router.push(`/admin/events/${id}/edit`)} className="btn-outline text-sm">
                  ✏️ Bewerken
                </button>
                <button onClick={() => setShowRepeat(s => !s)} className="text-sm border-2 border-cta-blue text-cta-blue px-3 py-1.5 rounded-xl hover:bg-cta-blue hover:text-white transition-colors">
                  🔁 Herhalen
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-sm border-2 border-rkv-red text-rkv-red px-3 py-1.5 rounded-xl hover:bg-rkv-red hover:text-white transition-colors"
                >
                  {cancelling ? '…' : '✕ Annuleren'}
                </button>
              </div>
            )}
          </div>

          {/* Event herhalen naar andere datum */}
          {showRepeat && !event.isCancelled && (
            <div className="mt-4 bg-rkv-gray rounded-xl p-4 space-y-3">
              <p className="text-xs text-rkv-teal">
                Maakt een kopie van dit event op een nieuwe datum, met dezelfde tijden, locatie en instellingen.
              </p>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="label">Nieuwe datum</label>
                  <input type="date" className="input" value={repeatDate}
                    onChange={e => setRepeatDate(e.target.value)} />
                </div>
                <button onClick={handleRepeat} disabled={repeating || !repeatDate} className="btn-blue text-sm py-3">
                  {repeating ? 'Bezig…' : 'Dupliceren'}
                </button>
              </div>
              {repeatError && <p className="text-sm text-rkv-red">⚠️ {repeatError}</p>}
              {repeatResult && (
                <div className="bg-rank-green/10 border border-rank-green/30 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-3">
                  <span className="text-rkv-teal-dark">
                    ✓ Event gedupliceerd naar {new Date(repeatResult.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => router.push(`/events/${repeatResult.id}`)} className="text-cta-blue font-medium hover:underline whitespace-nowrap">
                    Bekijken →
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <InfoRow icon="🕐" label="Tijdstip"
              value={isOvernight
                ? `${event.beginUur} – ${eindDatum.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })} ${event.eindUur}`
                : `${event.beginUur} – ${event.eindUur}`} />
            <InfoRow icon="📍" label="Locatie" value={event.plaats} />
            <InfoRow icon="👥" label="Min. hulpverleners"
              value={`${event.aantalJa} / ${event.minHulpverleners}`}
              color={event.aantalJa >= event.minHulpverleners ? '#8CAA2E' : '#EC2127'} />
            {event.minRank && (
              <InfoRow icon="🎖️" label="Minimum SB"
                value={getRankConfig(event.minRank).label}
                color={getRankConfig(event.minRank).color} />
            )}
            {event.afspreekplaats && (
              <InfoRow icon="🚐" label="Afspreekplaats" value={event.afspreekplaats} />
            )}
          </div>

          {/* Adres afspreekplaats */}
          {(event.afspreekStraat || event.afspreekGemeente) && (
            <div className="mt-3 bg-rkv-gray rounded-xl px-4 py-3">
              <p className="text-xs text-rkv-teal uppercase tracking-wide mb-1">📮 Adres afspreekplaats</p>
              <p className="text-sm font-medium text-rkv-teal-dark">
                {[event.afspreekStraat, event.afspreekNummer].filter(Boolean).join(' ')}
                {event.afspreekStraat && (event.afspreekPostcode || event.afspreekGemeente) && ', '}
                {[event.afspreekPostcode, event.afspreekGemeente].filter(Boolean).join(' ')}
              </p>
            </div>
          )}

          {/* Kaart */}
          {mapsUrl && (
            <div className="mt-4 rounded-xl overflow-hidden border border-rkv-gray-mid">
              <iframe title="Afspreekplaats" width="100%" height="200" loading="lazy"
                src={mapsUrl} className="border-0" />
            </div>
          )}

          {event.opmerkingen && (
            <div className="mt-4 bg-rkv-gray rounded-xl p-4">
              <p className="text-xs font-medium text-rkv-teal uppercase tracking-wide mb-1">Opmerkingen</p>
              <p className="text-sm text-rkv-teal-dark">{event.opmerkingen}</p>
            </div>
          )}

          {/* Opslaan in agenda */}
          <div className="mt-4 pt-4 border-t border-rkv-gray flex justify-end">
            <button
              onClick={downloadICS}
              className="flex items-center gap-2 text-sm font-medium text-rkv-teal hover:text-rkv-red transition-colors"
            >
              <span className="text-base">📅</span> Opslaan in agenda
            </button>
          </div>
        </div>

        {/* ── Mijn beschikbaarheid ─────────────────────────────── */}
        {myAttendance && !event.isCancelled && (
          <div className="card">
            <h2 className="section-title">Mijn beschikbaarheid</h2>
            <div className="flex gap-2">
              {STATUS_BTNS.map(({ status, label, activeColor }) => {
                const isActive = myAttendance.status === status
                return (
                  <button key={status}
                    disabled={statusLoading === me.id}
                    onClick={() => setStatus(me.id, status)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border-2"
                    style={isActive
                      ? { backgroundColor: activeColor, borderColor: activeColor, color: '#fff' }
                      : { borderColor: '#c5cdd5', color: '#223A3C' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Melding: SB te laag ──────────────────────────────── */}
        {isBelowMinRank && !event.isCancelled && (
          <div className="card" style={{ backgroundColor: '#fffbeb', borderColor: '#f3a400', border: '1px solid' }}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#92400e' }}>
                  Je SB voldoet niet aan de minimumvereiste
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#b45309' }}>
                  Dit event vereist minimum SB{' '}
                  <strong style={{ color: getRankConfig(event.minRank).color }}>
                    {getRankConfig(event.minRank).label}
                  </strong>
                  . Je staat niet op de deelnemerslijst en kunt je beschikbaarheid niet invullen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Hulpverleners ────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Hulpverleners GeZoZu</h2>
            {me?.isAdmin && !event.isCancelled && (
              <div className="relative">
                <button onClick={() => { setShowExternDropdown(!showExternDropdown); if (!allVolunteers.length) loadExternals() }}
                  className="btn-outline text-xs py-1.5">
                  + Externe toevoegen
                </button>
                {showExternDropdown && (
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-card-hover w-72 z-50 border border-rkv-gray-mid">
                    <div className="p-2 border-b border-rkv-gray">
                      <input className="input text-sm py-2" placeholder="🔍 Zoek vrijwilliger..."
                        value={externSearch} onChange={e => setExternSearch(e.target.value)} autoFocus />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredVolunteers.slice(0, 10).map(v => (
                        <button key={v.id} onClick={() => addExtern(v.id)}
                          className="w-full text-left px-3 py-2 hover:bg-rkv-gray flex items-center gap-2 text-sm">
                          <VolunteerAvatar pfpUrl={v.pfpUrl} naam={v.volledigeNaam} size={28} />
                          <div>
                            <div className="font-medium text-rkv-teal-dark">{v.volledigeNaam}</div>
                            <div className="text-xs text-rkv-teal">{v.hoofdentiteit}</div>
                          </div>
                        </button>
                      ))}
                      <button onClick={() => router.push('/admin/volunteers/create')}
                        className="w-full text-left px-3 py-2.5 text-rkv-red text-sm font-medium border-t border-rkv-gray hover:bg-rkv-gray">
                        + Nieuwe vrijwilliger toevoegen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {intern.map((a: any) => (
              <AttendeeRow key={a.volunteerId} attendee={a}
                isMe={a.volunteerId === me?.id} isAdmin={me?.isAdmin}
                loading={statusLoading === a.volunteerId} disabled={!!event.isCancelled}
                onStatusChange={s => setStatus(a.volunteerId, s)} />
            ))}
          </div>

          {extern.length > 0 && (
            <>
              <div className="mt-4 mb-2 text-xs font-medium text-rkv-teal uppercase tracking-wide">
                Externe vrijwilligers
              </div>
              <div className="space-y-2">
                {extern.map((a: any) => (
                  <AttendeeRow key={a.volunteerId} attendee={a}
                    isMe={a.volunteerId === me?.id} isAdmin={me?.isAdmin}
                    loading={statusLoading === a.volunteerId} disabled={!!event.isCancelled}
                    onStatusChange={s => setStatus(a.volunteerId, s)}
                    onRemove={me?.isAdmin && !event.isCancelled ? () => removeExternal(a.volunteerId) : undefined} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-rkv-teal uppercase tracking-wide mb-0.5">{icon} {label}</p>
      <p className="text-sm font-semibold text-rkv-teal-dark" style={color ? { color } : {}}>{value}</p>
    </div>
  )
}

function AttendeeRow({ attendee: a, isMe, isAdmin, loading, disabled, onStatusChange, onRemove }: {
  attendee: any; isMe: boolean; isAdmin: boolean; loading: boolean
  disabled: boolean; onStatusChange: (s: AttendStatus) => void; onRemove?: () => void
}) {
  const STATUS_BTNS: { status: AttendStatus; label: string; activeColor: string }[] = [
    { status: 'JA',            label: '✓', activeColor: '#8CAA2E' },
    { status: 'ONBESCHIKBAAR', label: '✗', activeColor: '#EC2127' },
    { status: 'RESERVE',       label: '●', activeColor: '#81A6AB' },
  ]

  const canEdit = !disabled && (isMe || isAdmin)

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isMe ? 'bg-rkv-red/5 ring-1 ring-rkv-red/20' : 'hover:bg-rkv-gray'}`}>
      <VolunteerAvatar pfpUrl={a.pfpUrl} naam={a.volledigeNaam} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-rkv-teal-dark truncate">
            {a.displayName || a.volledigeNaam}
          </span>
          {isMe && <span className="text-xs text-rkv-red font-medium">(jij)</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <RankBadge ranks={a.ranks} size="sm" />
          <span className="text-xs text-rkv-teal">{a.hoofdentiteit}</span>
        </div>
      </div>

      {canEdit ? (
        <div className="flex gap-1 items-center">
          {STATUS_BTNS.map(({ status, label, activeColor }) => {
            const isActive = a.status === status
            return (
              <button key={status} disabled={loading} onClick={() => onStatusChange(status)}
                title={status}
                className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                style={isActive
                  ? { backgroundColor: activeColor, color: '#fff' }
                  : { backgroundColor: '#EEF1F4', color: '#223A3C' }}>
                {label}
              </button>
            )
          })}
          {onRemove && (
            <button
              onClick={onRemove}
              title="Externe vrijwilliger verwijderen"
              className="w-7 h-7 rounded-lg text-xs font-bold transition-all ml-1"
              style={{ backgroundColor: '#FEE2E2', color: '#EC2127' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#EC2127'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FEE2E2'; (e.currentTarget as HTMLButtonElement).style.color = '#EC2127' }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <StatusBadge status={a.status} compact />
      )}
    </div>
  )
}
