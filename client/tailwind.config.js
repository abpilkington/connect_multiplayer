/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'connect-red': '#e53e3e',
        'connect-yellow': '#ecc94b',
        'board-blue': '#2d3748',
        'board-dark': '#1a202c',
      },
      spacing: {
        'board-cell': '5rem', // 80px
        'board-gap': '0.75rem', // 12px
        'board-padding': '1.5rem', // 24px
      },
      width: {
        'board-cell': '5rem', // 80px
        'board-container': '35rem', // 560px
      },
      height: {
        'board-cell': '5rem', // 80px
        'board-header': '3rem', // 48px
      },
      animation: {
        'drop': 'drop 0.5s ease-in-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        drop: {
          '0%': { transform: 'translateY(-100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

