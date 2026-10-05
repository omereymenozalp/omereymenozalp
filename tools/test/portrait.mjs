import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [w,h,name] of [[390,844,'portrait'],[844,390,'land']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs=[]; page.on('pageerror', e => errs.push(e.message));
  await page.goto(new URL('../../index.html', import.meta.url).href);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}_title.png` });
  await page.evaluate(() => { const S = window.__SB; S.newGame(0); for (let k = 0; k < 160; k++) S.tick(); S.input.keys.right=1; for (let k = 0; k < 60; k++) S.tick(); S.input.keys={}; S.render(); });
  // simulate touch on A button
  const a = await page.locator('[data-k="a"]').boundingBox();
  await page.touchscreen.tap(a.x + a.width/2, a.y + a.height/2);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/${name}_play.png` });
  console.log(name, errs.length ? errs : 'ok');
}
await browser.close();
