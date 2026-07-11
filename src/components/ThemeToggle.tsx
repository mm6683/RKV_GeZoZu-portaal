'use client'
import { useEffect, useState } from 'react'

// Toggle-knop voor lichte/donkere modus. De eigenlijke klasse wordt al vóór
// de eerste paint gezet door het inline script in layout.tsx (zie daar) —
// hier lezen we enkel die staat uit en schakelen we 'm om bij een klik.
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
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
