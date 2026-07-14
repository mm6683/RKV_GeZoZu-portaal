import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import ScrollRestorer from '@/components/ScrollRestorer'
import './globals.css'

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

const DESCRIPTION = 'Een onofficieel vrijwilligersportaal voor Rode Kruis Vlaanderen afdeling Genk-Zonhoven-Zutendaal primair voor shiftmanagement.'

export const metadata: Metadata = {
  // Zet dit op je echte productie-domein (bv. new URL('https://gezozu.pages.dev'))
  // zodra dat vaststaat — anders bouwt Next.js de og:image-URL mogelijk relatief
  // op, wat sommige crawlers (Facebook/Slack/…) niet correct oppikken.
  // metadataBase: new URL('https://JOUW-DOMEIN-HIER'),
  title: 'GeZoZu Portaal',
  description: DESCRIPTION,
  openGraph: {
    title: 'GeZoZu Portaal',
    description: DESCRIPTION,
    siteName: 'GeZoZu Portaal',
    locale: 'nl_BE',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'GeZoZu Portaal',
    description: DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        {/* Zet de dark-mode klasse al vóór de eerste paint, op basis van de
            eerder gekozen voorkeur (localStorage) of anders het systeem-
            thema. Dit voorkomt een korte flits van het verkeerde thema bij
            het laden van de pagina. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={ubuntu.className}>
        <ScrollRestorer />
        {children}
      </body>
    </html>
  )
}
