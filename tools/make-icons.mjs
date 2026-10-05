// Renders the PWA / favicon PNGs from the game's own generated pixel art.
// Run after `node tools/build.mjs`:  node tools/make-icons.mjs
// Loads index.html in headless Chromium, composes a small logical scene with the hero's big head
// (BIG_HEAD + HERO_PAL from src/03_art.js) and scales it up with nearest-neighbour only.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = [
  // file, size, kind
  ['icons/icon-512.png', 512, 'full'],
  ['icons/icon-192.png', 192, 'full'],
  ['icons/maskable-512.png', 512, 'maskable'],
  ['icons/maskable-192.png', 192, 'maskable'],
  ['icons/apple-touch-icon.png', 180, 'apple'],
  ['icons/favicon-48.png', 48, 'head'],
  ['favicon.png', 32, 'head'],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
// The game lives in an IIFE, so make a temp copy of the built page that also exposes the art helpers.
const html = readFileSync(join(root, 'index.html'), 'utf8');
const end = html.lastIndexOf('})();');
if (end < 0) throw new Error('could not find the end of the game IIFE in index.html');
const tmp = join(mkdtempSync(join(tmpdir(), 'sb-icons-')), 'index.html');
writeFileSync(tmp, html.slice(0, end) + 'window.__ICON = { BIG_HEAD, HERO_PAL, fromStrings, Pix, K };\n' + html.slice(end));
await page.goto(pathToFileURL(tmp).href);
await page.waitForTimeout(200);

const res = await page.evaluate(jobs => {
  const { BIG_HEAD, HERO_PAL, fromStrings, Pix, K } = window.__ICON;
  const BG = '#140d22', GOLD = '#ffd84a', RED = '#e4572e';
  const head = fromStrings(BIG_HEAD, HERO_PAL, 16); // 16x14
  // Logical scene: hero head on a gold disc with a red ring and a few sparkles, dark night background.
  function scene(L, opt) {
    const p = new Pix(L, L), c = L / 2;
    if (opt.bg) p.rect(0, 0, L, L, BG);
    const r = opt.r;
    p.ell(c, c, r + 1, r + 1, K);
    p.ell(c, c, r, r, RED);
    p.ell(c, c, r - 1.4, r - 1.4, GOLD);
    if (opt.sparkle) {
      const sp = (x, y) => { p.px(x, y, '#fff4e0'); p.px(x - 1, y, GOLD); p.px(x + 1, y, GOLD); p.px(x, y - 1, GOLD); p.px(x, y + 1, GOLD); };
      sp(2, 2); sp(L - 3, L - 3); p.px(L - 2, 1, '#fff4e0'); p.px(1, L - 2, '#c8ecff');
    }
    const cv = p.canvas(), g = cv.getContext('2d');
    g.drawImage(head, Math.round(c - 8 - 0.5), Math.round(c - 7 - 0.5));
    return cv;
  }
  function headOnly() {
    const p = new Pix(16, 16), cv = p.canvas(), g = cv.getContext('2d');
    g.drawImage(head, 0, 1);
    return cv;
  }
  const out = {};
  for (const [file, size, kind] of jobs) {
    let src, fill;
    if (kind === 'head') { src = headOnly(); fill = 1; }
    else if (kind === 'full') { src = scene(26, { bg: true, r: 11.5, sparkle: true }); fill = 1; }
    else if (kind === 'apple') { src = scene(26, { bg: true, r: 11.5, sparkle: true }); fill = 1; }
    else { src = scene(30, { bg: true, r: 11, sparkle: false }); fill = 1; } // maskable: disc fits in the 80% safe circle
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (kind !== 'head') { g.fillStyle = BG; g.fillRect(0, 0, size, size); }
    const s = Math.max(1, Math.floor(size * fill / src.width));
    const w = src.width * s, o = Math.floor((size - w) / 2);
    g.drawImage(src, o, o, w, w);
    out[file] = cv.toDataURL('image/png');
  }
  return out;
}, OUT);

for (const [file] of OUT) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), Buffer.from(res[file].split(',')[1], 'base64'));
  console.log('wrote', file);
}
await browser.close();
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
