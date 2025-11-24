/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        miku: {
          DEFAULT: '#39C5BB', // Primary Teal
          dark: '#289F97',    // Shadow/Hover
          light: '#A0E6E1',   // Light accent
        },
        magenta: {
          DEFAULT: '#E056FD', // Accent
          glow: '#FF85FF',
        },
        tech: {
          bg: '#0F172A',      // Deep Space
          panel: '#1E293B',   // Card BG
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
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 10px #39C5BB' },
          '50%': { opacity: .5, boxShadow: '0 0 20px #39C5BB' },
        }
      }
    },
  },
  plugins: [],
}
