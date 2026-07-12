'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Onthoudt de scrollpositie per pagina (in sessionStorage) en herstelt ze
// wanneer je terugkeert (bv. na het bekijken van een event via de "Terug"-
// knop of de browser-back). Dit is nodig omdat pagina's zoals het dashboard
// hun data client-side ophalen: bij het opnieuw mounten tonen ze eerst een
// korte laad-state, waardoor een eenmalige scroll-poging vaak te vroeg komt
// — de content is dan nog niet op volle hoogte, of de browser/Next.js zet
// de scroll daarna zelf nog eens terug naar boven.
//
// Belangrijk: dit effect mag gerust twee keer uitgevoerd worden (React's
// Strict Mode doet dat bewust in dev: mount → cleanup → mount). Er mag dus
// GEEN ref-vlag zijn die na de cleanup "al gedaan" blijft zeggen — anders
// wordt de tweede (echte) uitvoering geblokkeerd en gebeurt er nooit iets.
// Elke uitvoering start daarom zijn eigen volledig zelfstandige poging op,
// die via z'n eigen cleanup nét zichzelf afsluit.
//
// Gebruik: roep `useScrollRestoration(ready)` aan in een pagina, waarbij
// `ready` pas `true` wordt zodra de content geladen is (bv. `!loading`).
export function useScrollRestoration(ready: boolean) {
  const pathname = usePathname()
  const key = `scrollpos:${pathname}`

  // Zet de browser's eigen (native) scrollherstel op 'manual'. Anders
  // probeert de browser bij een back/forward-navigatie zelf ook nog te
  // scrollen — vaak net te vroeg, wat botst met onze eigen herstelpoging.
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return
    const prev = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => { window.history.scrollRestoration = prev }
  }, [])

  useEffect(() => {
    if (!ready) return

    const saved = sessionStorage.getItem(key)
    if (saved == null) return
    const y = parseInt(saved, 10)
    if (Number.isNaN(y)) return

    let cancelled = false

    // Stop meteen als de gebruiker zelf begint te scrollen — dan moeten we
    // niet blijven terugvechten naar de opgeslagen positie.
    function onUserScroll() { cancelled = true }
    window.addEventListener('wheel', onUserScroll, { passive: true })
    window.addEventListener('touchmove', onUserScroll, { passive: true })

    // Blijf de positie een korte periode herbevestigen: de pagina kan na
    // de eerste paint nog groeien (bv. een sectie die openklapt, een
    // avatar-afbeelding die laadt), en Next.js of de browser kunnen als
    // onderdeel van de navigatie zelf ook nog eens scrollen. Door dit een
    // tijdje te herhalen winnen we die race, zonder de gebruiker nadien
    // nog te storen.
    let frame = 0
    function raf() {
      if (cancelled) return
      window.scrollTo(0, y)
      frame++
      if (frame < 30) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Extra late herbevestigingen voor traag ladende content die pas na
    // die ~30 frames (~0,5s) nog de layout doet verschuiven.
    const t1 = setTimeout(() => { if (!cancelled) window.scrollTo(0, y) }, 400)
    const t2 = setTimeout(() => { if (!cancelled) window.scrollTo(0, y) }, 1000)

    return () => {
      cancelled = true
      window.removeEventListener('wheel', onUserScroll)
      window.removeEventListener('touchmove', onUserScroll)
      clearTimeout(t1)
      clearTimeout(t2)
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
