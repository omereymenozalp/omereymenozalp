// Secret underwater level "★ MERCAN DENİZİ": song bar lengths, swim physics, sea creatures, unlock rule,
// and a scripted swimmer that plays the level from start to finish (exit pipe -> beach flag -> special ending -> title).
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto(new URL('../../index.html', import.meta.url).href);
await page.waitForTimeout(300);
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

// --- every bar of every track of every song must be exactly 16 steps
const bars = await page.evaluate(() => {
  const bad = [];
  for (const [name, s] of Object.entries(window.__SB.SONGS)) if (s.loop) for (const [tn, str] of Object.entries(s.tracks)) { // jingles are one free-length phrase
    str.split('|').forEach((bar, i) => { const n = bar.trim().split(/\s+/).filter(Boolean).reduce((a, t) => a + parseInt(t.split(':')[1] || '1'), 0); if (n !== 16) bad.push(`${name}.${tn} bar ${i + 1} = ${n}`); });
  }
  return bad;
});
check('all song bars are 16 steps', bars.length === 0, bars.join(', '));

const r = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input, out = {};
  const run = (n, keys = {}) => { I.keys = { ...keys }; for (let i = 0; i < n; i++) S.tick(); I.keys = {}; };
  const sea = S.LEVELS.findIndex(L => L.secret);
  out.sea = sea; out.id = S.LEVELS[sea].id; out.main = S.MAIN_LEVELS;
  const enter = () => { G.unlocked = 7; S.newGame(sea); for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick(); for (const e of S.area.ents) if (e.enemy) e.dead = true; };
  const place = (tx, y) => { P.x = tx * 16 + 2; P.y = y; P.vx = 0; P.vy = 0; G.cam.x = Math.max(0, P.x - 150); };
  enter();
  out.water = !!S.area.water;
  // sinking: slow and capped
  place(30, 60); let maxVy = 0; const y0 = P.y;
  for (let i = 0; i < 90; i++) { S.tick(); maxVy = Math.max(maxVy, P.vy); }
  out.sinkMax = maxVy; out.sunk = P.y - y0;
  // one stroke goes up, repeated strokes keep climbing
  place(30, 170); run(2); const yb = P.y; run(1, { a: 1 }); out.strokeVy = P.vy; run(14); out.strokeRise = yb - P.y;
  place(30, 190); const yc = P.y;
  for (let i = 0; i < 120; i++) { I.keys = { a: i % 18 === 0 ? 1 : 0 }; S.tick(); } I.keys = {};
  out.multiRise = yc - P.y;
  // the surface caps the climb
  for (let i = 0; i < 200; i++) { I.keys = { a: i % 6 === 0 ? 1 : 0 }; S.tick(); } I.keys = {};
  out.topY = P.y;
  // horizontal: no running underwater, slower than on land
  place(30, 100); let vmax = 0;
  for (let i = 0; i < 120; i++) { I.keys = { right: 1, b: 1, a: i % 20 === 0 ? 1 : 0 }; S.tick(); vmax = Math.max(vmax, Math.abs(P.vx)); } I.keys = {};
  out.swimVmax = vmax;
  place(52, 12 * 16 + 1); run(5); vmax = 0;
  for (let i = 0; i < 90; i++) { I.keys = { right: 1, b: 1 }; S.tick(); if (P.onGround) vmax = Math.max(vmax, Math.abs(P.vx)); } I.keys = {};
  out.wadeVmax = vmax; out.wadeGround = P.onGround;
  // fireball underwater kills a fish (flies straight, no bounce)
  enter(); P.size = 2; P.h = 29; P.dir = 1; place(30, 100);
  const fish = S.area.ents.find(e => e.type === 'fish'); Object.assign(fish, { dead: false, dying: false, enemy: true, active: true, x: P.x + 60, y: P.y + 4, baseY: P.y + 4, vx: 0 });
  run(1, { b: 1 }); run(1);
  const fb = S.area.ents.find(e => e.type === 'fireball' && !e.dead);
  out.fbWater = !!(fb && fb.water); out.fbVy = fb ? fb.vy : null;
  run(40);
  out.fishShot = !!fish.dying;
  // touching a fish from above hurts (no stomping underwater)
  enter(); P.size = 1; P.h = 29; P.inv = 0; place(30, 100);
  const f2 = S.area.ents.find(e => e.type === 'fish'); Object.assign(f2, { dead: false, dying: false, enemy: true, active: true, x: P.x, y: P.y + P.h - 3, baseY: P.y + P.h - 3, vx: 0 });
  P.vy = 1; S.tick(); out.sizeAfterFish = P.size; out.fishAlive = !f2.dying;
  // pufferfish inflates when the hero comes close, then deflates when he leaves
  enter(); P.inv = 999;
  const pf = S.area.ents.find(e => e.type === 'puffer'); Object.assign(pf, { dead: false, active: true });
  place(Math.floor(pf.cx / 16) - 2, pf.cy - 10); run(30); out.pufferInf = pf.inf; out.pufferW = pf.w;
  place(Math.floor(pf.cx / 16) - 9, pf.cy - 10); run(120); out.pufferDeflated = pf.inf;
  // jellyfish pulses up toward a hero above it
  enter(); P.inv = 999;
  const jf = S.area.ents.find(e => e.type === 'jelly'); Object.assign(jf, { dead: false, active: true, pulse: 1 });
  const jy0 = jf.y; place(Math.floor(jf.x / 16), 40); run(80, {}); out.jellyRise = jy0 - jf.y;
  // star kills a sea creature on contact
  enter(); P.star = 300; place(30, 100);
  const f3 = S.area.ents.find(e => e.type === 'fish'); Object.assign(f3, { dead: false, dying: false, enemy: true, active: true, x: P.x + 2, y: P.y + 2, baseY: P.y + 2, vx: 0 });
  S.tick(); out.starKill = !!f3.dying;
  // the secret: pipe at 62 drops into the treasure grotto, whose pipe leads back out further along; hidden 1UP block
  enter(); P.size = 0; P.h = 15; place(62, 11 * 16 - 15 - 4); P.x = 62 * 16 + 10; run(30); run(3, { down: 1 }); run(60);
  out.grotto = S.G.areaIdx + ' coins=' + S.area.t.filter(t => t === 13).length;
  P.x = 23 * 16 + 10; P.y = 11 * 16 - 15 - 4; run(30); run(3, { down: 1 }); run(90);
  out.grottoExit = S.G.areaIdx + ' x=' + Math.floor(P.x / 16) + ' ' + P.state;
  out.hidden1up = S.LEVELS[sea].make().areas[0].t.some(t => t === 14);
  // unlock rule: beating the castle (ending) unlocks the secret level
  localStorage.removeItem('superbiyik.unlocked'); G.unlocked = 6;
  S.newGame(5); for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
  G.msg = { t: 419 }; for (let k = 0; k < 120 && G.state !== 'ending'; k++) S.tick();
  out.endingUnlock = G.state + ' unlocked=' + G.unlocked + ' stored=' + localStorage.getItem('superbiyik.unlocked');
  return out;
});
console.log(JSON.stringify(r));
check('secret level is the 7th, main adventure is 6', r.sea === 6 && r.main === 6 && r.id === '★');
check('area is underwater', r.water);
check('slow capped sink', r.sinkMax <= 1.11 && r.sunk > 20 && r.sunk < 100, `maxVy=${r.sinkMax.toFixed(2)} sunk=${r.sunk.toFixed(0)}px/90f`);
check('A = swim stroke upward', r.strokeVy < -2 && r.strokeRise > 15, `vy=${r.strokeVy.toFixed(2)} rise=${r.strokeRise.toFixed(0)}`);
check('repeated strokes keep climbing', r.multiRise > 60, `rise=${r.multiRise.toFixed(0)}`);
check('surface caps the climb', r.topY >= 6 && r.topY < 12, `y=${r.topY.toFixed(1)}`);
check('no running underwater (swim)', r.swimVmax <= 1.36 && r.swimVmax > 1.0, `vmax=${r.swimVmax.toFixed(2)}`);
check('slower wading on the sea floor', r.wadeVmax <= 1.11 && r.wadeVmax > 0.8, `vmax=${r.wadeVmax.toFixed(2)}`);
check('fireball works underwater (straight)', r.fbWater && r.fbVy === 0 && r.fishShot);
check('touching a fish hurts, even from above', r.sizeAfterFish === 0 && r.fishAlive);
check('pufferfish inflates near the hero', r.pufferInf > 0.9 && r.pufferW > 18, `inf=${r.pufferInf.toFixed(2)} w=${r.pufferW}`);
check('pufferfish deflates again', r.pufferDeflated < 0.1);
check('jellyfish rises toward the hero', r.jellyRise > 20, `rise=${r.jellyRise.toFixed(0)}px`);
check('star kills sea creatures', r.starKill);
check('secret pipe -> treasure grotto -> back out', /^2 coins=\d\d/.test(r.grotto) && /^0 x=11[23] play$/.test(r.grottoExit), r.grotto + ' / ' + r.grottoExit);
check('hidden 1UP block exists', r.hidden1up);
check('beating the castle unlocks the secret level', /^ending unlocked=7 stored=7$/.test(r.endingUnlock), r.endingUnlock);

