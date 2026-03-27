/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#020617',
          card: '#0f172a',
          border: '#1e293b',
          muted: '#94a3b8',
        },
      },
      boxShadow: {
        card: '0 10px 30px rgba(2, 6, 23, 0.35)',
      },
    },
  },
  plugins: [],
};
