// Budget check over built dist/. Node built-ins only.
//  1. Front page initial module JS (gzipped) <= limit (default 35 KB).
//  2. Inline theme script <= 600 bytes (raw, UTF-8).
//  3. Back pages: no type="module" and no <script src>.
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const THEME_LIMIT_BYTES = 600;

const argv = process.argv.slice(2);
const li = argv.indexOf('--limit');
const limitKb = li >= 0 ? Number(argv[li + 1]) : 35;
if (!Number.isFinite(limitKb) || limitKb <= 0) {
  console.error('Invalid --limit <KB>');
  process.exit(2);
}
const limit = limitKb * 1024;

const failures = [];
const read = (p) => readFileSync(p, 'utf8');
const gz = (buf) => gzipSync(buf).length;
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];

function distFile(href) {
  const clean = href.split(/[?#]/)[0].replace(/^\//, '');
  return join(DIST, clean);
}

function findHtml(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...findHtml(p));
    else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html missing: run pnpm build first');
  process.exit(2);
}

// 1. Front page module JS
const front = read(join(DIST, 'index.html'));
const seen = new Set();
const parts = [];
for (const m of front.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const tag = m[0].slice(0, m[0].indexOf('>') + 1);
  if (attr(tag, 'type') !== 'module') continue;
  const src = attr(tag, 'src');
  if (src) parts.push([src, readFileSync(distFile(src))]);
  else parts.push(['(inline module)', Buffer.from(m[1])]);
}
for (const m of front.matchAll(/<link\b[^>]*>/gi)) {
  if (attr(m[0], 'rel') !== 'modulepreload') continue;
  const href = attr(m[0], 'href');
  if (href) parts.push([href, readFileSync(distFile(href))]);
}
let total = 0;
for (const [name, buf] of parts) {
  if (seen.has(name)) continue;
  seen.add(name);
  const size = gz(buf);
  total += size;
  console.log(`  ${(size / 1024).toFixed(2)} KB gz  ${name}`);
}
console.log(`Front module JS: ${total} B gz (${(total / 1024).toFixed(2)} KB) / limit ${limitKb} KB`);
if (total > limit) failures.push(`front module JS ${total} B exceeds ${limit} B`);

// 2. Inline theme script: first classic inline script in <head>
const head = front.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
let theme;
for (const m of head.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  const tag = m[0].slice(0, m[0].indexOf('>') + 1);
  if (!attr(tag, 'type') && !attr(tag, 'src')) {
    theme = m[1];
    break;
  }
}
if (theme === undefined) {
  failures.push('inline theme script not found in <head>');
} else {
  const bytes = Buffer.byteLength(theme);
  console.log(`Inline theme script: ${bytes} B / limit ${THEME_LIMIT_BYTES} B`);
  if (bytes > THEME_LIMIT_BYTES) failures.push(`theme script ${bytes} B exceeds ${THEME_LIMIT_BYTES} B`);
}

// 3. Back pages
const backs = findHtml(DIST).filter((p) => p !== join(DIST, 'index.html'));
for (const p of backs) {
  const html = read(p);
  const rel = relative(DIST, p);
  if (/type\s*=\s*["']module["']/i.test(html)) failures.push(`${rel}: contains type="module"`);
  if (/<script\b[^>]*\ssrc\s*=/i.test(html)) failures.push(`${rel}: contains <script src>`);
}
console.log(`Back pages checked: ${backs.length}`);

if (failures.length) {
  console.error('\nBUDGET FAIL');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Budget OK');
