// Copia o cabeçalho e o rodapé da Home (index.html) para as outras páginas do site.
// A Home é a fonte: edite o menu, o cabeçalho ou o rodapé lá e rode:  node tools/sync-layout.mjs
// Nas outras páginas, os links internos (#secao) passam a apontar para index.html#secao
// e o que está entre <!-- so-na-home --> e <!-- /so-na-home --> é removido.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = ['seja-associado.html', 'seja-associado-pessoa-fisica.html', 'seja-associado-pessoa-juridica.html'];
const REGIONS = ['topo', 'rodape'];

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function region(html, name, file) {
  const re = new RegExp(`([ \\t]*<!-- layout:${name}\\b[^>]*-->)([\\s\\S]*?)([ \\t]*<!-- /layout:${name} -->)`);
  const match = html.match(re);
  if (!match) throw new Error(`Marcador layout:${name} não encontrado em ${file}`);
  return { re, match };
}

const forSubpage = (html) => html
  .replace(/[ \t]*<!-- so-na-home\b[\s\S]*?<!-- \/so-na-home -->\n?/g, '')
  .replace(/href="#home"/g, 'href="index.html"')
  .replace(/href="#([a-z][\w-]*)"/g, 'href="index.html#$1"');

for (const page of PAGES) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  for (const name of REGIONS) {
    const source = region(home, name, 'index.html').match[2];
    const { re } = region(html, name, page);
    html = html.replace(re, (_, open, __, close) => `${open}${forSubpage(source)}${close}`);
  }
  fs.writeFileSync(file, html);
  console.log(`${page}: cabeçalho e rodapé sincronizados`);
}
