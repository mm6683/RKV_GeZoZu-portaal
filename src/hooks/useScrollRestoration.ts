'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Onthoudt de scrollpositie per pagina (in sessionStorage) en herstelt ze
// wanneer je terugkeert (bv. na het bekijken van een event via de "Terug"-
// knop of de browser-back). Dit is nodig omdat pagina's zoals het dashboard
// hun data client-side ophalen: bij het opnieuw mounten tonen ze eerst een
// korte laad-state, waardoor de browser's eigen scrollherstel niet ver
// genoeg kan scrollen voordat de echte inhoud er staat — het resultaat is
// dat je telkens weer bovenaan de pagina belandt.
//
// Gebruik: roep `useScrollRestoration(ready)` aan in een pagina, waarbij
// `ready` pas `true` wordt zodra de content geladen is (bv. `!loading`).
export function useScrollRestoration(ready: boolean) {
  const pathname = usePathname()
  const key = `scrollpos:${pathname}`
  const restored = useRef(false)

  // Herstel de opgeslagen positie zodra de inhoud klaar is — maar slechts
  // één keer per keer dat de pagina mount (anders zou een latere re-render
  // steeds terug omhoog/omlaag springen).
  useEffect(() => {
    if (!ready || restored.current) return
    restored.current = true
    const saved = sessionStorage.getItem(key)
    if (saved != null) {
      const y = parseInt(saved, 10)
      if (!Number.isNaN(y)) {
        // Wacht tot na de eerstvolgende paint, zodat de content al
        // z'n volle hoogte heeft voordat we proberen te scrollen.
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)))
      }
    }
  }, [ready, key])

  // Sla de positie doorlopend op terwijl er gescrold wordt.
  useEffect(() => {
    function onScroll() {
      sessionStorage.setItem(key, String(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [key])
}
