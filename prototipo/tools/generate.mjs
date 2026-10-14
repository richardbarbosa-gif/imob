// Gera os SVGs embutidos no protótipo e injeta em src/index.html,
// entre os marcadores <!-- gen:nome --> e <!-- /gen:nome -->.
// Uso: cd prototipo/tools && npm install && npm run generate
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import brazil from '@svg-maps/brazil';
import { siFacebook, siInstagram, siYoutube, siWhatsapp } from 'simple-icons';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../src/index.html');
const r = n => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ */
/* Ícones: só entram no sprite os que o HTML realmente usa            */
/* ------------------------------------------------------------------ */
const brandIcons = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  whatsapp: siWhatsapp.path,
  // LinkedIn não está no simple-icons; glifo "in" desenhado à mão.
  linkedin: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z',
};

function sprite(html, arts = []) {
  const used = [...new Set([...html.matchAll(/href="#i-([a-z0-9-]+)"/g)].map(m => m[1]))].sort();
  const symbols = used.map(name => {
    if (brandIcons[name]) {
      return `<symbol id="i-${name}" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="${brandIcons[name]}"/></symbol>`;
    }
    const file = path.join(here, 'node_modules/lucide-static/icons', `${name}.svg`);
    if (!fs.existsSync(file)) throw new Error(`Ícone inexistente: ${name}`);
    const inner = fs.readFileSync(file, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>[\s\S]*$/, '')
      .replace(/\s*\n\s*/g, '')
      .replace(/\s\/>/g, '/>');
    return `<symbol id="i-${name}" viewBox="0 0 24 24">${inner}</symbol>`;
  });
  return `<svg class="sprite" aria-hidden="true" focusable="false">${symbols.join('')}${arts.join('')}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Ilustração: ponte pênsil inspirada na Ponte Hercílio Luz (noite)   */
/* ------------------------------------------------------------------ */
function bridge() {
  const W = 1200, H = 500, k = 1.35;
  const DECK = 330, CX = 930, HALF = 170 * k;
  const TOP = DECK - 90 * k, WATER = DECK + 60 * k, LOW = DECK - 4;
  const TL = CX - HALF, TR = CX + HALF;
  const chainY = x => LOW - (LOW - TOP) * ((x - CX) / HALF) ** 2;

  const pts = [];
  for (let x = TL; x <= TR + 0.01; x += 6) pts.push([x, chainY(x)]);
  const chain = 'M' + pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L');

  const N = 22, step = (TR - TL) / N;
  let truss = '', verticals = '', lights = '';
  for (let i = 0; i <= N; i++) {
    const x = TL + i * step;
    if (i > 0 && i < N) {
      verticals += `M${r(x)} ${r(chainY(x))}V${DECK}`;
      lights += `<circle cx="${r(x)}" cy="${r(chainY(x))}" r="2"/>`;
    }
    if (i < N) {
      const x2 = x + step;
      truss += i % 2 === 0
        ? `M${r(x)} ${r(chainY(x))}L${r(x2)} ${DECK}`
        : `M${r(x)} ${DECK}L${r(x2)} ${r(chainY(x2))}`;
    }
  }

  // Vãos laterais (corrente descendo da torre até a ancoragem) + pendurais
  const sides = [[TL, TL - 150 * k], [TR, TR + 150 * k]];
  const quad = (a, b, c, t) => (1 - t) ** 2 * a + 2 * (1 - t) * t * b + t ** 2 * c;
  let sideChains = '', hangers = '';
  for (const [x0, x1] of sides) {
    const qx = x0 + (x1 - x0) * 0.55, qy = TOP + (DECK - TOP) * 0.62;
    sideChains += `M${r(x0)} ${r(TOP)}Q${r(qx)} ${r(qy)} ${r(x1)} ${DECK - 2}`;
    for (let t = 0.09; t < 0.95; t += 0.09) {
      hangers += `M${r(quad(x0, qx, x1, t))} ${r(quad(TOP, qy, DECK - 2, t))}V${DECK}`;
    }
  }

  // Tabuleiro treliçado (toda a extensão)
  let deckTruss = '';
  for (let x = -12, n = 0; x < W + 12; x += 14, n++) {
    deckTruss += n % 2 === 0 ? `M${x} ${DECK}L${x + 14} ${DECK + 8}` : `M${x} ${DECK + 8}L${x + 14} ${DECK}`;
  }
  for (let x = 10; x < W; x += 26) lights += `<circle cx="${x}" cy="${DECK - 1}" r="1.3"/>`;

  // Torres treliçadas
  let towers = '', braces = '';
  for (const x of [TL, TR]) {
    const bw = 11, tw = 6, y0 = WATER, y1 = TOP - 8, seg = 9;
    towers += `M${r(x - bw)} ${r(y0)}L${r(x - tw)} ${r(y1)}M${r(x + bw)} ${r(y0)}L${r(x + tw)} ${r(y1)}M${r(x - tw - 4)} ${r(y1)}H${r(x + tw + 4)}`;
    for (let i = 0; i < seg; i++) {
      const ya = y0 - (y0 - y1) * (i / seg), yb = y0 - (y0 - y1) * ((i + 1) / seg);
      const wa = bw - (bw - tw) * (i / seg), wb = bw - (bw - tw) * ((i + 1) / seg);
      braces += `M${r(x - wa)} ${r(ya)}L${r(x + wb)} ${r(yb)}M${r(x + wa)} ${r(ya)}L${r(x - wb)} ${r(yb)}`;
    }
    lights += `<circle cx="${r(x)}" cy="${r(y1 - 3)}" r="2.6"/>`;
  }

  // Reflexo da corrente na água (espelhado e tracejado)
  const mirror = 'M' + pts.map(([x, y]) => `${r(x)} ${r(2 * WATER - y)}`).join('L');

  // Morros (continente à esquerda; ilha e Morro da Cruz à direita) + luzes da cidade
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hillBack = `M0 ${DECK + 52}C120 ${DECK + 30} 210 ${DECK - 6} 330 ${DECK - 2}C430 ${DECK + 2} 470 ${DECK + 28} 560 ${DECK + 30}C640 ${DECK + 32} 700 ${DECK + 12} 780 ${DECK + 8}C860 ${DECK + 4} 900 ${DECK - 34} 990 ${DECK - 46}C1060 ${DECK - 56} 1120 ${DECK - 40} 1200 ${DECK - 24}V${WATER}H0Z`;
  const hillFront = `M0 ${DECK + 66}C90 ${DECK + 58} 170 ${DECK + 44} 260 ${DECK + 48}C350 ${DECK + 52} 420 ${DECK + 66} 520 ${DECK + 70}H1200V${WATER}H0Z`;
  const island = `M930 ${WATER}C970 ${DECK + 46} 1040 ${DECK + 22} 1110 ${DECK + 22}C1150 ${DECK + 22} 1180 ${DECK + 30} 1200 ${DECK + 38}V${WATER}Z`;
  let city = '';
  for (let i = 0; i < 150; i++) {
    const x = rnd() * W, y = DECK + 14 + rnd() * (WATER - DECK - 18);
    city += `<circle cx="${r(x)}" cy="${r(y)}" r="${r(0.7 + rnd() * 0.9)}"/>`;
  }
  let ripples = '';
  for (let i = 0; i < 44; i++) {
    const y = WATER + 12 + rnd() * (H - WATER - 16), x = rnd() * W, w = 16 + rnd() * 60;
    ripples += `M${r(x)} ${r(y)}h${r(w)}`;
  }
  // Brilho das luzes refletido na água (traços curtos e horizontais)
  let shimmer = '';
  for (let i = 2; i < N; i += 2) {
    const x = TL + i * step, y = 2 * WATER - chainY(x);
    if (y < H - 4) shimmer += `M${r(x - 5)} ${r(y)}h10M${r(x - 2.5)} ${r(y + 5)}h5`;
  }
  const antenna = 1060;

  return `<svg class="bridge-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="br-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="br-sky-top"/><stop offset=".66" class="br-sky-bottom"/><stop offset="1" class="br-sky-top"/></linearGradient>
<radialGradient id="br-glow" cx=".68" cy=".66" r=".5"><stop offset="0" class="br-glow" stop-opacity=".6"/><stop offset="1" class="br-glow" stop-opacity="0"/></radialGradient>
<linearGradient id="br-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="br-sky-bottom" stop-opacity=".85"/><stop offset="1" class="br-sky-top"/></linearGradient>
<filter id="br-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#br-sky)"/>
<rect width="${W}" height="${H}" fill="url(#br-glow)"/>
<path class="br-hill-back" d="${hillBack}"/>
<path class="br-steel" d="M${antenna} ${DECK - 46}V${DECK - 78}" fill="none" stroke-width="1.2" opacity=".55"/>
<circle class="br-beacon" cx="${antenna}" cy="${DECK - 80}" r="2"/>
<g class="br-light" opacity=".55">${city}</g>
<path class="br-hill-front" d="${hillFront}"/>
<path class="br-hill-front" d="${island}"/>
<rect y="${r(WATER)}" width="${W}" height="${r(H - WATER)}" fill="url(#br-water)"/>
<g fill="none" stroke-linecap="round">
<path class="br-steel" d="${ripples}" stroke-width="1" opacity=".14"/>
<path class="br-steel" d="${mirror}" stroke-width="1.6" stroke-dasharray="6 6" opacity=".22"/>
<path class="br-light-stroke" d="${shimmer}" stroke-width="1.4" opacity=".35"/>
</g>
<g class="br-steel" fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${deckTruss}" stroke-width=".8" opacity=".42"/>
<path d="M-12 ${DECK}H${W + 12}M-12 ${DECK + 8}H${W + 12}" stroke-width="1.6" opacity=".85"/>
<path d="${hangers}" stroke-width=".8" opacity=".42"/>
<path d="${verticals}" stroke-width=".7" opacity=".32"/>
<path d="${truss}" stroke-width="1" opacity=".6"/>
<path d="${braces}" stroke-width=".8" opacity=".55"/>
<path d="${towers}" stroke-width="1.9"/>
<path d="${sideChains}" stroke-width="2.3"/>
<path d="${chain}" stroke-width="2.6"/>
</g>
<path class="br-pulse" d="${chain}" fill="none" stroke-width="3.4" stroke-linecap="round" pathLength="100"/>
<g class="br-light"><g filter="url(#br-blur)" opacity=".9">${lights}</g>${lights}</g>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Selo "65 anos"                                                     */
/* ------------------------------------------------------------------ */
function seal() {
  const C = 160;
  const at = (rad, deg) => [C + rad * Math.cos((deg * Math.PI) / 180), C + rad * Math.sin((deg * Math.PI) / 180)];
  const arc = (rad, a0, a1) => {
    const [x0, y0] = at(rad, a0), [x1, y1] = at(rad, a1);
    return `M${r(x0)} ${r(y0)}A${rad} ${rad} 0 0 1 ${r(x1)} ${r(y1)}`;
  };
  const star = (x, y, s) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? s : s * 0.45, a = -90 + i * 36;
      const px = x + rad * Math.cos((a * Math.PI) / 180), py = y + rad * Math.sin((a * Math.PI) / 180);
      d += (i ? 'L' : 'M') + r(px) + ' ' + r(py);
    }
    return d + 'Z';
  };
  // Ramos de louro: folhas ao longo do arco, alternando dentro/fora
  let leaves = '';
  const branch = (from, to) => {
    const n = 9, dir = Math.sign(to - from);
    for (let i = 0; i < n; i++) {
      const a = from + ((to - from) * i) / (n - 1);
      for (const side of [-1, 1]) {
        const [x, y] = at(110 + side * 7, a + dir * 3);
        const rot = a + 90 + side * 38 * dir;
        const sz = 1 - i * 0.045;
        leaves += `<ellipse cx="${r(x)}" cy="${r(y)}" rx="${r(8.5 * sz)}" ry="${r(3.4 * sz)}" transform="rotate(${r(rot)} ${r(x)} ${r(y)})"/>`;
      }
    }
  };
  branch(118, 196);
  branch(62, -16);
  const stars = [78, 90, 102].map((a, i) => { const [x, y] = at(112, a); return star(x, y, i === 1 ? 7 : 5.2); }).join('');

  return `<symbol id="art-seal" viewBox="0 0 320 320">
<defs>
<linearGradient id="seal-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e7bd"/><stop offset=".38" stop-color="#d6b46e"/><stop offset=".62" stop-color="#a98339"/><stop offset="1" stop-color="#ecd29a"/></linearGradient>
<radialGradient id="seal-disc" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#21407a"/><stop offset="1" stop-color="#0d1f3f"/></radialGradient>
<path id="seal-arc" d="${arc(120, 200, 340)}"/>
</defs>
<circle cx="${C}" cy="${C}" r="154" fill="none" stroke="url(#seal-gold)" stroke-width="3"/>
<circle cx="${C}" cy="${C}" r="146" fill="url(#seal-disc)" stroke="url(#seal-gold)" stroke-width="1.2"/>
<circle cx="${C}" cy="${C}" r="136" fill="none" stroke="url(#seal-gold)" stroke-width="1.4" stroke-dasharray=".1 7" stroke-linecap="round" opacity=".8"/>
<text fill="url(#seal-gold)" font-size="15" font-weight="700" letter-spacing="5"><textPath href="#seal-arc" startOffset="50%" text-anchor="middle">ANIVERSÁRIO</textPath></text>
<g fill="url(#seal-gold)">${leaves}<path d="${stars}"/></g>
<text x="${C}" y="186" text-anchor="middle" fill="url(#seal-gold)" font-size="116" font-weight="800" letter-spacing="-5">65</text>
<text x="${C + 5}" y="220" text-anchor="middle" fill="url(#seal-gold)" font-size="20" font-weight="700" letter-spacing="10">ANOS</text>
</symbol>`;
}

