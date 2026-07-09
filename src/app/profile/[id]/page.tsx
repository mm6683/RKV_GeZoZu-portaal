'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import VolunteerAvatar from '@/components/VolunteerAvatar'
import RankBadge from '@/components/RankBadge'
import { QUAL_BADGES } from '@/lib/ranks'

export default function ProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const [me, setMe]           = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notAllowed, setNotAllowed] = useState(false)

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/me')
      if (meRes.status === 401) { router.push('/login'); return }
      const meData = await meRes.json()
      setMe(meData)

      // Niet-admins worden doorgestuurd naar eigen profiel
      if (!meData.isAdmin && id !== meData.id) {
        setNotAllowed(true)
        setLoading(false)
        return
      }

      const profRes = await fetch(`/api/profile/${id}`)
      if (profRes.status === 403) { setNotAllowed(true); setLoading(false); return }
      if (!profRes.ok) { router.push('/dashboard'); return }
      setProfile(await profRes.json())
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
    </div>
  )

  if (notAllowed) return (
    <div className="min-h-screen bg-rkv-gray">
      {me && <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin={me.isAdmin} />}
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-xl font-bold text-rkv-teal-dark mb-2">Geen toegang</h1>
        <p className="text-rkv-teal mb-6">Je kan enkel je eigen profiel bekijken.</p>
        <button onClick={() => router.push(`/profile/${me?.id}`)} className="btn-blue">
          Mijn profiel bekijken
        </button>
      </div>
    </div>
  )

  if (!profile) return null

  const isOwnProfile = me?.id === profile.id
  const qualByType = profile.qualifications.reduce((acc: any, q: any) => {
    if (!acc[q.type]) acc[q.type] = []
    acc[q.type].push(q)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin={me.isAdmin} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Terug */}
        <button
          onClick={() => router.back()}
          className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red"
        >
          ‹ Terug
        </button>

        {/* ── Profielkaart ─────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-start gap-5">
            <VolunteerAvatar pfpUrl={profile.pfpUrl} naam={profile.volledigeNaam} size={80} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-rkv-teal-dark leading-tight">
                    {profile.volledigeNaam}
                  </h1>
                  {profile.displayName && profile.displayName !== profile.volledigeNaam && (
                    <p className="text-sm text-rkv-teal">"{profile.displayName}"</p>
                  )}
                  <p className="text-sm text-rkv-teal mt-0.5">{profile.hoofdentiteit}</p>
                </div>
                {me.isAdmin && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/admin/volunteers/${profile.id}`)}
                      className="btn-outline text-xs py-1.5"
                    >
                      ✏️ Bewerken
                    </button>
                    {me.id !== profile.id && (
                      <ResetPasswordButton volunteerId={profile.id} naam={profile.volledigeNaam} />
                    )}
                  </div>
                )}
              </div>

              {/* SB badge */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <RankBadge ranks={profile.ranks} size="lg" />
                {profile.isAdmin && (
                  <span className="badge bg-cta-blue text-white text-xs px-2.5 py-1">Admin</span>
                )}
                {profile.isExternal && (
                  <span className="badge bg-rkv-teal text-white text-xs px-2.5 py-1">Extern</span>
                )}
              </div>
            </div>
          </div>

          {/* Shift stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-rkv-gray rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-rkv-red">{profile.shiftenDitJaar}</div>
              <div className="text-xs text-rkv-teal mt-1">shifts dit jaar</div>
            </div>
            <div className="bg-rkv-gray rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-rkv-teal-dark">{profile.totalShiften}</div>
              <div className="text-xs text-rkv-teal mt-1">shifts totaal</div>
            </div>
          </div>
        </div>

        {/* ── Kwalificaties per type ────────────────────────────── */}
        {profile.qualifications.length > 0 && (
          <div className="card">
            <h2 className="section-title">Kwalificaties & Brevetten</h2>
            <div className="space-y-4">
              {(Object.keys(QUAL_BADGES) as any[]).map(type => {
                const items = qualByType[type]
                if (!items?.length) return null
                const cfg = QUAL_BADGES[type as keyof typeof QUAL_BADGES]
                return (
                  <div key={type}>
                    <div
                      className="text-xs font-bold uppercase tracking-wider mb-2 px-2 py-1 rounded-lg inline-block"
                      style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
                    >
                      {cfg.label}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((q: any) => (
                        <div key={q.id} className="flex items-center justify-between bg-rkv-gray rounded-lg px-3 py-2">
                          <span className="text-sm text-rkv-teal-dark font-medium">{q.naam}</span>
                          {q.geldigTot && (
                            <span className="text-xs text-rkv-teal">geldig tot {q.geldigTot}</span>
                          )}
                          {q.manualLock && (
                            <span className="text-[10px] text-rkv-red ml-2">🔒</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── RKV Functies ─────────────────────────────────────── */}
        {profile.functions.length > 0 && (
          <div className="card">
            <h2 className="section-title">RKV Functies</h2>
            <div className="space-y-2">
              {profile.functions.map((f: any) => (
                <div key={f.id} className="bg-rkv-gray rounded-lg px-3 py-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-rkv-teal-dark">{f.functie}</p>
                      {f.entiteit && (
                        <p className="text-xs text-rkv-teal mt-0.5">{f.entiteit}</p>
                      )}
                    </div>
                    {f.status && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        f.status === 'Actief' ? 'bg-rank-green/20 text-rank-green' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {f.status}
                      </span>
                    )}
                  </div>
                  {(f.startdatum || f.einddatum) && (
                    <p className="text-xs text-rkv-teal mt-1">
                      {f.startdatum} {f.einddatum ? `→ ${f.einddatum}` : '→ heden'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact (enkel eigen profiel of admin) ────────────── */}
        {(isOwnProfile || me.isAdmin) && (
          <div className="card">
            <h2 className="section-title">Contactinfo</h2>
            <div className="space-y-2">
              {profile.emailWerk && <ContactRow icon="✉️" label="E-mail werk" value={profile.emailWerk} />}
              {profile.gsm && <ContactRow icon="📱" label="GSM" value={profile.gsm} />}
              {profile.rkvId && <ContactRow icon="🪪" label="RKV ID" value={profile.rkvId} />}
            </div>
          </div>
        )}

        {/* ── Recente shifts ────────────────────────────────────── */}
        {profile.recentShiften.length > 0 && (
          <div className="card">
            <h2 className="section-title">Recente shifts</h2>
            <div className="space-y-1">
              {profile.recentShiften.map((s: any) => (
                <button
                  key={s.eventId}
                  onClick={() => router.push(`/events/${s.eventId}`)}
                  className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-rkv-gray text-left group"
                >
                  <div>
                    <span className="text-sm font-medium text-rkv-teal-dark group-hover:text-rkv-red transition-colors">
                      {s.naam}
                    </span>
                    <p className="text-xs text-rkv-teal">{s.plaats}</p>
                  </div>
                  <span className="text-xs text-rkv-teal flex-shrink-0">
                    {new Date(s.datum).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sync info (admin) */}
      </div>
    </div>
  )
}

function ContactRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base w-6 text-center">{icon}</span>
      <div>
        <p className="text-xs text-rkv-teal uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-rkv-teal-dark">{value}</p>
      </div>
    </div>
  )
}

function ResetPasswordButton({ volunteerId, naam }: { volunteerId: string; naam: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  async function handleReset() {
    if (!confirm(`Wachtwoord van ${naam} resetten? Ze moeten bij de volgende login een nieuw wachtwoord instellen.`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/volunteers/${volunteerId}/reset-password`, { method: 'POST' })
    if (res.ok) setDone(true)
    setLoading(false)
  }

  if (done) return (
    <span className="text-xs text-rank-green font-medium px-2 py-1.5 text-center">✓ Gereset</span>
  )

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-xs border-2 border-rkv-red text-rkv-red rounded-xl px-2 py-1.5 hover:bg-rkv-red hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? '…' : '🔑 Reset wachtwoord'}
    </button>
  )
}
