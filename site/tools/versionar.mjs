// Acrescenta ?v=<hash do conteúdo> aos CSS e JS locais de todas as páginas.
// A hospedagem manda o navegador guardar CSS/JS por 7 dias: sem versão no endereço, quem já visitou o site
// junta o HTML novo com o CSS/JS antigos e a página aparece quebrada. Com o hash, o endereço muda só quando
// o arquivo muda. Rode depois de qualquer alteração em assets/css ou assets/js:  node tools/versionar.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hashes = new Map();
const hashOf = (rel) => {
  if (!hashes.has(rel)) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) throw new Error(`Arquivo não encontrado: ${rel}`);
    hashes.set(rel, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10));
  }
  return hashes.get(rel);
};

for (const page of fs.readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const file = path.join(root, page);
  const html = fs.readFileSync(file, 'utf8');
  let n = 0;
  const out = html.replace(/(href|src)="(assets\/(?:css|js)\/[^"?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g, (_, attr, rel) => {
    n++;
    return `${attr}="${rel}?v=${hashOf(rel)}"`;
  });
  if (out !== html) fs.writeFileSync(file, out);
  console.log(`${page}: ${n} arquivo(s) versionado(s)`);
}