/* ------------------------------------------------------------------ */
/* Arte do certificado digital (documento + cartão com chip)         */
/* ------------------------------------------------------------------ */
function certArt() {
  const mark = '<path d="M2.5 27.5C9.6 13.6 24 5.2 45.5 3.5 33 7.6 21.7 14.7 13.6 27.5Z"/><path d="M15.4 29.5c5.2-7.6 13.6-13.2 25.2-16-8.3 4-14.4 9.3-18.6 16Z"/>';
  return `<symbol id="art-cert" viewBox="0 0 400 300">
<defs>
<linearGradient id="cert-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#24427a"/><stop offset="1" stop-color="#0b1a33"/></linearGradient>
<linearGradient id="cert-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dfab"/><stop offset=".5" stop-color="#c6a15b"/><stop offset="1" stop-color="#9c7a37"/></linearGradient>
<filter id="cert-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#06142b" flood-opacity=".45"/></filter>
</defs>
<g transform="rotate(-7 190 135)" filter="url(#cert-shadow)">
<rect x="64" y="34" width="250" height="186" rx="6" fill="#fbf9f4"/>
<rect x="76" y="46" width="226" height="162" rx="3" fill="none" stroke="#c6a15b" stroke-width="1.2"/>
<rect x="81" y="51" width="216" height="152" rx="2" fill="none" stroke="#c6a15b" stroke-width=".6" opacity=".6"/>
<rect x="124" y="70" width="130" height="8" rx="4" fill="#13264a"/>
<rect x="144" y="86" width="90" height="5" rx="2.5" fill="#a9b2c2"/>
<rect x="104" y="106" width="170" height="5" rx="2.5" fill="#d9dee6"/>
<rect x="104" y="117" width="152" height="5" rx="2.5" fill="#d9dee6"/>
<rect x="104" y="128" width="162" height="5" rx="2.5" fill="#d9dee6"/>
<circle cx="268" cy="176" r="17" fill="url(#cert-gold)"/>
<circle cx="268" cy="176" r="12" fill="none" stroke="#fbf9f4" stroke-width="1" opacity=".7"/>
<path d="M104 182h70" stroke="#13264a" stroke-width="1.2" opacity=".55"/>
</g>
<g transform="rotate(5 250 205)" filter="url(#cert-shadow)">
<rect x="132" y="128" width="236" height="148" rx="14" fill="url(#cert-card)"/>
<rect x="132.5" y="128.5" width="235" height="147" rx="13.5" fill="none" stroke="#c6a15b" stroke-opacity=".55"/>
<text x="152" y="155" fill="#d7b878" font-size="10.5" font-weight="700" letter-spacing="1.8">CERTIFICADO DIGITAL</text>
<g transform="translate(330 140) scale(.62)" fill="#c6a15b">${mark}</g>
<rect x="152" y="172" width="40" height="30" rx="5" fill="url(#cert-gold)"/>
<path d="M152 182h13M152 192h13M179 182h13M179 192h13M172 172v30" stroke="#7d5f22" stroke-width="1" opacity=".55" fill="none"/>
<rect x="152" y="222" width="126" height="7" rx="3.5" fill="#fff" opacity=".88"/>
<rect x="152" y="237" width="84" height="6" rx="3" fill="#fff" opacity=".4"/>
<text x="350" y="260" text-anchor="end" fill="#fff" fill-opacity=".72" font-size="10" font-weight="600" letter-spacing=".6">ICP-Brasil</text>
</g>
</symbol>`;
}

