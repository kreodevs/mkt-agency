/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      /* Letter Colors */
      colors: {
        'vault-ink': '#191b1f',
        'paper-white': '#ffffff',
        'mist-white': '#f6f9f9',
        'fog-gray': '#9fabad',
        'hairline': '#e6ebec',
        'obsidian': '#000000',
        'peach-wall': '#fcede1',
        'mint-wall': '#eefcef',
        'lavender-wall': '#e6def0',
        'deep-teal': '#186f64',
        'electric-violet': '#536eff',
        'royal-violet': '#644bc4',
        'sapphire-blue': '#154ea5',
      },
      /* Letter Typography */
      fontFamily: {
        'neufile': ['Neufile Grotesk Extended', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'albra': ['Albra Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'caption': ['13px', { lineHeight: '1.4' }],
        'body': ['16px', { lineHeight: '1.4' }],
        'subheading': ['22px', { lineHeight: '1.2', letterSpacing: '0.44px' }],
        'heading-sm': ['28px', { lineHeight: '1.3' }],
        'heading': ['46px', { lineHeight: '1.2', letterSpacing: '0.92px' }],
        'display': ['80px', { lineHeight: '1.1', letterSpacing: '1.6px' }],
      },
      /* Letter Spacing (4px base) */
      spacing: {
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
        '72': '72px',
      },
      /* Letter Border Radius — 2px max */
      borderRadius: {
        'sm': '2px',
        'md': '2px',
        'lg': '2px',
        'xl': '2px',
        '2xl': '2px',
        '3xl': '2px',
      },
      /* Layout widths — evita colisión con spacing numérico Letter (p. ej. w-72 ≠ 72px) */
      width: {
        sidebar: '18rem',
        'sidebar-collapsed': '5rem',
      },
    },
  },
  plugins: [],
};