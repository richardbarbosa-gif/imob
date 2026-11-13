// Monta as listas das páginas institucionais a partir dos JSON (texto idêntico ao do site original):
//   diretoria.html            <- tools/diretoria.json   (marcador <!-- inst:diretoria -->)
//   convencoes-coletivas.html <- tools/convencoes.json  (marcadores <!-- inst:anos-nav --> e <!-- inst:convencoes -->)
// Uso: node tools/institucional.mjs   (depois: node tools/versionar.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const esc = (s) => String(s).replace(/\s+/g, ' ').trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tamanho = (rel) => {
  const kb = fs.statSync(path.join(root, rel)).size / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(kb))} KB`;
};
const PDF = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
const RELOGIO = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M12 7v5l3 2"/></svg>';
const ABRIR = ''; // sem seta nos botões (pedido do cliente)
const _ABRIR_ANTIGA = '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8M17 7v9"/></svg>';

// ---------- Diretoria ----------
function diretoria() {
  const d = ler('tools/diretoria.json');
  return d.secoes.map((s, i) => {
    const id = `sec-${i + 1}`;
    if (s.regioes) {
      return `
        <section class="dir-secao" aria-labelledby="${id}">
          <div class="sec-title mb-6"><span class="sec-title__bar" aria-hidden="true"></span><h2 id="${id}">${esc(s.titulo)}</h2></div>
          <ul class="dir-regioes">
${s.regioes.map((r) => `            <li>${esc(r)}</li>`).join('\n')}
          </ul>
        </section>`;
    }
    const cards = s.pessoas.map((p) => {
      const foto = `imagens/diretoria/${p.foto}.webp`;
      if (!fs.existsSync(path.join(root, foto))) throw new Error(`Foto não encontrada: ${foto}`);
      const destaque = p.cargo === 'Presidente' ? ' dir-pessoa--destaque' : '';
      return `            <li class="dir-pessoa${destaque}">
              <img class="dir-pessoa__foto" src="${foto}" alt="" width="320" height="320" loading="lazy" decoding="async">
              <h3 class="dir-pessoa__nome">${esc(p.nome)}${p.cidade ? `<span class="dir-pessoa__cidade">(${esc(p.cidade)})</span>` : ''}</h3>
              ${p.cargo ? `<p class="dir-pessoa__cargo">${esc(p.cargo)}</p>` : ''}
            </li>`;
    }).join('\n');
    return `
        <section class="dir-secao" aria-labelledby="${id}">
          <div class="sec-title mb-6"><span class="sec-title__bar" aria-hidden="true"></span><h2 id="${id}">${esc(s.titulo)}</h2></div>
          <ul class="dir-grade">
${cards}
          </ul>
        </section>`;
  }).join('\n') + '\n        ';
}

// ---------- Convenções coletivas ----------
function convencoes() {
  const d = ler('tools/convencoes.json');
  const nav = `
          <nav class="cct-anos" aria-label="Convenções por ano">
            <ul>
${d.anos.map((a) => `              <li><a href="#cct-${a.ano}">${a.ano}</a></li>`).join('\n')}
            </ul>
          </nav>
          `;
  const anos = d.anos.map((a, i) => {
    const docs = a.documentos.map((doc) => {
      if (!doc.arquivo) {
        return `              <li class="cct-doc cct-doc--texto">
                <span class="cct-doc__icone">${RELOGIO}</span>
                <span class="cct-doc__titulo">${esc(doc.titulo)}</span>
              </li>`;
      }
      if (!fs.existsSync(path.join(root, doc.arquivo))) throw new Error(`PDF não encontrado: ${doc.arquivo}`);
      return `              <li>
                <a class="cct-doc" href="${esc(doc.arquivo)}" target="_blank" rel="noopener">
                  <span class="cct-doc__icone">${PDF}</span>
                  <span class="cct-doc__titulo">${esc(doc.titulo)}</span>
                  <span class="cct-doc__meta">PDF · ${tamanho(doc.arquivo)}${ABRIR}</span>
                  <span class="sr-only"> (abre o PDF em nova aba)</span>
                </a>
              </li>`;
    }).join('\n');
    const obs = a.observacao ? `
            <div class="cct-obs">
              <p><strong>${esc(a.observacao.titulo)}</strong></p>
              <p>${esc(a.observacao.texto)} <a href="mailto:${esc(a.observacao.email)}"><strong>${esc(a.observacao.email)}</strong></a></p>
            </div>` : '';
    const comPdf = a.documentos.filter((x) => x.arquivo).length;
    return `
          <details class="cct-ano" id="cct-${a.ano}"${i === 0 ? ' open' : ''}>
            <summary><span class="cct-ano__ano">${a.ano}</span><span class="cct-ano__qtd">${comPdf} ${comPdf === 1 ? 'documento' : 'documentos'}</span></summary>
            ${a.destaque ? `<p class="cct-piso"><strong>${esc(a.destaque)}</strong></p>` : ''}
            <ul class="cct-docs">
${docs}
            </ul>${obs}
          </details>`;
  }).join('\n') + '\n          ';
  return { nav, anos };
}

function aplicar(arquivo, blocos) {
  const file = path.join(root, arquivo);
  let html = fs.readFileSync(file, 'utf8');
  for (const [nome, conteudo] of Object.entries(blocos)) {
    const re = new RegExp(`(<!-- inst:${nome} -->)[\\s\\S]*?(<!-- /inst:${nome} -->)`);
    if (!re.test(html)) throw new Error(`Marcador inst:${nome} não encontrado em ${arquivo}`);
    if (/style="/.test(conteudo)) throw new Error('style="" não é permitido');
    html = html.replace(re, (_, a, b) => `${a}${conteudo}${b}`);
  }
  fs.writeFileSync(file, html);
  console.log(`${arquivo}: ${Object.keys(blocos).join(', ')} atualizados`);
}

// ---------- Home: diretoria executiva + regiões (mesmo JSON da página) ----------
function homeDiretoria() {
  const d = ler('tools/diretoria.json');
  const exec = d.secoes.find((s) => s.titulo === 'Diretoria Executiva');
  const reg = d.secoes.find((s) => s.regioes);
  return `
        <div class="home-dir__topo">
          <p class="home-dir__kicker">Sobre nós</p>
          <h3 class="home-dir__titulo">Diretoria Executiva</h3>
        </div>
        <ul class="home-dir__lista">
${exec.pessoas.map((p) => `          <li><img src="imagens/diretoria/${p.foto}.webp" alt="" width="320" height="320" loading="lazy" decoding="async"><span><strong>${esc(p.nome)}</strong><small>${esc(p.cargo)}${p.cidade ? ` · ${esc(p.cidade)}` : ''}</small></span></li>`).join('\n')}
        </ul>
        <p class="home-dir__sub">${esc(reg.titulo)}</p>
        <ul class="home-dir__regioes">
${reg.regioes.map((r) => `          <li>${esc(r)}</li>`).join('\n')}
        </ul>
        <a class="home-dir__cta" href="diretoria.html">Conheça a diretoria completa</a>
      `;
}

aplicar('diretoria.html', { diretoria: diretoria() });
aplicar('index.html', { 'home-diretoria': homeDiretoria() });
const c = convencoes();
aplicar('convencoes-coletivas.html', { 'anos-nav': c.nav, convencoes: c.anos });
