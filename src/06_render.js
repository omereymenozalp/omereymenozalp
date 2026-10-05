
// =====================================================================
//  RENDER
// =====================================================================
const D = (img, x, y) => ctx.drawImage(img, Math.round(x), Math.round(y));
function drawParallax(theme, camx) {
  const L = LAYERS[theme];
  ctx.drawImage(L.sky, 0, 0, VW, VH);
  for (const l of L) {
    const w = l.img.width;
    const off = (((camx * l.f + G.frame * (l.drift || 0)) % w) + w) % w;
    for (let x = -Math.round(off); x < VW; x += w) ctx.drawImage(l.img, x, l.y);
  }
}
function tileImg(A, id, tx, ty, TS) {
  switch (id) {
    case T.GROUND: return tileAt(A, tx, ty - 1) === T.GROUND ? TS.gfill : TS.gtop;
    case T.BRICK: return TS.brick;
    case T.Q: return TS.q[[0, 0, 0, 1, 2, 1][(G.frame >> 3) % 6]];
    case T.USED: return TS.used;
    case T.SOLID: return TS.solid;
    case T.PTL: return TS.ptl; case T.PTR: return TS.ptr; case T.PL: return TS.pl; case T.PR: return TS.pr;
    case T.SEMI: {
      const l = tileAt(A, tx - 1, ty) === T.SEMI, r = tileAt(A, tx + 1, ty) === T.SEMI;
      return l && r ? TS.semiM : l ? TS.semiR : r ? TS.semiL : TS.semiS;
    }
    case T.BRIDGE: return TS.bridge;
    case T.LAVA: return tileAt(A, tx, ty - 1) === T.LAVA ? TS.lava[(G.frame >> 4) % 4] : TS.lavaTop[(G.frame >> 3) % 4];
    case T.COIN: return ART.coin[[0, 0, 1, 2, 1][(G.frame >> 3) % 5]];
    case T.CASTLE: return TS.castle;
    case T.TRUNK: return TS.trunk;
    case T.CLOUD: return TS.cloud;
  }
  return null;
}
function drawTiles(A, camx) {
  const TS = TILES[A.theme];
  const tx0 = Math.max(0, Math.floor(camx / 16)), tx1 = Math.min(A.w - 1, Math.floor((camx + VW) / 16));
  const bumpOff = {};
  for (const b of A.bumps) { b.t++; bumpOff[b.ty * A.w + b.tx] = -Math.round(Math.sin(Math.min(b.t, 10) / 10 * Math.PI) * 5); }
  if (A.bumps.length) A.bumps = A.bumps.filter(b => b.t < 10);
  // trunks first (decor behind everything else on tile layer)
  for (let ty = 0; ty < ROWS; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const k = ty * A.w + tx, id = A.t[k];
    if (!id || id === T.HIDDEN) continue;
    const img = tileImg(A, id, tx, ty, TS);
    if (img) ctx.drawImage(img, tx * 16, ty * 16 + (bumpOff[k] || 0));
  }
}
function heroSet() { return P.star > 0 ? ART.heroStar[(G.frame >> 2) % 3] : P.size === 2 ? ART.fire : ART.hero; }
function drawPlayer() {
  if (!P.visible) return;
  if (G.state === 'play' && P.inv > 0 && P.transform <= 0 && (G.frame >> 2) % 2) return;
  const S = heroSet();
  const bottom = P.y + P.h;
  if (G.state === 'dying') { D(S.s_dead[0], P.x - 2, P.y - 1); return; }
  if (P.transform > 0 && G.freeze > 0) {
    const sz = ((P.transform >> 2) % 2) ? P.size : P.tfrom;
    const set = sz === 2 ? ART.fire : ART.hero;
    const img = sz > 0 ? set.b_stand : set.s_stand;
    D(img[P.dir > 0 ? 0 : 1], P.x - 2, sz > 0 ? (P.size > 0 ? P.y + P.h : P.y + P.h) - 31 : bottom - 16);
    return;
  }
  const big = P.size > 0;
  let key;
  if (P.ducking) key = 'duck';
  else if (P.state === 'flag') key = 'w2';
  else if (P.state === 'pipeIn' || P.state === 'pipeOut') key = 'stand';
  else if (!P.onGround && P.state !== 'axe' && P.state !== 'meet') key = 'jump';
  else if (P.skid) key = 'skid';
  else if (Math.abs(P.vx) > 0.1 || P.state === 'walk' || P.state === 'walkP') key = ['w1', 'w2', 'w3', 'w2'][Math.floor(P.anim) % 4];
  else key = 'stand';
  if (big && P.throwT > 0 && key !== 'duck') key = 'throw';
  const pair = S[(big ? 'b_' : 's_') + key] || S[(big ? 'b_' : 's_') + 'stand'];
  D(pair[P.dir > 0 ? 0 : 1], P.x - 2, big ? bottom - 31 : bottom - 16);
}
let podobooDown = null;
function drawEnt(e) {
  const f = e.t || 0;
  switch (e.type) {
    case 'kestane':
      if (e.dying) D(ART.kestane.dead, e.x - 1, e.y + e.h - 16);
      else D(e.flat ? ART.kestane.flat : ART.kestane.walk[(f >> 3) % 2], e.x - 1, e.y + e.h - 16);
      break;
    case 'beetle': {
      const y = e.y + e.h - 16;
      if (e.dying) { D(ART.beetle.dead, e.x - 1, y); break; }
      if (e.state === 'walk') D(ART.beetle.walk[(f >> 3) % 2][e.vx < 0 ? 0 : 1], e.x - 1, y);
      else {
        const wig = e.state === 'shell' && e.shellT < 90 ? ((f >> 2) % 2 ? 1 : -1) : 0;
        D(ART.beetle.shell[e.state === 'slide' ? (f >> 1) % 4 : 0], e.x - 1 + wig, y);
      }
      break;
    }
    case 'bee': if (e.dying) D(ART.bee.dead, e.x - 1, e.y - 2); else D(ART.bee.fly[(f >> 2) % 2][e.vx < 0 ? 0 : 1], e.x - 1, e.y - 2); break;
    case 'spiky': if (e.dying) D(ART.spiky.dead, e.x - 1, e.y + e.h - 16); else D(ART.spiky.walk[(f >> 3) % 2][e.vx < 0 ? 0 : 1], e.x - 1, e.y + e.h - 16); break;
    case 'podoboo':
      if (e.y < e.baseY - 2) { podobooDown = podobooDown || flipV(ART.podoboo); D(e.vy > 0 ? podobooDown : ART.podoboo, e.x - 2, e.y - 1); }
      break;
    case 'firebar': {
      const img = ART.fireball[(G.frame >> 2) % 4];
      for (let i = 0; i < e.len; i++) D(img, e.cx + Math.cos(e.a) * i * 8 - 4, e.cy + Math.sin(e.a) * i * 8 - 4);
      break;
    }
    case 'boss': {
      if (e.flash > 0 && (G.frame >> 1) % 2) break;
      const fr = e.mouth > 0 ? 2 : (f >> 4) % 2;
      const img = ART.boss[fr][e.dir < 0 ? 0 : 1];
      if (e.dying) { ctx.save(); ctx.translate(Math.round(e.x - 3), Math.round(e.y + e.h + 1)); ctx.scale(1, -1); ctx.drawImage(img, 0, 0); ctx.restore(); }
      else D(img, e.x - 3, e.y + e.h - 31);
      break;
    }
    case 'bossfire': D(ART.bossfire[(f >> 3) % 2][0], e.x, e.y); break;
    case 'axe': D(ART.axe[(G.frame >> 3) % 3], e.x, e.y); break;
    case 'princess': D(ART.princess, e.x, e.y); break;
    case 'plat': case 'fallplat': {
      const shake = e.type === 'fallplat' && e.fall > 0 && e.fall < 24 ? ((G.frame >> 1) % 2 ? 1 : -1) : 0;
      const x = Math.round(e.x) + shake, y = Math.round(e.y);
      const c = e.type === 'fallplat' ? ['#e4572e', '#8a2a14', '#ff9a70'] : area.theme === 'castle' ? ['#9aa0b0', '#4a4658', '#e8f0ff'] : ['#ffb02e', '#a8600a', '#ffe08a'];
      ctx.fillStyle = K; ctx.fillRect(x, y, e.w, e.h);
      ctx.fillStyle = c[0]; ctx.fillRect(x + 1, y + 1, e.w - 2, e.h - 2);
      ctx.fillStyle = c[2]; ctx.fillRect(x + 1, y + 1, e.w - 2, 2);
      ctx.fillStyle = c[1]; ctx.fillRect(x + 1, y + e.h - 2, e.w - 2, 1);
      for (let i = 6; i < e.w - 4; i += 12) { ctx.fillStyle = c[1]; ctx.fillRect(x + i, y + 4, 2, 2); }
      break;
    }
    case 'spring': D(ART.spring[e.comp > 6 ? 2 : e.comp > 0 ? 1 : 0], e.x, e.y); break;
    case 'item': {
      let img;
      if (e.kind === 'mush') img = ART.mush; else if (e.kind === '1up') img = ART.oneup;
      else if (e.kind === 'flower') img = ART.flower[(G.frame >> 2) % 4]; else img = ART.starItem[(G.frame >> 2) % 4];
      D(img, e.x - 1, e.y);
      break;
    }
    case 'fireball': D(ART.fireball[(f >> 1) % 4], e.x, e.y); break;
  }
}
function drawDecor(A, camx) {
  const set = DECOR[A.theme];
  for (const d of A.decor) {
    let img;
    if (d.k === 'torch') img = ART.torch[(G.frame >> 3) % 3];
    else img = set[d.k];
    if (!img) continue;
    if (d.x + img.width < camx - 8 || d.x > camx + VW + 8) continue;
    D(img, d.x, d.y - img.height);
  }
  if (A.castle) D(ART.castle, A.castle.x * 16, 13 * 16 - 80);
  if (A.flag) {
    const fx = A.flag.x * 16;
    D(ART.pole, fx + 4, 2 * 16);
    ART.flagL = ART.flagL || ART.flag.map(flipH);
    D(ART.flagL[(G.frame >> 3) % 3], fx + 6 - 18, G.flagY || 3 * 16 + 2);
  }
  if (G.areaIdx === 0 && G.level.checkpoint) {
    const x = G.level.checkpoint * 16 + 6, y = G.level.cpY;
    if (x > camx - 20 && x < camx + VW + 20) {
      ctx.fillStyle = K; ctx.fillRect(x - 1, y - 30, 4, 30);
      ctx.fillStyle = '#d8e0d8'; ctx.fillRect(x, y - 29, 2, 29);
      const fy = G.cp ? y - 29 : y - 12;
      ctx.fillStyle = K; ctx.fillRect(x + 2, fy - 1, 12, 9);
      ctx.fillStyle = G.cp ? '#2bb3a0' : '#8a8698'; ctx.fillRect(x + 2, fy, 11, 7);
      ctx.fillStyle = G.cp ? '#ffd84a' : '#c4c0d4'; ctx.fillRect(x + 6, fy + 2, 3, 3);
    }
  }
}
function drawParts(front) {
  for (const p of G.parts) {
    switch (p.k) {
      case 'text': drawText(p.text, p.x, p.y, p.col, { shadow: K }); break;
      case 'coinpop': D(ART.coin[(p.t >> 2) % 4], p.x, p.y); break;
      case 'debris': D(DECOR[area.theme].debris, p.x, p.y); break;
      case 'dust': ctx.fillStyle = 'rgba(255,244,224,' + (1 - p.t / 16) + ')'; ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 3), 3, 3); break;
      case 'spark': case 'fw': ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.k === 'fw' ? 2 : 1 + (p.t < 8), p.k === 'fw' ? 2 : 1 + (p.t < 8)); break;
    }
  }
}
function drawHUD() {
  const sh = K;
  const o = { shadow: sh };
  drawText('BIYIK', 8, 5, '#fff4e0', o);
  drawText(String(G.score).padStart(6, '0'), 8, 15, '#fff4e0', o);
  const cx = Math.round(VW * 0.2) + 10;
  ctx.drawImage(ART.heart, cx - 1, 5);
  drawText('×' + G.lives, cx + 8, 5, '#fff4e0', o);
  ctx.drawImage(ART.mcoin, cx, 15);
  drawText('×' + String(G.coins).padStart(2, '0'), cx + 8, 15, '#ffd84a', o);
  const wx = Math.round(VW * 0.7) - 6;
  drawText('DÜNYA', wx, 5, '#fff4e0', o);
  drawText(G.level ? G.level.def.id : '1-1', wx + 6, 15, '#fff4e0', o);
  drawText('SÜRE', VW - 8, 5, '#fff4e0', { shadow: sh, align: 'right' });
  drawText(String(Math.max(0, G.time)).padStart(3, '0'), VW - 8, 15, G.time <= 100 && (G.frame >> 4) % 2 ? '#ff6a5a' : '#fff4e0', { shadow: sh, align: 'right' });
}
function renderWorld() {
  const A = area;
  let camx = Math.round(G.cam.x);
  const sx = G.shake > 0 ? Math.round(rnd(-2, 2)) : 0, sy = G.shake > 0 ? Math.round(rnd(-2, 2)) : 0;
  drawParallax(A.theme, camx);
  if (A.theme === 'castle') { // lava glow
    const g = ctx.createLinearGradient(0, VH - 70, 0, VH); g.addColorStop(0, 'rgba(255,90,30,0)'); g.addColorStop(1, 'rgba(255,90,30,.28)');
    ctx.fillStyle = g; ctx.fillRect(0, VH - 70, VW, 70);
  }
  ctx.save();
  ctx.translate(-camx + sx, sy);
  if (camx < 0) { ctx.fillStyle = '#000'; ctx.fillRect(camx, 0, -camx, VH); ctx.fillRect(A.w * 16, 0, VW, VH); }
  drawDecor(A, camx);
  // behind-tile layer
  for (const e of A.ents) if (!e.dead && e.active && (e.type === 'piranha' || (e.type === 'item' && e.emerge > 0))) drawEnt(e);
  if (P.state === 'pipeIn' || P.state === 'pipeOut') drawPlayer();
  drawTiles(A, camx);
  for (const e of A.ents) if (!e.dead && e.active && e.type !== 'piranha' && !(e.type === 'item' && e.emerge > 0)) { if (e.x + 40 > camx && e.x - 40 < camx + VW) drawEnt(e); }
  if (P.state !== 'pipeIn' && P.state !== 'pipeOut') drawPlayer();
  drawParts();
  ctx.restore();
  drawHUD();
  if (G.msg) drawMessage();
  if (G.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + (G.fade / 14) + ')'; ctx.fillRect(0, 0, VW, VH); }
}
function panel(x, y, w, h) {
  ctx.fillStyle = K; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#fff4e0'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#2a1e44'; ctx.fillRect(x, y, w, h);
}
function drawMessage() {
  const t = G.msg.t;
  const w = Math.min(VW - 24, 236), x = (VW - w) / 2, y = 40;
  panel(x, y, w, 52);
  drawText('TEŞEKKÜRLER BIYIK!', VW / 2, y + 10, '#ffd84a', { align: 'center' });
  if (t > 60) drawText('EJDER KRAL YENİLDİ.', VW / 2, y + 24, '#fff4e0', { align: 'center' });
  if (t > 120) drawText('VADİ ARTIK GÜVENDE!', VW / 2, y + 36, '#fff4e0', { align: 'center' });
}

