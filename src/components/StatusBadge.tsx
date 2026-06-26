'use client'
import type { AttendStatus } from '@/types'

const CONFIG = {
  JA:            { label: 'Aanwezig',     bg: '#8CAA2E', text: '#fff' },
  ONBESCHIKBAAR: { label: 'Onbeschikbaar', bg: '#EC2127', text: '#fff' },
  RESERVE:       { label: 'Reserve',      bg: '#EEF1F4', text: '#223A3C' },
}

export default function StatusBadge({ status, compact }: { status: AttendStatus; compact?: boolean }) {
  const c = CONFIG[status]
  return (
    <span className="badge rounded-full font-medium"
      style={{ backgroundColor: c.bg, color: c.text, padding: compact ? '2px 8px' : '4px 12px', fontSize: compact ? 11 : 12 }}>
      {c.label}
    </span>
  )
}
