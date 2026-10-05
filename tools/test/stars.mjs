// BÜYÜK YILDIZ: 3 hidden big stars per level.
//  - placements: every level has exactly 3 (idx 0..2) spread over its areas, none stuck inside a solid tile
//  - reachability: from a nearby safe standing spot, a fixed script of real inputs (input.keys + tick(), enemies removed)
//    collects each star ('|' marks the frame by which it must be collected) and then reaches safe footing
//  - rules: score/popup on pickup, saved only when the level is finished (flag / axe), lost on death unless picked up
//    before a reached checkpoint, saved stars come back as ghosts (still give score), persistence across reload
//   SHOTS=/some/dir node tools/test/stars.mjs   # also writes screenshots of every star spot + the title (844x390, 390x844)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { mkdirSync } from 'node:fs';
const SHOTS = process.env.SHOTS;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const URL_ = new URL('../../index.html', import.meta.url).href;
async function open(w = 844, h = 390, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...opts });
  // seeded Math.random so the scripts replay exactly
  await ctx.addInitScript(() => {
    let s = 0x2545f491;
    Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(URL_);
  await page.waitForTimeout(200);
  return { ctx, page, errs };
}

// start spot (tile x, feet row y, dx = px into the tile), optional 'pre' inputs (e.g. down a pipe), then the route.
// keys: R/L = right/left, a = jump/swim, b = run, D = down; '|' = the star must be collected by now
const ROUTES = [
  { name: '1-1 #0 bonus room (secret)', lv: 0, idx: 0, x: 50, dx: 10, y: 9, pre: [[3, 'D'], [90, '']], seg: [[10, 'Rb'], [30, 'Rab'], [9, 'Rb'], [4, ''], [34, 'Rb'], [22, 'Rab'], [6, 'Rb'], [1, '|'], [22, 'Rb']] },
  { name: '1-1 #1 high brick road (off path)', lv: 0, idx: 1, x: 75, y: 9, seg: [[6, 'Rb'], [30, 'Rab'], [4, ''], [38, 'Rb'], [1, '|']] },
  { name: '1-1 #2 over the staircase gap (skill)', lv: 0, idx: 2, x: 149, y: 8, seg: [[6, 'Rb'], [24, 'Rab'], [1, '|'], [28, 'Rb']] },
  { name: '1-2 #0 above the brick row (off path)', lv: 1, idx: 0, x: 66, y: 9, seg: [[6, 'Rab'], [3, 'Rb'], [1, '|'], [17, 'Rb']] },
  { name: '1-2 #1 off the lift (skill)', lv: 1, idx: 1, x: 79, y: 13, seg: [[16, 'R'], [24, 'Ra'], [6, 'a'], [15, ''], [24, 'L'], [30, 'a'], [12, ''], [3, 'Rb'], [15, 'Rab'], [7, 'Rb'], [1, '|'], [7, 'Rb']] },
  { name: '1-2 #2 crystal grotto pipe (secret)', lv: 1, idx: 2, x: 155, dx: 10, y: 11, pre: [[3, 'D'], [90, '']], seg: [[3, 'ab'], [27, 'Rab'], [4, 'Rb'], [4, ''], [12, 'ab'], [18, 'Rab'], [8, 'Rb'], [4, ''], [3, 'Rab'], [4, 'Rb'], [1, '|'], [35, 'Rb']] },
  { name: '1-3 #0 high cloud (off path)', lv: 2, idx: 0, x: 25, y: 7, seg: [[3, 'Rb'], [30, 'Rab'], [5, 'Rb'], [4, ''], [1, '|']] },
  { name: '1-3 #1 falling platforms (skill)', lv: 2, idx: 1, x: 88, y: 8, seg: [[24, 'Rb'], [24, 'Rab'], [6, 'ab'], [18, 'b'], [4, ''], [10, 'ab'], [4, 'b'], [1, '|'], [3, 'Rab'], [3, 'Rb'], [15, 'b']] },
  { name: '1-3 #2 above the screen from the M block (secret)', lv: 2, idx: 2, x: 119, y: 7, seg: [[10, 'Rb'], [3, 'ab'], [27, 'Rab'], [1, 'Rb'], [4, ''], [6, 'Rab'], [3, 'Rb'], [1, '|'], [3, 'Rab'], [38, 'Rb']] },
  { name: '1-4 #0 invisible block -> icicle hall roof (secret)', lv: 3, idx: 0, x: 35, y: 13, seg: [[34, 'Rb'], [30, 'Rab'], [19, 'Rb'], [4, ''], [34, 'Rb'], [14, 'Rab'], [8, 'ab'], [8, 'b'], [4, ''], [24, 'Lb'], [30, 'Lab'], [8, 'Lb'], [1, '|'], [22, 'Rb']] },
  { name: '1-4 #1 beside the ?M? blocks (off path)', lv: 3, idx: 1, x: 121, y: 9, seg: [[34, 'Rb'], [10, 'Rab'], [2, 'Rb'], [1, '|'], [32, 'Rb']] },
  { name: '1-4 #2 over the last pit (skill)', lv: 3, idx: 2, x: 139, y: 13, seg: [[10, 'Rb'], [30, 'Rab'], [1, '|'], [17, 'Rb']] },
  { name: '1-5 #0 pyramid treasure room (secret)', lv: 4, idx: 0, x: 70, y: 11, seg: [[34, 'R'], [6, 'Ra'], [2, 'R'], [1, '|'], [20, 'Rb']] },
  { name: '1-5 #1 off the sinking slab (skill)', lv: 4, idx: 1, x: 100, y: 13, seg: [[16, 'Rb'], [30, 'Rab'], [8, 'Rb'], [4, ''], [10, 'Rab'], [4, 'Rb'], [1, '|'], [27, 'Rb']] },
  { name: '1-5 #2 from the high ledge (off path)', lv: 4, idx: 2, x: 135, y: 5, seg: [[3, 'Rb'], [30, 'Rab'], [9, 'Rb'], [1, '|'], [30, 'Rb']] },
  { name: '1-6 #0 over the lava (skill)', lv: 5, idx: 0, x: 40, y: 13, seg: [[10, 'Rb'], [30, 'Rab'], [1, '|'], [17, 'Rb']] },
  { name: '1-6 #1 up from the 1UP block (off path)', lv: 5, idx: 1, x: 90, y: 13, seg: [[10, 'Rb'], [22, 'Rab'], [4, 'Rb'], [4, ''], [10, 'Lab'], [7, 'Lb'], [1, '|'], [25, 'Rb']] },
  { name: '1-6 #2 invisible block -> ceiling notch (secret)', lv: 5, idx: 2, x: 112, y: 13, seg: [[16, 'Rb'], [6, 'ab'], [6, 'b'], [7, 'Rb'], [4, ''], [3, 'Lb'], [28, 'Lab'], [4, ''], [6, 'Lb'], [25, 'ab'], [1, '|'], [31, 'Rb']] },
  { name: '★ #0 deep in the trench (off path)', lv: 6, idx: 0, x: 44, y: 13, seg: [[49, 'R'], [1, '|'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [3, 'R']] },
  { name: '★ #1 treasure grotto (secret)', lv: 6, idx: 1, x: 62, dx: 10, y: 11, pre: [[3, 'D'], [90, '']], seg: [[1, 'Ra'], [39, 'R'], [1, 'Ra'], [103, 'R'], [1, 'Ra'], [39, 'R'], [1, 'Ra'], [76, 'R'], [1, '|'], [48, 'R'], [48, 'L']] },
  { name: '★ #2 between the pufferfish (skill)', lv: 6, idx: 2, x: 133, y: 13, seg: [[1, 'Ra'], [5, 'R'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [5, 'R'], [1, 'Ra'], [1, '|']] },
];

// ---------- 1. placements ----------
{
  const { ctx, page, errs } = await open();
  const r = await page.evaluate(() => {
    const S = window.__SB, out = [];
    for (const L of S.LEVELS) {
      const lv = L.make(), list = [];
      lv.areas.forEach((A, ai) => {
        for (const s of A.spawns) if (s.type === 'bigstar') {
          let free = true;
          if (s.y >= 0) free = !(A.t[s.y * A.w + s.x] && [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 17, 18, 12, 19].includes(A.t[s.y * A.w + s.x]));
          list.push({ ai, x: s.x, y: s.y, idx: s.idx, free });
        }
      });
      out.push({ id: L.id, list });
    }
    return out;
  });
  for (const L of r) {
    const ids = L.list.map(s => s.idx).sort().join(',');
    check(`${L.id}: 3 big stars, idx 0..2, in free space`, L.list.length === 3 && ids === '0,1,2' && L.list.every(s => s.free),
      L.list.map(s => `#${s.idx}@a${s.ai}(${s.x},${s.y})`).join(' '));
  }
  check('placements: no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ---------- 2. reachability with real inputs ----------
{
  const { ctx, page, errs } = await open();
  for (const R of ROUTES) {
    const res = await page.evaluate((R) => {
      const S = window.__SB, G = S.G, P = S.P, I = S.input;
      const K = s => ({ right: s.includes('R') ? 1 : 0, left: s.includes('L') ? 1 : 0, a: s.includes('a') ? 1 : 0, b: s.includes('b') ? 1 : 0, down: s.includes('D') ? 1 : 0 });
      G.unlocked = S.LEVELS.length; S.newGame(R.lv); G.lives = 99;
      for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
      const killAll = () => { for (const e of S.area.ents) if (e.enemy) e.dead = true; };
      killAll();
      // start: a safe standing spot near the star (the only placement; everything after is inputs)
      P.x = R.x * 16 + (R.dx || 2); P.y = R.y * 16 - P.h; P.vx = 0; P.vy = 0;
      G.cam.x = Math.max(0, Math.min(P.x - 150, S.area.w * 16 - 432));
      const play = segs => { for (const [n, k] of segs) for (let i = 0; i < n; i++) { if (k === '|') return true; I.keys = K(k); S.tick(); } return false; };
      play(R.pre || []); I.keys = {}; for (let i = 0; i < 10; i++) S.tick();
      killAll();
      const area = G.areaIdx, bit = 1 << R.idx;
      const star = S.area.ents.find(e => e.type === 'bigstar' && e.idx === R.idx);
      if (!star) return { err: 'star not in area ' + area };
      const score0 = G.score;
      let at = -1, f = 0;
      for (const [n, k] of R.seg) {
        if (k === '|') { at = f; break; }
        for (let i = 0; i < n; i++) { I.keys = K(k); S.tick(); f++; }
      }
      const gotAtMark = (G.bigRun & bit) !== 0, dead = G.state !== 'play';
      const rest = R.seg.slice(R.seg.findIndex(s => s[1] === '|') + 1);
      play(rest);
      I.keys = {};
      const idle = S.area.water ? 150 : 40;
      for (let i = 0; i < idle; i++) S.tick();
      return { area, gotAtMark, dead, score: G.score - score0, alive: G.state === 'play' && P.state === 'play', onGround: P.onGround, frames: f, starX: star.x / 16, starY: star.y / 16, px: +(P.x / 16).toFixed(1), py: +((P.y + P.h) / 16).toFixed(1) };
    }, R);
    check(`reach ${R.name}`, !res.err && res.gotAtMark && !res.dead && res.alive && res.score >= 2000,
      res.err || `area ${res.area} star(${res.starX},${res.starY}) in ${res.frames}f, +${res.score}, then safe at (${res.px},${res.py})`);
  }
  check('reachability: no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ---------- 3. rules: run-only until the flag, checkpoint, ghosts, persistence ----------
{
  const { ctx, page, errs } = await open();
  const ev = (f, a) => page.evaluate(f, a);
  const setup = `
    window.T = (() => {
      const S = window.__SB, G = S.G, P = S.P, I = S.input;
      const toPlay = () => { for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick(); };
      const killAll = () => { for (const e of S.area.ents) if (e.enemy) e.dead = true; };
      const run = (n, keys = {}) => { I.keys = { ...keys }; for (let i = 0; i < n; i++) S.tick(); I.keys = {}; };
      const place = (tx, row) => { P.x = tx * 16 + 2; P.y = row * 16 - P.h; P.vx = 0; P.vy = 0; G.cam.x = Math.max(0, P.x - 150); };
      const star = i => S.area.ents.find(e => e.type === 'bigstar' && e.idx === i && !e.dead);
      // walk the hero onto star i of the current area (a tiny touch test, not a reachability test)
      const touch = i => { const s = star(i); P.x = s.x + 2; P.y = s.y + 1; P.vx = 0; P.vy = 0; G.cam.x = Math.max(0, Math.min(P.x - 150, S.area.w * 16 - 432)); S.tick(); };
      const saved = () => JSON.parse(localStorage.getItem('superbiyik.stars') || '{}');
      const die = () => { for (let k = 0; k < 30 && G.state === 'play'; k++) { P.y = 300; S.tick(); } for (let k = 0; k < 600 && !(G.state === 'play' && P.state === 'play'); k++) S.tick(); killAll(); };
      const flag = () => { killAll(); const f = S.area.flag.x; place(f - 3, 13); for (let k = 0; k < 200 && P.state === 'play'; k++) { I.keys = { right: 1 }; S.tick(); } I.keys = {}; };
      return { S, G, P, I, toPlay, killAll, run, place, star, touch, saved, die, flag };
    })();`;
  await page.evaluate(setup);
  const r = await ev(() => {
    const { S, G, P, toPlay, killAll, run, place, star, touch, saved, die, flag } = window.T, out = {};
    G.unlocked = 7; S.newGame(0); toPlay(); G.lives = 9; killAll();
    // pickup: score, popup, HUD bit, but nothing saved yet
    const sc = G.score; touch(1);
    out.pick = { run: G.bigRun, score: G.score - sc, popup: G.parts.some(p => p.k === 'text' && /BÜYÜK YILDIZ/.test(p.text)), gone: !star(1), saved: saved()['1-1'] || 0 };
    // die before the checkpoint: the star is lost and comes back
    die(); out.afterDeath = { run: G.bigRun, back: !!star(1), cp: G.cp };
    // pick it up again, reach the checkpoint, then die: kept (picked up before the checkpoint)
    killAll(); touch(1); place(104, 13); run(3); out.cp = G.cp;
    // a star picked up after the checkpoint (idx 2 near the end) is lost on death
    killAll(); touch(2); out.both = G.bigRun;
    die(); out.afterCpDeath = { run: G.bigRun, star1: !!star(1), star2: !!star(2) };
    // finish: banked
    touch(2); flag(); out.flag = { state: P.state, saved: saved()['1-1'], tally: !!G.starTally && G.starTally.got };
    // play again: saved stars are ghosts, still give (less) score, the HUD keeps them
    S.newGame(0); toPlay(); killAll();
    const g = star(1); out.ghost = { g1: g && g.ghost, g0: star(0) ? 'wrong area' : 'ok', g2: star(2) && star(2).ghost };
    const sc2 = G.score; touch(1); out.ghostScore = G.score - sc2; out.ghostRun = G.bigRun;
    die(); flag(); out.afterGhost = saved()['1-1'];
    // castle: the axe banks the stars too
    S.newGame(5); toPlay(); G.lives = 9; killAll(); touch(0);
    const axe = S.area.ents.find(e => e.type === 'axe'); place(147, 10); P.x = axe.x - 14; run(30, { right: 1 });
    out.axe = { state: P.state, saved: saved()['1-6'] };
    // time attack: a restart (death) loses the star too
    S.startTimeAttack(2); toPlay(); killAll(); touch(0); out.taRun = G.bigRun; P.y = 300; for (let k = 0; k < 200 && G.ta.tries < 2; k++) S.tick();
    run(2); out.taAfter = G.bigRun; out.taStar = !!star(0);
    S.G.ta = null;
    out.count = S.stars.count(saved()['1-1'] || 0);
    return out;
  });
  check('pickup: +2000, popup, HUD bit, not saved yet', r.pick.run === 2 && r.pick.score === 2000 && r.pick.popup && r.pick.gone && r.pick.saved === 0, JSON.stringify(r.pick));
  check('death before the checkpoint: star lost and back in the level', r.afterDeath.run === 0 && r.afterDeath.back && !r.afterDeath.cp, JSON.stringify(r.afterDeath));
  check('checkpoint reached', r.cp === true);
  check('death after the checkpoint keeps stars picked up before it, loses the later one', r.both === 6 && r.afterCpDeath.run === 2 && !r.afterCpDeath.star1 && r.afterCpDeath.star2, JSON.stringify(r.afterCpDeath));
  check('flag: stars saved + tally', r.flag.state !== 'play' && r.flag.saved === 6 && r.flag.tally === 6, JSON.stringify(r.flag));
  check('saved stars return as ghosts and still give score', r.ghost.g1 === true && r.ghost.g2 === true && r.ghostScore === 1000 && r.ghostRun === 2, JSON.stringify(r.ghost) + ' score=' + r.ghostScore);
  check('saved stars are never lost again', r.afterGhost === 6);
  check('castle axe banks the stars', r.axe.saved === 1, JSON.stringify(r.axe));
  check('time attack restart loses the unbanked star', r.taRun === 1 && r.taAfter === 0 && r.taStar, JSON.stringify([r.taRun, r.taAfter, r.taStar]));
  // persistence across a reload: title total + per-level masks
  await page.reload(); await page.waitForTimeout(300);
  const p = await ev(() => { const S = window.__SB, G = S.G; return { m11: G.starSaved['1-1'], m16: G.starSaved['1-6'], total: S.LEVELS.reduce((a, L) => a + S.stars.count(S.stars.saved(L.id)), 0), state: G.state }; });
  check('saved stars persist across a reload', p.m11 === 6 && p.m16 === 1 && p.total === 3 && p.state === 'title', JSON.stringify(p));
  // a fresh run after reload: ghosts are back, HUD draws, tally renders without errors
  const q = await ev(() => { const S = window.__SB, G = S.G, P = S.P; S.newGame(0); for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick(); S.render(); const g = S.area.ents.filter(e => e.type === 'bigstar').map(e => e.idx + ':' + e.ghost); G.starTally = { got: 1, old: 6, t: G.frame - 60 }; S.render(); return g.join(' '); });
  check('ghost flags after reload', q === '1:true 2:true', q);
  check('rules: no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}

// ---------- 4. screenshots (SHOTS=dir) ----------
if (SHOTS) {
  mkdirSync(SHOTS, { recursive: true });
  for (const [w, h, tag] of [[844, 390, 'land'], [390, 844, 'port']]) {
    const { ctx, page, errs } = await open(w, h, { hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    await page.evaluate(() => { localStorage.setItem('superbiyik.unlocked', '7'); localStorage.setItem('superbiyik.stars', JSON.stringify({ '1-1': 7, '1-2': 3, '1-3': 1, '1-4': 6, '1-5': 2, '★': 4 })); });
    await page.reload(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/title_${tag}.png` });
    await page.evaluate(() => { window.__SB.G.taMode = true; }); await page.waitForTimeout(100);
    await page.screenshot({ path: `${SHOTS}/title_ta_${tag}.png` });
    await page.evaluate(() => { window.__SB.G.taMode = false; localStorage.removeItem('superbiyik.stars'); window.__SB.G.starSaved = {}; });
    for (const R of ROUTES) {
      await page.evaluate((R) => {
        const S = window.__SB, G = S.G, P = S.P, I = S.input;
        const K = s => ({ right: s.includes('R') ? 1 : 0, left: s.includes('L') ? 1 : 0, a: s.includes('a') ? 1 : 0, b: s.includes('b') ? 1 : 0, down: s.includes('D') ? 1 : 0 });
        G.unlocked = 7; S.newGame(R.lv); G.lives = 9;
        for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
        P.x = R.x * 16 + (R.dx || 2); P.y = R.y * 16 - P.h; P.vx = 0; P.vy = 0; P.inv = 0;
        G.cam.x = Math.max(0, Math.min(P.x - 150, S.area.w * 16 - 432));
        for (const [n, k] of (R.pre || [])) for (let i = 0; i < n; i++) { P.inv = 2; I.keys = K(k); S.tick(); }
        I.keys = {};
        const st = S.area.ents.find(e => e.type === 'bigstar' && e.idx === R.idx);
        const W = S.area.w * 16, VW = document.getElementById('game').width;
        G.cam.x = W < VW ? (W - VW) / 2 : Math.max(0, Math.min(st.x + 8 - VW * 0.55, W - VW));
        for (let k = 0; k < 4; k++) { P.inv = 2; S.tick(); }
        G.cam.x = W < VW ? (W - VW) / 2 : Math.max(0, Math.min(st.x + 8 - VW * 0.55, W - VW));
        G.wipe = null; S.render();
      }, R);
      await page.screenshot({ path: `${SHOTS}/star_${R.lv}_${R.idx}_${tag}.png` });
    }
    // HUD after a pickup + the level-clear tally
    await page.evaluate(() => {
      const S = window.__SB, G = S.G, P = S.P, I = S.input;
      S.newGame(0); for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
      for (const e of S.area.ents) if (e.enemy) e.dead = true;
      const s = S.area.ents.find(e => e.type === 'bigstar' && e.idx === 1); P.x = s.x - 30; P.y = s.y + 16 - P.h; G.cam.x = P.x - 120;
      I.keys = { right: 1 }; for (let k = 0; k < 24; k++) S.tick(); I.keys = {}; G.wipe = null; S.render();
    });
    await page.screenshot({ path: `${SHOTS}/pickup_${tag}.png` });
    await page.evaluate(() => {
      const S = window.__SB, G = S.G, P = S.P, I = S.input;
      for (const e of S.area.ents) if (e.enemy) e.dead = true;
      P.x = 194 * 16; P.y = 12 * 16 - P.h; P.vx = 0; P.vy = 0; G.cam.x = P.x - 150;
      for (let k = 0; k < 160; k++) { I.keys = { right: 1 }; S.tick(); } I.keys = {}; S.render();
    });
    await page.screenshot({ path: `${SHOTS}/tally_${tag}.png` });
    check(`screenshots ${tag}: no page errors`, errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  console.log('screenshots in ' + SHOTS);
}

await browser.close();
console.log(fails ? `${fails} FAILED` : 'ALL OK');
process.exitCode = fails ? 1 : 0;