// ---------- screens ----------
const LEVEL_TINT = { over: ['#5ec948', '#2a7a2a'], cave: ['#5a78e8', '#23264a'], sky: ['#ffc08a', '#e8708a'], castle: ['#e4372e', '#3a1620'] };
const LEVEL_THEME = ['over', 'cave', 'sky', 'castle'];
function titleCards() {
  const n = LEVELS.length, w = 52, gap = 8, total = n * w + (n - 1) * gap, x0 = Math.round((VW - total) / 2);
  return LEVELS.map((L, i) => ({ x: x0 + i * (w + gap), y: 104, w, h: 40 }));
}
function renderTitle() {
  const camx = G.frame * 0.6;
  drawParallax('over', camx);
  const TS = TILES.over;
  const off = Math.round(camx) % 16;
  for (let x = -off; x < VW + 16; x += 16) { ctx.drawImage(TS.gtop, x, 208); ctx.drawImage(TS.gfill, x, 224); }
  // bush scrolling
  const bush = DECOR.over.bush56, bx = ((-camx * 1) % (VW + 120) + VW + 120) % (VW + 120) - 60;
  D(bush, bx, 208 - bush.height);
  // hero running, chestnut chasing
  const fr = ['s_w1', 's_w2', 's_w3', 's_w2'][(G.frame >> 3) % 4];
  const hx = Math.round(VW * 0.62);
  D(ART.hero[fr.replace('s_', 'b_')][0], hx, 208 - 31);
  D(ART.kestane.walk[(G.frame >> 3) % 2], hx - 44 + Math.sin(G.frame / 30) * 6, 208 - 16);
  D(ART.beetle.walk[(G.frame >> 3) % 2][1], hx - 70 + Math.sin(G.frame / 24) * 4, 208 - 16);
  D(ART.bee.fly[(G.frame >> 2) % 2][1], hx - 100, 150 + Math.sin(G.frame / 20) * 8);
  // logo
  const bob = Math.round(Math.sin(G.frame / 25) * 2);
  drawText('SÜPER', VW / 2, 22 + bob, '#ffd84a', { scale: 2, align: 'center', outline: K });
  drawText('BIYIK', VW / 2 + 2, 48 + bob, K, { scale: 5, align: 'center' });
  drawText('BIYIK', VW / 2, 46 + bob, '#e4572e', { scale: 5, align: 'center', outline: K });
  drawText('4 BÖLÜMLÜK PİKSEL MACERA', VW / 2, 92, '#fff4e0', { align: 'center', shadow: K });
  // level cards
  const cards = titleCards();
  cards.forEach((c, i) => {
    const locked = i >= G.unlocked, sel = i === G.sel;
    const [c1, c2] = LEVEL_TINT[LEVEL_THEME[i]];
    ctx.fillStyle = K; ctx.fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + 4);
    ctx.fillStyle = sel ? ((G.frame >> 3) % 2 ? '#ffd84a' : '#fff4e0') : '#8a8698'; ctx.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
    ctx.fillStyle = locked ? '#3a3648' : c2; ctx.fillRect(c.x, c.y, c.w, c.h);
    if (!locked) { ctx.fillStyle = c1; ctx.fillRect(c.x, c.y + c.h - 12, c.w, 12); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(c.x, c.y + c.h - 12, c.w, 2); }
    drawText(LEVELS[i].id, c.x + c.w / 2, c.y + 6, locked ? '#8a8698' : '#fff4e0', { align: 'center', scale: 2, shadow: K });
    if (locked) { // padlock
      const lx = c.x + c.w / 2 - 4, ly = c.y + 26;
      ctx.fillStyle = '#8a8698'; ctx.fillRect(lx + 1, ly - 4, 6, 2); ctx.fillRect(lx + 1, ly - 4, 2, 5); ctx.fillRect(lx + 5, ly - 4, 2, 5); ctx.fillRect(lx, ly, 8, 7);
      ctx.fillStyle = '#3a3648'; ctx.fillRect(lx + 3, ly + 2, 2, 3);
    }
  });
  const selName = LEVELS[G.sel].name;
  drawText(selName, VW / 2, 152, '#ffd84a', { align: 'center', shadow: K });
  if ((G.frame >> 4) % 2 === 0) drawText(HAS_TOUCH ? 'OYNAMAK İÇİN DOKUN' : 'BAŞLAMAK İÇİN ENTER', VW / 2, 166, '#fff4e0', { align: 'center', shadow: K });
  drawText('EN YÜKSEK ' + String(G.best).padStart(6, '0'), VW / 2, 180, '#c8ecff', { align: 'center', shadow: K });
  if (!HAS_TOUCH) drawText('← → HAREKET  Z ZIPLA  X KOŞ/ATEŞ  P DURAKLAT', VW / 2, 228, '#fff4e0', { align: 'center', shadow: K });
}
const TIPS = ["İPUCU: B'YE BASILI TUT, HIZLI KOŞ!", 'İPUCU: GİZLİ BLOKLARI ARA!', 'İPUCU: DÜŞEN PLATFORMDA OYALANMA!', 'İPUCU: BALTAYA ULAŞ, KÖPRÜYÜ YIK!'];
function renderIntro() {
  ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, VW, VH);
  const def = LEVELS[G.levelIdx];
  const [c1] = LEVEL_TINT[LEVEL_THEME[G.levelIdx]];
  drawText('DÜNYA ' + def.id, VW / 2, 62, '#fff4e0', { scale: 2, align: 'center' });
  drawText(def.name, VW / 2, 90, c1, { align: 'center' });
  const set = P.size === 2 ? ART.fire : ART.hero;
  D((P.size ? set.b_stand : set.s_stand)[0], VW / 2 - 26, P.size ? 108 : 122);
  drawText('× ' + G.lives, VW / 2 - 4, 127, '#fff4e0');
  drawText(TIPS[G.levelIdx], VW / 2, 176, '#8a8698', { align: 'center' });
  drawText(String(G.score).padStart(6, '0'), VW / 2, 200, '#ffd84a', { align: 'center' });
}
function renderGameOver() {
  ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, VW, VH);
  drawText('OYUN BİTTİ', VW / 2, 90, '#e4572e', { scale: 3, align: 'center', outline: K });
  drawText('SKOR ' + String(G.score).padStart(6, '0'), VW / 2, 130, '#fff4e0', { align: 'center' });
  drawText('EN YÜKSEK ' + String(G.best).padStart(6, '0'), VW / 2, 144, '#ffd84a', { align: 'center' });
  if (G.stateT < 200 && (G.frame >> 4) % 2) drawText('DEVAM ETMEK İÇİN DOKUN', VW / 2, 180, '#8a8698', { align: 'center' });
}
function updateEnding() {
  G.stateT++;
  if (G.stateT % 34 === 0) {
    const cx = rnd(30, VW - 30), cy = rnd(30, 100);
    const cols = [['#ffd84a', '#fff4e0'], ['#ff6a8a', '#ffd0d8'], ['#6af0d8', '#ffffff'], ['#a98aff', '#ffd84a']][(Math.random() * 4) | 0];
    for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; G.parts.push({ k: 'fw', x: cx, y: cy, vx: Math.cos(a) * rnd(1, 2), vy: Math.sin(a) * rnd(1, 2), t: 0, col: cols[i % 2] }); }
    SND.play('burst');
  }
  updateParts();
  if (G.stateT > 150 && (input.aP || input.startP || G.tap)) toTitle();
}
function renderEnding() {
  ctx.drawImage(LAYERS.castle.sky, 0, 0, VW, VH);
  for (let i = 0; i < 60; i++) { ctx.fillStyle = (i + (G.frame >> 4)) % 7 ? '#8a8aa8' : '#ffffff'; ctx.fillRect((hash(i, 1) * VW) | 0, (hash(i, 2) * 150) | 0, 1, 1); }
  drawParts();
  const TS = TILES.over;
  for (let x = 0; x < VW; x += 16) { ctx.drawImage(TS.gtop, x, 208); ctx.drawImage(TS.gfill, x, 224); }
  D(ART.castle, VW - 90, 128);
  const set = P.size === 2 ? ART.fire : ART.hero;
  D(set.b_stand[0], VW / 2 - 22, 208 - 31);
  D(ART.princess, VW / 2 + 4, 208 - 32);
  if ((G.frame >> 5) % 2) D(ART.heart, VW / 2 - 3, 160 + Math.sin(G.frame / 10) * 2);
  drawText('TEBRİKLER!', VW / 2, 28, '#ffd84a', { scale: 3, align: 'center', outline: K });
  drawText('PRENSES LALE KURTARILDI', VW / 2, 66, '#fff4e0', { align: 'center', shadow: K });
  drawText('SKOR ' + String(G.score).padStart(6, '0'), VW / 2, 84, '#fff4e0', { align: 'center', shadow: K });
  drawText('EN YÜKSEK ' + String(G.best).padStart(6, '0'), VW / 2, 96, '#c8ecff', { align: 'center', shadow: K });
  if (G.stateT > 150 && (G.frame >> 4) % 2) drawText('ANA MENÜ İÇİN DOKUN', VW / 2, 118, '#ffd84a', { align: 'center', shadow: K });
}
function render() {
  ctx.imageSmoothingEnabled = false;
  switch (G.state) {
    case 'title': renderTitle(); break;
    case 'intro': renderIntro(); break;
    case 'play': case 'dying': renderWorld(); break;
    case 'gameover': renderGameOver(); break;
    case 'ending': renderEnding(); break;
  }
  if (G.paused) {
    ctx.fillStyle = 'rgba(11,7,20,.7)'; ctx.fillRect(0, 0, VW, VH);
    drawText('DURAKLATILDI', VW / 2, 96, '#ffd84a', { scale: 2, align: 'center', outline: K });
    drawText('DEVAM ETMEK İÇİN DOKUN', VW / 2, 126, '#fff4e0', { align: 'center' });
    drawText('ANA MENÜ: AŞAĞI + DOKUN', VW / 2, 142, '#8a8698', { align: 'center' });
  }
}

