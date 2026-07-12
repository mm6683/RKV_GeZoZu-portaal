'use client'
import type { AttendStatus } from '@/types'

const CONFIG = {
  JA:            { label: 'Aanwezig',     bg: '#8CAA2E', text: '#fff' },
  ONBESCHIKBAAR: { label: 'Onbeschikbaar', bg: '#EC2127', text: '#fff' },
}

export default function StatusBadge({ status, compact }: { status: AttendStatus; compact?: boolean }) {
  if (status === 'RESERVE') {
    return (
      <span
        className="badge rounded-full font-medium bg-rkv-gray text-rkv-teal-dark"
        style={{ padding: compact ? '2px 8px' : '4px 12px', fontSize: compact ? 11 : 12 }}
      >
        Reserve
      </span>
    )
  }
  const c = CONFIG[status]
  return (
    <span className="badge rounded-full font-medium"
      style={{ backgroundColor: c.bg, color: c.text, padding: compact ? '2px 8px' : '4px 12px', fontSize: compact ? 11 : 12 }}>
      {c.label}
    </span>
  )
}
