'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import VolunteerAvatar from '@/components/VolunteerAvatar'
import RankBadge from '@/components/RankBadge'

export default function AdminPage() {
  const router = useRouter()
  const [me, setMe]               = useState<any>(null)
  const [volunteers, setVols]     = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<'all' | 'gezozu' | 'extern'>('gezozu')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [meRes, volsRes] = await Promise.all([
      fetch('/api/me'),
      fetch('/api/admin/volunteers'),
    ])
    if (meRes.status === 401) { router.push('/login'); return }
    const meData = await meRes.json()
    if (!meData.isAdmin) { router.push('/dashboard'); return }
    setMe(meData)
    setVols(await volsRes.json())
    setLoading(false)
  }

  const filtered = volunteers.filter(v => {
    const matchSearch = v.volledigeNaam.toLowerCase().includes(search.toLowerCase())
      || v.rkvId.includes(search)
    const matchFilter = filter === 'all' ? true
      : filter === 'extern' ? v.isExternal
      : !v.isExternal
    return matchSearch && matchFilter
  })

  if (loading) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
  </div>

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-rkv-teal-dark">Admin paneel</h1>
          <button onClick={() => router.push('/admin/volunteers/create')} className="btn-blue text-sm">
            + Vrijwilliger toevoegen
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'GeZoZu', value: volunteers.filter(v => !v.isExternal).length, color: 'text-rkv-teal-dark' },
            { label: 'Externen', value: volunteers.filter(v => v.isExternal).length, color: 'text-rkv-teal' },
            { label: 'Admins', value: volunteers.filter(v => v.isAdmin).length, color: 'text-rkv-red' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-rkv-teal mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Zoek + filter */}
        <div className="card">
          <div className="flex gap-3 mb-4">
            <input
              className="input flex-1"
              placeholder="🔍 Zoek op naam of RKV ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'gezozu', 'extern'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-cta-blue text-white' : 'bg-rkv-gray text-rkv-teal hover:bg-rkv-gray-mid'
                }`}
              >
                {f === 'all' ? 'Alle' : f === 'gezozu' ? 'GeZoZu' : 'Externen'}
              </button>
            ))}
          </div>
        </div>

        {/* Lijst */}
        <div className="space-y-2">
          {filtered.map(v => (
            <button
              key={v.id}
              onClick={() => router.push(`/admin/volunteers/${v.id}`)}
              className="w-full card hover:shadow-card-hover transition-shadow text-left group"
            >
              <div className="flex items-center gap-3">
                <VolunteerAvatar pfpUrl={v.pfpUrl} naam={v.volledigeNaam} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-rkv-teal-dark group-hover:text-rkv-red transition-colors">
                      {v.volledigeNaam}
                    </span>
                    {v.isAdmin && <span className="badge bg-cta-blue text-white text-xs">Admin</span>}
                    {v.isExternal && <span className="badge bg-rkv-teal text-white text-xs">Extern</span>}
                    {v.isBlocked && <span className="badge bg-gray-400 text-white text-xs">Geblokkeerd</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-rkv-teal">{v.rkvId}</span>
                    <span className="text-rkv-teal-dark/30">·</span>
                    <span className="text-xs text-rkv-teal">{v.hoofdentiteit}</span>
                    {v.rank && (
                      <>
                        <span className="text-rkv-teal-dark/30">·</span>
                        <RankBadge rank={v.rank} size="sm" />
                      </>
                    )}
                  </div>
                </div>
                <span className="text-rkv-teal group-hover:text-rkv-red transition-colors">›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
