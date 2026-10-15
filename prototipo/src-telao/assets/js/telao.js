/* Sincor SC: interações da Home, versão "Telão". JavaScript puro, sem dependências. */
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
  const num = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const toNumber = (x) => (typeof x === 'number' ? x : parseFloat(x));
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

  /* ---------- Cabeçalho: transparente sobre o telão, sólido ao rolar ---------- */
  const header = $('[data-header]');
  const headerSentinel = $('.header-sentinel');
  if (header && headerSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('is-stuck', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(headerSentinel);
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

  /* ---------- Indicadores: Dólar e Selic ---------- */
  const quotesRoot = $('[data-quotes]');
  if (quotesRoot) initQuotes(quotesRoot);

  function initQuotes(root) {
    const feedUrl = root.dataset.feed;
    const timeEl = $('[data-quotes-time]', root);
    const CACHE_KEY = 'sincor-sc:indicadores';
    const REFRESH = 60_000;      // dólar
    const SELIC_RETRY = 600_000; // a Selic muda no máximo a cada reunião do Copom
    const SOURCES = {
      usd: 'https://economia.awesomeapi.com.br/json/last/USD-BRL',
      // Banco Central (série 432, meta Selic) e, se ele bloquear o navegador, a BrasilAPI (mesma série)
      selic: ['https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json', 'https://brasilapi.com.br/api/taxas/v1/selic'],
    };
    // [prefixo, número, sufixo]: só o número usa algarismos tabulares (unidade fica com espaçamento normal)
    const FORMAT = { USD: (v) => ['R$ ', num(v, 4), ''], SELIC: (v) => ['', num(v, 2), '% a.a.'] };
    const RANGE = { USD: [1, 30], SELIC: [0.5, 50] }; // sanidade: descarta dado absurdo
    const rows = Object.fromEntries($$('[data-quote]', root).map((li) => [li.dataset.quote, li]));
    const state = {};
    let selic = null;
    let selicTriedAt = 0;
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
    const valid = (id, value) => Number.isFinite(value) && value >= RANGE[id][0] && value <= RANGE[id][1];

    async function fromDollar() {
      const data = await getJSON(SOURCES.usd);
      const quote = data && data.USDBRL;
      const value = quote ? toNumber(quote.bid) : NaN;
      if (!valid('USD', value)) throw new Error('Dólar fora da faixa');
      const change = toNumber(quote.pctChange);
      return { id: 'USD', value, change: Number.isFinite(change) ? change : null };
    }
    async function fromSelic() {
      for (const url of SOURCES.selic) {
        try {
          const data = await getJSON(url);
          const raw = Array.isArray(data) ? data[data.length - 1]?.valor : data?.valor;
          const value = toNumber(raw);
          if (valid('SELIC', value)) return { id: 'SELIC', value, change: null };
        } catch { /* tenta a próxima fonte */ }
      }
      throw new Error('Selic indisponível');
    }
    async function fromFeed(url) {
      const data = await getJSON(url);
      const list = data && Array.isArray(data.items) ? data.items : [];
      return list
        .filter((i) => FORMAT[i.id] && valid(i.id, toNumber(i.value)))
        .map((i) => ({ id: i.id, value: toNumber(i.value), change: Number.isFinite(toNumber(i.change)) ? toNumber(i.change) : null }));
    }

    function arrow() {
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 10 10');
      svg.setAttribute('class', 'quote__arrow');
      svg.setAttribute('aria-hidden', 'true');
      const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 1.5 9.5 8.5H.5Z');
      svg.append(path);
      return svg;
    }

    // Monta com DOM (sem innerHTML): dado de terceiros nunca vira HTML
    function paint(entry) {
      const li = rows[entry.id];
      if (!li) return;
      const previous = state[entry.id];
      const [prefix, figure, suffix] = FORMAT[entry.id](entry.value);
      const figureEl = doc.createElement('span');
      figureEl.className = 'quote__num';
      figureEl.textContent = figure;
      $('[data-value]', li).replaceChildren(prefix, figureEl, suffix);
      li.classList.remove('is-empty');
      const variation = $('[data-var]', li);
      if (variation) {
        if (entry.change == null) {
          variation.hidden = true;
        } else {
          const dir = entry.change > 0.005 ? 'up' : entry.change < -0.005 ? 'down' : 'flat';
          const sr = doc.createElement('span');
          sr.className = 'sr-only';
          sr.textContent = dir === 'up' ? ' em alta no dia' : dir === 'down' ? ' em queda no dia' : ' estável no dia';
          variation.replaceChildren(...(dir === 'flat' ? [] : [arrow()]), `${num(Math.abs(entry.change), 2)}%`, sr);
          variation.className = `quote__var is-${dir}`;
          variation.hidden = false;
        }
      }
      if (previous && previous.value !== entry.value) {
        li.classList.add('is-flash');
        li.addEventListener('animationend', () => li.classList.remove('is-flash'), { once: true });
      }
      state[entry.id] = entry;
    }

    function stamp(time, mode) {
      const hour = time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      timeEl.textContent = mode === 'live' ? `Atualizado às ${hour}` : `Último dado às ${hour}`;
      timeEl.title = 'Indicadores com atraso, apenas informativos. Fontes: AwesomeAPI (dólar) e Banco Central do Brasil (Selic).';
      timeEl.hidden = false;
      root.classList.toggle('is-live', mode === 'live');
    }

    function unavailable() {
      Object.entries(rows).forEach(([id, li]) => {
        if (state[id]) return;
        const value = $('[data-value]', li);
        const sr = doc.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = 'indisponível no momento';
        value.replaceChildren('—', sr);
        li.classList.add('is-empty');
      });
    }

    async function load(first) {
      lastLoad = Date.now();
      let fresh = [];
      if (feedUrl) {
        fresh = await fromFeed(feedUrl).catch(() => []);
      } else {
        const tasks = [fromDollar()];
        if (first || (!selic && Date.now() - selicTriedAt > SELIC_RETRY)) {
          selicTriedAt = Date.now();
          tasks.push(fromSelic().then((s) => { selic = s; return null; }));
        }
        const settled = await Promise.allSettled(tasks);
        fresh = settled.filter((s) => s.status === 'fulfilled' && s.value).map((s) => s.value);
        if (selic) fresh.push(selic);
      }
      if (fresh.length) {
        fresh.forEach(paint);
        stamp(new Date(), 'live');
        store.set(CACHE_KEY, JSON.stringify({ time: Date.now(), items: Object.values(state) }));
      }
      unavailable();
    }

    // Último dado bom aparece na hora, marcado como "Último dado às…", até a leitura ao vivo chegar
    try {
      const cached = JSON.parse(store.get(CACHE_KEY));
      if (cached && Array.isArray(cached.items) && Date.now() - cached.time < 3 * 864e5) {
        const items = cached.items.filter((i) => FORMAT[i.id] && valid(i.id, i.value));
        if (items.length) {
          items.forEach(paint);
          stamp(new Date(cached.time), 'cached');
        }
      }
    } catch { /* cache inválido */ }

    load(true);
    setInterval(() => { if (!doc.hidden) load(false); }, REFRESH);
    doc.addEventListener('visibilitychange', () => {
      if (!doc.hidden && Date.now() - lastLoad > REFRESH) load(false);
    });
  }

  /* ---------- Telão: acende depois do título e corre em loop ---------- */
  const wall = $('[data-wall]');
  if (wall) {
    // Só depois do primeiro quadro: o título (LCP) pinta antes de as imagens do telão disputarem a rede.
    // 4 cópias de 5 telas = bloco de 10 duplicado; 10 telas cobrem a coluna em qualquer altura de tela,
    // então a animação anda meia trilha e recomeça sem emenda, sem ler medidas do layout.
    const start = () => {
      wall.classList.add('is-lit');
      if (reduceMotion.matches) return;
      $$('.wall__track', wall).forEach((track) => {
        const cards = [...track.children];
        for (let k = 1; k < 4; k += 1) cards.forEach((card) => track.append(card.cloneNode(true)));
      });
      wall.classList.add('is-looping');
    };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1200 });
    else setTimeout(start, 400);
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
    // A barra do destaque atual é o relógio da troca automática
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

  /* ---------- Benefícios: a tela acompanha o item em foco ---------- */
  const benefitList = $('[data-benefits]');
  const benefitScreen = $('[data-benefit-screen]');
  if (benefitList && benefitScreen) {
    const items = $$('.benefit', benefitList);
    const images = $$('.benefits__img', benefitScreen);
    const numEl = $('[data-benefit-num]', benefitScreen);
    const nameEl = $('[data-benefit-name]', benefitScreen);
    const activate = (i) => {
      items.forEach((item, k) => item.classList.toggle('is-active', k === i));
      images.forEach((img, k) => img.classList.toggle('is-active', k === i));
      numEl.textContent = String(i + 1).padStart(2, '0');
      nameEl.textContent = $('.benefit__title', items[i]).textContent;
    };
    items.forEach((item, i) => {
      item.addEventListener('pointerenter', () => activate(i));
      item.addEventListener('focus', () => activate(i));
    });
    activate(0);
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
    const stampNow = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sincor SC//Site//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT', `UID:${d.icsUid}@sincor-sc.com.br`, `DTSTAMP:${stampNow}`, `DTSTART:${d.icsStart}`,
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
