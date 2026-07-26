/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.{vue,js,ts,jsx,tsx}',
    './plugins/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['DM Sans', 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // MiniMax typography scale
        'hero': ['80px', { lineHeight: '1.10', letterSpacing: '-2px', fontWeight: '600' }],
        'display-lg': ['56px', { lineHeight: '1.10', letterSpacing: '-1.5px', fontWeight: '600' }],
        'heading-lg': ['40px', { lineHeight: '1.20', letterSpacing: '-1px', fontWeight: '600' }],
        'heading-md': ['32px', { lineHeight: '1.25', letterSpacing: '-0.5px', fontWeight: '600' }],
        'heading-sm': ['24px', { lineHeight: '1.30', fontWeight: '600' }],
        'card-title': ['20px', { lineHeight: '1.40', fontWeight: '600' }],
        'subtitle': ['18px', { lineHeight: '1.50', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.50', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.50', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.70', fontWeight: '400' }],
        'micro': ['12px', { lineHeight: '1.50', fontWeight: '400' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // MiniMax Brand Colors
        brand: {
          coral: 'hsl(var(--brand-coral))',
          magenta: 'hsl(var(--brand-magenta))',
          blue: 'hsl(var(--brand-blue))',
          'blue-deep': 'hsl(var(--brand-blue-deep))',
          cyan: 'hsl(var(--brand-cyan))',
          purple: 'hsl(var(--brand-purple))',
          'blue-200': 'hsl(var(--brand-blue-200))',
        },
        // MiniMax Extended Text
        slate: 'hsl(var(--slate))',
        stone: 'hsl(var(--stone))',
        'muted-text': 'hsl(var(--muted-text))',
        'hairline-soft': 'hsl(var(--hairline-soft))',
        // Semantic
        'success-bg': 'hsl(var(--success-bg))',
        'success-text': 'hsl(var(--success-text))',
      },
      borderRadius: {
        // MiniMax scale: match shadcn formulas
        lg: 'var(--radius)',          /* 12px */
        md: 'calc(var(--radius) - 4px)', /* 8px */
        sm: 'calc(var(--radius) - 6px)', /* 6px */
        // Extra MiniMax tokens (not in shadcn)
        xl: '16px',
        xxl: '20px',
        xxxl: '24px',
        hero: '32px',
      },
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        'xxl': '32px',
        'xxxl': '40px',
        'section-sm': '48px',
        'section': '64px',
        'section-lg': '80px',
        'hero': '96px',
      },
    },
  },
  plugins: [],
}
