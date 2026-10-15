// Gera os arquivos únicos de dist/: CSS, JS, fonte, imagens e favicon embutidos.
// Abrem com dois cliques, sem servidor (no file:// o navegador bloqueia fontes externas por CORS).
// Uso: node build.mjs            (as duas versões)
//      node build.mjs telao      (só uma: "classica" ou "telao")
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const sha256 = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;
const MIME = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml' };

const VARIANTS = {
  classica: {
    dir: 'src', css: 'assets/css/styles.css', js: 'assets/js/main.js', out: 'sincor-sc-home.html',
    // Cotações: moedas (AwesomeAPI), indicadores (Banco Central) e Ibovespa (brapi)
    connect: 'https://economia.awesomeapi.com.br https://api.bcb.gov.br https://brapi.dev',
  },
  telao: {
    dir: 'src-telao', css: 'assets/css/telao.css', js: 'assets/js/telao.js', out: 'sincor-sc-home-telao.html',
    // Dólar (AwesomeAPI) e Selic (Banco Central, com a BrasilAPI de reserva)
    connect: 'https://economia.awesomeapi.com.br https://api.bcb.gov.br https://brasilapi.com.br',
  },
};

const replaceOnce = (input, search, replacement) => {
  if (!input.includes(search)) throw new Error(`Trecho não encontrado: ${search}`);
  return input.replace(search, () => replacement);
};

function build(name) {
  const v = VARIANTS[name];
  const src = (p) => path.join(root, v.dir, p);
  let html = fs.readFileSync(src('index.html'), 'utf8');
  let css = fs.readFileSync(src(v.css), 'utf8');
  const js = fs.readFileSync(src(v.js), 'utf8').trim();

  // Fontes e imagens referenciadas no CSS viram data URI (cada arquivo entra uma única vez)
  const cssDir = path.dirname(src(v.css));
  css = css.replace(/url\("(\.\.\/[^"]+)"\)/g, (_, rel) => {
    const file = path.resolve(cssDir, rel);
    const ext = path.extname(file).slice(1);
    if (!MIME[ext]) throw new Error(`Tipo sem MIME: ${rel}`);
    return `url("data:${MIME[ext]};base64,${fs.readFileSync(file).toString('base64')}")`;
  });

  // Minificação conservadora do CSS (sem tocar em espaços de calc/seletores)
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

  if (/\sstyle="/.test(html)) throw new Error('Há atributo style="" no HTML: a CSP por hash vai bloquear. Use classes.');

  const favicon = fs.readFileSync(src('assets/img/favicon.svg'), 'utf8').trim();
  const faviconUri = `data:image/svg+xml,${encodeURIComponent(favicon)}`;

  const csp = [
    "default-src 'none'",
    `style-src ${sha256(css)}`,
    `script-src ${sha256(js)}`,
    'img-src data:',
    'font-src data:',
    `connect-src ${v.connect}`,
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; ');

  html = replaceOnce(html, '<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
  html = replaceOnce(html, '<link rel="preload" href="assets/fonts/schibsted-grotesk-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>\n', '');
  html = replaceOnce(html, '<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">', `<link rel="icon" href="${faviconUri}" type="image/svg+xml">`);
  html = replaceOnce(html, `<link rel="stylesheet" href="${v.css}">`, `<style>${css}</style>`);
  html = replaceOnce(html, `<script src="${v.js}" defer></script>`, `<script>${js}</script>`);
  html = html.replace(/<!-- \/?gen:[a-z]+ -->\n?/g, '');

  const out = path.join(root, 'dist', v.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`dist/${v.out}: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

const only = process.argv[2];
if (only && !VARIANTS[only]) throw new Error(`Versão desconhecida: ${only} (use ${Object.keys(VARIANTS).join(' ou ')})`);
(only ? [only] : Object.keys(VARIANTS)).forEach(build);