/* ------------------------------------------------------------------ */
/* Mapa de SC com a sede em Blumenau                                  */
/* Base: @svg-maps/brazil (CC BY 4.0) — crédito exibido na página     */
/* ------------------------------------------------------------------ */
function pathBBox(d) {
  const t = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (px, py) => { minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); };
  const num = () => parseFloat(t[i++]);
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toLowerCase()) {
      case 'm': case 'l': {
        const a = num(), b = num();
        x = rel ? x + a : a; y = rel ? y + b : b; add(x, y);
        if (cmd === 'm') { sx = x; sy = y; cmd = 'l'; } else if (cmd === 'M') { sx = x; sy = y; cmd = 'L'; }
        break;
      }
      case 'h': { const a = num(); x = rel ? x + a : a; add(x, y); break; }
      case 'v': { const b = num(); y = rel ? y + b : b; add(x, y); break; }
      case 'c': { const v = [num(), num(), num(), num(), num(), num()]; x = rel ? x + v[4] : v[4]; y = rel ? y + v[5] : v[5]; add(x, y); break; }
      case 'z': x = sx; y = sy; break;
      default: throw new Error('Comando de path não suportado: ' + cmd);
    }
  }
  return { minX, minY, maxX, maxY };
}

function scMap() {
  const sc = brazil.locations.find(l => l.id === 'sc');
  const b = pathBBox(sc.path);
  // Extremos geográficos de SC (graus decimais) para calibrar a projeção
  const geo = { n: -25.9614, s: -29.3986, w: -53.8333, e: -48.3269 };
  const project = (lat, lon) => [
    b.minX + ((lon - geo.w) / (geo.e - geo.w)) * (b.maxX - b.minX),
    b.minY + ((geo.n - lat) / (geo.n - geo.s)) * (b.maxY - b.minY),
  ];
  const pad = 6;
  const vb = [b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2].map(r);
  const [bx, by] = project(-26.9194, -49.0661); // Blumenau
  const [fx, fy] = project(-27.5954, -48.548); // Florianópolis (referência)
  return `<svg class="sc-map" viewBox="${vb.join(' ')}" role="img" aria-labelledby="scmap-t">
<title id="scmap-t">Mapa de Santa Catarina com a sede do Sincor SC em Blumenau</title>
<path class="sc-map__state" d="${sc.path}"/>
<g class="sc-map__ref"><circle cx="${r(fx)}" cy="${r(fy)}" r="1.1"/><text x="${r(fx - 3)}" y="${r(fy + 1.1)}" text-anchor="end">Florianópolis</text></g>
<g class="sc-map__pin"><circle class="sc-map__halo" cx="${r(bx)}" cy="${r(by)}" r="4"/><circle class="sc-map__dot" cx="${r(bx)}" cy="${r(by)}" r="1.7"/><text x="${r(bx - 3.2)}" y="${r(by - 2.6)}" text-anchor="end">Blumenau · sede</text></g>
</svg>`;
}