// =====================================================================
//  FLOW CONTROL, INPUT WIRING, LAYOUT, LOOP
// =====================================================================
const HAS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function pause() {
  if (G.state !== 'play' || G.paused) return;
  G.paused = true; G.resumeMusic = MUSIC.name; G.resumeSpeed = MUSIC.speed; MUSIC.stop(); SND.play('pause');
}
function unpause() {
  if (!G.paused) return;
  G.paused = false;
  if (G.resumeMusic && SONGS[G.resumeMusic] && SONGS[G.resumeMusic].loop) MUSIC.play(G.resumeMusic, null, G.resumeSpeed || 1);
}
function updateTitle() {
  G.stateT++;
  const L = input.left && !G._pl, R = input.right && !G._pr;
  G._pl = input.left; G._pr = input.right;
  if (L) { G.sel = (G.sel + G.unlocked - 1) % G.unlocked; SND.play('select'); }
  if (R) { G.sel = (G.sel + 1) % G.unlocked; SND.play('select'); }
  let go = input.aP || input.startP;
  if (G.tap) {
    const t = G.tap; let hit = -1;
    titleCards().forEach((c, i) => { if (t.x >= c.x - 4 && t.x <= c.x + c.w + 4 && t.y >= c.y - 4 && t.y <= c.y + c.h + 4) hit = i; });
    if (hit >= 0) { if (hit < G.unlocked) { G.sel = hit; go = true; } else SND.play('bump'); }
    else go = true;
  }
  if (go && G.stateT > 20) { SND.init(); SND.play('select'); newGame(G.sel); }
}
function tick() {
  pollInput();
  G.frame++;
  if (G.fade > 0) G.fade--;
  if (G.shake > 0) G.shake--;
  switch (G.state) {
    case 'title': updateTitle(); break;
    case 'intro': if (--G.stateT <= 0) beginPlay(); break;
    case 'play':
      if (G.paused) {
        if (G.tap || input.startP || input.aP) { if (input.down) { G.paused = false; toTitle(); } else unpause(); }
        break;
      }
      if (input.startP) { pause(); break; }
      updatePlay(); updateParts();
      if (G.msg) {
        G.msg.t++;
        if (G.msg.t % 20 === 0) sparkle(P.x + 14, P.y - 4, '#ff6a8a');
        if (G.msg.t > 420 || (G.msg.t > 150 && (input.aP || G.tap))) toEnding();
      }
      break;
    case 'dying': updateDying(); updateParts(); break;
    case 'gameover': if (--G.stateT <= 0 || (G.stateT < 200 && (input.aP || G.tap || input.startP))) toTitle(); break;
    case 'ending': updateEnding(); break;
  }
  G.tap = null;
  if (G.state !== G._lastState) { G._lastState = G.state; layout(); }
}

