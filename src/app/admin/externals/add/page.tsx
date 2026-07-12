'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function AddExternalPage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    rkvId: '',
    voornaam: '',
    naam: '',
    hoofdentiteit: '',
    emailWerk: '',
    gsm: '',
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

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.rkvId.trim()) { setError('RKV ID is verplicht.'); return }
    setSaving(true); setError(null)

    const res = await fetch('/api/admin/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (res.ok) {
      setSaved(data)
      setSaving(false)
    } else {
      setError(data.error || 'Opslaan mislukt.')
      setSaving(false)
    }
  }

  if (!me) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
    </div>
  )

  if (saved) return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} id={me.id} displayName={me.displayName} voornaam={me.voornaam} pfpUrl={me.pfpUrl} isAdmin />
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-rkv-teal-dark mb-2">
          {saved.existed ? 'Toegang verleend' : 'Externe toegevoegd'}
        </h1>
        <p className="text-rkv-teal mb-2">
          {saved.volunteer.volledigeNaam || form.rkvId}
        </p>
        <p className="text-sm text-rkv-teal mb-6">
          {saved.existed
            ? 'Deze vrijwilliger bestond al en heeft nu externe toegang.'
            : 'De externe vrijwilliger is aangemaakt. Ze kunnen zelf inloggen om hun profiel aan te vullen.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSaved(null); setForm({ rkvId: '', voornaam: '', naam: '', hoofdentiteit: '', emailWerk: '', gsm: '' }) }} className="btn-outline">
            Nog een toevoegen
          </button>
          <button onClick={() => router.push('/admin')} className="btn-blue">
            Terug naar admin
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me.volledigeNaam} id={me.id} displayName={me.displayName} voornaam={me.voornaam} pfpUrl={me.pfpUrl} isAdmin />

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <button onClick={() => router.push('/admin')} className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red">
          ‹ Terug naar admin
        </button>

        <h1 className="text-2xl font-bold text-rkv-teal-dark">Externe vrijwilliger toevoegen</h1>

        <div className="card space-y-5">
          <div className="bg-rkv-gray rounded-xl p-4 text-sm text-rkv-teal">
            <p className="font-medium text-rkv-teal-dark mb-1">ℹ️ Hoe werkt dit?</p>
            <p>Voeg het RKV ID in van de externe vrijwilliger. Ze krijgen dan toegang tot het portaal wanneer ze inloggen met hun eigen RKV-account. Je kan optioneel al basisinfo invullen — dit wordt automatisch aangevuld als ze zelf inloggen.</p>
          </div>

          <div>
            <label className="label">RKV ID <span className="text-rkv-red">*</span></label>
            <input
              className="input font-mono"
              placeholder="bv. 08121600162"
              value={form.rkvId}
              onChange={e => set('rkvId', e.target.value)}
            />
            <p className="text-xs text-rkv-teal mt-1">
              Het RKV ID staat op de vrijwilligerspas of in het vrijwilligersportaal van RKV.
            </p>
          </div>

          <div className="border-t border-rkv-gray pt-4">
            <p className="text-xs font-medium text-rkv-teal uppercase tracking-wide mb-3">
              Basisinfo (optioneel — wordt overschreven bij eerste login)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Voornaam</label>
                <input className="input" placeholder="Jana" value={form.voornaam} onChange={e => set('voornaam', e.target.value)} />
              </div>
              <div>
                <label className="label">Naam</label>
                <input className="input" placeholder="Janssen" value={form.naam} onChange={e => set('naam', e.target.value)} />
              </div>
              <div>
                <label className="label">Afdeling</label>
                <input className="input" placeholder="bv. Hasselt" value={form.hoofdentiteit} onChange={e => set('hoofdentiteit', e.target.value)} />
              </div>
              <div>
                <label className="label">E-mail</label>
                <input className="input" type="email" value={form.emailWerk} onChange={e => set('emailWerk', e.target.value)} />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-rkv-red/10 border border-red-200 dark:border-rkv-red/30 rounded-xl px-4 py-3 text-sm text-rkv-red">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push('/admin')} className="btn-ghost flex-1">Annuleren</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-blue flex-1">
              {saving ? 'Toevoegen…' : 'Externe toevoegen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
