import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(new URL('../../index.html', import.meta.url).href);
const ONLY = process.env.LV ? process.env.LV.split(',').map(Number) : null;
for (let lv = 0; lv < 6; lv++) {
  if (ONLY && !ONLY.includes(lv)) continue;
  const r = await page.evaluate((lv) => {
    const S = window.__SB, G = S.G, P = S.P, I = S.input;
    G.unlocked = 6; S.newGame(lv); G.lives = 99;
    for (let k = 0; k < 160; k++) S.tick();
    const deaths = []; let hold = 0, f = 0, stuck = 0, lastX = 0;
    const solid = (x, y) => { const A = S.area; const tx = Math.floor(x / 16), ty = Math.floor(y / 16); if (tx < 0 || tx >= A.w) return true; if (ty < 0 || ty >= 15) return false; return [1,2,3,4,5,6,7,8,9,11,15,17,18].includes(A.t[ty * A.w + tx]) || (A.t[ty*A.w+tx]===10); };
    const platUnder = (x) => S.area.ents.some(e => e.plat && x > e.x && x < e.x + e.w && e.y > P.y);
    while (f < 9000 && (G.state === 'play' || G.state === 'dying' || G.state === 'intro')) {
      f++;
      if (G.state === 'play' && P.state === 'play') {
        P.inv = 5;
        const fx = P.x + P.w + 6, foot = P.y + P.h + 2;
        const fw = P.x + P.w + 4 + Math.max(0, P.vx) * 9; const wall = solid(fw, P.y + P.h - 4) || solid(fw, P.y + 2) || solid(fw, P.y - 12);
        const ge = P.x + P.w + 3; const gapAhead = !solid(ge, foot) && !solid(ge, foot + 16) && !platUnder(ge);
        let wait = false;
        const gapFar = !solid(fx + 36, foot) && !solid(fx + 36, foot + 16) && !solid(fx + 36, foot + 32);
        if (P.onGround && (gapAhead || gapFar) && !P.onPlat) {
          const near = S.area.ents.filter(e => e.type === 'plat' && !e.dead && e.x > P.x - 8 && e.x < P.x + 140);
          if (near.length && !near.some(e => e.x < fx + 40 && e.x + e.w > fx + 30 && Math.abs(e.y - (P.y + P.h)) < 50)) wait = true;
        }
        let platJump = false;
        if (P.onPlat) {
          const pl = P.onPlat;
          const edgeGap = !solid(P.x + P.w + 3, foot) && !platUnder(P.x + P.w + 3);
          if (pl.axis === 'x') { if (pl.dx > 0.02) wait = true; else if (pl.prevdx > 0.02) platJump = true; else if (edgeGap) wait = true; }
          else if (pl.axis === 'y') { if (pl.dy < -0.02 || (pl.dy > 0.02 && !pl.wasUp)) wait = true; if (pl.dy < -0.02) pl.wasUp = 1; if (pl.wasUp && pl.dy >= 0) { platJump = true; pl.wasUp = 0; } }
          pl.prevdx = pl.dx;
          if (wait && !platJump) { const c = pl.x + pl.w / 2 - P.w / 2; I.keys = {}; P.x += Math.sign(c - P.x) * Math.min(0.5, Math.abs(c - P.x)); }
        }
        if (platJump) { hold = 30; wait = false; }
        const vp = S.area.ents.find(e => e.type === 'plat' && e.axis === 'y' && e.x > P.x && e.x < P.x + 72);
        if (vp && P.onGround && !P.onPlat) {
          const atEdge = !solid(P.x + P.w + 10, foot) && !solid(P.x + P.w + 10, foot + 16);
          if (atEdge) { wait = true; if (vp.y > foot - 40 && vp.y < foot + 4 && hold <= 0) { hold = 20; wait = false; } }
          else wait = false;
        }
        if (!wait && P.onGround && hold <= 0 && (wall || gapAhead || stuck > 20)) hold = 30;
        const groundBelow = (x) => { for (let yy = P.y + P.h + 1; yy < 240; yy += 8) if (solid(x, yy) || platUnder(x)) return true; return false; };
        let steer = 1;
        if (!P.onGround && P.vy > 0 && groundBelow(P.x + P.w / 2) && !groundBelow(P.x + P.w + 18 + P.vx * 12)) steer = P.vx > 0.8 ? -1 : 0;
        I.keys = { right: wait || steer < 1 ? 0 : 1, left: steer < 0 || (wait && P.vx > 0.3) ? 1 : 0, b: steer < 1 ? 0 : 1, a: hold > 0 ? 1 : 0 };
        if (hold > 0) hold--;
        // wait for a platform: if gap ahead and platform not reachable, pause
        if (Math.abs(P.x - lastX) < 0.2) stuck++; else stuck = 0; lastX = P.x;
      } else I.keys = {};
      if (G.state === 'dying' && G.stateT === 1) deaths.push([Math.round(P.x / 16), Math.round(P.y / 16), G.time]);
      S.tick();
      if (G.levelIdx !== lv) break;
    }
    I.keys = {};
    return { lv, done: G.levelIdx !== lv || G.state === 'ending', state: G.state, x: Math.round(P.x / 16), deaths, f };
  }, lv);
  console.log(JSON.stringify(r));
}
console.log(errs.join('\n') || 'no errors');
await browser.close();
