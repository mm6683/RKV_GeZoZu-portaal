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
      <body className={ubuntu.className}>{children}</body>
    </html>
  )
}
