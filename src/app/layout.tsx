import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import './globals.css'

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GeZoZu Vrijwilligersportaal',
  description: 'Onofficieel portaal voor vrijwilligers van Rode Kruis afdeling Genk-Zonhoven-Zutendaal',
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
      <body className={ubuntu.className}>{children}</body>
    </html>
  )
}
