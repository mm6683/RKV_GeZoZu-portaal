'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function ArchivePage() {
  const router = useRouter()
  const [me, setMe]           = useState<any>(null)
  const [byYear, setByYear]   = useState<Record<number, any[]>>({})
  const [annulaties, setAnn]  = useState<any[]>([])
  const [tab, setTab]         = useState<'archief' | 'annulaties'>('archief')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/me')
      if (meRes.status === 401) { router.push('/login'); return }
      const meData = await meRes.json()
      if (!meData.isAdmin) { router.push('/dashboard'); return }
      setMe(meData)
      const res = await fetch('/api/admin/archive')
      const data = await res.json()
      setByYear(data.byYear || {})
      setAnn(data.annulaties || [])
      setLoading(false)
    }
    load()
  }, [])

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
    </div>
  )

  const EventRow = ({ e }: { e: any }) => (
    <button key={e.id} onClick={() => router.push(`/events/${e.id}`)}
      className="w-full card hover:shadow-card-hover transition-shadow text-left group">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-14 text-center bg-rkv-gray rounded-xl py-2">
          <div className="text-xl font-bold text-rkv-teal-dark leading-tight">
            {new Date(e.datum).getDate()}
          </div>
          <div className="text-xs text-rkv-teal capitalize">
            {new Date(e.datum).toLocaleDateString('nl-BE', { month: 'short' })}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-rkv-teal-dark truncate group-hover:text-rkv-red transition-colors">
              {e.naam}
            </p>
            {e.isCancelled && (
              <span className="badge bg-rkv-red text-white text-xs flex-shrink-0">Geannuleerd</span>
            )}
          </div>
          <p className="text-sm text-rkv-teal">
            {e.beginUur} – {e.eindUur} · {e.plaats}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-rkv-teal-dark">{e.aantalJa} aanwezig</p>
          <p className="text-xs text-rkv-teal">
            {new Date(e.datum).getFullYear()}
          </p>
        </div>
      </div>
    </button>
  )

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="text-rkv-teal text-sm hover:text-rkv-red">
            ‹ Admin
          </button>
          <h1 className="text-2xl font-bold text-rkv-teal-dark">Archief</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-rkv-gray-mid overflow-hidden w-fit">
          <button onClick={() => setTab('archief')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${tab === 'archief' ? 'bg-rkv-red text-white' : 'text-rkv-teal hover:bg-rkv-gray'}`}>
            Voorbije events
          </button>
          <button onClick={() => setTab('annulaties')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'annulaties' ? 'bg-rkv-red text-white' : 'text-rkv-teal hover:bg-rkv-gray'}`}>
            Annulaties
            {annulaties.length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === 'annulaties' ? 'bg-white/30' : 'bg-rkv-red text-white'}`}>
                {annulaties.length}
              </span>
            )}
          </button>
        </div>

        {/* Archief tab */}
        {tab === 'archief' && (
          <>
            {years.length === 0 ? (
              <div className="card text-center text-rkv-teal py-10">
                <p className="text-3xl mb-3">📦</p>
                <p>Nog geen gearchiveerde events.</p>
              </div>
            ) : (
              years.map(year => (
                <div key={year}>
                  <h2 className="text-base font-bold text-rkv-teal-dark mb-3 flex items-center gap-2">
                    <span className="bg-rkv-teal-dark text-white text-sm px-2.5 py-0.5 rounded-full">{year}</span>
                    <span className="text-sm text-rkv-teal font-normal">{byYear[year].length} events</span>
                  </h2>
                  <div className="space-y-2">
                    {byYear[year].map(e => <EventRow key={e.id} e={e} />)}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Annulaties tab */}
        {tab === 'annulaties' && (
          <>
            {annulaties.length === 0 ? (
              <div className="card text-center text-rkv-teal py-10">
                <p className="text-3xl mb-3">✅</p>
                <p>Geen geannuleerde events.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {annulaties.map(e => <EventRow key={e.id} e={e} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
