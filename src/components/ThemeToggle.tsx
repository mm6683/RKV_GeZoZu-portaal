'use client'
import { useEffect, useState } from 'react'

// Toggle-knop voor lichte/donkere modus.
//
// Standaard volgt het thema de instelling van het toestel (prefers-color-
// scheme), inclusief live wijzigingen (bv. als het OS 's avonds automatisch
// naar donker schakelt terwijl de site open staat). Zodra de gebruiker deze
// knop gebruikt, wordt die keuze in localStorage bewaard als expliciete
// override voor dit toestel/deze browser, en stoppen we met het systeem te
// volgen totdat de opslag geleegd wordt.
//
// De eigenlijke klasse wordt al vóór de eerste paint gezet door het inline
// script in layout.tsx — hier lezen we enkel die staat uit en schakelen we
// 'm om bij een klik, of wanneer het systeemthema verandert.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    function onSystemChange(e: MediaQueryListEvent) {
      let hasOverride = false
      try { hasOverride = localStorage.getItem('theme') !== null } catch {}
      if (hasOverride) return // gebruiker koos zelf een thema op dit toestel — niet overschrijven
      document.documentElement.classList.toggle('dark', e.matches)
      setIsDark(e.matches)
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Lichte modus' : 'Donkere modus'}
      aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
      className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-rkv-gray transition-colors text-rkv-teal-dark text-lg flex-shrink-0"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
