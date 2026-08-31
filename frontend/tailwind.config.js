/** @type {import('tailwindcss').Config} */
// Design tokens — "Дәптер": a dark physics notebook. Ink background with a faint
// millimetre grid, amber marker as the single loud accent, sky-blue for anything
// "formula / AI", warm paper-white text.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0A0D14',
        surface: '#11151F',
        'surface-2': '#181D2A',
        'surface-3': '#212739',
        primary: '#FFB020',
        'primary-dim': 'rgba(255,176,32,0.14)',
        'primary-ink': '#1A1200',
        secondary: '#5EC8FF',
        'secondary-dim': 'rgba(94,200,255,0.14)',
        success: '#3DDC97',
        warning: '#FFD166',
        danger: '#FF5C5C',
        'text-1': '#F4F1EA',
        'text-2': '#9AA0B4',
        'text-3': '#5C6379',
        border: 'rgba(244,241,234,0.08)',
        'border-strong': 'rgba(244,241,234,0.14)',
      },
      fontFamily: {
        sans: ['"Golos Text"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Unbounded', '"Golos Text"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '2xl': '1.125rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'rise': 'rise 0.45s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideDown: { from: { transform: 'translateY(-12px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { from: { transform: 'scale(0.96)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        rise: { from: { transform: 'translateY(14px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(255,176,32,0.28)',
        'glow-secondary': '0 0 24px rgba(94,200,255,0.25)',
        'glow-success': '0 0 20px rgba(61,220,151,0.3)',
        'card': '0 6px 24px rgba(0,0,0,0.35)',
        'sheet': '0 -12px 40px rgba(0,0,0,0.6)',
        'hairline': 'inset 0 1px 0 rgba(244,241,234,0.06)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FFB020 0%, #FF7A3D 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #5EC8FF 0%, #3DDC97 100%)',
        'gradient-success': 'linear-gradient(135deg, #3DDC97 0%, #38F9D7 100%)',
        'gradient-card': 'linear-gradient(180deg, #181D2A 0%, #11151F 100%)',
        'gradient-hero': 'radial-gradient(120% 140% at 0% 0%, rgba(255,176,32,0.22) 0%, rgba(17,21,31,0.6) 45%, rgba(10,13,20,0.9) 100%)',
        'shimmer-bg': 'linear-gradient(90deg, #11151F 25%, #181D2A 50%, #11151F 75%)',
      },
    },
  },
  plugins: [],
}
