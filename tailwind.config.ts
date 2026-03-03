import type { Config } from 'tailwindcss'

export default <Config>{
  content: [],
  theme: {
    extend: {
      colors: {
        'taxi-yellow': '#F7C600',
        'taxi-gold': '#D4A900',
        'taxi-dark': '#0D0D0D',
        'taxi-darker': '#070707',
        'taxi-gray': '#1A1A1A',
        'taxi-light': '#2A2A2A',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
}