// ---------- layout ----------
const app = document.getElementById('app'), pad = document.getElementById('pad'), topBar = document.getElementById('top'), hintEl = document.getElementById('hint');
function layout() {
  const W = app.clientWidth, H = app.clientHeight;
  const portrait = H > W * 1.05;
  let cw, ch;
  if (!portrait) {
    VW = clamp(Math.round(VH * W / H / 2) * 2, 256, 432);
    const s = Math.min(H / VH, W / VW);
    cw = VW * s; ch = VH * s;
    Object.assign(cv.style, { width: cw + 'px', height: ch + 'px', left: (W - cw) / 2 + 'px', top: (H - ch) / 2 + 'px' });
    pad.classList.remove('portrait'); pad.style.top = '0px';
    const dp = clamp(H * 0.4, 120, 200);
    pad.style.setProperty('--dp', dp + 'px'); pad.style.setProperty('--ab', dp * 1.02 + 'px');
    const inPlay = G.state === 'play' || G.state === 'dying';
    Object.assign(topBar.style, inPlay ? { top: 'calc(6px + env(safe-area-inset-top,0px))', left: '50%', right: 'auto', transform: 'translateX(-50%)' }
      : { top: 'calc(6px + env(safe-area-inset-top,0px))', left: 'auto', right: 'calc(8px + env(safe-area-inset-right,0px))', transform: 'none' });
    hintEl.classList.add('hide');
  } else {
    VW = 256;
    cw = W; ch = Math.round(VH * W / VW);
    Object.assign(cv.style, { width: cw + 'px', height: ch + 'px', left: '0px', top: 'env(safe-area-inset-top,0px)' });
    pad.classList.add('portrait'); pad.style.top = `calc(env(safe-area-inset-top,0px) + ${ch}px)`;
    const padH = H - ch;
    const dp = clamp(Math.min(W * 0.44, padH * 0.62), 110, 220);
    pad.style.setProperty('--dp', dp + 'px'); pad.style.setProperty('--ab', dp * 1.02 + 'px');
    Object.assign(topBar.style, { top: `calc(env(safe-area-inset-top,0px) + ${ch + 10}px)`, right: 'calc(10px + env(safe-area-inset-right,0px))', left: 'auto', transform: 'none' });
    hintEl.classList.toggle('hide', padH < 330 || !HAS_TOUCH);
    hintEl.style.top = '62px';
  }
  pad.querySelectorAll('.cluster').forEach(c => c.classList.toggle('hide', !HAS_TOUCH));
  if (cv.width !== VW) { cv.width = VW; cv.height = VH; }
  if (area && G.state === 'play') G.cam.x = clamp(G.cam.x, area.w * 16 < VW ? (area.w * 16 - VW) / 2 : 0, Math.max(0, area.w * 16 - VW));
}

