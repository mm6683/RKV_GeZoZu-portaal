'use client'
import { getRankConfig } from '@/lib/ranks'

interface Props {
  ranks: string | string[] | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function RankBadge({ ranks, size = 'md', className = '' }: Props) {
  const list = (Array.isArray(ranks) ? ranks : ranks ? [ranks] : []).filter(Boolean)
  if (list.length === 0) return null

  const sizes = {
    sm:  'text-[11px] px-2 py-0.5',
    md:  'text-xs px-2.5 py-1',
    lg:  'text-sm px-3 py-1.5 font-semibold',
  }

  return (
    <span className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {list.map(r => {
        const cfg = getRankConfig(r)
        return (
          <span
            key={r}
            className={`inline-flex items-center rounded-full font-medium ${sizes[size]}`}
            style={{ backgroundColor: cfg.color, color: cfg.textColor }}
          >
            {cfg.label}
          </span>
        )
      })}
    </span>
  )
}
