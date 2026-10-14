/* Sincor SC: interações da Home. JavaScript puro, sem dependências. */
(() => {
  'use strict';

  const doc = document;
  const $ = (sel, ctx = doc) => ctx.querySelector(sel);
  const $$ = (sel, ctx = doc) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* navegação privada */ } },
  };
  doc.documentElement.classList.add('js');

  /* ---------- Aviso rápido (toast) ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4200);
  }

  /* ---------- Diálogos (menu, busca, login) ---------- */
  function openDialog(id, opener) {
    const dialog = doc.getElementById(id);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    $$('dialog[open]').forEach((d) => d !== dialog && d.close());
    dialog.opener = opener || null;
    if (!dialog.open) dialog.showModal();
  }

  $$('dialog').forEach((dialog) => {
    // Clique no fundo escurecido fecha (o conteúdo fica dentro de um wrapper)
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => {
      $$('.form-status', dialog).forEach((el) => { el.textContent = ''; });
      const opener = dialog.opener;
      if (opener && doc.contains(opener) && !$('dialog[open]')) opener.focus({ preventScroll: true });
    });
  });

  /* ---------- Cliques globais ---------- */
  doc.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open]');
    if (opener) {
      event.preventDefault();
      openDialog(opener.dataset.open, opener);
      return;
    }

    const closer = event.target.closest('[data-close]');
    if (closer) {
      closer.closest('dialog')?.close();
      return;
    }

    // Protótipo: páginas internas ainda não existem; avisa em vez de levar a um link quebrado
    const link = event.target.closest('a[href^="/"]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    link.closest('dialog')?.close();
    if (link.getAttribute('href') === '/') {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      return;
    }
    const label = link.dataset.page || link.querySelector('strong')?.textContent || link.textContent;
    showToast(`Página “${label.replace(/\s+/g, ' ').trim()}”: disponível na próxima etapa do projeto.`);
  });

  /* ---------- Atalho "/" para a busca ---------- */
  doc.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]') || $('dialog[open]')) return;
    event.preventDefault();
    openDialog('dlg-search', doc.activeElement);
  });

  /* ---------- Cabeçalho ---------- */
  const masthead = $('.masthead');
  const navbar = $('.navbar');
  // Sem listener de scroll: sentinelas dizem se a página saiu do topo
  const topSentinel = $('.top-sentinel');
  if (masthead && topSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => masthead.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(topSentinel);
  }
  const navSentinel = $('.navbar-sentinel');
  if (navbar && navSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const stuck = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      navbar.classList.toggle('is-stuck', stuck);
      $$('.navbar__brand, .navbar__cta', navbar).forEach((el) => { el.tabIndex = stuck ? 0 : -1; });
    }).observe(navSentinel);
  }

  /* ---------- Menus suspensos (desktop) ---------- */
  const navItems = $$('.nav__item.has-panel');
  let lastPointer = 'mouse';
  doc.addEventListener('pointerdown', (event) => { lastPointer = event.pointerType || 'mouse'; }, true);

  function setPanel(item, open) {
    item.classList.toggle('is-open', open);
    $('.nav__link', item).setAttribute('aria-expanded', String(open));
  }
  const closePanels = (except) => navItems.forEach((item) => item !== except && setPanel(item, false));

  navItems.forEach((item) => {
    const button = $('.nav__link', item);
    let hoverTimer;
    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Com mouse o painel já abriu no hover: o clique confirma em vez de fechar
      if (isOpen && lastPointer === 'mouse' && item.matches(':hover')) return;
      closePanels(item);
      setPanel(item, !isOpen);
    });
    item.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      clearTimeout(hoverTimer);
      closePanels(item);
      setPanel(item, true);
    });
    item.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      hoverTimer = setTimeout(() => setPanel(item, false), 180);
    });
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) setPanel(item, false);
    });
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && item.classList.contains('is-open')) {
        setPanel(item, false);
        button.focus();
      }
    });
  });
  doc.addEventListener('click', (event) => { if (!event.target.closest('.nav__item')) closePanels(); });

  /* ---------- Tamanho do texto (acessibilidade) ---------- */
  const SIZES = [100, 112.5, 125];
  const FONT_KEY = 'sincor-sc:fonte';
  let sizeIndex = Math.min(SIZES.length - 1, Math.max(0, Number(store.get(FONT_KEY)) || 0));
  function applySize() {
    doc.documentElement.style.fontSize = sizeIndex ? `${SIZES[sizeIndex]}%` : '';
    $$('[data-font]').forEach((button) => {
      const step = Number(button.dataset.font);
      const off = step === 1 ? sizeIndex === SIZES.length - 1 : sizeIndex === 0;
      button.setAttribute('aria-disabled', String(off));
    });
  }
  applySize();
  doc.addEventListener('click', (event) => {
    const button = event.target.closest('[data-font]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    const step = Number(button.dataset.font);
    sizeIndex = step === 0 ? 0 : Math.min(SIZES.length - 1, Math.max(0, sizeIndex + step));
    store.set(FONT_KEY, String(sizeIndex));
    applySize();
    showToast(`Tamanho do texto: ${SIZES[sizeIndex].toLocaleString('pt-BR')}%`);
  });

  /* ---------- Cotações e indicadores (ticker) ---------- */
  const tickerRoot = $('[data-ticker]');
  if (tickerRoot) initTicker(tickerRoot);

  function initTicker(root) {
    const track = $('[data-ticker-track]', root);
    const statusEl = $('[data-ticker-status]', root);
    const timeEl = $('[data-ticker-time]', root);
    const toggle = $('[data-ticker-toggle]', root);
    const feedUrl = root.dataset.feed;
    const CACHE_KEY = 'sincor-sc:mercado';
    const SPEED = 42;          // px por segundo
    const REFRESH = 60_000;    // moedas e Ibovespa
    const BCB_RETRY = 600_000; // indicadores do BC mudam no máximo 1x por dia

    const num = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
    const brl = (v, d) => `R$ ${num(v, d)}`;
    const toNumber = (x) => (typeof x === 'number' ? x : parseFloat(x));
    // Ordem de exibição e formatação
    const SPEC = {
      IBOV: { label: 'Ibovespa', fmt: (v) => `${num(v, 0)} pts` },
      USD: { label: 'Dólar', fmt: (v) => brl(v, 2) },
      EUR: { label: 'Euro', fmt: (v) => brl(v, 2) },
      GBP: { label: 'Libra', fmt: (v) => brl(v, 2) },
      ARS: { label: 'Peso argentino', fmt: (v) => brl(v, 4) },
      BTC: { label: 'Bitcoin', fmt: (v) => brl(v, 0) },
      SELIC: { label: 'Selic', fmt: (v) => `${num(v, 2)}% a.a.` },
      CDI: { label: 'CDI', fmt: (v) => `${num(v, 2)}% a.a.` },
      IPCA: { label: 'IPCA 12 meses', fmt: (v) => `${num(v, 2)}%` },
    };
    const ORDER = Object.keys(SPEC);
    const SOURCES = {
      currencies: 'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL,ARS-BRL,BTC-BRL',
      bcb: (series) => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados/ultimos/1?formato=json`,
      ibov: 'https://brapi.dev/api/quote/%5EBVSP',
    };
    const BCB_SERIES = { SELIC: 432, CDI: 4389, IPCA: 13522 };
    const RANGE = { SELIC: [0, 50], CDI: [0, 50], IPCA: [-10, 50] }; // sanidade: descarta série errada

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

    async function fromCurrencies() {
      const data = await getJSON(SOURCES.currencies);
      const keys = { USDBRL: 'USD', EURBRL: 'EUR', GBPBRL: 'GBP', ARSBRL: 'ARS', BTCBRL: 'BTC' };
      return Object.entries(keys).flatMap(([key, id]) => {
        const quote = data && data[key];
        const value = quote ? toNumber(quote.bid) : NaN;
        return Number.isFinite(value) && value > 0 ? [item(id, value, quote ? toNumber(quote.pctChange) : NaN)] : [];
      });
    }
    async function fromCentralBank() {
      const settled = await Promise.allSettled(Object.entries(BCB_SERIES).map(async ([id, series]) => {
        const data = await getJSON(SOURCES.bcb(series));
        const last = Array.isArray(data) && data.length ? data[data.length - 1] : null;
        const value = last ? toNumber(last.valor) : NaN;
        const [min, max] = RANGE[id];
        if (!Number.isFinite(value) || value < min || value > max) throw new Error(`Série ${series} fora da faixa`);
        return item(id, value, NaN);
      }));
      return settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
    }
    async function fromIbovespa() {
      const data = await getJSON(SOURCES.ibov);
      const quote = data && Array.isArray(data.results) ? data.results[0] : null;
      const value = quote ? toNumber(quote.regularMarketPrice) : NaN;
      return Number.isFinite(value) && value > 1000 ? [item('IBOV', value, toNumber(quote.regularMarketChangePercent))] : [];
    }
    async function fromFeed(url) {
      const data = await getJSON(url);
      const list = data && Array.isArray(data.items) ? data.items : [];
      return list
        .filter((i) => SPEC[i.id] && Number.isFinite(toNumber(i.value)))
        .map((i) => item(i.id, toNumber(i.value), toNumber(i.change)));
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
          tasks.push(fromCentralBank().then((r) => { if (r.length) rates = r; return []; }));
        }
        const settled = await Promise.allSettled(tasks);
        fresh = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : [])).concat(rates);
      }
      if (fresh.length) {
        // Mantém itens da última leitura ao vivo que falharam só nesta rodada
        const merged = new Map(currentMode === 'live' ? current.map((i) => [i.id, i]) : []);
        fresh.forEach((i) => merged.set(i.id, i));
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
          const items = cached.items.filter((i) => SPEC[i.id] && Number.isFinite(i.value));
          return items.length ? { time: cached.time, items } : null;
        }
      } catch { /* cache inválido */ }
      return null;
    }

    function arrow() {
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 10 10');
      svg.setAttribute('class', 'tick__arrow');
      svg.setAttribute('aria-hidden', 'true');
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 1.5 9.5 8.5H.5Z');
      svg.append(path);
      return svg;
    }

    // Monta com DOM (sem innerHTML): dados de terceiros nunca viram HTML
    function tickEl(entry, previous) {
      const spec = SPEC[entry.id];
      const li = doc.createElement('li');
      const dir = entry.change == null ? '' : entry.change > 0.005 ? 'up' : entry.change < -0.005 ? 'down' : 'flat';
      li.className = dir ? `tick tick--${dir}` : 'tick';
      const name = doc.createElement('span');
      name.className = 'tick__name';
      name.textContent = spec.label;
      const value = doc.createElement('span');
      value.className = 'tick__value';
      value.textContent = spec.fmt(entry.value);
      li.append(name, value);
      if (entry.change != null) {
        const variation = doc.createElement('span');
        variation.className = 'tick__var';
        if (dir !== 'flat') variation.append(arrow());
        variation.append(`${num(Math.abs(entry.change), 2)}%`);
        const sr = doc.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = dir === 'up' ? ' em alta' : dir === 'down' ? ' em queda' : ' estável';
        variation.append(sr);
        li.append(variation);
      }
      if (previous != null && previous !== entry.value) li.classList.add(entry.value > previous ? 'tick--flash-up' : 'tick--flash-down');
      return li;
    }

    function render(list, time, mode) {
      const previous = new Map(current.map((i) => [i.id, i.value]));
      current = ORDER.map((id) => list.find((i) => i.id === id)).filter(Boolean);
      currentMode = mode;
      if (!current.length) { unavailable(); return; }
      const group = doc.createElement('ul');
      group.className = 'ticker__list';
      current.forEach((entry) => group.append(tickEl(entry, previous.get(entry.id))));
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.replaceChildren(group, clone);
      track.hidden = false;
      statusEl.hidden = true;
      root.classList.toggle('is-live', mode === 'live');
      root.classList.toggle('is-cached', mode === 'cached');
      const hour = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      timeEl.textContent = mode === 'live' ? `Atualizado às ${hour}` : `Último dado às ${hour}`;
      timeEl.title = 'Cotações com atraso. Fontes: AwesomeAPI (moedas), Banco Central do Brasil (Selic, CDI e IPCA) e brapi/B3 (Ibovespa).';
      timeEl.hidden = false;
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
      const scroll = width > track.parentElement.clientWidth - 8 && !reduceMotion.matches;
      root.classList.toggle('is-scrolling', scroll);
      track.lastElementChild.hidden = !scroll;
      if (scroll) track.style.setProperty('--ticker-duration', `${Math.round(width / SPEED)}s`);
    }

    toggle.addEventListener('click', () => {
      const paused = root.classList.toggle('is-paused');
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Retomar a rolagem das cotações' : 'Pausar a rolagem das cotações');
    });
    let resizeFrame;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(setupScroll);
    }, { passive: true });

    const cached = readCache();
    if (cached) render(cached.items, new Date(cached.time), 'cached');
    load(true);
    setInterval(() => { if (!doc.hidden) load(false); }, REFRESH);
    doc.addEventListener('visibilitychange', () => {
      if (!doc.hidden && Date.now() - lastLoad > REFRESH) load(false);
    });
  }

  /* ---------- Carrossel de destaques ---------- */
  const carousel = $('[data-carousel]');
  if (carousel) {
    const track = $('[data-track]', carousel);
    const slides = $$('.slide', track);
    const dots = $$('[data-dot]', carousel);
    const playButton = $('[data-autoplay]', carousel);
    let index = 0;

    const render = () => {
      slides.forEach((slide, i) => { slide.inert = i !== index; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    };
    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      render();
    };
    // A barra de progresso do destaque atual é o relógio da troca automática
    const setPlaying = (on) => {
      carousel.toggleAttribute('data-playing', on);
      playButton.setAttribute('aria-label', on ? 'Pausar troca automática' : 'Retomar troca automática');
    };
    const stop = () => setPlaying(false);
    carousel.addEventListener('animationend', (event) => {
      if (event.animationName === 'step-fill' && carousel.hasAttribute('data-playing')) goTo(index + 1);
    });

    $('[data-prev]', carousel).addEventListener('click', () => { stop(); goTo(index - 1); });
    $('[data-next]', carousel).addEventListener('click', () => { stop(); goTo(index + 1); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { stop(); goTo(i); }));
    playButton.addEventListener('click', () => setPlaying(!carousel.hasAttribute('data-playing')));

    // Arrastar com o dedo define o destaque atual
    let scrollFrame;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== index && i >= 0 && i < slides.length) { index = i; render(); }
      });
    }, { passive: true });
    track.addEventListener('pointerdown', (event) => { if (event.pointerType !== 'mouse') stop(); });
    let resizeFrame;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => track.scrollTo({ left: index * track.clientWidth }));
    }, { passive: true });
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { stop(); goTo(index + 1); }
      if (event.key === 'ArrowLeft') { stop(); goTo(index - 1); }
    });
    doc.addEventListener('visibilitychange', () => carousel.classList.toggle('is-tab-hidden', doc.hidden));

    render();
    setPlaying(!reduceMotion.matches);
  }

  /* ---------- Contagem regressiva do evento ---------- */
  $$('[data-countdown]').forEach((el) => {
    const target = Date.parse(el.dataset.countdown);
    const out = $('[data-countdown-text]', el);
    const tick = () => {
      const ms = target - Date.now();
      if (Number.isNaN(target) || ms <= 0) { el.hidden = true; return; }
      const days = Math.floor(ms / 864e5);
      const hours = Math.floor((ms % 864e5) / 36e5);
      out.textContent = days >= 1
        ? `Faltam ${days} ${days === 1 ? 'dia' : 'dias'}`
        : hours >= 1 ? `Faltam ${hours} h` : 'É hoje!';
      el.hidden = false;
    };
    tick();
    setInterval(tick, 60_000);
  });

  /* ---------- "Adicionar à agenda" (.ics) ---------- */
  const icsText = (value) => String(value).replace(/([,;\\])/g, '\\$1');
  $$('[data-ics]').forEach((button) => button.addEventListener('click', () => {
    const d = button.dataset;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sincor SC//Site//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${d.icsUid}@sincor-sc.com.br`, `DTSTAMP:${stamp}`, `DTSTART:${d.icsStart}`,
      `SUMMARY:${icsText(d.icsTitle)}`, `LOCATION:${icsText(d.icsLocation)}`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = Object.assign(doc.createElement('a'), { href: url, download: `${d.icsUid}.ics` });
    doc.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }));

  /* ---------- Filtro de notícias ---------- */
  const filters = $$('[data-filter]');
  const newsItems = $$('[data-news] > [data-cat]');
  const newsEmpty = $('.news__empty');
  filters.forEach((filter) => filter.addEventListener('click', () => {
    const value = filter.dataset.filter;
    let visible = 0;
    filters.forEach((f) => f.setAttribute('aria-pressed', String(f === filter)));
    newsItems.forEach((item) => {
      const show = value === 'todas' || item.dataset.cat === value;
      item.hidden = !show;
      if (show) visible += 1;
    });
    if (newsEmpty) newsEmpty.hidden = visible > 0;
  }));

  /* ---------- Mostrar/ocultar senha ---------- */
  $$('[data-pw-toggle]').forEach((button) => button.addEventListener('click', () => {
    const input = button.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
    button.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  }));

  /* ---------- Formulários do protótipo (nada é enviado) ---------- */
  $$('form[data-proto]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = $('.form-status', form);
    if (status) status.textContent = form.dataset.proto;
  }));

  /* ---------- Entrada suave das seções ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Animações contínuas só rodam quando visíveis (CPU e bateria) ---------- */
  const animated = $$('[data-animate]');
  if ('IntersectionObserver' in window) {
    const animIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('in-view', entry.isIntersecting));
    });
    animated.forEach((el) => animIO.observe(el));
  } else {
    animated.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Consentimento de cookies (LGPD) ---------- */
  const cookie = $('#cookie');
  const CONSENT_KEY = 'sincor-sc:cookies';
  if (cookie && !store.get(CONSENT_KEY)) setTimeout(() => { cookie.hidden = false; }, 1200);
  doc.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cookie]');
    if (!button || !cookie) return;
    const choice = button.dataset.cookie;
    if (choice === 'open') { cookie.hidden = false; return; }
    store.set(CONSENT_KEY, choice);
    cookie.hidden = true;
    showToast(choice === 'accept' ? 'Preferências salvas: cookies de análise permitidos.' : 'Preferências salvas: somente cookies essenciais.');
  });

  /* ---------- Ano no rodapé ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
