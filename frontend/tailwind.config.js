/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode (or theme-based)
  theme: {
    extend: {
      colors: {
        miku: {
          DEFAULT: 'rgb(var(--color-miku) / <alpha-value>)',
          dark: 'rgb(var(--color-miku-dark) / <alpha-value>)',
          light: 'rgb(var(--color-miku-light) / <alpha-value>)',
        },
        magenta: {
          DEFAULT: '#E91E63',
          glow: '#FF85FF',
        },
        tech: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          panel: 'rgb(var(--color-panel) / <alpha-value>)',
        },
        theme: {
          text: 'rgb(var(--color-text) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 10px rgb(var(--color-miku))' },
          '50%': { opacity: .5, boxShadow: '0 0 20px rgb(var(--color-miku))' },
        }
      }
    },
  },
  plugins: [],
}
