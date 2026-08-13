import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0A0A',
        void: '#0A0A0A',
        surface: '#121214',
        panel: '#121214',
        raised: '#1A1A1E',
        lime: '#A3E635',
        signal: '#A3E635',
        red: '#EF4444',
        bad: '#EF4444',
        good: '#A3E635',
        ink: '#FFFFFF',
        dim: '#9CA3AF',
        faint: 'rgba(156, 163, 175, 0.55)',
        line: 'rgba(255, 255, 255, 0.08)',
        line2: 'rgba(255, 255, 255, 0.16)',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Inter', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      boxShadow: {
        'glow-lime': '0 0 25px rgba(163, 230, 53, 0.18)',
        'glow-lime-lg': '0 0 35px rgba(163, 230, 53, 0.28)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.15)',
      },
      maxWidth: {
        shell: '1280px',
      },
      borderRadius: {
        DEFAULT: '8px',
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};

export default config;

