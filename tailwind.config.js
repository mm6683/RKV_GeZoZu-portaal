/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],
      },
      colors: {
        // Primaire kleuren
        // teal, teal-dark, gray en gray-mid zijn gekoppeld aan CSS-variabelen
        // (zie globals.css) zodat ze automatisch omschakelen in dark mode —
        // dit zijn immers vooral de "neutrale" tekst-/achtergrondkleuren die
        // overal in de app gebruikt worden. red/red-dark blijven bewust vaste
        // kleuren: het zijn accentkleuren die in beide modi hetzelfde moeten
        // ogen (bv. badges met witte tekst erop).
        rkv: {
          red:       '#EC2127',
          'red-dark':'#b5191e',
          teal:      'rgb(var(--color-text-secondary) / <alpha-value>)',
          'teal-dark':'rgb(var(--color-text) / <alpha-value>)',
          gray:      'rgb(var(--color-bg) / <alpha-value>)',
          'gray-mid':'rgb(var(--color-bg-mid) / <alpha-value>)',
        },
        // Oppervlak van kaarten/navbar/dropdowns — vervangt "white" op
        // plekken waar dat oppervlak in dark mode donker moet worden.
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        cta: {
          blue: '#0591e2',
          'blue-dark': '#0477b8',
          gray: '#e3e3e3',
          'gray-dark': '#d0d0d0',
        },
        // Secundaire kleuren
        rank: {
          gold:   '#f3a400',   // Ereteken
          purple: '#962071',   // Medisch Diploma
          blue:   '#008AB7',   // Kwalificatie
          green:  '#8CAA2E',   // Brevet
          teal:   '#81A6AB',   // Attest
        },
        // Status kleuren
        status: {
          ja:            '#8CAA2E',
          onbeschikbaar: '#EC2127',
          blanco:        '#c5cdd5',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(34,58,60,0.10)',
        'card-hover': '0 4px 24px rgba(34,58,60,0.18)',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
