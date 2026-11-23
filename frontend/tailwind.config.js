/** @type {import('tailwindcss').Config} */
// Paleta "Evergrid" do Cobrei. slate e emerald são remapeados para os tons
// quentes/floresta para que todas as telas herdem a identidade sem mudar classes.
const creme = '#F3F1EA';
const floresta = '#1F3D2B';
const limao = '#B5D96A';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        creme: { DEFAULT: creme, claro: '#F8F6F0', escuro: '#ECE8DD' },
        floresta: { DEFAULT: floresta, 800: '#24472F', 700: '#2B5238', 900: '#16301F' },
        limao: { DEFAULT: limao, 500: '#9CC255', suave: '#E6F2D9', dourado: '#C9B458' },
        verde: { DEFAULT: '#3F7A4F', escuro: '#2F5E2A' },
        oliva: { DEFAULT: '#6B6A5E', claro: '#9A988A' },
        borda: { DEFAULT: '#E7E3D8', fina: '#EEEAE0' },
        critico: { bg: '#FBE4DF', fg: '#9A3324' },
        atencao: { bg: '#FBF0D3', fg: '#8A6A12' },
        emdia: { bg: '#E6F2D9', fg: '#2F5E2A' },
        slate: {
          50: creme,
          100: '#EEEAE0',
          200: '#E7E3D8',
          300: '#D6D1C2',
          400: '#9A988A',
          500: '#6B6A5E',
          600: '#57564B',
          700: '#3F3E35',
          800: '#2C2C25',
          900: '#1B2A20',
        },
        rose: { 50: '#FBE4DF', 100: '#FBE4DF', 200: '#F2C4B9', 400: '#D2553F', 500: '#C0472F', 600: '#9A3324', 700: '#82291C' },
        amber: { 50: '#FBF0D3', 100: '#FBF0D3', 500: '#E9C46A', 600: '#8A6A12', 700: '#8A6A12' },
        emerald: {
          50: '#F0F6E6',
          100: '#E6F2D9',
          200: '#CFE6B4',
          300: limao,
          400: '#8BD43F',
          500: '#3F7A4F',
          600: floresta,
          700: '#2F5E2A',
          800: '#16301F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 0 rgba(31,61,43,0.03)',
        pop: '0 24px 48px -16px rgba(31,61,43,0.25)',
      },
      keyframes: {
        'slide-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: { 'slide-in': 'slide-in .2s ease-out', 'fade-in': 'fade-in .15s ease-out' },
    },
  },
  plugins: [],
};
