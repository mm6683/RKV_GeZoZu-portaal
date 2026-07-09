'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { RANK_ORDER, getRankConfig } from '@/lib/ranks'

export default function CreateEventPage() {
  const router = useRouter()
  const [me, setMe]     = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [form, setForm] = useState({
    naam: '', datum: '', beginUur: '', eindUur: '', eindDatum: '', plaats: '',
    afspreekplaats: '', afspreekStraat: '', afspreekNummer: '',
    afspreekPostcode: '', afspreekGemeente: '',
    minHulpverleners: '2', minRank: '', opmerkingen: '',
  })

  useEffect(() => {
    fetch('/api/me').then(r => {
      if (r.status === 401) { router.push('/login'); return }
      r.json().then(d => { if (!d.isAdmin) { router.push('/dashboard'); return }; setMe(d) })
    })
  }, [])

  function set(field: string, value: string) {
    setForm(f => {
      const updated = { ...f, [field]: value }

      // Sync end date when start date changes (if they were on the same day)
      if (field === 'datum') {
        if (!f.eindDatum || f.eindDatum === f.datum) updated.eindDatum = value
      }

      // Auto-advance end date to next day when end time is before start time on the same day
      if ((field === 'eindUur' || field === 'beginUur') && updated.datum && updated.eindDatum === updated.datum) {
        if (updated.beginUur && updated.eindUur && updated.eindUur < updated.beginUur) {
          const d = new Date(updated.datum + 'T12:00:00')
          d.setDate(d.getDate() + 1)
          updated.eindDatum = d.toISOString().split('T')[0]
        }
      }

      return updated
    })
  }

  // Bouw Google Maps embed URL vanuit adresvelden
  function mapsEmbedUrl() {
    const parts = [
      form.afspreekStraat && form.afspreekNummer ? `${form.afspreekStraat} ${form.afspreekNummer}` : form.afspreekStraat,
      form.afspreekPostcode,
      form.afspreekGemeente,
      'België',
    ].filter(Boolean).join(', ')
    if (!parts.trim() || parts === 'België') return null
    return `https://maps.google.com/maps?q=${encodeURIComponent(parts)}&output=embed`
  }

  async function handleSubmit() {
    if (!form.naam || !form.datum || !form.beginUur || !form.eindUur || !form.plaats) {
      setError('Vul alle verplichte velden in.'); return
    }
    setSaving(true); setError(null)

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        naam: form.naam, datum: form.datum, beginUur: form.beginUur, eindUur: form.eindUur,
        eindDatum: form.eindDatum || form.datum,
        plaats: form.plaats, afspreekplaats: form.afspreekplaats || undefined,
        afspreekStraat: form.afspreekStraat || undefined, afspreekNummer: form.afspreekNummer || undefined,
        afspreekPostcode: form.afspreekPostcode || undefined, afspreekGemeente: form.afspreekGemeente || undefined,
        minHulpverleners: parseInt(form.minHulpverleners),
        minRank: form.minRank || null,
        opmerkingen: form.opmerkingen || undefined,
      }),
    })

    if (res.ok) { const ev = await res.json(); router.push(`/events/${ev.id}`) }
    else { const d = await res.json(); setError(d.error || 'Opslaan mislukt.'); setSaving(false) }
  }

  const embedUrl = mapsEmbedUrl()

  if (!me) return <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
  </div>

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <button onClick={() => router.push('/dashboard')} className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red">
          ‹ Terug
        </button>
        <h1 className="text-2xl font-bold text-rkv-teal-dark">Nieuw event aanmaken</h1>

        {/* Basisinfo */}
        <div className="card space-y-4">
          <h2 className="section-title">Eventinformatie</h2>
          <div>
            <label className="label">Naam <span className="text-rkv-red">*</span></label>
            <input className="input" placeholder="bv. EHBO Limburghal" value={form.naam} onChange={e => set('naam', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Datum <span className="text-rkv-red">*</span></label>
              <input className="input min-w-0" type="date" value={form.datum} onChange={e => set('datum', e.target.value)} />
            </div>
            <div>
              <label className="label">Begin <span className="text-rkv-red">*</span></label>
              <input className="input min-w-0" type="time" value={form.beginUur} onChange={e => set('beginUur', e.target.value)} />
            </div>
            <div>
              <label className="label">Einddatum <span className="text-rkv-red">*</span></label>
              <input className="input min-w-0" type="date" value={form.eindDatum} min={form.datum || undefined}
                onChange={e => set('eindDatum', e.target.value)} />
            </div>
            <div>
              <label className="label">Einde <span className="text-rkv-red">*</span></label>
              <input className="input min-w-0" type="time" value={form.eindUur} onChange={e => set('eindUur', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Evenementlocatie <span className="text-rkv-red">*</span></label>
              <input className="input" placeholder="bv. Limburghal Genk" value={form.plaats} onChange={e => set('plaats', e.target.value)} />
            </div>
            <div>
              <label className="label">Min. hulpverleners</label>
              <input className="input" type="number" min="1" max="50" value={form.minHulpverleners} onChange={e => set('minHulpverleners', e.target.value)} />
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

        {/* Afspreekplaats */}
        <div className="card space-y-4">
          <h2 className="section-title">Afspreekplaats <span className="text-rkv-teal font-normal text-sm">(optioneel)</span></h2>
          <div>
            <label className="label">Omschrijving</label>
            <input className="input" placeholder="bv. Parking Lidl Genk" value={form.afspreekplaats} onChange={e => set('afspreekplaats', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Straat</label>
              <input className="input" placeholder="Hasseltweg" value={form.afspreekStraat} onChange={e => set('afspreekStraat', e.target.value)} />
            </div>
            <div>
              <label className="label">Nummer</label>
              <input className="input" placeholder="1" value={form.afspreekNummer} onChange={e => set('afspreekNummer', e.target.value)} />
            </div>
            <div>
              <label className="label">Postcode</label>
              <input className="input" placeholder="3600" value={form.afspreekPostcode} onChange={e => set('afspreekPostcode', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Gemeente</label>
              <input className="input" placeholder="Genk" value={form.afspreekGemeente} onChange={e => set('afspreekGemeente', e.target.value)} />
            </div>
          </div>

          {/* Live kaartpreview */}
          {embedUrl && (
            <div className="rounded-xl overflow-hidden border border-rkv-gray-mid">
              <iframe title="Afspreekplaats" width="100%" height="200" loading="lazy"
                src={embedUrl} className="border-0" />
            </div>
          )}
        </div>

        {/* Opmerkingen */}
        <div className="card">
          <h2 className="section-title">Opmerkingen <span className="text-rkv-teal font-normal text-sm">(optioneel)</span></h2>
          <textarea className="input resize-none" rows={4}
            placeholder="Extra informatie voor vrijwilligers…"
            value={form.opmerkingen} onChange={e => set('opmerkingen', e.target.value)} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-rkv-red">⚠️ {error}</div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push('/dashboard')} className="btn-ghost flex-1">Annuleren</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-blue flex-1 text-base py-3">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Aanmaken…
              </span>
            ) : 'Event aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )
}
