// Every level: die after the checkpoint, respawn there, and verify the hero stands on real floor and can walk right.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext()).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(new URL('../../index.html', import.meta.url).href);
const r = await page.evaluate(() => {
  const S = window.__SB, G = S.G, P = S.P, I = S.input, out = [];
  for (let lv = 0; lv < S.LEVELS.length; lv++) {
    S.newGame(lv); for (let k = 0; k < 400 && G.state !== 'play'; k++) S.tick();
    G.cp = true; G.lives = 5;
    G.state = 'dying'; G.stateT = 189; S.tick();
    for (let k = 0; k < 600 && G.state !== 'play'; k++) S.tick();
    const x0 = P.x, y0 = P.y + P.h;
    for (let k = 0; k < 20; k++) S.tick();
    const standing = P.onGround && Math.abs(P.y + P.h - y0) < 1;
    I.keys = { right: 1 }; for (let k = 0; k < 40; k++) { P.inv = 5; S.tick(); } I.keys = {};
    out.push(`${S.LEVELS[lv].id}: spawnRow=${(y0 / 16).toFixed(1)} standing=${standing} walked=${(P.x - x0).toFixed(0)}px state=${G.state} ${standing && P.x - x0 > 30 ? 'OK' : 'FAIL'}`);
  }
  return out.join('\n');
});
console.log(r); console.log(errs.join('\n') || 'no errors');
await browser.close();
