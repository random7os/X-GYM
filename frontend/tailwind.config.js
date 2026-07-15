export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
