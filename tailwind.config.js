/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],
      },
      colors: {
        // Primaire kleuren
        rkv: {
          red:       '#EC2127',
          'red-dark':'#b5191e',
          teal:      '#81A6AB',
          'teal-dark':'#223A3C',
          gray:      '#EEF1F4',
          'gray-mid':'#c5cdd5',
        },
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
