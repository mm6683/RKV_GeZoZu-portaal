'use client'
import { useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface Props {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

// Onthoudt open/dicht per pagina + titel (sessionStorage), zodat de sectie
// in dezelfde stand staat wanneer je terugkeert vanaf een event — anders
// klopt de opgeslagen scrollpositie niet meer met de (kortere/langere)
// pagina na een terugkeer.
export default function Collapsible({ title, count, defaultOpen = false, children }: Props) {
  const pathname = usePathname()
  const storageKey = `collapsible:${pathname}:${title}`

  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved !== null) return saved === '1'
    } catch {}
    return defaultOpen
  })

  function toggle() {
    setOpen(o => {
      const next = !o
      try { sessionStorage.setItem(storageKey, next ? '1' : '0') } catch {}
      return next
    })
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-rkv-gray/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="font-bold text-rkv-teal-dark capitalize">{title}</span>
          {typeof count === 'number' && (
            <span className="text-xs font-medium bg-rkv-gray text-rkv-teal rounded-full px-2 py-0.5">
              {count}
            </span>
          )}
        </span>
        <span className={`text-rkv-teal transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2 border-t border-rkv-gray pt-4">
          {children}
        </div>
      )}
    </div>
  )
}
