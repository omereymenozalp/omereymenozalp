// Automated player: finishes every level using only input.keys + the real tick().
// It plans by snapshotting the whole game state, trying candidate inputs through the
// real tick() (wait N frames, run M frames, jump with hold H, steer in the air),
// rolling back after each try, and then playing the best plan for real.
// Enemy damage is off (P.inv = 5 every frame); pits, lava and quicksand still kill.
//   LV=2 node tools/test/bot.mjs   # only 1-3 (0-based, comma list ok)
//   VERBOSE=1 ...                  # print every plan
//   CP=1 ...                       # start each level from its checkpoint
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const t0 = Date.now();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'log') console.log('  ' + m.text()); });
// seeded Math.random whose state can be snapshotted, so rollouts are exactly reproducible
await page.addInitScript(() => {
  let s = 0x2545f491;
  window.__rng = { get s() { return s; }, set s(v) { s = v; } };
  Math.random = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
});
await page.goto(new URL('../../index.html', import.meta.url).href);
const ONLY = process.env.LV ? process.env.LV.split(',').map(Number) : null;
const nLevels = await page.evaluate(() => window.__SB.LEVELS.length);
let allDone = true;
for (let lv = 0; lv < nLevels; lv++) {
  if (ONLY && !ONLY.includes(lv)) continue;
  const tl = Date.now();
  const r = await page.evaluate(([lv, opt]) => {
    const S = window.__SB, G = S.G, P = S.P, I = S.input, RNG = window.__rng;
    G.unlocked = S.LEVELS.length; S.newGame(lv); G.lives = 99; if (opt.cp) G.cp = true;
    const live = () => G.state === 'play' && P.state === 'play';
    const won = () => G.levelIdx !== lv || G.state === 'ending' || (G.state === 'play' && P.state !== 'play' && P.state !== 'pipeIn' && P.state !== 'pipeOut');
    let ticks = 0;
    function step(keys) { I.keys = keys; if (live()) P.inv = 5; S.tick(); ticks++; }

    // ---------- snapshot / restore of everything tick() reads or writes during play ----------
    const cl = o => (o && typeof o === 'object') ? { ...o } : o;
    function restoreObj(o, s) { for (const k in o) if (!(k in s)) delete o[k]; Object.assign(o, s); }
    function snap() {
      const A = S.area;
      return {
        A, G: { ...G }, cam: { ...G.cam }, seq: cl(G.seq), msg: cl(G.msg), wipe: cl(G.wipe), level: G.level,
        parts: G.parts.map(cl), P: { ...P }, I: { ...I }, rng: RNG.s,
        t: A.t.slice(), q: { ...A.q }, qn: { ...A.qn }, bumps: A.bumps.map(cl),
        ents: A.ents.slice(), es: A.ents.map(cl),
      };
    }
    function restore(s) {
      const A = s.A;
      if (S.area !== A || G.level !== s.level) throw new Error('area changed during a rollout');
      restoreObj(G, s.G); G.cam = { ...s.cam }; G.seq = cl(s.seq); G.msg = cl(s.msg); G.wipe = cl(s.wipe);
      G.parts = s.parts.map(cl); restoreObj(P, s.P); restoreObj(I, s.I); RNG.s = s.rng;
      A.t.set(s.t); A.q = { ...s.q }; A.qn = { ...s.qn }; A.bumps = s.bumps.map(cl);
      A.ents = s.ents.slice(); for (let i = 0; i < s.ents.length; i++) restoreObj(s.ents[i], s.es[i]);
    }

    // ---------- plans ----------
    // p = { w: idle frames, j: run frames, h: jump hold (0 = no jump), sw: frame (after the jump) to switch steering, d1, d2 }
    function keysFor(p, f) {
      if (f < p.w) return {};
      f -= p.w;
      if (f < p.j) return { right: 1, b: 1 };
      f -= p.j;
      const d = f < p.sw ? p.d1 : p.d2;
      return { a: f < p.h ? 1 : 0, right: d > 0 ? 1 : 0, left: d < 0 ? 1 : 0, b: 1 };
    }
    const MAXAIR = 160, SETTLE = 16;
    // from the current state, play the part of the plan after the run-up; returns the landing
    function leaf(p) {
      let air = false, f = 0;
      const k0 = p.w + p.j;
      for (; f < MAXAIR; f++) {
        step(keysFor(p, k0 + f));
        if (won()) return { ok: true, win: true, x: 1e6, f: k0 + f + 1 };
        if (!live()) return null;
        if (!P.onGround) air = true;
        if (f >= 3 && P.onGround && (air || (p.h === 0 && f >= 6))) break;
      }
      if (f >= MAXAIR) return null;
      const res = { ok: true, x: P.x, y: P.y, f: k0 + f + 1, plat: P.onPlat ? P.onPlat.type : '' };
      for (let k = 0; k < SETTLE; k++) { step({}); if (won()) return res; if (!live()) return null; }
      return res;
    }
    const FULL = {
      J: [0, 2, 4, 7, 10, 14, 18, 23, 30, 40], H: [0, 1, 4, 8, 12, 17, 23, 30],
      ST: [[1e9, 1, 1], [8, 1, 0], [16, 1, 0], [26, 1, 0], [36, 1, 0], [8, 1, -1], [16, 1, -1], [26, 1, -1], [36, 1, -1]],
    };
    const QUICK = { J: [0, 4, 10, 18, 30], H: [0, 4, 12, 23, 30], ST: [[1e9, 1, 1], [12, 1, 0], [24, 1, 0], [12, 1, -1], [24, 1, -1]] };
    // Search plans from the current state (which is restored afterwards).
    // Waits are tried in increasing order; the first wait that yields any forward landing wins.
    function search(set, maxW, firstOnly, minW, minProg = 6) {
      const root = snap(), x0 = P.x;
      let found = [], cur = root, w = 0;
      try {
        while (w <= maxW) {
          let jsnap = cur, jprev = 0;
          if (w >= minW) for (const j of set.J) {
            restore(jsnap);
            let dead = false;
            for (let k = jprev; k < j; k++) { step({ right: 1, b: 1 }); if (!live() || won()) { dead = true; break; } }
            if (dead) break;
            jsnap = snap(); jprev = j;
            for (const h of set.H) for (const [sw, d1, d2] of set.ST) {
              if (h === 0 && sw > 1e8 && j < set.J[set.J.length - 1]) continue; // plain run: only the longest one
              const p = { w, j, h, sw, d1, d2 };
              restore(jsnap);
              const r = leaf(p);
              if (r && (r.win || r.x > x0 + minProg)) {
                found.push({ p, r, score: r.win ? 1e9 - r.f : r.x - 0.25 * r.f });
                if (firstOnly) return found;
              }
            }
          }
          if (found.length) return found;
          // advance the wait
          restore(cur);
          const dw = w < 40 ? 4 : 6;
          let dead = false;
          for (let k = 0; k < dw; k++) { step({}); if (!live()) { dead = true; break; } }
          if (dead) break;
          w += dw; cur = snap();
        }
        return found;
      } finally { restore(root); }
    }
    // play a plan from the current (root) state up to the frame count `n`; returns a fresh snapshot
    function playTo(p, n) { for (let k = 0; k < n; k++) { step(keysFor(p, k)); if (!live()) break; } }
    // How sloppy can a human be with this plan? Largest d <= TOL such that pressing jump d frames
    // earlier/later (run-up or idle wait), holding A d frames shorter/longer and switching the air
    // steering d frames earlier/later all still land somewhere forward.
    const TOL = 3;
    function tolerance(p, root) {
      const x0 = root.P.x;
      const okp = q => { restore(root); playTo(q, q.w + q.j); if (!live()) return false; const r = leaf(q); return !!r && (r.win || r.x > x0 + 6); };
      for (let d = 1; d <= TOL; d++) for (const s of [-d, d]) {
        const vs = [];
        if (p.j + s >= 0) vs.push({ ...p, j: p.j + s });
        if (p.w > 0 && p.w + s >= 0) vs.push({ ...p, w: p.w + s });
        if (p.h > 0 && p.h < 30) vs.push({ ...p, h: Math.max(1, p.h + s) });
        if (p.sw < 1e8 && p.sw + s >= 0) vs.push({ ...p, sw: p.sw + s });
        for (const q of vs) if (!okp(q)) return d - 1;
      }
      return TOL;
    }
    // Pick the farthest landing that is forgiving (tolerance TOL) and from which the run can go on;
    // if the earliest workable wait has nothing forgiving, also look at later waits.
    function choose() {
      const root = snap();
      let best = null, minW = 0, any = null;
      for (let round = 0; round < 8 && minW <= 240; round++) {
        restore(root);
        const cands = search(FULL, 240, false, minW).sort((a, b) => b.score - a.score);
        if (!cands.length) break;
        any = any || cands[0];
        for (let i = 0; i < cands.length && i < 150; i++) {
          const c = cands[i];
          if (c.r.win) { restore(root); c.tol = TOL; return c; }
          c.tol = tolerance(c.p, root);
          if (best && c.tol <= best.tol) continue;
          // look one landing further: the spot must allow a real (>= 1.5 tiles) forward continuation
          restore(root); playTo(c.p, c.r.f);
          const ok = live() && search(QUICK, 150, true, 0, 24).length > 0;
          if (!ok) continue;
          best = c;
          if (c.tol === TOL) break;
        }
        if (best && best.tol === TOL) break;
        minW = cands[0].p.w + 4;
      }
      restore(root);
      return best || any;
    }

    // ---------- main loop ----------
    const deaths = [], log = [];
    let f = 0, plans = 0, mism = 0; const tight = [];
    while (f < 20000 && !won() && G.state !== 'gameover') {
      if (live() && P.onGround && G.freeze === 0) {
        const c = choose(); plans++;
        if (!c) { for (let k = 0; k < 10; k++) { step({ right: 1, b: 1, a: k < 8 ? 1 : 0 }); f++; } continue; }
        for (let k = 0; k < c.r.f; k++) {
          step(keysFor(c.p, k)); f++;
          if (G.state === 'dying' && G.stateT === 1) deaths.push([Math.round(P.x / 16), Math.round(P.y / 16), G.time]);
          if (!live()) break;
        }
        const ex = !c.r.win && (Math.abs(P.x - c.r.x) > 0.01 || Math.abs(P.y - c.r.y) > 0.01);
        if (ex) mism++;
        if (c.tol < 2) tight.push([Math.round(P.x / 16), c.tol]);
        if (opt.verbose || ex || c.tol < 2) log.push(`f${f} x=${(P.x / 16).toFixed(2)} plan w${c.p.w} j${c.p.j} h${c.p.h} st${c.p.sw > 1e8 ? '-' : c.p.sw}/${c.p.d2} -> x=${(c.r.x / 16).toFixed(2)} ${c.r.plat} tol=${c.tol}${ex ? ' MISMATCH real=' + (P.x / 16).toFixed(2) : ''}`);
      } else {
        step({}); f++;
        if (G.state === 'dying' && G.stateT === 1) deaths.push([Math.round(P.x / 16), Math.round(P.y / 16), G.time]);
      }
    }
    I.keys = {};
    return { lv: S.LEVELS[lv].id, done: won(), x: Math.round(P.x / 16), deaths, frames: f, plans, mismatches: mism, tight, simTicks: ticks, log };
  }, [lv, { verbose: !!process.env.VERBOSE, cp: !!process.env.CP }]);
  const { log, ...rest } = r;
  for (const l of log) console.log('  ' + l);
  console.log(JSON.stringify({ ...rest, sec: +((Date.now() - tl) / 1000).toFixed(1) }));
  if (!r.done) allDone = false;
}
console.log(errs.join('\n') || 'no errors');
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
await browser.close();
process.exitCode = allDone ? 0 : 1;
