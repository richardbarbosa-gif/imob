/* Sincor SC: interações da Home. JavaScript puro, sem dependências. */
(() => {
  'use strict';

  const doc = document;
  const $ = (sel, ctx = doc) => ctx.querySelector(sel);
  const $$ = (sel, ctx = doc) => [...ctx.querySelectorAll(sel)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
  // Sem listener de scroll: um sentinela no topo diz se a página saiu do início
  const topSentinel = $('.top-sentinel');
  if (masthead && topSentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => masthead.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(topSentinel);
  }

  const sentinel = $('.navbar-sentinel');
  if (navbar && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const stuck = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      navbar.classList.toggle('is-stuck', stuck);
      $$('.navbar__brand, .navbar__cta', navbar).forEach((el) => { el.tabIndex = stuck ? 0 : -1; });
    }).observe(sentinel);
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

  /* ---------- Carrossel de destaques ---------- */
  const carousel = $('[data-carousel]');
  if (carousel) {
    const track = $('[data-track]', carousel);
    const slides = $$('.slide', track);
    const dots = $$('[data-dot]', carousel);
    const playButton = $('[data-autoplay]', carousel);
    const DELAY = 7000;
    let index = 0;
    let timer = null;
    let stoppedByUser = false;

    const render = () => {
      slides.forEach((slide, i) => { slide.inert = i !== index; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    };
    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      render();
    };
    const setPlayState = (playing) => {
      playButton.dataset.state = playing ? 'playing' : 'paused';
      playButton.setAttribute('aria-label', playing ? 'Pausar troca automática' : 'Retomar troca automática');
    };
    const pause = () => { clearInterval(timer); timer = null; };
    const play = () => {
      if (timer || stoppedByUser || reduceMotion.matches || doc.hidden) return;
      timer = setInterval(() => goTo(index + 1), DELAY);
    };
    const stop = () => { pause(); stoppedByUser = true; setPlayState(false); };

    $('[data-prev]', carousel).addEventListener('click', () => { stop(); goTo(index - 1); });
    $('[data-next]', carousel).addEventListener('click', () => { stop(); goTo(index + 1); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { stop(); goTo(i); }));
    playButton.addEventListener('click', () => {
      if (stoppedByUser) { stoppedByUser = false; setPlayState(true); play(); } else stop();
    });

    // Arrastar com o dedo/mouse define o slide atual
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

    // Pausa enquanto o usuário interage (WCAG 2.2.2)
    carousel.addEventListener('pointerenter', pause);
    carousel.addEventListener('pointerleave', play);
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', (event) => { if (!carousel.contains(event.relatedTarget)) play(); });
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { stop(); goTo(index + 1); }
      if (event.key === 'ArrowLeft') { stop(); goTo(index - 1); }
    });
    doc.addEventListener('visibilitychange', () => (doc.hidden ? pause() : play()));

    if (reduceMotion.matches) { stoppedByUser = true; setPlayState(false); }
    render();
    play();
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
  const chips = $$('[data-filter]');
  const newsItems = $$('[data-news] > [data-cat]');
  const newsEmpty = $('.news__empty');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const filter = chip.dataset.filter;
    let visible = 0;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    newsItems.forEach((item) => {
      const show = filter === 'todas' || item.dataset.cat === filter;
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

  /* ---------- Animações de entrada ---------- */
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
  const consent = {
    get() { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } },
    set(value) { try { localStorage.setItem(CONSENT_KEY, value); } catch { /* navegação privada */ } },
  };
  if (cookie && !consent.get()) setTimeout(() => { cookie.hidden = false; }, 1200);
  doc.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cookie]');
    if (!button || !cookie) return;
    const choice = button.dataset.cookie;
    if (choice === 'open') { cookie.hidden = false; return; }
    consent.set(choice);
    cookie.hidden = true;
    showToast(choice === 'accept' ? 'Preferências salvas: cookies de análise permitidos.' : 'Preferências salvas: somente cookies essenciais.');
  });

  /* ---------- Ano no rodapé ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
