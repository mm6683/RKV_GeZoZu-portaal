'use client'

interface Props {
  pfpUrl: string | null
  naam: string
  size?: number   // px
  className?: string
}

export default function VolunteerAvatar({ pfpUrl, naam, size = 40, className = '' }: Props) {
  const initials = naam
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  if (pfpUrl) {
    return (
      <img
        src={pfpUrl}
        alt={naam}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size, minWidth: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-rkv-red flex items-center justify-center text-white font-bold select-none ${className}`}
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  )
}