// ---------- touch pad ----------
const ptrs = new Map();
const padBtns = [...document.querySelectorAll('[data-k]')];
function updTouch() {
  const t = {};
  for (const p of ptrs.values()) {
    const el = document.elementFromPoint(p.x, p.y);
    const b = el && el.closest ? el.closest('[data-k]') : null;
    if (b) t[b.dataset.k] = 1;
  }
  input.touch = t;
  for (const el of padBtns) el.classList.toggle('on', !!t[el.dataset.k]);
}
pad.addEventListener('pointerdown', e => {
  if (!e.target.closest('[data-k]')) return;
  e.preventDefault();
  try { e.target.releasePointerCapture(e.pointerId); } catch (err) { }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  updTouch();
  if (G.state !== 'play' || G.paused) G.tap = G.tap || { x: -99, y: -99, pad: true };
});
window.addEventListener('pointermove', e => { if (ptrs.has(e.pointerId)) { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); updTouch(); } }, { passive: true });
const ptrEnd = e => { if (ptrs.delete(e.pointerId)) updTouch(); };
window.addEventListener('pointerup', ptrEnd); window.addEventListener('pointercancel', ptrEnd);
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  G.tap = { x: (e.clientX - r.left) * VW / r.width, y: (e.clientY - r.top) * VH / r.height };
  if (G.state === 'play' && !G.paused && !HAS_TOUCH) G.tap = null;
});
window.addEventListener('pointerdown', () => { SND.init(); if (G.state === 'title' && !MUSIC.cur && SND.ctx) MUSIC.play('title'); }, { capture: true });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault());

