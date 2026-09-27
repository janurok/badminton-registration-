// Reader behaviour: settings, reading progress, continue-reading links and sheets. No dependencies.
// Everything is stored in the reader's own browser (localStorage).
(() => {
  'use strict';

  const KEYS = { settings: 'novel:settings', progress: 'novel:progress', read: 'novel:read', last: 'novel:last' };
  const DEFAULTS = { theme: 'auto', font: 'serif', size: 19, leading: 'normal', width: 'normal', indent: '0' };
  const SIZE_MIN = 14;
  const SIZE_MAX = 30;
  const NEW_DAYS = 7;

  const doc = document.documentElement;
  const body = document.body;
  const root = body.dataset.root || './';
  const reader = document.querySelector('main.reader');
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or disabled */ }
    },
  };

  const scrollRange = () => Math.max(0, doc.scrollHeight - window.innerHeight);
  const scrollRatio = () => {
    const range = scrollRange();
    return range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 1;
  };

  // ---------- settings ----------

  let settings = { ...DEFAULTS, ...store.get(KEYS.settings, {}) };

  function applySettings() {
    if (settings.theme === 'auto') delete doc.dataset.theme;
    else doc.dataset.theme = settings.theme;
    for (const key of ['font', 'leading', 'width', 'indent']) doc.dataset[key] = settings[key];
    doc.style.setProperty('--read-size', `${settings.size}px`);
    for (const btn of $$('[data-set]')) {
      btn.setAttribute('aria-pressed', String(String(settings[btn.dataset.set]) === btn.dataset.value));
    }
    for (const out of $$('[data-out="size"]')) out.textContent = settings.size;
    const themeColor = $('meta[name="theme-color"]');
    if (themeColor) themeColor.content = getComputedStyle(doc).getPropertyValue('--bg').trim();
  }

  // Changing font size or width reflows the chapter, so keep the reader at the same relative spot.
  function updateSettings(patch) {
    const ratio = reader ? scrollRatio() : 0;
    settings = { ...settings, ...patch };
    store.set(KEYS.settings, settings);
    applySettings();
    if (reader) window.scrollTo(0, ratio * scrollRange());
  }

  // ---------- sheets ----------

  let openSheetEl = null;
  let lastFocus = null;

  function openSheet(name, trigger) {
    const sheet = $(`[data-sheet="${name}"]`);
    const scrim = $('[data-scrim]');
    if (!sheet) return;
    if (openSheetEl) closeSheet(true);
    openSheetEl = sheet;
    lastFocus = trigger || document.activeElement;
    sheet.hidden = false;
    if (scrim) scrim.hidden = false;
    scrim?.classList.toggle('is-clear', name === 'settings');
    void sheet.offsetWidth; // commit the visible state so the slide-in transition runs
    sheet.classList.add('is-open');
    scrim?.classList.add('is-open');
    const current = $('[aria-current="page"]', sheet);
    if (current) sheet.scrollTop = current.offsetTop - sheet.clientHeight / 2;
    (current || $('[data-close]', sheet))?.focus({ preventScroll: true });
  }

  function closeSheet(immediate = false) {
    const sheet = openSheetEl;
    const scrim = $('[data-scrim]');
    if (!sheet) return;
    openSheetEl = null;
    sheet.classList.remove('is-open');
    scrim?.classList.remove('is-open');
    const hide = () => {
      if (openSheetEl !== sheet) sheet.hidden = true;
      if (scrim && !openSheetEl) scrim.hidden = true;
    };
    if (immediate) return hide();
    setTimeout(hide, 300);
    lastFocus?.focus({ preventScroll: true });
  }

  function trapFocus(event) {
    const focusable = $$('a[href], button:not([disabled])', openSheetEl);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ---------- table of contents, continue reading ----------

  function markChapters() {
    const read = store.get(KEYS.read, {});
    const now = Date.now();
    for (const row of $$('[data-ch]')) {
      const isRead = Boolean(read[row.dataset.ch]);
      row.classList.toggle('is-read', isRead);
      const published = Date.parse(row.dataset.date || '');
      const fresh = !isRead && published <= now && now - published < NEW_DAYS * 864e5;
      const badge = $('.badge-new', row);
      if (fresh && !badge) $('.toc-title', row)?.insertAdjacentHTML('beforeend', ' <span class="badge-new">ใหม่</span>');
      else if (!fresh && badge) badge.remove();
    }
  }

  function sortToc(button) {
    const list = $('[data-toc]');
    if (!list) return;
    list.append(...Array.from(list.children).reverse());
    const newestFirst = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(newestFirst));
    button.textContent = newestFirst ? 'เรียงจากตอนแรก' : 'เรียงจากตอนล่าสุด';
  }

  function showContinue() {
    const last = store.get(KEYS.last, {});
    for (const link of $$('[data-continue-novel]')) {
      const entry = last[link.dataset.continueNovel];
      if (!entry?.url) continue;
      link.href = root + entry.url;
      link.textContent = `อ่านต่อ ${entry.label}`;
    }
    const card = $('[data-continue]');
    const recent = Object.values(last).filter(entry => entry?.url).sort((a, b) => b.t - a.t)[0];
    if (!card || !recent) return;
    card.href = root + recent.url;
    $('[data-continue-title]', card).textContent = recent.novelTitle;
    $('[data-continue-sub]', card).textContent = `${recent.label} · ${recent.title}`;
    $('[data-continue-bar]', card).style.transform = `scaleX(${recent.p || 0})`;
    card.hidden = false;
  }

  function toast(message, actionLabel, action) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = message;
    el.append(text);
    const dismiss = () => {
      el.classList.remove('is-shown');
      setTimeout(() => el.remove(), 300);
    };
    if (actionLabel) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = actionLabel;
      btn.addEventListener('click', () => { action(); dismiss(); });
      el.append(btn);
    }
    body.append(el);
    void el.offsetWidth;
    el.classList.add('is-shown');
    setTimeout(dismiss, 6000);
  }

  // ---------- reading page ----------

  function initReader() {
    const data = reader.dataset;
    const key = data.chapter;
    const bar = $('[data-progress]');
    const header = $('[data-readerbar]');
    const saved = store.get(KEYS.progress, {})[key];
    let lastY = window.scrollY;
    let frame = 0;
    let saveTimer = 0;

    history.scrollRestoration = 'manual';

    function remember(ratio) {
      const progress = store.get(KEYS.progress, {});
      progress[key] = Math.round(ratio * 1000) / 1000;
      store.set(KEYS.progress, progress);
      if (ratio >= 0.9) {
        const read = store.get(KEYS.read, {});
        if (!read[key]) {
          read[key] = 1;
          store.set(KEYS.read, read);
          markChapters();
        }
      }
      // Once a chapter is finished, "continue reading" should point at the next one.
      const last = store.get(KEYS.last, {});
      last[data.novel] = ratio >= 0.97 && data.nextUrl
        ? { url: data.nextUrl, novelTitle: data.novelTitle, label: data.nextLabel, title: data.nextTitle, p: 0, t: Date.now() }
        : { url: data.url, novelTitle: data.novelTitle, label: data.label, title: data.title, p: ratio, t: Date.now() };
      store.set(KEYS.last, last);
    }

    function update() {
      frame = 0;
      const ratio = scrollRatio();
      const y = window.scrollY;
      bar.style.transform = `scaleX(${ratio})`;
      if (!openSheetEl && Math.abs(y - lastY) > 6) {
        header.classList.toggle('is-hidden', y > lastY && y > 96);
        lastY = y;
      }
      if (ratio > 0.995) header.classList.remove('is-hidden');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => remember(ratio), 400);
    }

    const schedule = () => { frame ||= requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pagehide', () => remember(scrollRatio()));

    // Restore after web fonts load, otherwise the text reflows and the position drifts.
    const restore = () => {
      if (saved > 0.02 && saved < 0.97 && !location.hash) {
        window.scrollTo(0, saved * scrollRange());
        toast('อ่านต่อจากจุดที่ค้างไว้', 'กลับไปต้นตอน', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      }
      update();
    };
    const afterFonts = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(restore));
    if (document.readyState === 'complete') afterFonts();
    else window.addEventListener('load', afterFonts, { once: true });
  }

  // ---------- events ----------

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-set], [data-step], [data-open], [data-close], [data-scrim], [data-action]');
    if (!target) return;
    if (target.matches('[data-set]')) {
      updateSettings({ [target.dataset.set]: target.dataset.value });
    } else if (target.matches('[data-step]')) {
      const size = Math.min(SIZE_MAX, Math.max(SIZE_MIN, Number(settings.size) + Number(target.dataset.step)));
      updateSettings({ size });
    } else if (target.matches('[data-open]')) {
      openSheet(target.dataset.open, target);
    } else if (target.matches('[data-close], [data-scrim]')) {
      closeSheet();
    } else if (target.dataset.action === 'reset') {
      updateSettings({ ...DEFAULTS });
    } else if (target.dataset.action === 'toc-sort') {
      sortToc(target);
    }
  });

  document.addEventListener('keydown', event => {
    if (openSheetEl) {
      if (event.key === 'Escape') closeSheet();
      else if (event.key === 'Tab') trapFocus(event);
      return;
    }
    if (!reader || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const rel = { ArrowLeft: 'prev', ArrowRight: 'next' }[event.key];
    if (rel) $(`[data-nav="${rel}"]`)?.click();
  });

  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', applySettings);

  applySettings();
  markChapters();
  showContinue();
  if (reader) initReader();
})();
