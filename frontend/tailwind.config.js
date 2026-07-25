export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Oswald', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.125rem', letterSpacing: '0.04em' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem', letterSpacing: '0.03em' }],
        base: ['0.9375rem', { lineHeight: '1.5rem', letterSpacing: '0.02em' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem', letterSpacing: '0.02em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      letterSpacing: {
        tightest: '-0.02em',
        tighter: '-0.01em',
      },
      colors: {
        vital: {
          black: '#050608',
          charcoal: '#11131a',
          surface: '#141418',
          gold: '#ffe53d',
          glow: '#ffd600',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(255, 229, 61, 0.18)',
      },
      backdropBlur: {
        xl: '24px',
      },
    },
  },
  plugins: [],
};
