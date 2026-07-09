'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { RANK_ORDER, getRankConfig } from '@/lib/ranks'

export default function EditEventPage() {
  const router = useRouter()
  const { id } = useParams()
  const [me, setMe]         = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [form, setForm]     = useState<any>(null)

  useEffect(() => {
    async function load() {
      const [meRes, evRes] = await Promise.all([fetch('/api/me'), fetch(`/api/events/${id}`)])
      if (meRes.status === 401) { router.push('/login'); return }
      const meData = await meRes.json()
      if (!meData.isAdmin) { router.push('/dashboard'); return }
      setMe(meData)
      const ev = await evRes.json()
      const d = new Date(ev.datum)
      setForm({
        naam: ev.naam, datum: d.toISOString().split('T')[0],
        beginUur: ev.beginUur, eindUur: ev.eindUur, plaats: ev.plaats,
        afspreekplaats: ev.afspreekplaats || '', afspreekStraat: ev.afspreekStraat || '',
        afspreekNummer: ev.afspreekNummer || '', afspreekPostcode: ev.afspreekPostcode || '',
        afspreekGemeente: ev.afspreekGemeente || '',
        minHulpverleners: ev.minHulpverleners.toString(),
        minRank: ev.minRank || '',
        eindDatum: ev.eindDatum
          ? new Date(ev.eindDatum).toISOString().split('T')[0]
          : d.toISOString().split('T')[0],
        opmerkingen: ev.opmerkingen || '', isActief: ev.isActief,
      })
    }
    load()
  }, [id])

  function set(field: string, value: any) {
    setForm((f: any) => {
      const updated = { ...f, [field]: value }

      // Sync end date when start date changes (if they were on the same day)
      if (field === 'datum' && typeof value === 'string') {
        if (!f.eindDatum || f.eindDatum === f.datum) updated.eindDatum = value
      }

      // Auto-advance end date to next day when end time is before start time on the same day
      if ((field === 'eindUur' || field === 'beginUur') && typeof value === 'string') {
        if (updated.beginUur && updated.eindUur && updated.eindUur < updated.beginUur && updated.eindDatum === updated.datum) {
          const d = new Date(updated.datum + 'T12:00:00')
          d.setDate(d.getDate() + 1)
          updated.eindDatum = d.toISOString().split('T')[0]
        }
      }

      return updated
    })
  }

  function mapsEmbedUrl() {
    const parts = [
      form?.afspreekStraat && form?.afspreekNummer ? `${form.afspreekStraat} ${form.afspreekNummer}` : form?.afspreekStraat,
      form?.afspreekPostcode, form?.afspreekGemeente, 'België',
    ].filter(Boolean).join(', ')
    if (!parts.trim() || parts === 'België') return null
    return `https://maps.google.com/maps?q=${encodeURIComponent(parts)}&output=embed`
  }

  async function handleSave() {
    if (!form.naam || !form.datum || !form.beginUur || !form.eindUur || !form.plaats) {
      setError('Vul alle verplichte velden in.'); return
    }
    setSaving(true); setError(null)
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        naam: form.naam, datum: form.datum, beginUur: form.beginUur, eindUur: form.eindUur,
        eindDatum: form.eindDatum || form.datum,
        plaats: form.plaats, afspreekplaats: form.afspreekplaats || null,
        afspreekStraat: form.afspreekStraat || null, afspreekNummer: form.afspreekNummer || null,
        afspreekPostcode: form.afspreekPostcode || null, afspreekGemeente: form.afspreekGemeente || null,
        minHulpverleners: parseInt(form.minHulpverleners),
        minRank: form.minRank || null,
        opmerkingen: form.opmerkingen || null, isActief: form.isActief,
      }),
    })
    if (res.ok) router.push(`/events/${id}`)
    else { setError('Opslaan mislukt.'); setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('Ben je zeker dat je dit event wil archiveren?')) return
    setDeleting(true)
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  const embedUrl = form ? mapsEmbedUrl() : null

  if (!form) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
  </div>

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me?.volledigeNaam} pfpUrl={me?.pfpUrl} isAdmin />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <button onClick={() => router.push(`/events/${id}`)} className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red">
          ‹ Terug naar event
        </button>
        <h1 className="text-2xl font-bold text-rkv-teal-dark">Event bewerken</h1>

        <div className="card space-y-4">
          <h2 className="section-title">Eventinformatie</h2>
          <div>
            <label className="label">Naam <span className="text-rkv-red">*</span></label>
            <input className="input" value={form.naam} onChange={e => set('naam', e.target.value)} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="label">Datum <span className="text-rkv-red">*</span></label>
              <input className="input" type="date" value={form.datum} onChange={e => set('datum', e.target.value)} />
            </div>
            <div>
              <label className="label">Begin <span className="text-rkv-red">*</span></label>
              <input className="input" type="time" value={form.beginUur} onChange={e => set('beginUur', e.target.value)} />
            </div>
            <div>
              <label className="label">Einddatum <span className="text-rkv-red">*</span></label>
              <input className="input" type="date" value={form.eindDatum} min={form.datum || undefined}
                onChange={e => set('eindDatum', e.target.value)} />
            </div>
            <div>
              <label className="label">Einde <span className="text-rkv-red">*</span></label>
              <input className="input" type="time" value={form.eindUur} onChange={e => set('eindUur', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Evenementlocatie <span className="text-rkv-red">*</span></label>
              <input className="input" value={form.plaats} onChange={e => set('plaats', e.target.value)} />
            </div>
            <div>
              <label className="label">Min. hulpverleners</label>
              <input className="input" type="number" min="1" value={form.minHulpverleners} onChange={e => set('minHulpverleners', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Minimum SB</label>
            <p className="text-xs text-rkv-teal mb-1.5">
              Vrijwilligers onder deze SB worden niet op de lijst geplaatst en kunnen hun beschikbaarheid niet invullen.
            </p>
            <select
              className="input"
              value={form.minRank}
              onChange={e => set('minRank', e.target.value)}
            >
              <option value="">(Geen beperking)</option>
              {RANK_ORDER.map(rank => (
                <option key={rank} value={rank}>
                  {getRankConfig(rank).label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="section-title">Afspreekplaats</h2>
          <div>
            <label className="label">Omschrijving</label>
            <input className="input" placeholder="bv. Parking Lidl Genk" value={form.afspreekplaats} onChange={e => set('afspreekplaats', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Straat</label>
              <input className="input" value={form.afspreekStraat} onChange={e => set('afspreekStraat', e.target.value)} />
            </div>
            <div>
              <label className="label">Nummer</label>
              <input className="input" value={form.afspreekNummer} onChange={e => set('afspreekNummer', e.target.value)} />
            </div>
            <div>
              <label className="label">Postcode</label>
              <input className="input" value={form.afspreekPostcode} onChange={e => set('afspreekPostcode', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Gemeente</label>
              <input className="input" value={form.afspreekGemeente} onChange={e => set('afspreekGemeente', e.target.value)} />
            </div>
          </div>
          {embedUrl && (
            <div className="rounded-xl overflow-hidden border border-rkv-gray-mid">
              <iframe title="Afspreekplaats" width="100%" height="200" loading="lazy" src={embedUrl} className="border-0" />
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">Opmerkingen</h2>
          <textarea className="input resize-none" rows={4} value={form.opmerkingen} onChange={e => set('opmerkingen', e.target.value)} />
        </div>

        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('isActief', !form.isActief)}
              className={`w-10 h-6 rounded-full transition-colors relative ${form.isActief ? 'bg-rank-green' : 'bg-rkv-gray-mid'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActief ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="font-medium text-rkv-teal-dark text-sm">
              Event is actief {!form.isActief && <span className="text-rkv-teal font-normal">(gearchiveerd)</span>}
            </span>
          </label>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-rkv-red">⚠️ {error}</div>}

        <div className="flex gap-3 pb-6">
          <button onClick={handleDelete} disabled={deleting}
            className="border-2 border-rkv-red text-rkv-red px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rkv-red hover:text-white transition-colors">
            {deleting ? 'Archiveren…' : '🗑 Archiveren'}
          </button>
          <div className="flex-1" />
          <button onClick={() => router.push(`/events/${id}`)} className="btn-ghost">Annuleren</button>
          <button onClick={handleSave} disabled={saving} className="btn-blue">
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
