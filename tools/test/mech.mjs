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
  G.unlocked = 6;
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
  // --- 1-4 ice: slippery ground stops much later than normal ground
  const stopDist = (tx) => {
    S.newGame(3); run(160); for (const e of S.area.ents) if (e.enemy || e.type === 'icicle') e.dead = true;
    tp(tx, 12); run(3); run(50, { right: 1, b: 1 }); const x0 = P.x; run(120); return Math.round(P.x - x0);
  };
  const dGround = stopDist(2), dIce = stopDist(111);
  log.push('stop distance ground=' + dGround + ' ice=' + dIce + ' slippery=' + (dIce > dGround * 2));
  // icicle drops on a slow player and hurts
  S.newGame(3); run(160);
  const ic = S.area.ents.find(e => e.type === 'icicle');
  for (const e of S.area.ents) if (e.enemy) e.dead = true;
  P.size = 1; P.h = 29; P.inv = 0; tp(Math.floor(ic.x / 16), 12); P.x = ic.x - 2; run(80);
  log.push('icicle state=' + ic.st + ' dead=' + !!ic.dead + ' size after=' + P.size);
  // penguin: stompable, slides toward the player
  S.newGame(3); run(160);
  const pg = S.area.ents.find(e => e.type === 'penguin');
  pg.active = true; tp(Math.floor(pg.x / 16) - 5, 12); P.inv = 300; run(45);
  log.push('penguin state near player=' + pg.state + ' vx=' + pg.vx.toFixed(2));
  P.x = pg.x; P.y = pg.y - P.h - 6; P.vy = 3; run(2);
  log.push('penguin stomped: dying=' + !!pg.dying);
  // --- 1-5 desert: scorpion & tumbleweed stomps, fireball, sinking sand, quicksand, pyramid tunnel
  S.newGame(4); run(160);
  for (const type of ['scorpion', 'tumble']) {
    const en = S.area.ents.find(e => e.type === type && !e.dead && !e.dying);
    en.active = true; G.cam.x = Math.max(0, en.x - 150); P.x = en.x; P.y = en.y - P.h - 6; P.vy = 3; P.inv = 0; run(2);
    log.push(type + ' stomped: dying=' + !!en.dying);
  }
  const sc2 = S.area.ents.find(e => e.type === 'scorpion' && !e.dead && !e.dying);
  P.size = 2; P.h = 29; P.dir = 1; sc2.active = true; tp(Math.floor(sc2.x / 16) - 4, 12); sc2.y = 13 * 16 - sc2.h; sc2.vx = 0; sc2.hopT = 999; P.inv = 200;
  run(2); for (let i = 0; i < 60; i++) { I.keys = { right: 1, b: (i >> 3) % 2 }; S.tick(); } I.keys = {}; run(20);
  log.push('fireball vs scorpion: dying=' + !!sc2.dying);
  const sp = S.area.ents.find(e => e.type === 'sinkplat');
  P.size = 0; P.h = 15; G.cam.x = sp.x - 100; P.x = sp.x + 8; P.y = sp.y - P.h - 2; P.vy = 1; run(40);
  const sunk = sp.y - sp.by;
  P.x = sp.x - 40; P.y = 12 * 16 + 1 - P.h; P.vy = 0; run(120);
  log.push('sinkplat sank ' + sunk.toFixed(1) + 'px while ridden, back to rest=' + (sp.y === sp.by));
  tp(Math.floor(sp.x / 16) + 1, 13); P.y = 13 * 16; run(10);
  log.push('quicksand: G.state=' + G.state);
  run(200);
  S.newGame(4); run(160); for (const e of S.area.ents) if (e.enemy) e.dead = true;
  P.size = 1; P.h = 29; tp(67, 10); I.keys = { right: 1 }; for (let i = 0; i < 400 && P.x < 94 * 16; i++) S.tick(); I.keys = {};
  log.push('pyramid tunnel (big): x=' + Math.round(P.x / 16) + ' state=' + G.state + ' coins=' + G.coins);

  // 1-6 boss (castle is the last level)
  const castleIdx = S.LEVELS.findIndex(L => L.id === '1-6');
  S.newGame(castleIdx); run(160);
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
