'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { RANK_ORDER, VOLUNTEER_RANKS } from '@/lib/ranks'

export default function CreateVolunteerPage() {
  const router = useRouter()
  const [me, setMe]       = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [form, setForm] = useState({
    voornaam:      '',
    naam:          '',
    rkvId:         '',
    emailWerk:     '',
    gsm:           '',
    hoofdentiteit: 'GENK-ZONHOVEN-ZUTENDAAL',
    rank:          'BASISVRIJWILLIGER',
    isExternal:    false,
  })

  useEffect(() => {
    fetch('/api/me').then(r => {
      if (r.status === 401) { router.push('/login'); return }
      r.json().then(d => {
        if (!d.isAdmin) { router.push('/dashboard'); return }
        setMe(d)
      })
    })
  }, [])

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.voornaam.trim() || !form.naam.trim()) {
      setError('Voor- en achternaam zijn verplicht.'); return
    }
    if (!form.emailWerk.trim()) {
      setError('E-mailadres is verplicht — dit is het login-adres van de vrijwilliger.'); return
    }

    setSaving(true); setError(null)

    const res = await fetch('/api/admin/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      router.push(`/admin/volunteers/${data.volunteer.id}`)
    } else {
      setError(data.error || 'Aanmaken mislukt.')
      setSaving(false)
    }
  }

  if (!me) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} pfpUrl={me.pfpUrl} isAdmin />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <button onClick={() => router.push('/admin')} className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red">
          ‹ Terug naar admin
        </button>

        <h1 className="text-2xl font-bold text-rkv-teal-dark">Vrijwilliger toevoegen</h1>

        {/* Basisinfo */}
        <div className="card space-y-4">
          <h2 className="section-title">Basisinformatie</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Voornaam <span className="text-rkv-red">*</span></label>
              <input className="input" placeholder="Jana" value={form.voornaam} onChange={e => set('voornaam', e.target.value)} />
            </div>
            <div>
              <label className="label">Achternaam <span className="text-rkv-red">*</span></label>
              <input className="input" placeholder="Janssen" value={form.naam} onChange={e => set('naam', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">E-mailadres <span className="text-rkv-red">*</span></label>
              <input className="input" type="email" placeholder="naam@email.com" value={form.emailWerk} onChange={e => set('emailWerk', e.target.value)} />
              <p className="text-xs text-rkv-teal mt-1">Dit is het adres waarmee de vrijwilliger inlogt.</p>
            </div>
            <div>
              <label className="label">GSM</label>
              <input className="input" placeholder="+32 499 00 00 00" value={form.gsm} onChange={e => set('gsm', e.target.value)} />
            </div>
            <div>
              <label className="label">RKV ID <span className="text-rkv-teal font-normal">(optioneel)</span></label>
              <input className="input font-mono" placeholder="bv. 08121600162" value={form.rkvId} onChange={e => set('rkvId', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Afdeling</label>
            <input className="input" value={form.hoofdentiteit} onChange={e => set('hoofdentiteit', e.target.value)} />
          </div>
        </div>

        {/* Rang */}
        <div className="card space-y-3">
          <h2 className="section-title">Rang</h2>
          <div className="grid grid-cols-2 gap-2">
            {RANK_ORDER.map(rank => {
              const cfg = VOLUNTEER_RANKS[rank]
              const isSelected = form.rank === rank
              return (
                <button
                  key={rank}
                  onClick={() => set('rank', rank)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-rkv-red bg-rkv-red/5' : 'border-rkv-gray-mid hover:border-rkv-teal'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className={`text-sm font-medium ${isSelected ? 'text-rkv-red' : 'text-rkv-teal-dark'}`}>
                    {cfg.label}
                  </span>
                  {isSelected && <span className="ml-auto text-rkv-red text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Extern */}
        <div className="card">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('isExternal', !form.isExternal)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.isExternal ? 'bg-rkv-teal' : 'bg-rkv-gray-mid'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isExternal ? 'left-5' : 'left-1'}`} />
            </div>
            <div>
              <p className="font-medium text-rkv-teal-dark text-sm">Externe vrijwilliger</p>
              <p className="text-xs text-rkv-teal">Van een andere afdeling — heeft beperkte toegang</p>
            </div>
          </label>
        </div>

        {/* Info box */}
        <div className="bg-rkv-gray rounded-xl p-4 text-sm text-rkv-teal">
          <p className="font-medium text-rkv-teal-dark mb-1">ℹ️ Na het aanmaken</p>
          <p>De vrijwilliger heeft nog geen wachtwoord. Ze loggen in met hun RKV ID en worden automatisch naar het wachtwoord-instellen scherm gestuurd.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-rkv-red">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push('/admin')} className="btn-ghost flex-1">Annuleren</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-blue flex-1 text-base py-3">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Aanmaken…
              </span>
            ) : 'Vrijwilliger aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )
}
