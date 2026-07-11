'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import VolunteerAvatar from './VolunteerAvatar'
import ThemeToggle from './ThemeToggle'

interface Props {
  naam: string
  pfpUrl: string | null
  isAdmin: boolean
}

export default function Navbar({ naam, pfpUrl, isAdmin }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="nav-bar">
      {/* Logo + naam */}
      <div className="flex items-center gap-3">
        <span className="text-rkv-red text-2xl font-bold leading-none">✚</span>
        <div className="hidden sm:block">
          <div className="text-rkv-teal-dark font-bold text-sm leading-tight">GeZoZu Portaal</div>
          <div className="text-rkv-teal-dark/70 text-xs">Genk · Zonhoven · Zutendaal</div>
        </div>
      </div>

      {/* Navigatie links (desktop) */}
      <div className="hidden md:flex items-center gap-1">
        <button onClick={() => router.push('/dashboard')} className="text-rkv-teal-dark/80 hover:text-rkv-teal-dark px-3 py-1 rounded-lg hover:bg-rkv-gray transition-colors text-sm">
          Home
        </button>
        {isAdmin && (
          <button onClick={() => router.push('/admin')} className="text-rkv-teal-dark/80 hover:text-rkv-teal-dark px-3 py-1 rounded-lg hover:bg-rkv-gray transition-colors text-sm">
            Admin
          </button>
        )}
      </div>

      {/* Thema + gebruiker */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-rkv-gray rounded-xl px-2 py-1 transition-colors"
          >
            <VolunteerAvatar pfpUrl={pfpUrl} naam={naam} size={32} />
            <span className="text-rkv-teal-dark text-sm font-medium hidden sm:block max-w-[120px] truncate">
              {naam.split(' ')[0]}
            </span>
            <span className="text-rkv-teal-dark/70 text-xs">▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 bg-white dark:bg-surface rounded-xl shadow-card-hover w-48 z-50 overflow-hidden border border-rkv-gray/50 dark:border-white/10">
              <div className="px-4 py-3 border-b border-rkv-gray">
                <p className="text-xs text-rkv-teal font-medium">Ingelogd als</p>
                <p className="text-sm font-bold text-rkv-teal-dark truncate">{naam}</p>
              </div>
              <button onClick={() => { setMenuOpen(false); router.push('/dashboard') }}
                className="w-full text-left px-4 py-2.5 text-sm text-rkv-teal-dark hover:bg-rkv-gray transition-colors">
                🏠 Home
              </button>
              {isAdmin && (
                <button onClick={() => { setMenuOpen(false); router.push('/admin') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-rkv-teal-dark hover:bg-rkv-gray transition-colors">
                  ⚙️ Admin paneel
                </button>
              )}
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-rkv-red hover:bg-rkv-gray transition-colors border-t border-rkv-gray">
                → Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
