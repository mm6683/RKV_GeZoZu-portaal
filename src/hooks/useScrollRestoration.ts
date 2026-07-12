'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Onthoudt de scrollpositie per pagina (in sessionStorage) en herstelt ze
// wanneer je terugkeert (bv. na het bekijken van een event via de "Terug"-
// knop of de browser-back). Dit is nodig omdat pagina's zoals het dashboard
// hun data client-side ophalen: bij het opnieuw mounten tonen ze eerst een
// korte laad-state, waardoor een eenmalige scroll-poging vaak te vroeg komt
// — de content is dan nog niet op volle hoogte, of de browser/Next.js zet
// de scroll daarna zelf nog eens terug naar boven.
//
// Gebruik: roep `useScrollRestoration(ready)` aan in een pagina, waarbij
// `ready` pas `true` wordt zodra de content geladen is (bv. `!loading`).
export function useScrollRestoration(ready: boolean) {
  const pathname = usePathname()
  const key = `scrollpos:${pathname}`
  const restored = useRef(false)

  // Zet de browser's eigen (native) scrollherstel op 'manual'. Anders
  // probeert de browser bij een back/forward-navigatie zelf ook nog te
  // scrollen — vaak net te vroeg, wat botst met onze eigen herstelpoging.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      const prev = window.history.scrollRestoration
      window.history.scrollRestoration = 'manual'
      return () => { window.history.scrollRestoration = prev }
    }
  }, [])

  // Herstel de opgeslagen positie zodra de inhoud klaar is — maar slechts
  // één keer per keer dat de pagina mount.
  useEffect(() => {
    if (!ready || restored.current) return
    restored.current = true

    const saved = sessionStorage.getItem(key)
    if (saved == null) return
    const y = parseInt(saved, 10)
    if (Number.isNaN(y)) return

    let cancelled = false
    let stableFrames = 0
    let frame = 0

    // Stop meteen als de gebruiker zelf begint te scrollen — dan moeten we
    // niet blijven terugvechten naar de opgeslagen positie.
    function stop() {
      cancelled = true
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchmove', stop)
      window.removeEventListener('keydown', stop)
    }
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchmove', stop, { passive: true })
    window.addEventListener('keydown', stop)

    // Blijf de positie een aantal frames herbevestigen: de pagina kan na
    // de eerste paint nog groeien (avatars/afbeeldingen die laden), en
    // Next.js kan als onderdeel van de navigatie zelf ook nog scrollen.
    // Door dit te herhalen tot het stabiel blijft, winnen we die race
    // zonder de gebruiker daarna nog te storen.
    function tick() {
      if (cancelled) return
      window.scrollTo(0, y)
      frame++
      stableFrames = Math.abs(window.scrollY - y) < 2 ? stableFrames + 1 : 0
      if (stableFrames >= 4 || frame > 40) { stop(); return }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return stop
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
