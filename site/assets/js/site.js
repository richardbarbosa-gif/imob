// Comportamento compartilhado por todas as páginas: menus, barra de cotações, faixa de parceiros e modais
// Menu Mobile
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
function setMobileMenu(open) {
  mobileMenu.classList.toggle('hidden', !open);
  mobileMenuBtn.setAttribute('aria-expanded', String(open));
  mobileMenuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}
mobileMenuBtn.addEventListener('click', () => setMobileMenu(mobileMenu.classList.contains('hidden')));
// Escolheu um destino: fecha o menu para a seção aparecer
mobileMenu.addEventListener('click', e => { if (e.target.closest('a')) setMobileMenu(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) { setMobileMenu(false); mobileMenuBtn.focus(); }
});

// Menu principal com painéis: hover no mouse, clique no toque, teclado (Esc fecha e devolve o foco)
const navItems = document.querySelectorAll('.nav-item.has-panel');
let lastPointer = 'mouse';
document.addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; }, true);
function setPanel(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector('.nav-link').setAttribute('aria-expanded', String(open));
}
const closePanels = except => navItems.forEach(item => item !== except && setPanel(item, false));
navItems.forEach(item => {
  const button = item.querySelector('.nav-link');
  let hoverTimer;
  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    // Com mouse o painel já abriu no hover: o clique confirma em vez de fechar
    if (isOpen && lastPointer === 'mouse' && item.matches(':hover')) return;
    closePanels(item);
    setPanel(item, !isOpen);
  });
  item.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    closePanels(item);
    setPanel(item, true);
  });
  item.addEventListener('pointerleave', e => {
    if (e.pointerType !== 'mouse') return;
    hoverTimer = setTimeout(() => setPanel(item, false), 180);
  });
  item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) setPanel(item, false); });
  item.addEventListener('keydown', e => {
    if (e.key === 'Escape' && item.classList.contains('is-open')) { setPanel(item, false); button.focus(); }
  });
  item.querySelector('.nav-panel').addEventListener('click', e => { if (e.target.closest('a')) setPanel(item, false); });
});
document.addEventListener('click', e => { if (!e.target.closest('.nav-item')) closePanels(); });

