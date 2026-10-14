// Gera dist/sincor-sc-home.html: um único arquivo, com CSS, JS, fonte e favicon embutidos.
// Abre com dois cliques, sem servidor (no file:// o navegador bloqueia fontes externas por CORS).
// Uso: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = (p) => path.join(root, 'src', p);
const sha256 = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;

let html = fs.readFileSync(src('index.html'), 'utf8');
let css = fs.readFileSync(src('assets/css/styles.css'), 'utf8');
const js = fs.readFileSync(src('assets/js/main.js'), 'utf8').trim();

// Fontes viram data URI
css = css.replace(/url\("\.\.\/fonts\/([^"]+)"\)/g, (_, file) =>
  `url("data:font/woff2;base64,${fs.readFileSync(src(`assets/fonts/${file}`)).toString('base64')}")`);

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
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

const replaceOnce = (input, search, replacement) => {
  if (!input.includes(search)) throw new Error(`Trecho não encontrado: ${search}`);
  return input.replace(search, () => replacement);
};

html = replaceOnce(html, '<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
html = replaceOnce(html, '<link rel="preload" href="assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>\n', '');
html = replaceOnce(html, '<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">', `<link rel="icon" href="${faviconUri}" type="image/svg+xml">`);
html = replaceOnce(html, '<link rel="stylesheet" href="assets/css/styles.css">', `<style>${css}</style>`);
html = replaceOnce(html, '<script src="assets/js/main.js" defer></script>', `<script>${js}</script>`);
html = html.replace(/<!-- \/?gen:[a-z]+ -->\n?/g, '');

const out = path.join(root, 'dist', 'sincor-sc-home.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`dist/sincor-sc-home.html: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
