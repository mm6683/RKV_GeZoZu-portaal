'use client'
import { useState, ReactNode } from 'react'

interface Props {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

export default function Collapsible({ title, count, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card !p-0 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
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
