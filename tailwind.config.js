/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Expedition (Historical Academy) theme tokens — backed by CSS vars
        border: 'var(--exp-border)',
        input: 'var(--exp-input)',
        ring: 'var(--exp-ring)',
        background: 'var(--exp-background)',
        foreground: 'var(--exp-foreground)',
        primary: {
          DEFAULT: 'var(--exp-primary)',
          foreground: 'var(--exp-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--exp-secondary)',
          foreground: 'var(--exp-secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--exp-muted)',
          foreground: 'var(--exp-muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--exp-accent)',
          foreground: 'var(--exp-accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--exp-destructive)',
          foreground: 'var(--exp-destructive-foreground)',
        },
        card: {
          DEFAULT: 'var(--exp-card)',
          foreground: 'var(--exp-card-foreground)',
        },
      },
    },
  },
  plugins: [],
};
