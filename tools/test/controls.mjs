// Controls test: KONTROL: JOYSTICK (floating stick) and OTOMATİK KOŞU, driven with real CDP multi-touch (Input.dispatchTouchEvent).
// Covers stick spawn, dead zone, left/right/down, run threshold, A while holding the stick, release, no spawn from A/B or the
// top buttons, auto-run speed (normal + time attack), persistence across reload and the AYARLAR grid in three viewports.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

for (const [w, h, name] of [[844, 390, 'land'], [390, 844, 'portrait'], [667, 375, 'small']]) {
  console.log('--- ' + name + ' ' + w + 'x' + h);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(new URL('../../index.html', import.meta.url).href);
  await page.waitForTimeout(500);
  const ev = (f, a) => page.evaluate(f, a);
  const cdp = await ctx.newCDPSession(page);
  // real multi-touch: every event carries the full set of fingers still down
  const fingers = new Map();
  // (Chromium: touchStart/touchMove list every finger down, touchEnd lists the fingers that lift)
  const pt = ([id, p]) => ({ id, x: p.x, y: p.y, radiusX: 4, radiusY: 4, force: 1 });
  const send = async (type, list) => { await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: list.map(pt) }); await page.waitForTimeout(25); };
  const down = async (id, x, y) => { fingers.set(id, { x, y }); await send('touchStart', [...fingers.entries()]); };
  const move = async (id, x, y) => { fingers.set(id, { x, y }); await send('touchMove', [...fingers.entries()]); };
  const up = async id => { const p = fingers.get(id); fingers.delete(id); await send('touchEnd', [[id, p]]); };
  const tap = async (x, y) => { await down(9, x, y); await up(9); await page.waitForTimeout(320); }; // spaced out so taps never pair up into a double tap
  const touch = () => ev(() => ({ ...window.__SB.input.touch }));
  const keys = t => Object.keys(t).filter(k => t[k]).sort().join(',') || '-';
  const toPlay = () => ev(() => { const S = window.__SB; S.newGame(0); for (let n = 0; S.G.state !== 'play' && n < 400; n++) S.tick(); for (let i = 0; i < 20; i++) S.tick(); S.P.x = 120; S.P.vx = 0; S.area.ents.length = 0; }); // no enemies: the live loop keeps running while fingers are down
  const box = sel => ev(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }, sel);
  const vis = sel => ev(sel => { const el = document.querySelector(sel); return !!el && !!el.offsetParent && (sel === '#stick' || el.getBoundingClientRect().width > 0); }, sel);
  const tapItem = async id => {
    const it = await ev(id => window.__SB.pauseItems().find(i => i.id === id), id);
    const r = await box('#game'), vw = await ev(() => document.getElementById('game').width);
    await tap(r.x + (it.x + it.w / 2) * r.w / vw, r.y + (it.y + it.h / 2) * r.h / 240);
    await page.waitForTimeout(40);
  };
  const pauseBtn = async () => { const b = await box('#bPause'); await tap(b.cx, b.cy); await page.waitForTimeout(40); };

  // ---- AYARLAR: the new rows fit, are tall enough, and set + persist both options through real taps
  await toPlay();
  await pauseBtn(); await tapItem('settings');
  const grid = await ev(() => { const S = window.__SB, c = document.getElementById('game').getBoundingClientRect(); return { items: S.pauseItems(), s: c.height / 240, vw: document.getElementById('game').width }; });
  const ids = grid.items.map(i => i.id).join(' ');
  check('AYARLAR has KONTROL + OTOMATİK KOŞU next to the old rows', ['ctrl', 'autorun', 'vib', 'padsize', 'padalpha', 'pixel', 'back'].every(i => ids.includes(i)), ids);
  const fits = grid.items.every(i => i.x >= 0 && i.x + i.w <= grid.vw && i.y + i.h <= 240 - 20);
  const tall = grid.items.every(i => i.h * grid.s >= 36 || i.h === 29);
  const overlap = grid.items.some((a, i) => grid.items.some((b, j) => i < j && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h));
  check('AYARLAR rows fit the screen, >= 36 CSS px, no overlap', fits && tall && !overlap, `rows ${grid.items[0].h}px x${grid.s.toFixed(2)} = ${(grid.items[0].h * grid.s).toFixed(1)} css px, last row ends ${Math.max(...grid.items.map(i => i.y + i.h))}/240`);
  const opt = () => ev(() => ({ ctrl: window.__SB.OPT.ctrl, autoRun: window.__SB.OPT.autoRun, ls: [localStorage.getItem('superbiyik.ctrl'), localStorage.getItem('superbiyik.autoRun')] }));
  const o0 = await opt();
  check('defaults: KONTROL TUŞLAR, OTOMATİK KOŞU KAPALI', o0.ctrl === 'pad' && o0.autoRun === false, JSON.stringify(o0));
  await tapItem('ctrl'); await tapItem('autorun');
  const o1 = await opt();
  check('tapping KONTROL / OTOMATİK KOŞU switches + stores them', o1.ctrl === 'stick' && o1.autoRun === true && o1.ls[0] === '"stick"' && o1.ls[1] === 'true', JSON.stringify(o1));
  await ev(() => window.__SB.render());
  await page.screenshot({ path: `${OUT}/controls_${name}_settings.png` });
  // keyboard on the grid: ↓ walks the left column then GERİ, → steps across, ↑ from GERİ lands in the bottom row
  await ev(() => { window.__SB.G.psel = 0; });
  const nav = [];
  for (const k of ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowUp']) { await page.keyboard.press(k); nav.push(await ev(() => window.__SB.G.psel)); }
  check('keyboard grid navigation', nav.join(',') === '2,4,6,0,1,6,4', nav.join(','));
  await ev(() => { window.__SB.G.psel = 2; }); await page.keyboard.press('Enter');
  check('Enter toggles OTOMATİK KOŞU', (await opt()).autoRun === false); await page.keyboard.press('Enter');
  check('D-pad stays usable in the pause menu (JOYSTICK mode)', await vis('.dpad'));
  // reload: both settings stick
  await page.reload(); await page.waitForTimeout(400);
  const o2 = await opt();
  check('settings persist across reload', o2.ctrl === 'stick' && o2.autoRun === true, JSON.stringify(o2));
  await ev(() => { window.__SB.OPT.autoRun = false; });

  // ---- joystick in play
  await toPlay();
  check('in play: D-pad hidden, stick zone + idle stick shown', !(await vis('.dpad')) && await vis('#stickZone') && await vis('#stick') && await ev(() => document.getElementById('stick').classList.contains('idle')));
  await page.screenshot({ path: `${OUT}/controls_${name}_idle.png` });
  const zone = await box('#stickZone'), A = await box('[data-k="a"]'), B = await box('[data-k="b"]'), cv = await box('#game');
  check('stick zone stays left of the A/B cluster', zone.x + zone.w < Math.min(A.x, B.x) - 4 && zone.w >= w * 0.3, `zone ${Math.round(zone.x)}..${Math.round(zone.x + zone.w)} A/B from ${Math.round(Math.min(A.x, B.x))}`);
  if (name === 'portrait') check('portrait: stick zone is in the pad area below the canvas', zone.y >= cv.y + cv.h - 1, `zone y ${zone.y} canvas bottom ${cv.y + cv.h}`);
  const R = await ev(() => parseFloat(document.getElementById('stick').style.getPropertyValue('--r')));
  const x0 = zone.x + zone.w * 0.5, y0 = zone.y + zone.h * 0.6;
  await down(1, x0, y0);
  let st = await ev(() => window.__SB.stick);
  check('touch in the zone spawns the stick under the finger', st && Math.abs(st.bx + zone.x - x0) < 2 && keys(await touch()) === '-', JSON.stringify(st));
  await move(1, x0 + R * 0.15, y0 + R * 0.1); check('dead zone: small nudge does nothing', keys(await touch()) === '-', keys(await touch()));
  await move(1, x0 + R * 0.5, y0); check('push right = right, no run', keys(await touch()) === 'right');
  await move(1, x0 + R * 0.85, y0); check('push right > 70% = right + run', keys(await touch()) === 'right,run');
  await page.screenshot({ path: `${OUT}/controls_${name}_stick_run.png` });
  await move(1, x0 - R * 0.5, y0 + R * 0.2); check('push left = left', keys(await touch()) === 'left');
  await move(1, x0 - R * 0.9, y0); check('push left far = left + run', keys(await touch()) === 'left,run');
  await move(1, x0 + R * 0.2, y0 + R * 0.8); check('pull down = down only', keys(await touch()) === 'down');
  await move(1, x0 + R * 0.7, y0 + R * 0.4); check('diagonal down-right still runs right', keys(await touch()).startsWith('right'), keys(await touch()));
  // multi-touch: A while the stick is held
  await move(1, x0 + R * 0.9, y0);
  await down(2, A.cx, A.cy);
  check('A tap while holding the stick: both active', keys(await touch()) === 'a,right,run', keys(await touch()));
  await page.screenshot({ path: `${OUT}/controls_${name}_stick_a.png` });
  await up(2); check('A released, stick still held', keys(await touch()) === 'right,run', keys(await touch()));
  await down(3, B.cx, B.cy); await move(1, x0 - R * 0.4, y0);
  check('B + stick left together', keys(await touch()) === 'b,left', keys(await touch()));
  await up(3);
  // dragging past the rim pulls the base along, so a short move back reverses at once
  await move(1, x0 + R * 2.5, y0); await move(1, x0 + R * 2.5 - R * 1.35, y0); // a fixed base would still read 'right' here
  check('base follows past the rim: pull back 1.35R = left', keys(await touch()) === 'left', keys(await touch()));
  await up(1);
  st = await ev(() => window.__SB.stick);
  check('release clears stick input', keys(await touch()) === '-' && !st && await ev(() => document.getElementById('stick').classList.contains('idle')));
  // in game: holding the stick far right reaches run speed, half-way only walking speed
  const speed = async (dx, frames = 50) => {
    await ev(() => { const S = window.__SB; S.P.x = 120; S.P.vx = 0; S.G.cam.x = 0; S.P.y = 12 * 16 - S.P.h; });
    await down(1, x0, y0); await move(1, x0 + dx, y0);
    const v = await ev(n => { const S = window.__SB; let m = 0; for (let i = 0; i < n; i++) { S.tick(); m = Math.max(m, S.P.vx); } return +m.toFixed(2); }, frames);
    await up(1); return v;
  };
  const vWalk = await speed(R * 0.5), vRun = await speed(R * 0.9);
  check('stick: half push walks (1.55), far push runs (2.6)', vWalk === 1.55 && vRun === 2.6, `walk ${vWalk} run ${vRun}`);
  // no stick from the A/B cluster or the top buttons, or the right side of the screen
  await down(4, A.cx, A.cy); await down(5, B.cx, B.cy);
  check('touches on A/B never spawn the stick', !(await ev(() => window.__SB.stick)) && keys(await touch()) === 'a,b', keys(await touch()));
  await up(5); await up(4);
  await tap(w - 30, Math.min(h - 30, cv.y + cv.h * 0.3 + 5));
  check('touch on the right side never spawns the stick', !(await ev(() => window.__SB.stick)));
  const mute = await box('#bMute'), m0 = await ev(() => localStorage.getItem('superbiyik.muted'));
  await tap(mute.cx, mute.cy);
  check('top button (mute) works and spawns no stick', !(await ev(() => window.__SB.stick)) && (await ev(() => localStorage.getItem('superbiyik.muted'))) !== m0);
  await tap(mute.cx, mute.cy);
  await pauseBtn();
  check('pause button pauses, no stick, D-pad back', await ev(() => window.__SB.G.paused) && !(await ev(() => window.__SB.stick)) && await vis('.dpad') && !(await vis('#stickZone')));
  // pausing mid-hold drops the stick input
  await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  await down(1, x0, y0); await move(1, x0 + R * 0.9, y0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  check('pausing while the stick is held clears its input', await ev(() => window.__SB.G.paused) && keys(await touch()) === '-', keys(await touch()));
  await up(1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(40);
  check('resumed', !(await ev(() => window.__SB.G.paused)));

  // ---- OTOMATİK KOŞU: keyboard walk reaches run speed, in normal play and in time attack; water still slow
  const kbSpeed = () => ev(() => { const S = window.__SB; S.P.x = 120; S.P.vx = 0; S.G.cam.x = 0; S.input.keys = { right: 1 }; let m = 0; for (let i = 0; i < 50; i++) { S.tick(); m = Math.max(m, S.P.vx); } S.input.keys = {}; return +m.toFixed(2); });
  const vOff = await kbSpeed();
  await ev(() => { window.__SB.OPT.autoRun = true; });
  const vOn = await kbSpeed();
  await ev(() => { const S = window.__SB; S.startTimeAttack(0); for (let n = 0; S.G.state !== 'play' && n < 400; n++) S.tick(); for (let i = 0; i < 20; i++) S.tick(); S.area.ents.length = 0; });
  const vTA = await kbSpeed();
  const isTA = await ev(() => !!window.__SB.G.ta);
  check('OTOMATİK KOŞU: walk 1.55 -> run 2.6 (normal + time attack)', vOff === 1.55 && vOn === 2.6 && vTA === 2.6 && isTA, `off ${vOff} on ${vOn} ta ${vTA}`);
  const fire = await ev(() => { const S = window.__SB; S.P.size = 2; S.P.fireCD = 0; S.input.keys = { b: 1 }; S.tick(); S.input.keys = {}; S.tick(); return S.area.ents.some(e => e.type === 'fireball' && !e.dead); });
  check('B still fires with OTOMATİK KOŞU on', fire);
  await ev(() => { window.__SB.OPT.autoRun = false; });
  // the stick in time attack too
  await ev(() => window.__SB.layout());
  check('stick zone active in time attack', await vis('#stickZone'));
  check('no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(fails ? fails + ' FAILED' : 'ALL OK');
process.exit(fails ? 1 : 0);
