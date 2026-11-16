import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dz: {
          bg: '#080A0F',
          surface: '#0E131D',
          card: '#131A28',
          border: '#1F2A3E',
          accent: '#F59E0B',
          lime: '#A3E635',
          cyan: '#22D3EE',
        },
        rarity: {
          milspec: '#4B69FF',
          restricted: '#8847FF',
          classified: '#D32CE6',
          covert: '#EB4B4B',
          gold: '#F59E0B',
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-amber': '0 0 28px -4px rgba(245, 158, 11, 0.35)',
        'glow-cyan': '0 0 28px -4px rgba(34, 211, 238, 0.3)',
        'glow-covert': '0 0 28px -4px rgba(235, 75, 75, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
