'use client'
import { getRankConfig } from '@/lib/ranks'
import type { VolunteerRank } from '@/lib/ranks'

interface Props {
  rank: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function RankBadge({ rank, size = 'md', className = '' }: Props) {
  const cfg = getRankConfig(rank)
  const sizes = {
    sm:  'text-[11px] px-2 py-0.5',
    md:  'text-xs px-2.5 py-1',
    lg:  'text-sm px-3 py-1.5 font-semibold',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizes[size]} ${className}`}
      style={{ backgroundColor: cfg.color, color: cfg.textColor }}
    >
      {cfg.label}
    </span>
  )
}
