'use client'
import { useState, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'

const RULES = [
  { label: 'Minstens 8 tekens',    test: (p: string) => p.length >= 8 },
  { label: 'Minstens 1 cijfer',    test: (p: string) => /\d/.test(p) },
  { label: 'Minstens 1 hoofdletter', test: (p: string) => /[A-Z]/.test(p) },
]

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const rulesPassed = RULES.every(r => r.test(password))
  const match       = password && confirmPassword && password === confirmPassword

  async function handleSubmit() {
    if (!rulesPassed) { setError('Wachtwoord voldoet niet aan de vereisten.'); return }
    if (!match)       { setError('Wachtwoorden komen niet overeen.'); return }
    setLoading(true); setError(null)

    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Opslaan mislukt.')
        setLoading(false)
      }
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
      setLoading(false)
    }
  }

  function onKey(e: KeyboardEvent) { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-rkv-gray relative overflow-hidden">
      {/* Background abstract shapes for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rkv-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rkv-teal/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-surface rounded-2xl shadow-sm border border-white/50 dark:border-white/10 mb-4">
            <span className="text-rkv-red text-4xl font-bold">✚</span>
          </div>
          <h1 className="text-rkv-teal-dark text-3xl font-bold">GeZoZu Portaal</h1>
          <p className="text-rkv-teal-dark/70 mt-1">Welkom! Stel je wachtwoord in.</p>
        </div>

        <div className="card">
          <h2 className="text-rkv-teal-dark text-xl font-bold mb-2">Wachtwoord instellen</h2>
          <p className="text-sm text-rkv-teal mb-6">
            Dit is je eerste login. Kies een persoonlijk wachtwoord.
          </p>

          <div className="space-y-5">
            <div>
              <label className="label">Nieuw wachtwoord</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={onKey}
                disabled={loading}
                autoFocus
              />
              {/* Regels indicator */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {RULES.map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-xs">
                      <span className={r.test(password) ? 'text-rank-green' : 'text-rkv-gray-mid'}>
                        {r.test(password) ? '✓' : '○'}
                      </span>
                      <span className={r.test(password) ? 'text-rkv-teal-dark' : 'text-rkv-teal'}>
                        {r.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Wachtwoord bevestigen</label>
              <input
                type="password"
                className={`input ${confirmPassword && (match ? 'border-rank-green' : 'border-rkv-red')}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={onKey}
                disabled={loading}
              />
              {confirmPassword && !match && (
                <p className="text-xs text-rkv-red mt-1">Wachtwoorden komen niet overeen.</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-rkv-red/10 border border-red-200 dark:border-rkv-red/30 rounded-xl px-4 py-3 text-sm text-rkv-red">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !rulesPassed || !match}
              className="btn-blue w-full text-base py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Opslaan…
                </span>
              ) : 'Wachtwoord instellen & inloggen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