// ---------- keyboard ----------
window.addEventListener('keydown', e => {
  SND.init();
  if (G.state === 'title' && !MUSIC.cur && SND.ctx) MUSIC.play('title');
  const k = KEYMAP[e.code];
  if (k) { input.keys[k] = 1; e.preventDefault(); }
  if (e.code === 'KeyP' || e.code === 'Escape') { if (G.paused) unpause(); else pause(); }
  if (e.code === 'KeyM') toggleMute();
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) input.keys[k] = 0; });
window.addEventListener('blur', () => { input.keys = {}; ptrs.clear(); updTouch(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); if (SND.ctx) SND.ctx.suspend(); } else if (SND.ctx) SND.ctx.resume(); });

// ---------- top buttons ----------
const SND_ON = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>';
const SND_OFF = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/>';
function toggleMute() { SND.init(); SND.setMuted(!SND.muted); document.getElementById('icoSnd').innerHTML = SND.muted ? SND_OFF : SND_ON; }
document.getElementById('icoSnd').innerHTML = SND.muted ? SND_OFF : SND_ON;
document.getElementById('bMute').addEventListener('click', e => { e.stopPropagation(); toggleMute(); });
document.getElementById('bPause').addEventListener('click', e => { e.stopPropagation(); if (G.paused) unpause(); else pause(); });
const bFull = document.getElementById('bFull');
const fsEl = document.documentElement;
if (!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen) || !document.fullscreenEnabled && !document.webkitFullscreenEnabled) bFull.classList.add('hide');
bFull.addEventListener('click', async e => {
  e.stopPropagation();
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    await (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl);
    try { await screen.orientation.lock('landscape'); } catch (err) { }
  } catch (err) { }
});

// ---------- boot ----------
initArt();
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 120));
layout();
G.sel = Math.min(G.unlocked - 1, LEVELS.length - 1);
let last = performance.now(), acc = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = now - last; last = now;
  if (dt > 100) dt = 100;
  acc += dt;
  const step = 1000 / 60;
  let n = 0;
  while (acc >= step && n < 5) { tick(); acc -= step; n++; }
  if (n === 5) acc = 0;
  render();
}
requestAnimationFrame(loop);
window.__SB = { G, P, input, get area() { return area; }, LEVELS, beginPlay, newGame, tick, render };
})();
</script>
</body>
</html>