// Barra de cotações: dados reais, atualizados a cada minuto; sem dado, o item não aparece (nada inventado)
(function initTicker(root) {
  if (!root) return;
  const track = root.querySelector('[data-ticker-track]');
  const statusEl = root.querySelector('[data-ticker-status]');
  const timeEl = root.querySelector('[data-ticker-time]');
  const toggle = root.querySelector('[data-ticker-toggle]');
  const feedUrl = root.dataset.feed;
  const brapiToken = root.dataset.brapiToken;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const CACHE_KEY = 'sincor-sc:mercado';
  const SPEED = 40;          // px por segundo
  const REFRESH = 60000;     // moedas e Ibovespa
  const BCB_RETRY = 600000;  // indicadores do BC mudam no máximo 1x por dia

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* navegação privada */ } }
  };
  const num = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const brl = (v, d) => `R$ ${num(v, d)}`;
  const toNumber = x => (typeof x === 'number' ? x : parseFloat(x));
  // Ordem de exibição e formatação
  const SPEC = {
    IBOV: { label: 'Ibovespa', fmt: v => `${num(v, 0)} pts` },
    USD: { label: 'Dólar', fmt: v => brl(v, 4) },
    EUR: { label: 'Euro', fmt: v => brl(v, 4) },
    GBP: { label: 'Libra', fmt: v => brl(v, 4) },
    BTC: { label: 'Bitcoin', fmt: v => brl(v, 0) },
    SELIC: { label: 'Selic', fmt: v => `${num(v, 2)}% a.a.` },
    CDI: { label: 'CDI', fmt: v => `${num(v, 2)}% a.a.` },
    IPCA: { label: 'IPCA 12 meses', fmt: v => `${num(v, 2)}%` }
  };
  const ORDER = Object.keys(SPEC);
  const SOURCES = {
    currencies: 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL',
    bcb: series => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados/ultimos/1?formato=json`,
    selicBackup: 'https://brasilapi.com.br/api/taxas/v1/selic', // se o Banco Central bloquear o navegador
    ibov: token => `https://brapi.dev/api/quote/%5EBVSP?token=${encodeURIComponent(token)}`
  };
  const BCB_SERIES = { SELIC: 432, CDI: 4389, IPCA: 13522 };
  const RANGE = { SELIC: [0.5, 50], CDI: [0.5, 50], IPCA: [-10, 50] }; // sanidade: descarta dado absurdo

  let current = [];
  let currentMode = '';
  let rates = [];
  let bcbTriedAt = 0;
  let lastLoad = 0;

  async function getJSON(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
  const item = (id, value, change) => ({ id, value, change: Number.isFinite(change) ? change : null });
  const inRange = (id, v) => Number.isFinite(v) && v >= RANGE[id][0] && v <= RANGE[id][1];

  async function fromCurrencies() {
    const data = await getJSON(SOURCES.currencies);
    const keys = { USDBRL: 'USD', EURBRL: 'EUR', GBPBRL: 'GBP', BTCBRL: 'BTC' };
    return Object.entries(keys).flatMap(([key, id]) => {
      const quote = data && data[key];
      const value = quote ? toNumber(quote.bid) : NaN;
      return Number.isFinite(value) && value > 0 ? [item(id, value, quote ? toNumber(quote.pctChange) : NaN)] : [];
    });
  }
  async function bcbSeries(id) {
    const data = await getJSON(SOURCES.bcb(BCB_SERIES[id]));
    const last = Array.isArray(data) && data.length ? data[data.length - 1] : null;
    const value = last ? toNumber(last.valor) : NaN;
    if (!inRange(id, value)) throw new Error(`Série ${BCB_SERIES[id]} fora da faixa`);
    return item(id, value, NaN);
  }
  async function selicFromBackup() {
    const data = await getJSON(SOURCES.selicBackup);
    const value = data ? toNumber(data.valor) : NaN;
    if (!inRange('SELIC', value)) throw new Error('Selic de reserva fora da faixa');
    return item('SELIC', value, NaN);
  }
  async function fromCentralBank() {
    const settled = await Promise.allSettled(Object.keys(BCB_SERIES).map(id =>
      id === 'SELIC' ? bcbSeries(id).catch(selicFromBackup) : bcbSeries(id)));
    return settled.filter(s => s.status === 'fulfilled').map(s => s.value);
  }
  async function fromIbovespa() {
    if (!brapiToken) return [];
    const data = await getJSON(SOURCES.ibov(brapiToken));
    const quote = data && Array.isArray(data.results) ? data.results[0] : null;
    const value = quote ? toNumber(quote.regularMarketPrice) : NaN;
    return Number.isFinite(value) && value > 1000 ? [item('IBOV', value, toNumber(quote.regularMarketChangePercent))] : [];
  }
  async function fromFeed(url) {
    const data = await getJSON(url);
    const list = data && Array.isArray(data.items) ? data.items : [];
    return list
      .filter(i => SPEC[i.id] && Number.isFinite(toNumber(i.value)))
      .map(i => item(i.id, toNumber(i.value), toNumber(i.change)));
  }

  async function load(first) {
    lastLoad = Date.now();
    let fresh = [];
    if (feedUrl) {
      fresh = await fromFeed(feedUrl).catch(() => []);
    } else {
      const tasks = [fromCurrencies(), fromIbovespa()];
      if (first || (!rates.length && Date.now() - bcbTriedAt > BCB_RETRY)) {
        bcbTriedAt = Date.now();
        tasks.push(fromCentralBank().then(r => { if (r.length) rates = r; return []; }));
      }
      const settled = await Promise.allSettled(tasks);
      fresh = settled.flatMap(s => (s.status === 'fulfilled' ? s.value : [])).concat(rates);
    }
    if (fresh.length) {
      // Mantém itens da última leitura ao vivo que falharam só nesta rodada
      const merged = new Map(currentMode === 'live' ? current.map(i => [i.id, i]) : []);
      fresh.forEach(i => merged.set(i.id, i));
      const list = [...merged.values()];
      render(list, new Date(), 'live');
      store.set(CACHE_KEY, JSON.stringify({ time: Date.now(), items: list }));
    } else if (!current.length) {
      unavailable();
    }
  }

  function readCache() {
    try {
      const cached = JSON.parse(store.get(CACHE_KEY));
      if (cached && Array.isArray(cached.items) && Date.now() - cached.time < 3 * 864e5) {
        const items = cached.items.filter(i => SPEC[i.id] && Number.isFinite(i.value));
        return items.length ? { time: cached.time, items } : null;
      }
    } catch { /* cache inválido */ }
    return null;
  }

  function arrow() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 10 10');
    svg.setAttribute('class', 'tick__arrow');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M5 1.5 9.5 8.5H.5Z');
    svg.append(path);
    return svg;
  }

  // Monta com DOM (sem innerHTML): dados de terceiros nunca viram HTML
  function tickEl(entry, previous) {
    const spec = SPEC[entry.id];
    const li = document.createElement('li');
    const dir = entry.change == null ? '' : entry.change > 0.005 ? 'up' : entry.change < -0.005 ? 'down' : 'flat';
    li.className = dir ? `tick tick--${dir}` : 'tick';
    const name = document.createElement('span');
    name.className = 'tick__name';
    name.textContent = spec.label;
    const value = document.createElement('span');
    value.className = 'tick__value';
    value.textContent = spec.fmt(entry.value);
    li.append(name, value);
    if (entry.change != null) {
      const variation = document.createElement('span');
      variation.className = 'tick__var';
      if (dir !== 'flat') variation.append(arrow());
      variation.append(`${num(Math.abs(entry.change), 2)}%`);
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = dir === 'up' ? ' em alta' : dir === 'down' ? ' em queda' : ' estável';
      variation.append(sr);
      li.append(variation);
    }
    if (previous != null && previous !== entry.value) li.classList.add(entry.value > previous ? 'tick--flash-up' : 'tick--flash-down');
    return li;
  }

  function render(list, time, mode) {
    const previous = new Map(current.map(i => [i.id, i.value]));
    current = ORDER.map(id => list.find(i => i.id === id)).filter(Boolean);
    currentMode = mode;
    if (!current.length) { unavailable(); return; }
    const group = document.createElement('ul');
    group.className = 'ticker__list';
    current.forEach(entry => group.append(tickEl(entry, previous.get(entry.id))));
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.replaceChildren(group, clone);
    track.hidden = false;
    statusEl.hidden = true;
    root.classList.toggle('is-live', mode === 'live');
    root.classList.toggle('is-cached', mode === 'cached');
    const hour = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    timeEl.textContent = mode === 'live' ? `Atualizado às ${hour}` : `Último dado às ${hour}`;
    timeEl.title = 'Cotações com atraso, apenas informativas. Fontes: AwesomeAPI (moedas e bitcoin), Banco Central do Brasil (Selic, CDI e IPCA) e brapi/B3 (Ibovespa).';
    timeEl.hidden = false;
    // A Selic do rodapé usa o mesmo dado
    const selic = current.find(i => i.id === 'SELIC');
    document.querySelectorAll('[data-selic]').forEach(el => { el.textContent = `Selic: ${selic ? SPEC.SELIC.fmt(selic.value) : '—'}`; });
    requestAnimationFrame(setupScroll);
  }

  function unavailable() {
    statusEl.textContent = 'Cotações indisponíveis no momento.';
    statusEl.hidden = false;
    track.hidden = true;
    timeEl.hidden = true;
    root.classList.remove('is-live', 'is-cached', 'is-scrolling');
  }

  function setupScroll() {
    const group = track.firstElementChild;
    if (!group) return;
    const width = group.getBoundingClientRect().width;
    const scroll = width > track.parentElement.clientWidth - 8;
    root.classList.toggle('is-scrolling', scroll);
    track.lastElementChild.hidden = !scroll;
    // "Reduzir movimento" (comum no Windows de PCs antigos) deixa mais lento, sem parar: pedido do cliente; há botão de pausa
    if (scroll) track.style.setProperty('--ticker-duration', `${Math.round(width / (reduceMotion.matches ? SPEED / 2 : SPEED))}s`);
  }

  toggle.addEventListener('click', () => {
    const paused = root.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Retomar a rolagem das cotações' : 'Pausar a rolagem das cotações');
  });
  // Remede quando o layout muda (CSS do Tailwind chegando, fonte trocada, janela redimensionada)
  let resizeFrame;
  const remeasure = () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(setupScroll); };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(track.parentElement);
  else window.addEventListener('resize', remeasure);
  // A fonte da marca pode chegar depois do primeiro desenho e mudar a largura dos itens
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

  const cached = readCache();
  if (cached) render(cached.items, new Date(cached.time), 'cached');
  load(true);
  setInterval(() => { if (!document.hidden) load(false); }, REFRESH);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastLoad > REFRESH) load(false);
  });
})(document.querySelector('[data-ticker]'));

