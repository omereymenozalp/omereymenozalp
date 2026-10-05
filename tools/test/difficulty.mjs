// Difficulty KOLAY / NORMAL: title switch (real taps, both orientations) + persistence, NORMAL unchanged,
// KOLAY lives / time / grace / big respawn, pit rescue once per life, extra checkpoints on standable floor in every level.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const url = new URL('../../index.html', import.meta.url).href;
const allErrs = [];
const watch = page => {
  page.on('pageerror', e => allErrs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') allErrs.push('CONSOLE ' + m.text()); });
};

// ---------- title switch: real taps in both orientations, pad B, persistence across reloads ----------
for (const [w, h, name] of [[844, 390, 'land'], [390, 844, 'portrait']]) {
  console.log('--- ' + name);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); watch(page);
  await page.goto(url); await page.waitForTimeout(400);
  const ev = (f, a) => page.evaluate(f, a);
  const tapGame = async (x, y) => {
    const r = await page.locator('#game').boundingBox(), vw = await ev(() => document.getElementById('game').width);
    await page.touchscreen.tap(r.x + x * r.width / vw, r.y + y * r.height / 240); await page.waitForTimeout(60);
  };
  check('defaults to NORMAL', await ev(() => window.__SB.G.diff === 'normal'));
  const [dt, mt, cards] = await ev(() => [window.__SB.diffToggle(), window.__SB.modeToggle(), window.__SB.titleCards()]);
  const vw = await ev(() => document.getElementById('game').width);
  const sep = (a, b) => a.x + a.w + 2 <= b.x - 2 || b.x + b.w + 2 <= a.x - 2 || a.y + a.h + 2 <= b.y - 2 || b.y + b.h + 2 <= a.y - 2; // borders may touch, never overlap
  check('switches inside the screen, not overlapping each other or the cards', dt.x - 2 >= 0 && mt.x + mt.w + 2 <= vw && sep(dt, mt) && cards.every(c => sep(dt, c) && sep(mt, c)), JSON.stringify({ dt, mt }));
  await tapGame(dt.x + 10, dt.y + dt.h / 2);
  check('tap KOLAY selects easy (saved, still on title, mode untouched)', await ev(() => window.__SB.G.diff === 'easy' && localStorage.getItem('superbiyik.diff') === '"easy"' && window.__SB.G.state === 'title' && !window.__SB.G.taMode));
  await tapGame(dt.x + dt.w - 10, dt.y + dt.h / 2);
  check('tap NORMAL selects normal', await ev(() => window.__SB.G.diff === 'normal' && localStorage.getItem('superbiyik.diff') === '"normal"'));
  await tapGame(mt.x + 10, mt.y + mt.h / 2);
  check('tapping the mode switch leaves the difficulty alone', await ev(() => window.__SB.G.diff === 'normal' && !window.__SB.G.taMode && window.__SB.G.state === 'title'));
  const pb = await page.locator('[data-k="b"]').boundingBox();
  await page.touchscreen.tap(pb.x + pb.width / 2, pb.y + pb.height / 2); await page.waitForTimeout(80);
  check('pad B toggles the difficulty', await ev(() => window.__SB.G.diff === 'easy' && !window.__SB.G.taMode && window.__SB.G.state === 'title'));
  const dn = await page.locator('[data-k="down"]').boundingBox();
  await page.touchscreen.tap(dn.x + dn.width / 2, dn.y + dn.height / 2); await page.waitForTimeout(80);
  check('pad ▼ still toggles the mode only', await ev(() => window.__SB.G.diff === 'easy' && window.__SB.G.taMode));
  await page.screenshot({ path: `${OUT}/diff_title_ta_${name}.png` });
  await page.touchscreen.tap(dn.x + dn.width / 2, dn.y + dn.height / 2); await page.waitForTimeout(80);
  const pressX = async () => { await page.keyboard.down('KeyX'); await page.waitForTimeout(80); await page.keyboard.up('KeyX'); await page.waitForTimeout(40); };
  await pressX();
  check('keyboard X toggles the difficulty', await ev(() => window.__SB.G.diff === 'normal'));
  await pressX();
  await page.reload(); await page.waitForTimeout(700);
  check('KOLAY persists across a reload', await ev(() => window.__SB.G.diff === 'easy'));
  await page.screenshot({ path: `${OUT}/diff_title_${name}.png` });
  // tap the 1-1 card: an easy run starts with 5 lives
  const c0 = cards[0];
  await tapGame(c0.x + c0.w / 2, c0.y + c0.h / 2); await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/diff_intro_${name}.png` });
  check('card tap starts a KOLAY run with 5 lives', await ev(() => window.__SB.G.state === 'intro' && window.__SB.G.lives === 5 && window.__SB.isEasy()));
  await ctx.close();
}

// ---------- rules ----------
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage(); watch(page);
await page.goto(url); await page.waitForTimeout(300);
const r = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input, out = {};
  const toPlay = () => { for (let k = 0; k < 600 && G.state !== 'play'; k++) S.tick(); };
  const run = n => { for (let i = 0; i < n; i++) S.tick(); };
  const clearEnemies = () => { for (const e of S.area.ents) if (e.enemy) e.dead = true; };
  // a pit column in area 0: no floor at all, with standable ground a few tiles to its left
  const findPit = () => {
    const A = S.area;
    for (let x = 12; x < A.w - 20; x++) {
      let empty = true; for (let y = 0; y < 15; y++) { const t = A.t[y * A.w + x]; if (t === S.T.LAVA || t === S.T.QSAND || (t && t !== S.T.COIN)) empty = false; }
      if (empty) return x;
    }
    return -1;
  };
  const stand = () => { I.keys = {}; run(10); }; // let the hero register safe ground
  const nearPit = x => { P.x = (x - 3) * 16 + 2; P.y = (S.groundRowAt(x - 3) + 1) * 16 - P.h; P.vy = 0; G.cam.x = Math.max(0, P.x - 120); };
  const dropInto = x => { P.x = x * 16 + 2; P.y = 120; P.vx = 0; P.vy = 0; G.cam.x = Math.max(0, P.x - 120); P.inv = 0; P.grace = 0; };
  const fallUntil = () => { for (let k = 0; k < 200 && G.state === 'play' && P.state === 'play'; k++) S.tick(); return G.state === 'dying' ? 'death' : P.state; };
  // NORMAL
  G.diff = 'normal'; S.newGame(0); toPlay(); clearEnemies();
  out.nLives = G.lives; out.nTime = G.time; out.nCps = G.level.cps; out.nInv = P.inv;
  stand(); const pit = findPit(); out.pit = pit;
  dropInto(pit); out.nPit = fallUntil();
  // KOLAY
  G.diff = 'easy'; S.newGame(0); toPlay(); clearEnemies();
  out.eLives = G.lives; out.eTime = G.time; out.eInv = P.inv; out.eCps = G.level.cps.map(c => c.x);
  // grace: a chestnut right on the small hero does no harm during the first second
  const k = S.spawnEntity({ type: 'kestane', x: Math.floor((P.x + 2) / 16), y: Math.floor((P.y + P.h - 1) / 16) }); k.active = true; k.vx = 0; S.area.ents.push(k);
  run(10); out.graceAlive = G.state === 'play' && P.size === 0; k.dead = true;
  run(60); stand(); nearPit(pit); stand();
  const safe = P.safe && { x: P.safe.x, y: P.safe.y };
  out.safe = safe;
  dropInto(pit); out.r1 = fallUntil();
  if (out.r1 === 'rescue') {
    const states = new Set(); let minY = 999;
    for (let k = 0; k < 200 && P.state === 'rescue'; k++) { S.tick(); states.add(G.state); minY = Math.min(minY, P.y); if (k === 40) S.render(); }
    run(4);
    out.afterRescue = { state: G.state + '/' + P.state, x: P.x, bottom: P.y + P.h, ground: P.onGround, inv: P.inv, states: [...states].join(','), lives: G.lives };
  }
  // second pit of the same life: death
  nearPit(pit); stand(); dropInto(pit); out.r2 = fallUntil();
  // die -> the next life gets a fresh rescue
  for (let k = 0; k < 700 && G.state !== 'play'; k++) S.tick();
  out.livesAfter = G.lives; out.rescuedReset = G.rescued === false;
  clearEnemies(); nearPit(pit); stand(); dropInto(pit); out.r3 = fallUntil();
  for (let k = 0; k < 200 && P.state === 'rescue'; k++) S.tick();
  // lava is never rescued (1-6)
  S.newGame(5); toPlay(); clearEnemies(); stand();
  const A = S.area; let lx = -1;
  for (let x = 0; x < A.w && lx < 0; x++) for (let y = 0; y < 15; y++) if (A.t[y * A.w + x] === S.T.LAVA) { lx = x; break; }
  P.x = lx * 16 + 2; P.y = 150; P.vy = 0; G.cam.x = Math.max(0, P.x - 120); P.inv = 0;
  out.lava = fallUntil();
  // quicksand is never rescued (1-5)
  S.newGame(4); toPlay(); clearEnemies(); stand();
  const B = S.area; let qx = -1, qy = -1;
  for (let x = 0; x < B.w && qx < 0; x++) for (let y = 0; y < 15; y++) if (B.t[y * B.w + x] === S.T.QSAND) { qx = x; qy = y; break; }
  P.x = qx * 16 + 2; P.y = qy * 16 - P.h - 2; P.vy = 0; G.cam.x = Math.max(0, P.x - 120); P.inv = 0;
  out.qsand = fallUntil();
  // a big hero who dies comes back big in KOLAY, small in NORMAL
  for (const d of ['easy', 'normal']) {
    G.diff = d; S.newGame(0); toPlay(); clearEnemies(); P.size = 1; P.h = 29; P.y -= 14; run(5);
    G.rescued = true; dropInto(pit); fallUntil();
    for (let k = 0; k < 700 && G.state !== 'play'; k++) S.tick();
    out['big_' + d] = P.size;
  }
  // time attack always plays by NORMAL rules
  G.diff = 'easy'; S.startTimeAttack(0); toPlay();
  out.ta = { easy: S.isEasy(), lives: G.lives, time: G.time, cps: G.level.cps, inv: P.inv };
  G.ta = null;
  return out;
});
console.log(JSON.stringify(r));
check('NORMAL: 3 lives, 300 time, single checkpoint, no grace', r.nLives === 3 && r.nTime === 300 && r.nCps === null && r.nInv === 0, `lives=${r.nLives} time=${r.nTime} cps=${JSON.stringify(r.nCps)} inv=${r.nInv}`);
check('NORMAL: falling into a pit is death', r.pit > 0 && r.nPit === 'death', `pit=${r.pit} ${r.nPit}`);
check('KOLAY: 5 lives, +100 time, 1 s grace', r.eLives === 5 && r.eTime === 400 && r.eInv === 60, `lives=${r.eLives} time=${r.eTime} inv=${r.eInv}`);
check('KOLAY: three checkpoints', r.eCps.length === 3, JSON.stringify(r.eCps));
check('KOLAY: enemy contact during the respawn grace does not kill', r.graceAlive);
check('KOLAY: first pit of a life -> bubble rescue', r.r1 === 'rescue', r.r1);
const a = r.afterRescue || {};
check('rescue lands on the last safe ground with invulnerability', a.state === 'play/play' && r.safe && Math.abs(a.x - r.safe.x) < 1 && Math.abs(a.bottom - r.safe.y) < 1 && a.ground && a.inv > 60 && a.lives === 5, JSON.stringify(a) + ' safe=' + JSON.stringify(r.safe));
check('second pit in the same life is death', r.r2 === 'death', r.r2);
check('next life: lives 4 and the rescue is back', r.livesAfter === 4 && r.rescuedReset && r.r3 === 'rescue', `lives=${r.livesAfter} ${r.r3}`);
check('lava is not rescued', r.lava === 'death', r.lava);
check('quicksand is not rescued', r.qsand === 'death', r.qsand);
check('KOLAY: big hero respawns big; NORMAL: small', r.big_easy === 1 && r.big_normal === 0, `easy=${r.big_easy} normal=${r.big_normal}`);
check('time attack ignores KOLAY', !r.ta.easy && r.ta.lives === 1 && r.ta.time === 300 && r.ta.cps === null && r.ta.inv === 0, JSON.stringify(r.ta));

// ---------- extra checkpoints in every level: reached by walking past, respawn on standable floor, walk on ----------
const cp = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input, out = [];
  const toPlay = () => { for (let k = 0; k < 600 && G.state !== 'play'; k++) S.tick(); };
  G.diff = 'easy';
  for (let lv = 0; lv < S.LEVELS.length; lv++) {
    S.newGame(lv); toPlay();
    const cps = G.level.cps.map(c => ({ ...c })), mid = G.level.checkpoint;
    const res = [];
    for (const c of cps) {
      // walk over the flag: it is reached
      S.newGame(lv); toPlay(); G.cpx = 0; G.cp = false;
      for (const e of S.area.ents) if (e.enemy) e.dead = true;
      P.x = c.x * 16 - 4; P.y = c.y - P.h; P.vy = 0; G.cam.x = Math.max(0, P.x - 120);
      I.keys = { right: 1 }; for (let k = 0; k < 12; k++) { P.inv = 5; S.tick(); } I.keys = {};
      const reached = G.cpx === c.x && G.cp === (c.x >= mid);
      // die and respawn there
      G.lives = 5; G.state = 'dying'; G.stateT = 189; S.tick();
      toPlay();
      const x0 = P.x, y0 = P.y + P.h;
      const atFlag = Math.abs(x0 - (c.x * 16 + 2)) < 1 && Math.abs(y0 - c.y) < 1;
      for (let k = 0; k < 20; k++) S.tick();
      const standing = P.onGround && !P.onPlat && Math.abs(P.y + P.h - y0) < 1 && G.state === 'play';
      I.keys = { right: 1 }; for (let k = 0; k < 40; k++) { P.inv = 5; S.tick(); } I.keys = {};
      const walked = P.x - x0;
      res.push({ x: c.x, row: c.y / 16, mid: c.x === mid, reached, atFlag, standing, walked: Math.round(walked), ok: reached && atFlag && standing && walked > 30 });
    }
    out.push({ id: S.LEVELS[lv].id, n: cps.length, res });
  }
  return out;
});
for (const L of cp) {
  check(`${L.id}: ${L.n} checkpoints, each reached, respawn on floor and walkable`, L.n === 3 && L.res.every(c => c.ok),
    L.res.map(c => `${c.mid ? '[' : ''}${c.x}@${c.row}${c.mid ? ']' : ''} reach=${c.reached} flag=${c.atFlag} stand=${c.standing} walk=${c.walked}`).join('  '));
}

// ---------- screenshots: rescue bubble and KOLAY HUD ----------
for (const [w, h, name] of [[844, 390, 'land'], [390, 844, 'portrait']]) {
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(200);
  await page.evaluate(() => {
    const S = window.__SB, G = S.G, P = S.P;
    G.diff = 'easy'; S.newGame(0); for (let k = 0; k < 600 && G.state !== 'play'; k++) S.tick();
    for (const e of S.area.ents) if (e.enemy) e.dead = true;
    for (let k = 0; k < 70; k++) S.tick();
    const A = S.area; let pit = -1;
    for (let x = 12; x < A.w && pit < 0; x++) { let e = true; for (let y = 0; y < 15; y++) if (A.t[y * A.w + x] && A.t[y * A.w + x] !== S.T.COIN) e = false; if (e) pit = x; }
    P.safe = { x: (pit - 3) * 16, y: (S.groundRowAt(pit - 3) + 1) * 16, area: 0 };
    P.x = pit * 16 + 2; P.y = 200; G.cam.x = Math.max(0, P.x - 160);
    for (let k = 0; k < 200 && P.state === 'play' && G.state === 'play'; k++) S.tick();
    for (let k = 0; k < 50; k++) S.tick();
  });
  await page.waitForTimeout(50);
  await page.evaluate(() => window.__SB.render());
  await page.locator('#game').screenshot({ path: `${OUT}/diff_rescue_${name}.png` });
}
await ctx.close();
check('no console errors', allErrs.length === 0, allErrs.join(' | '));
console.log(fails ? `${fails} FAILED` : 'ALL OK');
await browser.close();
process.exit(fails ? 1 : 0);