// --- scripted swimmer plays the whole level
const play = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input;
  const sea = S.LEVELS.findIndex(L => L.secret);
  G.unlocked = 7; S.newGame(sea); G.lives = 99;
  for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
  const SOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 17, 18];
  const solidT = (tx, ty) => { const A = S.area; if (tx < 0 || tx >= A.w) return true; if (ty < 0 || ty >= 15) return false; return SOL.includes(A.t[ty * A.w + tx]); };
  const log = []; let f = 0, lastX = 0, stuck = 0, strokeCD = 0, beach = false, pipes = [];
  while (f < 12000 && (G.state === 'play' || G.state === 'dying' || G.state === 'intro')) {
    f++;
    const keys = {};
    if (G.state === 'play' && P.state === 'play') {
      P.inv = 5; // like bot.mjs: ignore enemy contact, test the route
      if (S.area.water) {
        // find the open vertical window in the next few columns nearest to the hero, then bob in its lower part
        // (a stroke lifts ~40px, so trigger strokes near the window floor)
        const hT = Math.ceil(P.h / 16), cx = Math.floor((P.x + P.w / 2) / 16), feet = P.y + P.h;
        const openRow = (r) => { for (let c = cx; c <= cx + 2; c++) if (solidT(c, r)) return false; return true; };
        const fits = (r) => { for (let k = 0; k < hT; k++) if (!openRow(r + k)) return false; return true; };
        let tRow = -1, best = 99;
        for (let r = 0; r <= 13 - hT; r++) if (fits(r) && Math.abs(r - P.y / 16) < best) { best = Math.abs(r - P.y / 16); tRow = r; }
        if (tRow < 0) tRow = 6;
        let wTop = tRow, wBot = tRow + hT - 1;
        while (wTop > 0 && openRow(wTop - 1)) wTop--;
        while (wBot < 12 && openRow(wBot + 1)) wBot++;
        let targetFeet = (wBot + 1) * 16 - 5;
        const inWindow = P.y >= wTop * 16 - 1 && feet <= (wBot + 1) * 16 + 1;
        let goRight = true;
        if (G.areaIdx === 0 && cx >= 168) { // line up over the exit pipe and sink onto it
          const px = 172 * 16 + 16 - P.w / 2;
          goRight = false; keys.right = P.x < px - 1 ? 1 : 0; keys.left = P.x > px + 1 ? 1 : 0;
          targetFeet = Math.abs(P.x - px) < 3 ? 999 : 10 * 16;
          if (P.onGround && Math.abs(P.x - px) < 6) keys.down = 1;
        }
        if (G.areaIdx === 2) { // the grotto (not used by this route) - head to its exit pipe
          const px = 23 * 16 + 16 - P.w / 2; goRight = false; keys.right = P.x < px ? 1 : 0; targetFeet = Math.abs(P.x - px) < 3 ? 999 : 9 * 16; if (P.onGround) keys.down = 1;
        }
        const blockedAhead = solidT(Math.floor((P.x + P.w + 3) / 16), Math.floor(P.y / 16)) || solidT(Math.floor((P.x + P.w + 3) / 16), Math.floor((feet - 1) / 16));
        if (goRight) keys.right = blockedAhead && !inWindow ? 0 : 1;
        if (strokeCD > 0) strokeCD--;
        if ((feet > targetFeet || stuck > 90) && P.vy > -0.6 && strokeCD === 0) { keys.a = 1; strokeCD = 8; }
      } else { keys.right = 1; beach = true; }
      if (Math.abs(P.x - lastX) < 0.05 && !keys.down) stuck++; else stuck = 0;
      lastX = P.x;
    }
    if (P.state === 'pipeIn' && !pipes.includes(G.areaIdx + '>' + P.warp.to.area)) pipes.push(G.areaIdx + '>' + P.warp.to.area);
    if (G.state === 'dying' && G.stateT === 1) log.push('death at x=' + Math.round(P.x / 16) + ' y=' + Math.round(P.y / 16));
    I.keys = keys; S.tick();
  }
  I.keys = {};
  const endState = G.state; let back = '';
  if (G.state === 'seaend') { for (let k = 0; k < 200; k++) S.tick(); G.tap = { x: 10, y: 10 }; S.tick(); for (let k = 0; k < 60; k++) S.tick(); back = G.state; }
  return { endState, back, f, deaths: log, pipes, beach, coins: G.coins, score: G.score };
});
console.log(JSON.stringify(play));
check('scripted swimmer finishes the sea level', play.endState === 'seaend' && play.beach && play.pipes.includes('0>1'), `frames=${play.f} deaths=${play.deaths.length}`);
check('special ending returns to the title', play.back === 'title');
check('no page errors', errs.length === 0, errs.join('\n'));
console.log(fails ? fails + ' FAILED' : 'ALL OK');
await browser.close();
process.exit(fails ? 1 : 0);
