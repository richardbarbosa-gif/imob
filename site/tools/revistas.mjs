// Monta a lista de revistas a partir de tools/revistas.json, em dois lugares:
//   revistas.html: destaque (edição mais recente), edições anteriores e especiais;
//   index.html: vitrine da Home (seção #revistas).
// Uso: node tools/revistas.mjs   (depois: node tools/versionar.mjs)
// Só reescreve o que está entre os marcadores <!-- revistas:x --> e <!-- /revistas:x -->.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dados = JSON.parse(fs.readFileSync(path.join(root, 'tools/revistas.json'), 'utf8'));
const edicoes = [...dados.edicoes].sort((a, b) => b.num - a.num);
const [atual, ...anteriores] = edicoes;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (n) => `Nº ${String(n).padStart(2, '0')}`;
const SETA = ''; // sem seta nos botões (pedido do cliente)
const _SETA_ANTIGA = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8M17 7v9"/></svg>';
const NOVA_ABA = '<span class="sr-only"> (abre o leitor digital em nova aba)</span>';
const externo = (link) => `href="${esc(link)}" target="_blank" rel="noopener noreferrer"`;
const capa = (nome, { lazy = true, cls = '' } = {}) =>
  `<img${cls ? ` class="${cls}"` : ''} src="imagens/revistas/${nome}-360.webp" srcset="imagens/revistas/${nome}-360.webp 1x, imagens/revistas/${nome}-720.webp 2x" alt="" width="360" height="480"${lazy ? ' loading="lazy"' : ''} decoding="async">`;

for (const r of [...edicoes, ...dados.especiais]) {
  for (const w of [360, 720]) {
    if (!fs.existsSync(path.join(root, `imagens/revistas/${r.capa}-${w}.webp`))) throw new Error(`Capa não encontrada: ${r.capa}-${w}.webp (rode tools/capas.py)`);
  }
}

function cartao(r, rotulo, ind) {
  return `${ind}<li>
${ind}  <a class="revista" ${externo(r.link)}>
${ind}    <span class="revista__capa">${capa(r.capa)}</span>
${ind}    <span class="revista__num">${esc(rotulo)}</span>
${ind}    <span class="revista__titulo">${esc(r.titulo)}</span>
${ind}    <span class="revista__cta">Ler on-line${SETA}${NOVA_ABA}</span>
${ind}  </a>
${ind}</li>`;
}

const blocos = {
  destaque: `
        <article class="rev-destaque stage-spotlight" aria-labelledby="rev-atual-t">
          <div class="light-beam-gold" aria-hidden="true"></div>
          <a class="rev-destaque__capa" ${externo(atual.link)} tabindex="-1" aria-hidden="true">
            <img src="imagens/revistas/${atual.capa}-720.webp" alt="" width="360" height="480" decoding="async">
          </a>
          <div class="rev-destaque__info">
            <p class="rev-destaque__tag">Edição mais recente</p>
            <p class="rev-destaque__num">${num(atual.num)} · ${esc(atual.data)}</p>
            <h2 class="rev-destaque__titulo" id="rev-atual-t">${esc(atual.titulo)}</h2>
            ${atual.resumo ? `<p class="rev-destaque__resumo">${esc(atual.resumo)}</p>` : ''}
            <a class="rev-destaque__cta" ${externo(atual.link)}>Ler a revista on-line${SETA}${NOVA_ABA}</a>
            <p class="rev-destaque__nota">A revista abre no leitor digital, com as páginas em sequência, no computador ou no celular.</p>
          </div>
        </article>
        `,
  lista: `
        <ul class="revistas">
${anteriores.map((r) => cartao(r, `${num(r.num)} · ${r.data}`, '          ')).join('\n')}
        </ul>
        `,
  especiais: `
        <ul class="revistas revistas--especiais">
${dados.especiais.map((r) => cartao(r, r.rotulo, '          ')).join('\n')}
        </ul>
        `,
  home: `
    <div class="rev-home">
      <div class="rev-home__texto">
        <p class="rev-home__kicker">Revista do Sincor SC · ${num(atual.num)} · ${esc(atual.data)}</p>
        <h2 class="rev-home__titulo">${esc(atual.titulo)}</h2>
        ${atual.resumo ? `<p class="rev-home__resumo">${esc(atual.resumo)}</p>` : ''}
        <p class="rev-home__resumo">Leia a versão on-line das revistas do Sincor SC: ${edicoes.length} edições e ${dados.especiais.length} publicações especiais no acervo.</p>
        <div class="rev-home__acoes">
          <a class="rev-home__cta" ${externo(atual.link)}>Ler a edição ${num(atual.num)}${SETA}${NOVA_ABA}</a>
          <a class="rev-home__link" href="revistas.html">Ver todas as revistas</a>
        </div>
      </div>
      <a class="rev-home__pilha" href="revistas.html" tabindex="-1" aria-hidden="true">
${edicoes.slice(0, 3).reverse().map((r, i) => `        ${capa(r.capa, { cls: `rev-home__capa rev-home__capa--${3 - i}` })}`).join('\n')}
      </a>
    </div>
    `,
};

const alvos = { 'revistas.html': ['destaque', 'lista', 'especiais'], 'index.html': ['home'] };
for (const [arquivo, nomes] of Object.entries(alvos)) {
  const file = path.join(root, arquivo);
  let html = fs.readFileSync(file, 'utf8');
  for (const nome of nomes) {
    const re = new RegExp(`(<!-- revistas:${nome} -->)[\\s\\S]*?(<!-- /revistas:${nome} -->)`);
    if (!re.test(html)) throw new Error(`Marcador revistas:${nome} não encontrado em ${arquivo}`);
    html = html.replace(re, (_, a, b) => `${a}${blocos[nome]}${b}`);
  }
  if (/style="/.test(blocos.home)) throw new Error('style="" não é permitido');
  fs.writeFileSync(file, html);
  console.log(`${arquivo}: ${nomes.join(', ')} atualizados`);
}
