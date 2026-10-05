// Pause menu + juice test: real touch taps on the canvas-drawn menu, pad and keyboard navigation, haptics, iris wipe.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const OUT = process.env.OUT || '/tmp';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let fails = 0;
const check = (name, ok, extra = '') => { if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
for (const [w, h, name] of [[844, 390, 'land'], [390, 844, 'portrait']]) {
  console.log('--- ' + name + ' ' + w + 'x' + h);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { window.__vib = []; navigator.vibrate = p => { window.__vib.push(p); return true; }; });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto(new URL('../../index.html', import.meta.url).href);
  await page.waitForTimeout(700);
  const ev = (f, a) => page.evaluate(f, a);
  const st = () => ev(() => { const S = window.__SB; return { state: S.G.state, paused: S.G.paused, psel: S.G.psel, lives: S.G.lives, muted: JSON.parse(localStorage.getItem('superbiyik.muted') || 'false'), vib: S.HAPTIC.on, wipe: S.G.wipe && S.G.wipe.k }; });
  // title -> intro goes through the iris wipe
  const card = await page.locator('#game').boundingBox();
  await page.touchscreen.tap(card.x + card.width / 2, card.y + card.height * 0.3);
  await page.waitForTimeout(140);
  const midWipe = await st();
  await page.screenshot({ path: `${OUT}/${name}_wipe.png` });
  check('title tap starts iris wipe', midWipe.wipe === 'out' && midWipe.state === 'title', JSON.stringify(midWipe));
  await page.waitForTimeout(500);
  check('wipe lands on intro', (await st()).state === 'intro');
  await ev(() => { const S = window.__SB; for (let n = 0; S.G.state !== 'play' && n < 400; n++) S.tick(); for (let i = 0; i < 30; i++) S.tick(); });
  const tapItem = async id => {
    const it = await ev(id => window.__SB.pauseItems().find(i => i.id === id), id);
    const r = await page.locator('#game').boundingBox();
    const vw = await ev(() => document.getElementById('game').width);
    await page.touchscreen.tap(r.x + (it.x + it.w / 2) * r.width / vw, r.y + (it.y + it.h / 2) * r.height / 240);
    await page.waitForTimeout(80);
  };
  const pauseBtn = async () => { const b = await page.locator('#bPause').boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(80); };
  await pauseBtn();
  check('top pause button opens menu', (await st()).paused);
  await page.screenshot({ path: `${OUT}/${name}_pause.png` });
  // SES
  let s0 = await st();
  await tapItem('sound');
  let s1 = await st();
  check('SES toggles mute', s1.muted === !s0.muted && s1.paused && s1.psel === 2, `${s0.muted} -> ${s1.muted}`);
  await page.screenshot({ path: `${OUT}/${name}_pause_sound.png` });
  await tapItem('sound');
  check('SES toggles back', (await st()).muted === s0.muted);
  // TITRESIM
  s0 = await st();
  await tapItem('vib');
  s1 = await st();
  const stored = await ev(() => localStorage.getItem('superbiyik.vibrate'));
  check('TİTREŞİM toggles + persists', s1.vib === !s0.vib && stored === String(s1.vib), `${s0.vib} -> ${s1.vib} stored=${stored}`);
  await tapItem('vib');
  check('TİTREŞİM back on', (await st()).vib === true);
  // pad navigation: down moves, A activates (DEVAM ET after wrapping around)
  const pad = async k => { const b = await page.locator(`[data-k="${k}"]`).boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(80); };
  await ev(() => { window.__SB.G.psel = 0; });
  await pad('down'); check('pad ▼ moves selection', (await st()).psel === 1);
  await pad('left'); check('pad ◀ moves selection up', (await st()).psel === 0);
  await pad('a'); check('pad A on DEVAM ET resumes', !(await st()).paused);
  // keyboard: Enter pauses, arrows move, Enter confirms
  await page.keyboard.press('Escape'); await page.waitForTimeout(60);
  check('Esc pauses', (await st()).paused);
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  check('arrows move selection', (await st()).psel === 1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(60);
  check('Esc resumes', !(await st()).paused);
  // DEVAM ET by touch
  await pauseBtn();
  await tapItem('resume');
  check('DEVAM ET resumes', !(await st()).paused);
  // YENIDEN BASLAT
  await ev(() => { const S = window.__SB; S.G.lives = 3; for (let i = 0; i < 60; i++) S.tick(); });
  await pauseBtn();
  await tapItem('restart');
  await page.waitForTimeout(120);
  await page.screenshot({ path: `${OUT}/${name}_restart_wipe.png` });
  await page.waitForTimeout(500);
  s1 = await st();
  check('YENİDEN BAŞLAT -> intro, costs a life', s1.state === 'intro' && !s1.paused && s1.lives === 2, JSON.stringify(s1));
  await ev(() => { const S = window.__SB; for (let n = 0; S.G.state !== 'play' && n < 400; n++) S.tick(); for (let i = 0; i < 40; i++) S.tick(); });
  // effects: stomp a kestane -> hit-stop, flash, vibrate, star burst
  const fx = await ev(() => {
    const S = window.__SB, G = S.G, P = S.P;
    const k = S.area.ents.find(e => e.type === 'kestane' && !e.dead && !e.flat);
    k.active = true; G.cam.x = Math.max(G.cam.x, k.x - 150); P.x = k.x; P.y = k.y - P.h - 6; P.vy = 3; P.state = 'play';
    window.__vib.length = 0;
    let n = 0; while (!k.flat && n++ < 10) S.tick();
    const r = { freeze: G.freeze, flash: G.flash, vib: window.__vib.slice(), stars: G.parts.filter(p => p.k === 'star').length };
    S.render();
    return r;
  });
  await page.screenshot({ path: `${OUT}/${name}_stomp.png` });
  check('stomp: hit-stop + flash + vibrate + star burst', fx.freeze >= 2 && fx.flash > 0 && fx.vib.length === 1 && fx.stars === 8, JSON.stringify(fx));
  // ANA MENU
  await ev(() => { const S = window.__SB; for (let i = 0; i < 10; i++) S.tick(); });
  await pauseBtn();
  await tapItem('menu');
  await page.waitForTimeout(650);
  s1 = await st();
  check('ANA MENÜ -> title', s1.state === 'title' && !s1.paused, JSON.stringify(s1));
  check('no page errors', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close();
console.log(fails ? fails + ' FAILED' : 'ALL OK');
process.exit(fails ? 1 : 0);
