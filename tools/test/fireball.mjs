// Fireball reliability: fire-flower hero stands still on flat ground and fires once at a ground enemy 2..8 tiles away.
// Every ground enemy type must be hit at every distance. Also checks the fireball hops a 1-tile step but dies on a 2-tile wall.
// HTML=path/to/index.html overrides the page under test (handy for comparing against an older build).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
const url = process.env.HTML ? pathToFileURL(process.env.HTML).href : new URL('../../index.html', import.meta.url).href;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto(url);
await page.waitForTimeout(300);
const res = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input, T = S.T;
  S.newGame(0); for (let n = 0; G.state !== 'play' && n < 400; n++) S.tick();
  const A = S.area, PX = 4;
  // flat test range: ground on rows 13-14, empty above
  const flat = () => { for (let x = 0; x < 40; x++) for (let y = 0; y < 15; y++) A.t[y * A.w + x] = y >= 13 ? T.GROUND : T.EMPTY; };
  const reset = () => {
    flat(); A.ents = []; G.parts = []; G.cam.x = 0; G.time = 300;
    P.size = 2; P.h = 29; P.x = PX * 16 + 2; P.y = 13 * 16 - P.h; P.vx = 0; P.vy = 0; P.dir = 1; P.onGround = true;
    P.state = 'play'; P.ducking = false; P.fireCD = 0; P.star = 0; P.inv = 0; P.onPlat = null;
    I.keys = {}; S.tick(); S.tick();
  };
  // fire once from rest, then watch for up to 80 frames
  const shoot = (watch) => {
    I.keys = { b: 1 }; S.tick(); I.keys = {};
    let fb = null, out = { hit: false, frames: 0 };
    for (let f = 0; f < 80; f++) {
      P.inv = 50; P.vx = 0; // the hero must not move or get hurt while we watch
      S.tick();
      fb = fb || A.ents.find(e => e.type === 'fireball');
      if (watch && watch(out, fb)) break;
      if (!A.ents.some(e => e.type === 'fireball' && !e.dead)) { out.frames = f; break; }
    }
    return { out, fb };
  };
  const types = ['kestane', 'spiky', 'beetle', 'scorpion', 'penguin', 'tumble'];
  const table = {};
  for (const type of types) {
    table[type] = [];
    for (let d = 2; d <= 8; d++) {
      reset();
      const e = S.spawnEntity({ type, x: PX + d, y: 12 });
      e.active = true; A.ents.push(e);
      let maxH = 0;
      const { out } = shoot((o, fb) => {
        if (fb && !fb.dead) maxH = Math.max(maxH, 13 * 16 - (fb.y + fb.h));
        if (e.dying || e.dead) { o.hit = true; return true; }
      });
      table[type].push({ d, hit: out.hit, h: e.h, apex: Math.round(maxH * 10) / 10 });
    }
  }
  // fireball over a one-tile step (at tile PX+4), hits a kestane standing on top of it at PX+7
  reset();
  for (let x = PX + 4; x < 40; x++) A.t[12 * A.w + x] = T.GROUND;
  let k = S.spawnEntity({ type: 'kestane', x: PX + 7, y: 11 }); k.active = true; k.vx = 0; A.ents.push(k);
  shoot((o) => k.dying);
  const step = { hit: !!k.dying };
  // a two-tile wall still stops it
  reset();
  for (let x = PX + 4; x < 40; x++) { A.t[12 * A.w + x] = T.GROUND; A.t[11 * A.w + x] = T.GROUND; }
  k = S.spawnEntity({ type: 'kestane', x: PX + 7, y: 10 }); k.active = true; k.vx = 0; A.ents.push(k);
  shoot((o) => k.dying);
  const wall = { hit: !!k.dying };
  return { table, step, wall };
});
let fails = 0;
for (const [type, rows] of Object.entries(res.table)) {
  const hits = rows.filter(r => r.hit).length;
  if (hits !== rows.length) fails++;
  console.log((hits === rows.length ? 'ok   ' : 'FAIL ') + type.padEnd(9) + ` ${hits}/${rows.length}  ` + rows.map(r => `${r.d}:${r.hit ? 'HIT' : 'miss'}`).join(' ') + `   (enemy h=${rows[0].h}, fireball max height ${Math.max(...rows.map(r => r.apex))}px)`);
}
console.log((res.step.hit ? 'ok   ' : 'FAIL ') + 'fireball hops a 1-tile step and hits the kestane on it');
console.log((!res.wall.hit ? 'ok   ' : 'FAIL ') + 'fireball still stops at a 2-tile wall');
if (!res.step.hit) fails++;
if (res.wall.hit) fails++;
if (errs.length) { fails++; console.log('FAIL errors: ' + errs.join(' | ')); } else console.log('ok   no page errors');
await browser.close();
console.log(fails ? fails + ' FAILED' : 'ALL OK');
process.exit(fails ? 1 : 0);
