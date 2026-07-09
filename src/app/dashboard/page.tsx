'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import EventCard from '@/components/EventCard'
import RankBadge from '@/components/RankBadge'
import VolunteerAvatar from '@/components/VolunteerAvatar'
import Collapsible from '@/components/Collapsible'

type View = 'list' | 'calendar'

export default function Dashboard() {
  const router = useRouter()
  const [me, setMe]         = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [view, setView]     = useState<View>('list')
  const [calMonth, setCalMonth] = useState(new Date())
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const [meRes, evRes] = await Promise.all([fetch('/api/me'), fetch('/api/events')])
      if (meRes.status === 401) { router.push('/login'); return }
      const meData = await meRes.json()
      const evData = await evRes.json()
      setMe(meData)
      setEvents(Array.isArray(evData) ? evData : [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin mx-auto" />
    </div>
  )

  const monthName = new Date().toLocaleDateString('nl-BE', { month: 'long' })
  const { thisMonth, otherGroups, curYear } = groupEventsByMonth(events)

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin={me.isAdmin} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Profielkaart ─────────────────────────────────────── */}
        <div className="card cursor-pointer hover:shadow-card-hover transition-shadow"
          onClick={() => router.push(`/profile/${me.id}`)}>
          <div className="flex items-center gap-5">
            <VolunteerAvatar pfpUrl={me.pfpUrl} naam={me.volledigeNaam} size={72} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-rkv-teal-dark truncate">{me.volledigeNaam}</h1>
              <p className="text-sm text-rkv-teal mt-0.5">{me.hoofdentiteit}</p>
              <div className="mt-2">
                <RankBadge ranks={me.ranks} size="md" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-rkv-gray rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-rkv-red">{me.shiftenDitJaar}</div>
              <div className="text-xs text-rkv-teal mt-1">shifts dit jaar</div>
            </div>
            <div className="bg-rkv-gray rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-rkv-teal-dark">{thisMonth.length}</div>
              <div className="text-xs text-rkv-teal mt-1">events deze maand</div>
            </div>
          </div>
        </div>

        {/* ── Events sectie ────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title mb-0">Opkomende evenementen</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white rounded-xl border border-rkv-gray-mid overflow-hidden">
                <button onClick={() => setView('list')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'list' ? 'bg-cta-blue text-white' : 'text-rkv-teal hover:bg-rkv-gray'}`}>
                  Lijst
                </button>
                <button onClick={() => setView('calendar')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'calendar' ? 'bg-cta-blue text-white' : 'text-rkv-teal hover:bg-rkv-gray'}`}>
                  Kalender
                </button>
              </div>
              {me.isAdmin && (
                <button onClick={() => router.push('/admin/events/create')} className="btn-blue text-sm py-1.5 px-3">
                  + Nieuw event
                </button>
              )}
            </div>
          </div>

          {view === 'list' ? (
            <div className="space-y-3">
              <Collapsible title={`Deze maand (${monthName})`} count={thisMonth.length} defaultOpen>
                {thisMonth.length === 0 ? (
                  <p className="text-sm text-rkv-teal text-center py-6 capitalize">Geen events gepland voor {monthName}.</p>
                ) : (
                  thisMonth.map(e => <EventCard key={e.id} {...e} isAdmin={me.isAdmin} />)
                )}
              </Collapsible>

              {otherGroups.length > 0 && (
                <Collapsible title="Opkomende maanden" count={otherGroups.reduce((n, g) => n + g.events.length, 0)}>
                  {(() => {
                    let lastYearShown: number | null = null
                    return otherGroups.map(g => {
                      const showYearHeader = g.year !== curYear && lastYearShown !== g.year
                      if (showYearHeader) lastYearShown = g.year
                      const monthLabel = new Date(g.year, g.month, 1).toLocaleDateString('nl-BE', { month: 'long' })
                      return (
                        <div key={`${g.year}-${g.month}`}>
                          {showYearHeader && (
                            <div className="text-sm font-bold text-rkv-teal-dark mt-4 mb-2 first:mt-0">{g.year}</div>
                          )}
                          <div className="text-xs font-semibold text-rkv-teal uppercase tracking-wide mb-2 mt-3 first:mt-0">
                            {monthLabel}:
                          </div>
                          <div className="space-y-2">
                            {g.events.map(e => <EventCard key={e.id} {...e} isAdmin={me.isAdmin} />)}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </Collapsible>
              )}
            </div>
          ) : (
            <CalendarView events={events} month={calMonth}
              onMonthChange={setCalMonth}
              onEventClick={id => router.push(`/events/${id}`)} />
          )}

          {me.isAdmin && (
            <button onClick={() => router.push('/admin/archive')}
              className="w-full mt-4 py-2.5 text-sm text-rkv-teal hover:text-rkv-red transition-colors text-center">
              📦 Archief & annulaties bekijken
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Groepeert events in "deze maand" + alle andere (toekomstige) maanden,
// gesorteerd chronologisch. Andere jaren dan het huidige jaar krijgen een
// jaar-header (bv. "2027"), de rest toont enkel de maandnaam.
function groupEventsByMonth(events: any[]) {
  const now = new Date()
  const curYear = now.getFullYear(), curMonth = now.getMonth()

  const thisMonth: any[] = []
  const otherMap = new Map<string, { year: number; month: number; events: any[] }>()

  for (const e of events) {
    const d = new Date(e.datum)
    const y = d.getFullYear(), m = d.getMonth()
    if (y === curYear && m === curMonth) {
      thisMonth.push(e)
    } else {
      const key = `${y}-${m}`
      if (!otherMap.has(key)) otherMap.set(key, { year: y, month: m, events: [] })
      otherMap.get(key)!.events.push(e)
    }
  }

  const otherGroups = Array.from(otherMap.values()).sort((a, b) => a.year - b.year || a.month - b.month)
  return { thisMonth, otherGroups, curYear }
}

function CalendarView({ events, month, onMonthChange, onEventClick }: {
  events: any[]; month: Date
  onMonthChange: (d: Date) => void; onEventClick: (id: string) => void
}) {
  const year = month.getFullYear(), mon = month.getMonth()
  const first = new Date(year, mon, 1), last = new Date(year, mon + 1, 0)
  const days: (Date | null)[] = []
  const startDay = (first.getDay() + 6) % 7
  for (let i = 0; i < startDay; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, mon, d))

  const eventsByDay: Record<string, any[]> = {}
  for (const e of events) {
    const key = new Date(e.datum).toDateString()
    if (!eventsByDay[key]) eventsByDay[key] = []
    eventsByDay[key].push(e)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onMonthChange(new Date(year, mon - 1))} className="btn-ghost px-2">‹</button>
        <span className="font-bold text-rkv-teal-dark capitalize">
          {month.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => onMonthChange(new Date(year, mon + 1))} className="btn-ghost px-2">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Ma','Di','Wo','Do','Vr','Za','Zo'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-rkv-teal py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />
          const key = day.toDateString()
          const evs = eventsByDay[key] || []
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div key={i} className={`min-h-[52px] rounded-lg p-1 ${isToday ? 'bg-rkv-red/10 ring-2 ring-rkv-red' : 'hover:bg-rkv-gray'}`}>
              <div className={`text-xs font-medium text-center mb-0.5 ${isToday ? 'text-rkv-red font-bold' : 'text-rkv-teal-dark'}`}>
                {day.getDate()}
              </div>
              {evs.slice(0, 2).map(e => (
                <button key={e.id} onClick={() => onEventClick(e.id)}
                  className="w-full text-left text-[10px] bg-cta-blue text-white rounded px-1 py-0.5 mb-0.5 truncate leading-tight hover:bg-rkv-red-dark"
                  title={e.naam}>{e.naam}</button>
              ))}
              {evs.length > 2 && <div className="text-[10px] text-rkv-teal text-center">+{evs.length - 2}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
