// Tema do Tailwind: cores, fontes e sombras da marca, compartilhado por todas as páginas.
// O CSS é compilado uma vez (npm run css) e servido pronto em assets/css/tailwind.css,
// em vez de o navegador do visitante montar o CSS pelo CDN a cada visita.
// Versão fixa em 3.4.17, a mesma que o CDN servia: o resultado visual é idêntico.
module.exports = {
  content: [
    '../*.html',
    '../*.php',
    '../inc/*.php',
    '../assets/js/*.js',
    './*.mjs',
    './*.json',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Cinzel"', 'serif'],
      },
      colors: {
        sincor: {
          950: '#030d1f',
          900: '#071d49',
          800: '#0c2d6b',
          700: '#154294',
          gold: '#d4962a',
          goldLight: '#f1c266',
          goldDark: '#a87214',
          cream: '#f9f6f0',
        },
      },
      boxShadow: {
        editorial: '0 12px 40px -12px rgba(7, 29, 73, 0.10)',
        'editorial-hover': '0 22px 50px -12px rgba(7, 29, 73, 0.18)',
        'gold-glow': '0 10px 30px -5px rgba(212, 150, 42, 0.40)',
      },
    },
  },
  plugins: [],
};
