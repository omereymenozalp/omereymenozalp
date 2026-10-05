// Time attack ("ZAMANA KARŞI"): title toggle (real taps), stopwatch HUD, instant restart on death (no lives lost),
// result screen + best time saved per level in localStorage, "YENİ REKOR" only when beaten, normal mode untouched.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
for (const [w, h, name] of [[844, 390, 'land'], [390, 844, 'portrait']]) {
  console.log('--- ' + name);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(new URL('../../index.html', import.meta.url).href);
  await page.waitForTimeout(500);
  const ev = (f, a) => page.evaluate(f, a);
  const tapGame = async (x, y) => { // x, y in game pixels
    const r = await page.locator('#game').boundingBox(), vw = await ev(() => document.getElementById('game').width);
    await page.touchscreen.tap(r.x + x * r.width / vw, r.y + y * r.height / 240);
    await page.waitForTimeout(60);
  };
  check('fmtTime', await ev(() => [window.__SB.fmtTime(2875), window.__SB.fmtTime(6000), window.__SB.fmtTime(0)].join(' ')) === '00:47.91 01:40.00 00:00.00');
  // toggle via a real tap on the right half of the switch, and back/forth with the pad's ▼
  const mt = await ev(() => window.__SB.modeToggle());
  await tapGame(mt.x + mt.w - 20, mt.y + mt.h / 2);
  check('tap ZAMANA KARŞI turns the mode on', await ev(() => window.__SB.G.taMode && localStorage.getItem('superbiyik.tamode') === 'true' && window.__SB.G.state === 'title'));
  await tapGame(mt.x + 10, mt.y + mt.h / 2);
  check('tap NORMAL turns it off', await ev(() => !window.__SB.G.taMode));
  const dn = await page.locator('[data-k="down"]').boundingBox();
  await page.touchscreen.tap(dn.x + dn.width / 2, dn.y + dn.height / 2); await page.waitForTimeout(80);
  check('pad ▼ toggles the mode', await ev(() => window.__SB.G.taMode && window.__SB.G.state === 'title'));
  // tap the 1-1 card -> time attack run
  const c0 = await ev(() => window.__SB.titleCards()[0]);
  await tapGame(c0.x + c0.w / 2, c0.y + c0.h / 2);
  await page.waitForTimeout(500);
  const r = await ev(() => {
    const S = window.__SB, G = S.G, P = S.P, I = S.input, out = {};
    const run = (n, keys = {}) => { I.keys = { ...keys }; for (let i = 0; i < n; i++) S.tick(); I.keys = {}; };
    const toPlay = () => { for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick(); };
    toPlay();
    out.started = G.state + ' ta=' + !!G.ta + ' lv=' + (G.ta && G.ta.lv);
    for (const e of S.area.ents) if (e.enemy) e.dead = true;
    const t0 = G.ta.t; run(120); out.dt = G.ta.t - t0; out.countdown = G.time;
    // death -> instant restart, no life lost, no game over
    const lives = G.lives; P.y = 260; const states = new Set();
    for (let k = 0; k < 120; k++) { S.tick(); states.add(G.state); }
    out.restart = G.state + ' tries=' + G.ta.tries + ' t=' + G.ta.t + ' livesSame=' + (G.lives === lives) + ' states=' + [...states].join('/');
    // reach the flag -> result screen, best saved
    const finish = (extra) => {
      for (const e of S.area.ents) if (e.enemy) e.dead = true;
      run(extra);
      P.x = 194 * 16; P.y = 12 * 16 - P.h; G.cam.x = P.x - 150;
      for (let k = 0; k < 400 && G.state === 'play'; k++) { I.keys = { right: 1 }; S.tick(); } I.keys = {};
      for (let k = 0; k < 60 && G.state !== 'taresult'; k++) S.tick();
      return { state: G.state, t: G.ta.t, rec: G.ta.rec, stored: JSON.parse(localStorage.getItem('superbiyik.ta') || '{}')['1-1'] };
    };
    out.first = finish(30);
    out.unlockedSame = G.unlocked;
    // retry (A on the result screen) and be slower: no record
    for (let k = 0; k < 40; k++) S.tick();
    I.keys = { a: 1 }; S.tick(); I.keys = {}; for (let k = 0; k < 120 && G.state !== 'play'; k++) S.tick();
    out.retry = G.state + ' tries=' + G.ta.tries;
    out.slow = finish(300);
    for (let k = 0; k < 40; k++) S.tick();
    I.keys = { a: 1 }; S.tick(); I.keys = {}; for (let k = 0; k < 120 && G.state !== 'play'; k++) S.tick();
    out.fast = finish(5);
    out.best = S.G.taBest['1-1'];
    for (let k = 0; k < 40; k++) S.tick();
    return out;
  });
  console.log(JSON.stringify(r));
  check('card tap starts a time-attack run of 1-1', r.started === 'play ta=true lv=0', r.started);
  check('stopwatch runs (frames), countdown frozen', r.dt === 120 && r.countdown === 300, `dt=${r.dt} time=${r.countdown}`);
  // the clock restarted with the level: well under the 120 frames simulated since the fall
  check('death restarts the level instantly, no life lost', /^play tries=2 t=\d{1,2} /.test(r.restart) && r.restart.includes('livesSame=true') && !r.restart.includes('gameover') && !r.restart.includes('intro'), r.restart);
  check('flag -> result screen, first time is a record and is saved', r.first.state === 'taresult' && r.first.rec && r.first.stored === r.first.t, JSON.stringify(r.first));
  check('A on result = retry', r.retry === 'play tries=3' || r.retry === 'play tries=2', r.retry);
  check('slower run: no record, best unchanged', r.slow.state === 'taresult' && !r.slow.rec && r.slow.stored === r.first.t, JSON.stringify(r.slow));
  check('faster run: new record saved', r.fast.rec && r.fast.t < r.first.t && r.fast.stored === r.fast.t && r.best === r.fast.t, JSON.stringify(r.fast));
  await page.screenshot({ path: `${process.env.OUT || '/tmp'}/ta_result_${name}.png` });
  // menu button on the result screen (real tap) -> title, run cleared, high score untouched
  const btn = await ev(() => window.__SB.taButtons()[1]);
  await tapGame(btn.x + btn.w / 2, btn.y + btn.h / 2);
  await page.waitForTimeout(700);
  const back = await ev(() => { const G = window.__SB.G; return { state: G.state, ta: G.ta, score: G.score, best: localStorage.getItem('superbiyik.best') }; });
  check('ANA MENÜ -> title, time attack cleared, no high score from TA', back.state === 'title' && back.ta === null && back.score === 0 && back.best === null, JSON.stringify(back));
  // normal mode still behaves as before
  const n = await ev(() => {
    const S = window.__SB, G = S.G; G.taMode = false; S.newGame(0); for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
    for (let k = 0; k < 48; k++) S.tick();
    return { ta: G.ta, lives: G.lives, time: G.time };
  });
  check('normal mode: countdown + 3 lives, no stopwatch', n.ta === null && n.lives === 3 && n.time === 298, JSON.stringify(n));
  check('no page errors', errs.length === 0, errs.join('\n'));
  await ctx.close();
}
console.log(fails ? fails + ' FAILED' : 'ALL OK');
await browser.close();
process.exit(fails ? 1 : 0);
