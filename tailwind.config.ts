import type { Config } from 'tailwindcss';

// Tokens copied 1:1 from the design prototype's styles.css :root block.
// Do not "improve" these — they are the approved visual language.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0b0d',
        panel: '#14171c',
        raised: '#1c2027',
        line: 'rgba(255,255,255,.07)',
        line2: 'rgba(255,255,255,.14)',
        ink: '#eef0f3',
        dim: 'rgba(238,240,243,.58)',
        faint: 'rgba(238,240,243,.32)',
        signal: '#ff9f1c',
        good: '#2bd576',
        partial: '#ffd166',
        bad: '#ff5c5c',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Arial', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      maxWidth: {
        shell: '1280px',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
};

export default config;
