'use client'
import { useEffect } from 'react'

// Onthoudt de scrollpositie per pagina (sessionStorage) en herstelt ze bij
// terug/vooruit-navigatie (browser-knoppen, of onze eigen "Terug"-knoppen
// die router.back() gebruiken).
//
// Dit zit hier op layout-niveau — ÉÉN keer gemount voor de hele sessie —
// in plaats van als hook binnen elke pagina. Reden: Next.js hergebruikt bij
// terug-navigatie vaak de al-gerenderde versie van een pagina uit z'n eigen
// router-cache in plaats van 'm opnieuw te mounten. In dat (normale!) geval
// verandert een pagina's eigen "aan het laden"-status nooit meer, dus een
// hook die daarop wacht vuurt simpelweg nooit. Door in plaats daarvan te
// luisteren naar het echte browser-event (popstate) werkt dit ongeacht of
// Next.js de pagina hergebruikt (meestal — dan doet de browser het zelf al,
// zie hieronder) of vers opnieuw opbouwt (na een tijdje, of na een refresh).
//
// We raken history.scrollRestoration bewust NIET aan: Next.js' router-cache
// is er net op gebouwd dat de browser dat zelf (op 'auto', de standaard)
// afhandelt zodra de gecachte pagina terug getoond wordt. We vullen alleen
// aan voor het geval dat de pagina vers moest herladen en de browser niet
// ver genoeg kon scrollen omdat de inhoud toen nog niet op volle hoogte was.
export default function ScrollRestorer() {
  useEffect(() => {
    function restoreFor(pathname: string) {
      const saved = sessionStorage.getItem(`scrollpos:${pathname}`)
      if (saved == null) return
      const y = parseInt(saved, 10)
      if (Number.isNaN(y)) return

      let cancelled = false
      function onUserScroll() { cancelled = true }
      window.addEventListener('wheel', onUserScroll, { passive: true })
      window.addEventListener('touchmove', onUserScroll, { passive: true })

      // Blijf een tijdje herbevestigen: als de browser het zelf al goed
      // deed, zijn dit no-ops. Als de pagina vers moest herladen, vangt dit
      // op dat de inhoud pas na een paar frames op volle hoogte staat.
      let frame = 0
      function tick() {
        if (cancelled) return
        window.scrollTo(0, y)
        frame++
        if (frame < 90) requestAnimationFrame(tick) // ~1,5s @ 60fps
        else stop()
      }
      function stop() {
        cancelled = true
        window.removeEventListener('wheel', onUserScroll)
        window.removeEventListener('touchmove', onUserScroll)
      }
      requestAnimationFrame(tick)
    }

    function onPopState() {
      restoreFor(window.location.pathname)
    }
    window.addEventListener('popstate', onPopState)

    function onScroll() {
      sessionStorage.setItem(`scrollpos:${window.location.pathname}`, String(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return null
}
