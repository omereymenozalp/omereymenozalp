import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const url = new URL('../../index.html', import.meta.url).href;
const out = process.argv[2] || '.';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async()=>chromium.launch());
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto(url);
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/title.png` });
for (let i = 0; i < 4; i++) {
  await page.evaluate(i => { const S = window.__SB; S.G.unlocked = 4; S.newGame(i); for (let k = 0; k < 160; k++) S.tick(); }, i);
  // run right for a while with jumping
  await page.evaluate(() => { const S = window.__SB; S.input.keys.right = 1; for (let k = 0; k < 90; k++) { S.input.keys.a = (k % 40) < 20 ? 1 : 0; S.tick(); } S.input.keys = {}; });
  await page.waitForTimeout(100);
  await page.screenshot({ path: `${OUT}/level${i}.png` });
  const info = await page.evaluate(() => { const S = window.__SB; return { state: S.G.state, px: S.P.x, py: S.P.y, ents: S.area.ents.length, lives: S.G.lives }; });
  console.log('level', i, JSON.stringify(info));
}
console.log(errs.length ? errs.join('\n') : 'NO ERRORS');
await browser.close();
