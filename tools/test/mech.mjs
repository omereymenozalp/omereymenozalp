import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + e.stack));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto(new URL('../../index.html', import.meta.url).href);
await page.waitForTimeout(300);
const r = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input;
  const log = [];
  const run = (n, keys = {}) => { I.keys = { ...keys }; for (let i = 0; i < n; i++) S.tick(); I.keys = {}; };
  const tp = (tx, ty) => { P.x = tx * 16 + 2; P.y = (ty + 1) * 16 - P.h; P.vx = 0; P.vy = 0; G.cam.x = Math.max(0, P.x - 150); };
  G.unlocked = 4;
  // --- 1-1: power block at x=19,y=9
  S.newGame(0); run(160);
  tp(19, 12); run(5);
  run(30, { a: 1 });
  const item = S.area.ents.find(e => e.type === 'item');
  log.push('item spawned: ' + (item && item.kind));
  run(60);
  if (item) { P.x = item.x; P.y = item.y + item.h - P.h; }
  run(70);
  log.push('size after mushroom: ' + P.size + ' h=' + P.h);
  // stomp a kestane
  const k = S.area.ents.find(e => e.type === 'kestane' && !e.dead);
  k.active = true; P.x = k.x; P.y = k.y - P.h - 10; P.vy = 3; G.cam.x = Math.max(0, k.x - 150);
  run(3);
  log.push('kestane flat: ' + !!k.flat + ' score=' + G.score);
  // pipe warp at 50 (top row 9)
  tp(50, 8); P.x = 50 * 16 + 10; run(10);
  run(5, { down: 1 }); log.push('pipe state: ' + P.state);
  run(60);
  log.push('area after pipe: ' + G.areaIdx + ' state=' + P.state);
  run(60);
  // walk to exit pipe 23 in bonus
  tp(23, 10); P.x = 23 * 16 + 10; run(10);
  run(3, { down: 1 }); run(60);
  log.push('area after exit: ' + G.areaIdx + ' state=' + P.state + ' x=' + Math.round(P.x / 16));
  run(60);
  log.push('after emerge state=' + P.state + ' y=' + P.y);
  // flag
  tp(194, 12); run(5);
  run(200, { right: 1 });
  log.push('flag: state=' + P.state + ' G.state=' + G.state);
  for (let i = 0; i < 1500 && G.state === 'play'; i++) S.tick();
  log.push('after tally: G.state=' + G.state + ' level=' + G.levelIdx + ' unlocked=' + G.unlocked + ' score=' + G.score);
  // death by pit in 1-2
  run(160);
  log.push('in 1-2 state=' + G.state);
  tp(45, 5); run(120);
  log.push('after pit: ' + G.state);
  run(200);
  log.push('after death: G.state=' + G.state + ' lives=' + G.lives);
  // 1-4 boss
  S.newGame(3); run(160);
  P.size = 2; P.h = 29;
  tp(128, 9); G.cam.x = 128 * 16 - 100; run(30);
  const boss = S.area.ents.find(e => e.type === 'boss');
  log.push('boss fight=' + boss.fight + ' hp=' + boss.hp);
  // shoot boss a few times
  P.dir = 1;
  for (let i = 0; i < 40; i++) { I.keys = { b: i % 2 }; S.tick(); }
  I.keys = {};
  run(60);
  log.push('boss hp after fire=' + boss.hp + ' P.state=' + P.state + ' size=' + P.size);
  // teleport to axe
  P.inv = 999; tp(148, 9); run(5);
  log.push('after axe: P.state=' + P.state + ' seq=' + (G.seq && G.seq.k));
  for (let i = 0; i < 900 && G.state === 'play'; i++) S.tick();
  log.push('end: G.state=' + G.state + ' msg=' + !!G.msg);
  return log;
});
console.log(r.join('\n'));
await page.screenshot({ path: OUT + '/ending.png' });
console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
await browser.close();