/* ------------------------------------------------------------------ */
/* QR Code da carteira (exemplo)                                      */
/* ------------------------------------------------------------------ */
async function qr() {
  const svg = await QRCode.toString('https://sincor-sc.com.br/validar/EXEMPLO', {
    type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#13264aff', light: '#ffffff00' },
  });
  return svg
    .replace('<svg ', '<svg class="qr" role="img" aria-label="QR Code de validação da carteira (exemplo)" ')
    .replace(/<path fill="#ffffff00"[^>]*\/>/, '')
    .replace(/ shape-rendering="crispEdges"/g, '')
    .replace('<path ', '<path shape-rendering="crispEdges" ')
    .trim();
}

/* ------------------------------------------------------------------ */
const blocks = { bridge: bridge(), map: scMap(), qr: await qr() };
let html = fs.readFileSync(SRC, 'utf8');
blocks.sprite = sprite(html, [seal(), certArt()]);
for (const [name, content] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- gen:${name} -->)[\\s\\S]*?(<!-- /gen:${name} -->)`);
  if (!re.test(html)) { console.warn(`marcador ausente: ${name}`); continue; }
  html = html.replace(re, (_, a, b) => `${a}\n${content}\n${b}`);
}
fs.writeFileSync(SRC, html);
console.log('OK', Object.fromEntries(Object.entries(blocks).map(([k, v]) => [k, v.length])));
