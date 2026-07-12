'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import VolunteerAvatar from '@/components/VolunteerAvatar'
import RankBadge from '@/components/RankBadge'
import { RANK_ORDER, VOLUNTEER_RANKS, QUAL_BADGES } from '@/lib/ranks'

const QUAL_TYPES = Object.keys(QUAL_BADGES) as (keyof typeof QUAL_BADGES)[]

export default function AdminVolunteerDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [me, setMe]         = useState<any>(null)
  const [volunteer, setVol] = useState<any>(null)
  const [form, setForm]     = useState<any>({})
  const [quals, setQuals]   = useState<any[]>([])
  const [deleteQuals, setDeleteQuals] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [meRes, volRes] = await Promise.all([
      fetch('/api/me'),
      fetch(`/api/admin/volunteers/${id}`),
    ])
    if (meRes.status === 401) { router.push('/login'); return }
    const meData = await meRes.json()
    if (!meData.isAdmin) { router.push('/dashboard'); return }
    setMe(meData)
    const volData = await volRes.json()
    setVol(volData)
    setForm({
      voornaam:      volData.voornaam,
      naam:          volData.naam,
      displayName:   volData.displayName || '',
      pfpUrl:        volData.pfpUrl || '',
      hoofdentiteit: volData.hoofdentiteit,
      emailWerk:     volData.emailWerk || '',
      gsm:           volData.gsm || '',
      ranks:         volData.ranks?.length ? volData.ranks : ['BASISVRIJWILLIGER'],
      isAdmin:       volData.isAdmin,
      isExternal:    volData.isExternal,
    })
    setQuals(volData.qualifications || [])
  }

  function toggleRank(rank: string) {
    setForm((f: any) => ({
      ...f,
      ranks: f.ranks.includes(rank) ? f.ranks.filter((r: string) => r !== rank) : [...f.ranks, rank],
    }))
  }

  async function save() {
    if (!form.ranks?.length) { alert('Selecteer minstens 1 SB.'); return }
    setSaving(true)
    await fetch(`/api/admin/volunteers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        volledigeNaam: `${form.naam} ${form.voornaam}`.trim(),
        qualifications: quals,
        deleteQualifications: deleteQuals,
      }),
    })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDelete() {
    if (!confirm(`Ben je zeker dat je ${volunteer?.volledigeNaam} wil verwijderen? Dit kan niet ongedaan gemaakt worden.`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/volunteers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin')
    } else {
      const d = await res.json()
      alert(d.error || 'Verwijderen mislukt.')
      setDeleting(false)
    }
  }

  function addQual() {
    setQuals(p => [...p, { type: 'ATTEST', naam: '', geldigTot: '', manualLock: true, _new: true }])
  }

  function removeQual(i: number, q: any) {
    if (q.id) setDeleteQuals(p => [...p, q.id])
    setQuals(p => p.filter((_, idx) => idx !== i))
  }

  function updateQual(i: number, field: string, value: any) {
    setQuals(p => p.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function setF(field: string, value: any) {
    setForm((f: any) => ({ ...f, [field]: value }))
  }

  const hasPassword: boolean = volunteer?.hasPassword ?? false

  if (!volunteer) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rkv-red/20 border-t-rkv-red rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-rkv-gray">
      <Navbar naam={me?.volledigeNaam} id={me?.id} displayName={me?.displayName} voornaam={me?.voornaam} pfpUrl={me?.pfpUrl} isAdmin />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <button
          onClick={() => { if (window.history.length > 1) router.back(); else router.push('/admin') }}
          className="text-rkv-teal text-sm flex items-center gap-1 hover:text-rkv-red"
        >
          ‹ Terug naar overzicht
        </button>

        {/* Header */}
        <div className="card">
          <div className="flex items-center gap-4">
            <VolunteerAvatar pfpUrl={volunteer.pfpUrl} naam={volunteer.volledigeNaam} size={60} />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-rkv-teal-dark">{volunteer.volledigeNaam}</h1>
              <p className="text-sm text-rkv-teal">{volunteer.emailWerk || '—'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <RankBadge ranks={form.ranks} size="sm" />
                {volunteer.isExternal && <span className="badge bg-[#81A6AB] text-white text-xs">Extern</span>}
                {!hasPassword && <span className="badge bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-xs">Nog geen wachtwoord</span>}
              </div>
            </div>
            <button onClick={() => router.push(`/profile/${id}`)} className="btn-ghost text-sm">
              Profiel bekijken
            </button>
          </div>
        </div>

        {/* ── SB ───────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="section-title mb-0">SB</h2>
          <p className="text-xs text-rkv-teal -mt-3">Selecteer één of meerdere Sanitaire Bekwaamheden.</p>
          <div className="grid grid-cols-2 gap-2">
            {RANK_ORDER.map(rank => {
              const cfg = VOLUNTEER_RANKS[rank]
              const isSelected = form.ranks?.includes(rank)
              return (
                <button key={rank} type="button" onClick={() => toggleRank(rank)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected ? 'border-rkv-red bg-rkv-red/5' : 'border-rkv-gray-mid hover:border-rkv-teal'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-rkv-red' : 'text-rkv-teal-dark'}`}>
                    {cfg.label}
                  </span>
                  {isSelected && <span className="ml-auto text-rkv-red text-sm">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Basisinfo ─────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="section-title">Basisinformatie</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Voornaam" value={form.voornaam} onChange={v => setF('voornaam', v)} />
            <Field label="Naam" value={form.naam} onChange={v => setF('naam', v)} />
            <Field label="Weergavenaam (kort)" value={form.displayName} onChange={v => setF('displayName', v)} placeholder="bv. Midas M." />
            <Field label="Hoofdentiteit" value={form.hoofdentiteit} onChange={v => setF('hoofdentiteit', v)} />
            <Field label="E-mail" value={form.emailWerk} onChange={v => setF('emailWerk', v)} />
            <Field label="GSM" value={form.gsm} onChange={v => setF('gsm', v)} />
            <div className="col-span-2">
              <Field label="Profielfoto URL (optioneel)" value={form.pfpUrl} onChange={v => setF('pfpUrl', v)} placeholder="https://..." />
            </div>
          </div>

          <div className="flex gap-6 pt-2 border-t border-rkv-gray">
            <Toggle label="Admin" checked={form.isAdmin} onChange={v => setF('isAdmin', v)}
              disabled={!hasPassword} disabledReason="Gebruiker moet eerst een wachtwoord instellen" />
            <Toggle label="Externe vrijwilliger" checked={form.isExternal} onChange={v => setF('isExternal', v)} />
          </div>
        </div>

        {/* ── Kwalificaties ─────────────────────────────────────── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title mb-0">Kwalificaties & Brevetten</h2>
            <button onClick={addQual} className="btn-outline text-xs py-1.5">+ Toevoegen</button>
          </div>

          {quals.length === 0 && (
            <p className="text-sm text-rkv-teal text-center py-6">Geen kwalificaties</p>
          )}

          {quals.map((q, i) => (
            <div key={i} className="p-3 rounded-xl border border-rkv-gray-mid">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label text-[10px]">Type</label>
                  <select className="input text-sm py-2" value={q.type}
                    onChange={e => updateQual(i, 'type', e.target.value)}>
                    {QUAL_TYPES.map(t => (
                      <option key={t} value={t}>{QUAL_BADGES[t].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-[10px]">Naam</label>
                  <input className="input text-sm py-2" value={q.naam}
                    onChange={e => updateQual(i, 'naam', e.target.value)} />
                </div>
                <div>
                  <label className="label text-[10px]">Geldig tot</label>
                  <input className="input text-sm py-2" value={q.geldigTot || ''}
                    onChange={e => updateQual(i, 'geldigTot', e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button onClick={() => removeQual(i, q)} className="text-xs text-rkv-red hover:underline">
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── RKV Functies ──────────────────────────────────────── */}
        {volunteer.functions?.length > 0 && (
          <div className="card">
            <h2 className="section-title">RKV Functies</h2>
            <div className="space-y-2">
              {volunteer.functions.map((f: any) => (
                <div key={f.id} className="flex items-center justify-between bg-rkv-gray rounded-lg px-3 py-2.5 text-sm">
                  <span className="font-medium text-rkv-teal-dark">{f.functie}</span>
                  {f.entiteit && <span className="text-rkv-teal">{f.entiteit}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recente shifts ────────────────────────────────────── */}
        {volunteer.attendances?.length > 0 && (
          <div className="card">
            <h2 className="section-title">Recente shifts</h2>
            <div className="space-y-1">
              {volunteer.attendances.slice(0, 10).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-rkv-gray last:border-0 text-sm">
                  <span className="text-rkv-teal-dark">{a.event.naam}</span>
                  <span className="text-rkv-teal">{new Date(a.event.datum).toLocaleDateString('nl-BE')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Knoppen ───────────────────────────────────────────── */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="border-2 border-rkv-red text-rkv-red px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rkv-red hover:text-white transition-colors disabled:opacity-50"
          >
            {deleting ? 'Verwijderen…' : '🗑 Verwijderen'}
          </button>
          <div className="flex-1" />
          <button onClick={() => router.push('/admin')} className="btn-ghost">Annuleren</button>
          <button onClick={save} disabled={saving} className="btn-blue px-8">
            {saving ? 'Opslaan…' : saved ? '✓ Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function Toggle({ label, checked, onChange, danger, disabled, disabledReason }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
  danger?: boolean; disabled?: boolean; disabledReason?: string
}) {
  return (
    <div>
      <label className={`flex items-center gap-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
        <div onClick={() => !disabled && onChange(!checked)}
          className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
            disabled ? 'bg-rkv-gray-mid cursor-not-allowed' :
            checked ? (danger ? 'bg-rkv-red' : 'bg-rank-green') : 'bg-rkv-gray-mid'
          }`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'left-5' : 'left-1'}`} />
        </div>
        <span className={`text-sm font-medium ${danger && checked ? 'text-rkv-red' : 'text-rkv-teal-dark'}`}>{label}</span>
      </label>
      {disabled && disabledReason && (
        <p className="text-xs text-rkv-teal mt-1 ml-12">⚠️ {disabledReason}</p>
      )}
    </div>
  )
}
