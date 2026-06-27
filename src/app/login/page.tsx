'use client'
import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleLogin() {
    if (!identifier.trim()) { setError('Vul je gebruikersnaam of RKV-ID in.'); return }
    setLoading(true); setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), password }),
      })
      const data = await res.json()

      if (!res.ok) { setError(data.error || 'Login mislukt.'); setLoading(false); return }
      if (data.firstTime) { router.push('/set-password'); return }
      if (data.success) router.push('/dashboard')
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
      setLoading(false)
    }
  }

  function onKey(e: KeyboardEvent) { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-rkv-gray relative overflow-hidden">
      {/* Background abstract shapes for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rkv-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rkv-teal/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-sm border border-white/50 mb-4">
            <span className="text-rkv-red text-4xl font-bold">✚</span>
          </div>
          <h1 className="text-rkv-teal-dark text-3xl font-bold">GeZoZu Portaal</h1>
          <p className="text-rkv-teal-dark/70 mt-1">Genk · Zonhoven · Zutendaal</p>
        </div>

        <div className="card">
          <h2 className="text-rkv-teal-dark text-xl font-bold mb-6">Inloggen</h2>
          <div className="space-y-5">
            <div>
              <label className="label">Gebruikersnaam of RKV-ID</label>
              <input type="text" className="input" placeholder="voornaam.achternaam"
                value={identifier} onChange={e => setIdentifier(e.target.value)}
                onKeyDown={onKey} disabled={loading} autoComplete="username" autoFocus />
              <p className="text-xs text-rkv-teal mt-1.5">
                Gebruik <span className="font-mono font-medium">voornaam.achternaam</span> (bijv. <span className="font-mono font-medium">jan.peeters</span>) of je RKV-ID.
              </p>
            </div>
            <div>
              <label className="label">Wachtwoord</label>
              <input type="password" className="input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={onKey} disabled={loading} autoComplete="current-password" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-rkv-red">
                ⚠️ {error}
              </div>
            )}
            <button onClick={handleLogin} disabled={loading} className="btn-blue w-full text-base py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Inloggen…
                </span>
              ) : 'Inloggen'}
            </button>
          </div>
          <p className="text-center text-xs text-rkv-teal mt-6">
            Geen account? Contacteer een admin van GeZoZu.
          </p>
        </div>
      </div>
    </div>
  )
}
