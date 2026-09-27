#!/usr/bin/env node
// Builds the novel site: Markdown in content/ -> static HTML in dist/. No dependencies.
//   node scripts/build.mjs                  build once
//   node scripts/build.mjs --serve [port]   build, serve dist/ and rebuild when content/ or theme/ changes

import { createHash } from 'node:crypto';
import { watch } from 'node:fs';
import fs from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const THEME = path.join(ROOT, 'theme');
const DIST = path.join(ROOT, 'dist');

const WORDS_PER_MINUTE = 250;
const COVER_FILE = /^cover\.(?:jpe?g|png|webp|avif|gif)$/i;
const COVER_COLORS = ['#5b3a29', '#2f4a3a', '#2c3e57', '#6b2e2e', '#7a5b2b', '#3d3b4f', '#4a5a3b', '#35505a'];
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600&family=Noto+Serif+Thai:wght@400;500;600;700&family=Sarabun:ital,wght@0,400;0,600;1,400&display=swap';
const SCENE_BREAK = /^(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/;
const NOTE_BREAK = /^={3,}$/;
const TITLE_HAS_NUMBER = /^(?:ตอนที่|ตอน|บทที่|บท|chapter|ch\.?|episode|ep\.?)\s*[\d๐-๙]+/i;

const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
const collator = new Intl.Collator('th', { numeric: true, sensitivity: 'base' });
const thaiDate = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// ---------- helpers ----------

const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const enc = encodeURIComponent;
const isRelative = src => !/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(src);
const fmtDate = date => (date ? thaiDate.format(date) : '');
const isoDate = date => (date ? date.toISOString().slice(0, 10) : '');
const truthy = value => /^(?:true|yes|1|ใช่)$/i.test(String(value ?? '').trim());
const list = value => (value ? value.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^(["'])(.*)\1$/, '$2')).filter(Boolean) : []);
const slugify = value => value.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

function fmtMinutes(minutes) {
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}

function parseDate(value) {
  const m = String(value ?? '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const year = Number(m[1]) > 2400 ? Number(m[1]) - 543 : Number(m[1]); // accept Buddhist-era years
  const date = new Date(Date.UTC(year, Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(date.getTime()) ? null : date;
}

function countWords(text) {
  let n = 0;
  for (const s of segmenter.segment(text)) if (s.isWordLike) n++;
  return n;
}

function excerpt(text, max = 150) {
  if (text.length <= max) return text;
  let out = '';
  for (const { segment } of segmenter.segment(text)) {
    if (out.length + segment.length > max) break;
    out += segment;
  }
  return `${out.trimEnd()}…`;
}

function pickColor(seed) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return COVER_COLORS[h % COVER_COLORS.length];
}

function statusOf(value = '') {
  const v = value.trim();
  if (!v) return null;
  if (/^(?:complete|completed|end|ended|finished|done|จบ)/i.test(v)) return { key: 'done', label: 'จบแล้ว' };
  if (/^(?:hiatus|paused?|on hold|พัก|หยุด|ดอง)/i.test(v)) return { key: 'paused', label: 'พักการเขียน' };
  if (/^(?:ongoing|writing|กำลัง)/i.test(v)) return { key: 'ongoing', label: 'กำลังเขียน' };
  return { key: 'ongoing', label: v };
}

// ---------- Markdown ----------

function parseFrontMatter(raw) {
  const text = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = text.match(/^---[ \t]*\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of (m[1] ?? '').split('\n')) {
    const kv = line.match(/^\s*([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const quoted = kv[2].match(/^(["'])(.*?)\1/);
    data[kv[1].toLowerCase()] = quoted ? quoted[2] : kv[2].replace(/\s+#.*$/, '').trim();
  }
  return { data, body: text.slice(m[0].length) };
}

function inline(text, asset) {
  return esc(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${asset(src)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const scheme = href.match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase();
      if (scheme === 'http' || scheme === 'https') return `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
      return !scheme || scheme === 'mailto' ? `<a href="${href}">${label}</a>` : label;
    })
    .replace(/\*\*\*(?=\S)(.+?)(?<=\S)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(?=\S)(.+?)(?<=\S)\*/g, '<em>$1</em>')
    .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, '<del>$1</del>');
}

// Novel-friendly Markdown: every non-empty line is its own paragraph, which matches how
// text pasted from Word or Google Docs looks. Raw HTML is escaped.
function markdown(src, asset = s => s) {
  const out = [];
  let quote = [];
  const flush = () => {
    if (quote.length) out.push(`<blockquote>${quote.map(l => `<p>${inline(l, asset)}</p>`).join('')}</blockquote>`);
    quote = [];
  };
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      if (q[1].trim()) quote.push(q[1].trim());
      continue;
    }
    flush();
    if (!line) continue;
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (SCENE_BREAK.test(line)) {
      out.push('<hr class="scene-break">');
    } else if (heading) {
      const level = heading[1].length + 1;
      out.push(`<h${level}>${inline(heading[2], asset)}</h${level}>`);
    } else if (image) {
      const caption = image[1] ? `<figcaption>${esc(image[1])}</figcaption>` : '';
      out.push(`<figure><img src="${asset(esc(image[2]))}" alt="${esc(image[1])}" loading="lazy">${caption}</figure>`);
    } else {
      out.push(`<p>${inline(line, asset)}</p>`);
    }
  }
  flush();
  return out.join('\n');
}

function plainText(md) {
  return md
    .split('\n')
    .filter(line => !SCENE_BREAK.test(line.trim()) && !NOTE_BREAK.test(line.trim()))
    .join('\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[#>]+\s?/gm, '')
    .replace(/[*~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- content ----------

async function readSite() {
  const raw = await fs.readFile(path.join(CONTENT, 'site.md'), 'utf8').catch(() => '');
  const { data, body } = parseFrontMatter(raw);
  return {
    title: data.title || 'ชั้นหนังสือ',
    author: data.author || '',
    tagline: data.tagline || '',
    description: data.description || data.tagline || '',
    url: data.url ? data.url.replace(/\/*$/, '/') : '',
    introHtml: body.trim() ? markdown(body.trim()) : '',
  };
}

async function readNovel(slug, site) {
  const dir = path.join(CONTENT, slug);
  const entries = (await fs.readdir(dir, { withFileTypes: true })).filter(e => !/^[._]/.test(e.name));
  const infoEntry = entries.find(e => e.isFile() && e.name.toLowerCase() === 'novel.md');
  const info = infoEntry ? parseFrontMatter(await fs.readFile(path.join(dir, infoEntry.name), 'utf8')) : { data: {}, body: '' };
  const meta = info.data;
  const chapterAsset = src => (isRelative(src) ? `../${src}` : src);

  const files = entries
    .filter(e => e.isFile() && /\.md$/i.test(e.name) && e !== infoEntry)
    .map(e => e.name)
    .sort(collator.compare);

  const chapters = [];
  const usedSlugs = new Set();
  let number = 0;
  for (const file of files) {
    const { data, body } = parseFrontMatter(await fs.readFile(path.join(dir, file), 'utf8'));
    if (truthy(data.draft)) continue;

    const lines = body.split('\n');
    const noteAt = lines.findIndex(l => NOTE_BREAK.test(l.trim()));
    let story = noteAt < 0 ? body : lines.slice(0, noteAt).join('\n');
    const note = noteAt < 0 ? '' : lines.slice(noteAt + 1).join('\n').trim();
    const heading = story.match(/^\s*#\s+(.+)\n?/);
    if (heading) story = story.slice(heading[0].length);

    const stem = file.replace(/\.md$/i, '');
    let chSlug = stem.match(/^\d+/)?.[0].replace(/^0+(?=\d)/, '') || slugify(stem) || `ch-${chapters.length + 1}`;
    while (usedSlugs.has(chSlug)) chSlug += '-2';
    usedSlugs.add(chSlug);

    const custom = data.label?.trim();
    if (!custom) number++;
    const label = custom || `ตอนที่ ${number}`;
    const text = plainText(story);
    const words = countWords(text);
    chapters.push({
      slug: chSlug,
      label,
      short: custom || String(number),
      title: data.title || heading?.[1].trim() || label,
      date: parseDate(data.date),
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      excerpt: excerpt(text),
      html: markdown(story, chapterAsset),
      noteHtml: note ? markdown(note, chapterAsset) : '',
    });
  }

  const title = meta.title || slug;
  const synopsis = info.body.trim();
  const dates = chapters.map(c => c.date).filter(Boolean);
  return {
    slug,
    title,
    subtitle: meta.subtitle || '',
    author: meta.author || site.author,
    status: statusOf(meta.status),
    tags: list(meta.tags),
    order: Number(meta.order) || 0,
    cover: meta.cover || entries.find(e => e.isFile() && COVER_FILE.test(e.name))?.name || '',
    color: /^#[\da-f]{3,8}$/i.test(meta.color || '') ? meta.color : pickColor(title),
    synopsisHtml: synopsis ? markdown(synopsis) : '',
    excerpt: excerpt(plainText(synopsis)),
    chapters,
    minutes: chapters.reduce((sum, c) => sum + c.minutes, 0),
    updated: dates.length ? new Date(Math.max(...dates)) : null,
    assets: entries.filter(e => !/\.md$/i.test(e.name)).map(e => e.name),
  };
}

// ---------- templates ----------

const icon = paths => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
  back: icon('<path d="M15 18l-6-6 6-6"/>'),
  toc: icon('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
  type: icon('<path d="M3.5 19 8.5 5l5 14M5.3 14h6.4M14.5 19l3.5-9 3.5 9M15.7 16h4.6"/>'),
  theme: icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor"/>'),
  close: icon('<path d="M18 6 6 18M6 6l12 12"/>'),
};

// Applies saved reader settings before first paint so there is no flash of the wrong theme.
const PREPAINT = "try{var s=JSON.parse(localStorage.getItem('novel:settings')||'{}'),e=document.documentElement;if(s.theme&&s.theme!=='auto')e.dataset.theme=s.theme;['font','leading','width','indent'].forEach(function(k){if(s[k]!=null)e.dataset[k]=s[k]});if(s.size)e.style.setProperty('--read-size',s.size+'px')}catch(_){}";

function layout(ctx, { title, description = '', root, body, page, urlPath = null, image = '', type = 'website' }) {
  const { site, assets } = ctx;
  const url = site.url && urlPath != null ? site.url + urlPath : '';
  const img = site.url && image ? site.url + image : '';
  const meta = [
    description && `<meta name="description" content="${esc(description)}">`,
    '<meta name="theme-color" content="#fbf8f3">',
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${esc(site.title)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    description && `<meta property="og:description" content="${esc(description)}">`,
    url && `<meta property="og:url" content="${esc(url)}">\n<link rel="canonical" href="${esc(url)}">`,
    img && `<meta property="og:image" content="${esc(img)}">`,
  ].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${meta}
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(FONTS_URL)}">
<link rel="stylesheet" href="${root}assets/style.css?v=${assets['style.css']}">
<script>${PREPAINT}</script>
<script src="${root}assets/app.js?v=${assets['app.js']}" defer></script>
</head>
<body data-page="${page}" data-root="${root}">
<a class="skip-link" href="#main">ข้ามไปที่เนื้อหา</a>
${body}
</body>
</html>
`;
}

const topbar = (ctx, root) => `<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="${root}">${esc(ctx.site.title)}</a>
    <button class="icon-btn" type="button" data-open="settings" aria-label="เปลี่ยนธีม">${ICONS.theme}</button>
  </div>
</header>`;

const footer = ctx => `<footer class="site-footer"><p>© ${ctx.year}${ctx.site.author ? ` ${esc(ctx.site.author)}` : ''}</p></footer>`;

const scrim = '<div class="scrim" data-scrim hidden></div>';

function settingsSheet(full) {
  const seg = (key, options, extraClass = '') => `<div class="seg${extraClass}">${options
    .map(([value, label, attrs = '']) => `<button type="button" data-set="${key}" data-value="${value}" aria-pressed="false"${attrs}>${label}</button>`)
    .join('')}</div>`;
  const row = (label, control) => `<div class="setting"><span class="setting-label">${label}</span>${control}</div>`;
  const rows = [
    row('ธีม', seg('theme', [
      ['auto', 'อัตโนมัติ', ' class="swatch" style="--sw: linear-gradient(135deg, #fbf8f3 50%, #1a1917 50%)"'],
      ['light', 'สว่าง', ' class="swatch" style="--sw: #fbf8f3"'],
      ['sepia', 'ซีเปีย', ' class="swatch" style="--sw: #f4ecda"'],
      ['dark', 'มืด', ' class="swatch" style="--sw: #1a1917"'],
    ])),
  ];
  if (full) {
    rows.push(
      row('ฟอนต์', seg('font', [
        ['serif', 'หนังสือ', ' style="font-family: var(--font-serif)"'],
        ['sans', 'อ่านง่าย', ' style="font-family: var(--font-sans)"'],
        ['modern', 'โมเดิร์น', ' style="font-family: var(--font-modern)"'],
      ])),
      row('ขนาด', `<div class="stepper">
        <button type="button" data-step="-1" aria-label="ลดขนาดตัวอักษร"><span class="is-small">ก</span></button>
        <output data-out="size" aria-live="polite"></output>
        <button type="button" data-step="1" aria-label="เพิ่มขนาดตัวอักษร"><span class="is-big">ก</span></button>
      </div>`),
      row('บรรทัด', seg('leading', [['tight', 'ชิด'], ['normal', 'ปกติ'], ['loose', 'โปร่ง']])),
      row('ความกว้าง', seg('width', [['narrow', 'แคบ'], ['normal', 'กลาง'], ['wide', 'กว้าง']])),
      row('ย่อหน้า', seg('indent', [['0', 'เว้นบรรทัด'], ['1', 'แบบหนังสือ']])),
    );
  }
  return `<section class="sheet" data-sheet="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden>
  <div class="sheet-head"><h2 id="settings-title">${full ? 'ตั้งค่าการอ่าน' : 'ธีมสี'}</h2><button class="icon-btn" type="button" data-close aria-label="ปิด">${ICONS.close}</button></div>
  ${rows.join('\n  ')}
  ${full ? '<div class="sheet-foot"><button class="text-btn" type="button" data-action="reset">คืนค่าเริ่มต้น</button></div>' : ''}
</section>`;
}

function cover(n, base) {
  if (n.cover) {
    const src = isRelative(n.cover) ? base + n.cover : n.cover;
    return `<img class="cover" src="${esc(src)}" alt="" loading="lazy">`;
  }
  return `<div class="cover cover-generated" style="--cover-bg: ${n.color}">
      <span class="cover-title">${esc(n.title)}</span>
      <span class="cover-rule"></span>
      ${n.author ? `<span class="cover-author">${esc(n.author)}</span>` : ''}
    </div>`;
}

function pills(n, maxTags = Infinity) {
  const items = n.tags.slice(0, maxTags).map(tag => `<span class="pill">${esc(tag)}</span>`);
  if (n.status) items.unshift(`<span class="pill pill-status is-${n.status.key}">${esc(n.status.label)}</span>`);
  return items.length ? `<div class="pills">${items.join('')}</div>` : '';
}

// Each part is kept on one line so a date never wraps in the middle.
const novelMeta = n => [
  `${n.chapters.length} ตอน`,
  n.chapters.length && `อ่าน ${fmtMinutes(n.minutes)}`,
  n.updated && `อัปเดต ${fmtDate(n.updated)}`,
].filter(Boolean).map(part => `<span>${esc(part)}</span>`).join(' · ');

function tocRow(n, c, base, current = false) {
  const date = c.date ? ` data-date="${isoDate(c.date)}"` : '';
  return `<li><a class="toc-row" href="${base}${enc(c.slug)}/" data-ch="${esc(`${n.slug}/${c.slug}`)}"${date}${current ? ' aria-current="page"' : ''}>
      <span class="toc-num">${esc(c.short)}</span>
      <span class="toc-title">${esc(c.title)}</span>
      <span class="toc-meta">${[fmtDate(c.date), `${c.minutes} นาที`].filter(Boolean).join(' · ')}</span>
    </a></li>`;
}

function novelCard(n) {
  const href = `n/${enc(n.slug)}/`;
  const first = n.chapters[0];
  return `<article class="novel-card">
    <a class="novel-card-cover book" href="${href}" tabindex="-1" aria-hidden="true">${cover(n, href)}</a>
    <div class="novel-card-head">
      ${pills(n, 3)}
      <h3 class="novel-card-title"><a href="${href}">${esc(n.title)}</a></h3>
      <p class="meta">${novelMeta(n)}</p>
    </div>
    ${n.excerpt ? `<p class="novel-card-excerpt">${esc(n.excerpt)}</p>` : ''}
    <div class="actions">
      ${first ? `<a class="btn btn-primary" href="${href}${enc(first.slug)}/" data-continue-novel="${esc(n.slug)}">เริ่มอ่าน</a>` : ''}
      <a class="btn btn-quiet" href="${href}#toc">สารบัญ</a>
    </div>
  </article>`;
}

function homePage(ctx, novels) {
  const { site } = ctx;
  const root = './';
  const body = `${topbar(ctx, root)}
<main id="main" class="wrap home">
  <section class="hero">
    <h1 class="hero-title">${esc(site.title)}</h1>
    ${site.tagline ? `<p class="hero-tagline">${esc(site.tagline)}</p>` : ''}
    ${site.author ? `<p class="hero-byline">โดย ${esc(site.author)}</p>` : ''}
    <span class="ornament" aria-hidden="true"></span>
    ${site.introHtml ? `<div class="hero-intro">${site.introHtml}</div>` : ''}
  </section>
  <a class="continue-card" href="${root}" data-continue hidden>
    <span class="continue-kicker">อ่านต่อจากที่ค้างไว้</span>
    <span class="continue-title" data-continue-title></span>
    <span class="continue-sub" data-continue-sub></span>
    <span class="meter"><i data-continue-bar></i></span>
  </a>
  <section class="shelf" aria-labelledby="shelf-title">
    <div class="section-head"><h2 id="shelf-title" class="section-title">นิยายทั้งหมด</h2><span class="section-count">${novels.length} เรื่อง</span></div>
    ${novels.length ? `<div class="novel-list">${novels.map(novelCard).join('\n')}</div>` : '<p class="empty">ยังไม่มีนิยาย สร้างโฟลเดอร์เรื่องแรกใน content/ ได้เลย</p>'}
  </section>
</main>
${footer(ctx)}
${settingsSheet(false)}
${scrim}`;
  return layout(ctx, { title: site.title, description: site.description, root, body, page: 'home', urlPath: '' });
}

function novelPage(ctx, n) {
  const root = '../../';
  const first = n.chapters[0];
  const stats = [
    ['จำนวนตอน', `${n.chapters.length} ตอน`],
    n.chapters.length && ['เวลาอ่านรวม', fmtMinutes(n.minutes)],
    n.updated && ['อัปเดตล่าสุด', fmtDate(n.updated)],
  ].filter(Boolean);
  const body = `${topbar(ctx, root)}
<main id="main" class="wrap is-narrow novel">
  <section class="novel-hero">
    <div class="novel-hero-cover book">${cover(n, '')}</div>
    <div class="novel-hero-info">
      ${pills(n)}
      <h1 class="novel-title">${esc(n.title)}</h1>
      ${n.subtitle ? `<p class="novel-subtitle">${esc(n.subtitle)}</p>` : ''}
      ${n.author ? `<p class="novel-byline">โดย ${esc(n.author)}</p>` : ''}
      <dl class="stats">${stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="actions">
        ${first ? `<a class="btn btn-primary" href="${enc(first.slug)}/" data-continue-novel="${esc(n.slug)}">เริ่มอ่านตอนแรก</a>` : ''}
        <a class="btn btn-quiet" href="#toc">ดูสารบัญ</a>
      </div>
    </div>
  </section>
  ${n.synopsisHtml ? `<section class="synopsis" aria-labelledby="synopsis-title"><h2 id="synopsis-title" class="section-title">เรื่องย่อ</h2><div class="prose">${n.synopsisHtml}</div></section>` : ''}
  <section class="toc" id="toc" aria-labelledby="toc-title">
    <div class="section-head"><h2 id="toc-title" class="section-title">สารบัญ</h2>${n.chapters.length > 1 ? '<button class="text-btn" type="button" data-action="toc-sort" aria-pressed="false">เรียงจากตอนล่าสุด</button>' : ''}</div>
    ${n.chapters.length ? `<ol class="toc-list" data-toc>${n.chapters.map(c => tocRow(n, c, '')).join('\n')}</ol>` : '<p class="empty">ยังไม่มีตอนที่เผยแพร่</p>'}
  </section>
</main>
${footer(ctx)}
${settingsSheet(false)}
${scrim}`;
  const coverPath = n.cover && isRelative(n.cover) ? `n/${enc(n.slug)}/${n.cover}` : '';
  return layout(ctx, { title: `${n.title} · ${ctx.site.title}`, description: n.excerpt, root, body, page: 'novel', urlPath: `n/${enc(n.slug)}/`, image: coverPath });
}

function chapterPage(ctx, n, i) {
  const c = n.chapters[i];
  const prev = n.chapters[i - 1];
  const next = n.chapters[i + 1];
  const root = '../../../';
  const url = `n/${enc(n.slug)}/${enc(c.slug)}/`;
  const navLink = (ch, rel) => `<a class="chapter-nav-link is-${rel}" href="../${enc(ch.slug)}/" rel="${rel}" data-nav="${rel}">
      <span class="chapter-nav-kicker">${rel === 'prev' ? 'ตอนก่อนหน้า' : 'ตอนถัดไป'}</span>
      <strong>${esc(ch.title)}</strong>
    </a>`;
  const nextData = next
    ? ` data-next-url="${esc(`n/${enc(n.slug)}/${enc(next.slug)}/`)}" data-next-label="${esc(next.label)}" data-next-title="${esc(next.title)}"`
    : '';
  const body = `<div class="progress" aria-hidden="true"><i data-progress></i></div>
<header class="readerbar" data-readerbar>
  <a class="icon-btn" href="../" aria-label="กลับไปหน้าเรื่อง">${ICONS.back}</a>
  <a class="readerbar-title" href="../">${esc(n.title)}</a>
  <button class="icon-btn" type="button" data-open="toc" aria-label="สารบัญ">${ICONS.toc}</button>
  <button class="icon-btn" type="button" data-open="settings" aria-label="ตั้งค่าการอ่าน">${ICONS.type}</button>
</header>
<main id="main" class="reader" data-novel="${esc(n.slug)}" data-chapter="${esc(`${n.slug}/${c.slug}`)}" data-url="${esc(url)}" data-novel-title="${esc(n.title)}" data-label="${esc(c.label)}" data-title="${esc(c.title)}"${nextData}>
  <article class="chapter">
    <header class="chapter-head">
      ${TITLE_HAS_NUMBER.test(c.title) ? '' : `<p class="chapter-label">${esc(c.label)}</p>`}
      <h1 class="chapter-title">${esc(c.title)}</h1>
      <p class="chapter-meta">${[fmtDate(c.date), `อ่านประมาณ ${fmtMinutes(c.minutes)}`].filter(Boolean).join(' · ')}</p>
    </header>
    <div class="chapter-body">
${c.html}
    </div>
    ${c.noteHtml ? `<aside class="author-note" aria-labelledby="note-title"><p class="author-note-label" id="note-title">ทอล์กจากผู้เขียน</p>${c.noteHtml}</aside>` : ''}
  </article>
  <nav class="chapter-nav" aria-label="เปลี่ยนตอน">
    ${prev ? navLink(prev, 'prev') : ''}
    ${next ? navLink(next, 'next') : '<a class="chapter-nav-link is-end" href="../"><span class="chapter-nav-kicker">อ่านถึงตอนล่าสุดแล้ว</span><strong>กลับไปหน้าเรื่อง</strong></a>'}
  </nav>
</main>
<section class="sheet sheet-side" data-sheet="toc" role="dialog" aria-modal="true" aria-labelledby="toc-sheet-title" hidden>
  <div class="sheet-head"><h2 id="toc-sheet-title">สารบัญ</h2><button class="icon-btn" type="button" data-close aria-label="ปิด">${ICONS.close}</button></div>
  <ol class="toc-list is-compact">${n.chapters.map(ch => tocRow(n, ch, '../', ch === c)).join('\n')}</ol>
</section>
${settingsSheet(true)}
${scrim}`;
  const coverPath = n.cover && isRelative(n.cover) ? `n/${enc(n.slug)}/${n.cover}` : '';
  return layout(ctx, { title: `${c.title} · ${n.title}`, description: c.excerpt, root, body, page: 'chapter', urlPath: url, image: coverPath, type: 'article' });
}

function notFoundPage(ctx) {
  const { site } = ctx;
  // Without a configured url, guess the GitHub Pages project root (/<repo>/) so "home" works.
  const guessHome = site.url ? '' : `
<script>
  if (/\\.github\\.io$/.test(location.hostname)) {
    var first = location.pathname.split('/')[1];
    if (first) document.getElementById('home').href = '/' + first + '/';
  }
</script>`;
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ไม่พบหน้านี้ · ${esc(site.title)}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; text-align: center; background: #fbf8f3; color: #2b2521; font-family: "Noto Serif Thai", Georgia, serif; }
  @media (prefers-color-scheme: dark) { body { background: #1a1917; color: #e8e1d5; } a { color: #e2a878; } }
  h1 { margin: 0; font-size: 3.5rem; font-weight: 600; }
  p { opacity: .8; }
  a { color: #9a4a2c; }
</style>
</head>
<body>
<main>
  <h1>404</h1>
  <p>ไม่พบหน้านี้ อาจถูกย้ายหรือยังไม่ได้เผยแพร่</p>
  <p><a id="home" href="${esc(site.url || '/')}">กลับหน้าแรก</a></p>
</main>${guessHome}
</body>
</html>
`;
}

// ---------- build ----------

async function write(rel, content) {
  const file = path.join(DIST, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

// Copy images and other files next to the chapters, skipping Markdown, notes (_x) and hidden files.
const keepAsset = src => !/\.md$/i.test(src) && !/^[._]/.test(path.basename(src));

async function build() {
  const started = Date.now();
  const site = await readSite();
  const novels = [];
  for (const entry of await fs.readdir(CONTENT, { withFileTypes: true })) {
    if (entry.isDirectory() && !/^[._]/.test(entry.name)) novels.push(await readNovel(entry.name, site));
  }
  novels.sort((a, b) => (a.order || Infinity) - (b.order || Infinity) || (b.updated ?? 0) - (a.updated ?? 0) || collator.compare(a.title, b.title));

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(path.join(DIST, 'assets'), { recursive: true });
  const assets = {};
  for (const name of await fs.readdir(THEME)) {
    const buf = await fs.readFile(path.join(THEME, name));
    assets[name] = createHash('sha1').update(buf).digest('hex').slice(0, 8);
    await fs.writeFile(path.join(DIST, 'assets', name), buf);
  }

  const ctx = { site, assets, year: new Date().getFullYear() };
  await write('index.html', homePage(ctx, novels));
  await write('404.html', notFoundPage(ctx));
  for (const n of novels) {
    const base = path.join('n', n.slug);
    await write(path.join(base, 'index.html'), novelPage(ctx, n));
    for (let i = 0; i < n.chapters.length; i++) await write(path.join(base, n.chapters[i].slug, 'index.html'), chapterPage(ctx, n, i));
    for (const name of n.assets) {
      await fs.cp(path.join(CONTENT, n.slug, name), path.join(DIST, base, name), { recursive: true, filter: keepAsset });
    }
  }

  const chapterCount = novels.reduce((sum, n) => sum + n.chapters.length, 0);
  console.log(`✓ สร้างเว็บเสร็จ: ${novels.length} เรื่อง ${chapterCount} ตอน ใน ${Date.now() - started} ms → dist/`);
}

// ---------- local preview ----------

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
};

function serve(port) {
  createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.join(DIST, path.normalize(pathname));
      if ((await fs.stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          res.writeHead(301, { Location: encodeURI(`${pathname}/`) });
          return res.end();
        }
        file = path.join(file, 'index.html');
      }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      res.end(await fs.readFile(path.join(DIST, '404.html')).catch(() => 'Not found'));
    }
  }).listen(port, () => console.log(`\n  เปิดดูเว็บที่ http://localhost:${port}  (แก้ไฟล์แล้วรีเฟรชหน้าได้เลย)\n`));
}

function watchAndRebuild() {
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(err => console.error(`✗ ${err.message}`)), 150);
  };
  for (const dir of [CONTENT, THEME]) watch(dir, { recursive: true }, rebuild);
}

const args = process.argv.slice(2);
try {
  await build();
} catch (err) {
  console.error(`✗ build ไม่สำเร็จ\n${err.stack || err}`);
  process.exit(1);
}
if (args.includes('--serve')) {
  serve(Number(args[args.indexOf('--serve') + 1]) || 4321);
  watchAndRebuild();
}