// Faixa de parceiros: o loop roda só com CSS; o script ajusta a velocidade, a pausa e para fora da tela
(function initPartners(root) {
  if (!root) return;
  const track = root.querySelector('[data-partners-track]');
  const list = track.firstElementChild;
  const toggle = root.querySelector('[data-partners-toggle]');
  const reduceMotion = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  // px por segundo: devagar, para a marca ser lida. "Reduzir movimento" (comum no Windows de PCs antigos) deixa
  // ainda mais lento, sem parar: pedido do cliente; o botão de pausa atende quem precisa do conteúdo parado
  const speed = () => (reduceMotion && reduceMotion.matches ? 18 : 32);

  function setup() {
    const width = list.getBoundingClientRect().width;
    if (width > 0) track.style.setProperty('--partners-duration', `${Math.round(width / speed())}s`);
  }
  toggle.addEventListener('click', () => {
    const paused = root.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Retomar o carrossel de parceiros' : 'Pausar o carrossel de parceiros');
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => root.classList.toggle('is-offscreen', !entry.isIntersecting)).observe(root);
  }
  // Remede quando o layout muda (CSS do Tailwind chegando, logo carregado, janela redimensionada)
  let frame;
  const remeasure = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(setup); };
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(list);
  else { window.addEventListener('resize', remeasure); window.addEventListener('load', remeasure); }
  if (reduceMotion) {
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', remeasure);
    else if (reduceMotion.addListener) reduceMotion.addListener(remeasure);
  }
  setup();
})(document.querySelector('[data-partners]'));

// Modais
function openAuthModal(tab) {
  document.getElementById('authModal').classList.remove('hidden');
  switchAuthTab(tab);
}
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }
function switchAuthTab(tab) {
  ['login', 'votacao', 'carteira'].forEach(t => {
    const cap = t.charAt(0).toUpperCase() + t.slice(1);
    document.getElementById('tabContent' + cap).classList.toggle('hidden', t !== tab);
    document.getElementById('tabBtn' + cap).className = t === tab
      ? 'flex-1 py-3 border-b-2 border-sincor-900 text-sincor-900'
      : 'flex-1 py-3 border-b-2 border-transparent text-slate-500';
  });
}
function openEventModal(title) {
  document.getElementById('eventModalTitle').textContent = title;
  document.getElementById('eventModal').classList.remove('hidden');
}
function closeEventModal() { document.getElementById('eventModal').classList.add('hidden'); }
function handleQuickLogin(e) { e.preventDefault(); openAuthModal('carteira'); }

// Efeito 3D Suave nos Cards
document.querySelectorAll('.card-3d').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 6;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -6;
    card.style.transform = `rotateX(${y}deg) rotateY(${x}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
});
