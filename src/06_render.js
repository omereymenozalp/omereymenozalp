
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
    case T.GROUND: { const up = tileAt(A, tx, ty - 1); return up === T.GROUND || up === T.ICE ? TS.gfill : TS.gtop; }
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
    case T.ICE: return TS.ice;
    case T.QSAND: return tileAt(A, tx, ty - 1) === T.QSAND ? TS.qsand[(G.frame >> 4) % 4] : TS.qsandTop[(G.frame >> 4) % 4];
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
  if (P.state === 'rescue') { drawRescue(S); return; }
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
  else if (area && area.water && !P.onGround && P.state === 'play') key = P.swimT > 8 ? 'jump' : ['w1', 'w2', 'w3', 'w2'][Math.floor(P.anim) % 4];
  else if (!P.onGround && P.state !== 'axe' && P.state !== 'meet') key = 'jump';
  else if (P.skid) key = 'skid';
  else if (Math.abs(P.vx) > 0.1 || P.state === 'walk' || P.state === 'walkP') key = ['w1', 'w2', 'w3', 'w2'][Math.floor(P.anim) % 4];
  else key = 'stand';
  if (big && P.throwT > 0 && key !== 'duck') key = 'throw';
  const pair = S[(big ? 'b_' : 's_') + key] || S[(big ? 'b_' : 's_') + 'stand'];
  drawSquash(pair[P.dir > 0 ? 0 : 1], P.x - 2, big ? bottom - 31 : bottom - 16, P.state === 'play' ? P.sq || 0 : 0);
}
// KOLAY pit rescue: the hero floats inside a wobbling soap bubble
function drawRescue(S) {
  const big = P.size > 0, key = big ? 'rbubbleB' : 'rbubbleS';
  ART[key] = ART[key] || (big ? makeRescueBubble(30, 40) : makeRescueBubble(26, 26));
  const img = ART[key], cx = P.x + P.w / 2, cy = P.y + P.h / 2 + (big ? 0 : -1), wob = Math.round(Math.sin(G.frame * 0.25));
  D(S[big ? 'b_jump' : 's_jump'][P.dir > 0 ? 0 : 1], P.x - 2, P.y + P.h - (big ? 31 : 16) + Math.round(Math.sin(G.frame * 0.12)));
  ctx.drawImage(img, Math.round(cx - img.width / 2) - wob, Math.round(cy - img.height / 2) + wob, img.width + wob * 2, img.height - wob * 2);
}
// squash (s > 0) / stretch (s < 0) around the sprite's bottom centre; render-only
function drawSquash(img, x, y, s) {
  if (Math.abs(s) < 0.12) return D(img, x, y);
  const w = img.width, h = img.height, sw = Math.round(w * (1 + 0.18 * s)), sh = Math.round(h * (1 - 0.16 * s));
  ctx.drawImage(img, Math.round(x + (w - sw) / 2), Math.round(y + h - sh), sw, sh);
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
    case 'penguin': {
      const fl = e.vx < 0 ? 0 : 1, y = e.y + e.h - 16;
      if (e.dying) D(ART.penguin.dead, e.x - 1, e.y - 2);
      else D(e.state === 'slide' ? ART.penguin.slide[fl] : ART.penguin.walk[(f >> 3) % 2][fl], e.x - 1, y);
      break;
    }
    case 'scorpion':
      if (e.dying) D(ART.scorpion.dead, e.x - 1, e.y - 4);
      else D(ART.scorpion.walk[e.hop ? 0 : (f >> 3) % 2][e.vx < 0 ? 0 : 1], e.x - 1, e.y + e.h - 16);
      break;
    case 'tumble':
      if (e.dying) D(ART.tumble.dead, e.x - 1, e.y - 1);
      else D(ART.tumble.roll[((Math.floor(-e.x / 5) % 4) + 4) % 4], e.x - 1, e.y - 1);
      break;
    case 'icicle': D(ART.icicle, e.x - 4 + (e.st === 'shake' ? ((G.frame >> 1) % 2 ? 1 : -1) : 0), e.y); break;
    case 'sinkplat': D(ART.sandslab, e.x, e.y); break;
    case 'puffer': {
      const fl = (e.inf > 0.5 ? P.x + P.w / 2 > e.cx : e.vx > 0) ? 1 : 0;
      if (e.dying) D(ART.puffer.dead, e.x - 2, e.y - 2);
      else if (e.inf > 0.7) D(ART.puffer.big[fl], e.cx - 12, e.cy - 12);
      else if (e.inf > 0.1) { const s = Math.round(16 + e.inf * 8); ctx.drawImage(ART.puffer.swim[0][fl], Math.round(e.cx - s / 2), Math.round(e.cy - s / 2), s, s); }
      else D(ART.puffer.swim[(f >> 3) % 2][fl], e.cx - 8, e.cy - 8);
      break;
    }
    case 'jelly': D(e.dying ? ART.jelly.dead : ART.jelly.fr[e.vy < -0.35 ? 1 : 0], e.x - 2, e.y - 1); break;
    case 'fish': { const F = ART.fish[e.kind]; D(e.dying ? F.dead : F.swim[(f >> 3) % 2][e.vx < 0 ? 0 : 1], e.x - 1, e.y - 1); break; }
    case 'bigstar': { // gentle bob; the shimmer sweeps across every ~2 s
      const y = e.y - 4 + Math.round(Math.sin(G.frame / 14 + e.idx * 2) * 2), ph = (G.frame + e.idx * 37) % 120;
      D(e.ghost ? ART.bigStar.ghost : ART.bigStar.fr[ph < 12 ? ph >> 2 : 3], e.x - 4, y);
      break;
    }
  }
}
function drawKelp(d, set) {
  for (let i = 0; i < d.n; i++) {
    const sx = Math.round(d.x + Math.sin(G.frame * 0.035 + d.ph + i * 0.5) * i * 0.55), sy = d.y - (i + 1) * 6;
    ctx.fillStyle = '#14502a'; ctx.fillRect(sx - 1, sy, 4, 7);
    ctx.fillStyle = i % 3 ? '#2a9a4a' : '#3cb85a'; ctx.fillRect(sx, sy, 2, 7);
    if (i > 0) D(i % 2 ? set.kelpL : set.kelpR, i % 2 ? sx - 6 : sx + 1, sy - 1);
  }
}
// underwater: light rays from the surface, a shimmering surface line and drifting bubbles (all frame-driven)
function drawSea(camx) {
  for (let i = 0; i < 5; i++) {
    const span = VW + 160, bx = ((i * 113 + 20 - camx * 0.25) % span + span) % span - 80;
    const sw = Math.sin(G.frame * 0.012 + i * 1.7) * 12, w0 = 10 + (i % 2) * 8;
    ctx.fillStyle = 'rgba(220,250,255,' + (0.055 + 0.025 * Math.sin(G.frame * 0.02 + i * 2)).toFixed(3) + ')';
    for (let y = 0; y < VH; y += 2) { const k = y / VH; ctx.fillRect(Math.round(bx + (44 + sw) * k), y, Math.round(w0 + 26 * k), 2); }
  }
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  for (let x = 0; x < VW; x += 4) ctx.fillRect(x, 2 + Math.round(Math.sin((x + camx) * 0.07 + G.frame * 0.05) * 1.5), 4, 1);
  for (let i = 0; i < 22; i++) {
    const sp = 0.25 + hash(i, 3) * 0.45, y = VH + 10 - (hash(i, 4) * 270 + G.frame * sp) % 270;
    const x = Math.round(((hash(i, 1) * (VW + 20) - camx * 0.6 + Math.sin(G.frame * 0.03 + i) * 4) % (VW + 20) + VW + 20) % (VW + 20) - 10), yy = Math.round(y);
    ctx.fillStyle = 'rgba(230,250,255,.7)';
    if (hash(i, 5) < 0.3) { ctx.fillRect(x - 1, yy - 2, 3, 1); ctx.fillRect(x - 1, yy + 2, 3, 1); ctx.fillRect(x - 2, yy - 1, 1, 3); ctx.fillRect(x + 2, yy - 1, 1, 3); ctx.fillRect(x - 1, yy - 1, 1, 1); }
    else ctx.fillRect(x, yy, hash(i, 6) < 0.5 ? 2 : 1, hash(i, 6) < 0.5 ? 2 : 1);
  }
}
// falling snow / drifting sand in front of the ice & desert worlds (stateless, frame-driven)
function drawWeather(theme, camx) {
  if (theme === 'ice') {
    for (let i = 0; i < 48; i++) {
      const near = hash(i, 5) < 0.3, sp = near ? 0.7 + hash(i, 3) * 0.3 : 0.3 + hash(i, 3) * 0.25;
      const y = (hash(i, 4) * 260 + G.frame * sp) % 260 - 10;
      const x = ((hash(i, 1) * (VW + 20) - camx * (near ? 0.9 : 0.5) + Math.sin(G.frame * 0.02 + i) * 6) % (VW + 20) + VW + 20) % (VW + 20) - 10;
      ctx.fillStyle = near ? '#ffffff' : 'rgba(232,244,255,.75)';
      ctx.fillRect(Math.round(x), Math.round(y), near ? 2 : 1, near ? 2 : 1);
    }
  } else if (theme === 'desert') {
    ctx.fillStyle = 'rgba(255,236,190,.10)';
    for (let k = 0; k < 3; k++) { const y = 118 + k * 9 + Math.round(Math.sin(G.frame * 0.03 + k * 2) * 2); ctx.fillRect(0, y, VW, 2); }
    for (let i = 0; i < 26; i++) {
      const sp = 1 + hash(i, 3) * 1.6;
      const x = ((hash(i, 1) * (VW + 20) - G.frame * sp - camx * 0.8) % (VW + 20) + VW + 20) % (VW + 20) - 10;
      const y = 110 + hash(i, 2) * 125 + Math.sin(G.frame * 0.05 + i) * 3;
      ctx.fillStyle = hash(i, 6) < 0.5 ? 'rgba(255,232,170,.8)' : 'rgba(216,160,90,.7)';
      ctx.fillRect(Math.round(x), Math.round(y), hash(i, 7) < 0.4 ? 2 : 1, 1);
    }
  }
}
function drawDecor(A, camx) {
  const set = DECOR[A.theme];
  for (const d of A.decor) {
    let img;
    if (d.k === 'kelp') { if (d.x > camx - 40 && d.x < camx + VW + 40) drawKelp(d, set); continue; }
    if (d.k === 'torch') img = ART.torch[(G.frame >> 3) % 3];
    else img = set[d.k];
    if (!img) continue;
    if (d.x + img.width < camx - 8 || d.x > camx + VW + 8) continue;
    D(img, d.x, d.y - img.height + (d.k === 'arrow' ? Math.round(Math.sin(G.frame / 8) * 2) : 0));
  }
  if (A.castle) D(ART.castle, A.castle.x * 16, 13 * 16 - 80);
  if (A.flag) {
    const fx = A.flag.x * 16;
    D(ART.pole, fx + 4, 2 * 16);
    ART.flagL = ART.flagL || ART.flag.map(flipH);
    D(ART.flagL[(G.frame >> 3) % 3], fx + 6 - 18, G.flagY || 3 * 16 + 2);
  }
  if (G.areaIdx === 0 && G.level.cps) { for (const c of G.level.cps) drawCpFlag(c.x * 16 + 6, c.y, camx, c.x <= (G.cpx || 0)); } // KOLAY: every checkpoint
  else if (G.areaIdx === 0 && G.level.checkpoint) drawCpFlag(G.level.checkpoint * 16 + 6, G.level.cpY, camx, G.cp);
}
function drawCpFlag(x, y, camx, on) {
  if (x > camx - 20 && x < camx + VW + 20) {
    ctx.fillStyle = K; ctx.fillRect(x - 1, y - 30, 4, 30);
    ctx.fillStyle = '#d8e0d8'; ctx.fillRect(x, y - 29, 2, 29);
    const fy = on ? y - 29 : y - 12;
    ctx.fillStyle = K; ctx.fillRect(x + 2, fy - 1, 12, 9);
    ctx.fillStyle = on ? '#2bb3a0' : '#8a8698'; ctx.fillRect(x + 2, fy, 11, 7);
    ctx.fillStyle = on ? '#ffd84a' : '#c4c0d4'; ctx.fillRect(x + 6, fy + 2, 3, 3);
  }
}
function drawParts(front) {
  for (const p of G.parts) {
    switch (p.k) {
      case 'text': drawText(p.text, p.x, p.y, p.col, { shadow: K }); break;
      case 'coinpop': D(ART.coin[(p.t >> 2) % 4], p.x, p.y); break;
      case 'debris': { // tumbles in quarter turns so it stays pixel-crisp
        const q = ((p.t >> 2) * (p.spin || 1)) & 3;
        if (!q) { D(DECOR[area.theme].debris, p.x, p.y); break; }
        ctx.save(); ctx.translate(Math.round(p.x) + 4, Math.round(p.y) + 4); ctx.rotate(q * Math.PI / 2);
        ctx.drawImage(DECOR[area.theme].debris, -4, -4); ctx.restore(); break;
      }
      case 'star': {
        const x = Math.round(p.x), y = Math.round(p.y);
        ctx.fillStyle = p.col;
        if (p.t < 9) { ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } else ctx.fillRect(x, y, 1, 1);
        break;
      }
      case 'twinkle': { // 4-point sparkle that pops then shrinks
        const n = p.big ? [2, 4, 5, 4, 3, 2, 2, 1, 1, 1, 0][p.t] : [1, 2, 3, 3, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0][p.t];
        if (!n) break;
        const x = Math.round(p.x), y = Math.round(p.y);
        ctx.fillStyle = p.t < 3 ? '#ffffff' : '#fff4a0';
        ctx.fillRect(x - n, y, n * 2 + 1, 1); ctx.fillRect(x, y - n, 1, n * 2 + 1);
        if (n > 2) ctx.fillRect(x - 1, y - 1, 3, 3);
        break;
      }
      case 'dust': ctx.fillStyle = 'rgba(255,244,224,' + (1 - p.t / 16) + ')'; ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 3), 3, 3); break;
      case 'bubble': {
        const x = Math.round(p.x), y = Math.round(p.y);
        ctx.fillStyle = 'rgba(235,252,255,.85)';
        if (p.r > 1) { ctx.fillRect(x - 1, y - 2, 3, 1); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x - 2, y - 1, 1, 3); ctx.fillRect(x + 2, y - 1, 1, 3); ctx.fillRect(x - 1, y - 1, 1, 1); }
        else { ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1); }
        break;
      }
      case 'spark': case 'fw': ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.k === 'fw' ? 2 : 1 + (p.t < 8), p.k === 'fw' ? 2 : 1 + (p.t < 8)); break;
    }
  }
}
function drawHUD() {
  const sh = K;
  const o = { shadow: sh };
  drawText('BIYIK', 8, 5, '#fff4e0', o);
  if (isEasy()) easyBadge(41, 4);
  drawText(String(G.score).padStart(6, '0'), 8, 15, '#fff4e0', o);
  const cx = Math.round(VW * 0.2) + 10;
  ctx.drawImage(ART.heart, cx - 1, 5);
  drawText('×' + (G.ta ? '∞' : G.lives), cx + 8, 5, '#fff4e0', o);
  ctx.drawImage(ART.mcoin, cx, 15);
  drawText('×' + String(G.coins).padStart(2, '0'), cx + 8, 15, '#ffd84a', o);
  drawStarSlots();
  const wx = Math.round(VW * (G.ta ? 0.6 : 0.7)) - 6; // the stopwatch is wider than the countdown
  drawText('DÜNYA', wx, 5, '#fff4e0', o);
  drawText(G.level ? G.level.def.id : '1-1', wx + 6, 15, '#fff4e0', o);
  if (G.ta) { // time attack: a precise stopwatch replaces the countdown
    drawText('SÜRE', VW - 8, 5, '#6af0d8', { shadow: sh, align: 'right' });
    drawText(fmtTime(G.ta.t), VW - 8, 15, G.timeStop && (G.frame >> 3) % 2 ? '#ffd84a' : '#fff4e0', { shadow: sh, align: 'right' });
    return;
  }
  drawText('SÜRE', VW - 8, 5, '#fff4e0', { shadow: sh, align: 'right' });
  drawText(String(Math.max(0, G.time)).padStart(3, '0'), VW - 8, 15, G.time <= 100 && (G.frame >> 4) % 2 ? '#ff6a5a' : '#fff4e0', { shadow: sh, align: 'right' });
}
// tiny green "K" tag for KOLAY (HUD, beside the name)
function easyBadge(x, y) {
  ctx.fillStyle = K; ctx.fillRect(x, y, 9, 9);
  ctx.fillStyle = '#6af08a'; ctx.fillRect(x + 1, y + 1, 7, 7);
  drawText('K', x + 2, y + 1, '#1d4a2a');
}
// the level's 3 BÜYÜK YILDIZ slots: a third HUD row under the score (the top centre belongs to the DOM buttons in landscape)
function drawStarSlots() {
  if (!G.level) return;
  const saved = starsSaved(G.level.def.id), have = saved | G.bigRun, x0 = 8;
  for (let i = 0; i < 3; i++) {
    const on = (have >> i) & 1, fresh = G.bigI === i && G.frame - G.bigT < 50 && ((G.bigRun >> i) & 1);
    const y = 25 - (fresh ? Math.round(Math.sin((G.frame - G.bigT) / 50 * Math.PI) * 4) : 0);
    D(on ? ART.bigStar.icon : ART.bigStar.iconOff, x0 + i * 10, y);
    if (fresh && (G.frame >> 2) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + i * 10 + 3, y - 2, 1, 2); ctx.fillRect(x0 + i * 10 + 3, y + 7, 1, 2); }
  }
}
// level clear: which big stars were found in this run (gold), saved before (ghost) or still missing (empty)
function drawStarTally() {
  const T0 = G.starTally, k = G.frame - T0.t;
  if (k < 20) return;
  const w = 104, h = 50, x = Math.round((VW - w) / 2), y = G.msg ? 98 : 40; // clear of the top buttons in landscape
  panel(x, y, w, h);
  drawText('BÜYÜK YILDIZ', VW / 2, y + 4, '#ffd84a', { align: 'center' });
  for (let i = 0; i < 3; i++) {
    const got = (T0.got >> i) & 1, old = (T0.old >> i) & 1, d = k - 20 - i * 10;
    const sx = x + 14 + i * 26, sy = y + 14 - (got && d >= 0 && d < 12 ? Math.round(Math.sin(d / 12 * Math.PI) * 5) : 0);
    if (got && d >= 0) D(ART.bigStar.fr[d < 12 ? d >> 2 : 3], sx, sy);
    else { ctx.globalAlpha = old ? 1 : 0.35; D(ART.bigStar.ghost, sx, sy); ctx.globalAlpha = 1; }
    if (got && !old && d >= 12 && (G.frame >> 4) % 2) drawText('YENİ', sx + 12, y + 41, '#6af0d8', { align: 'center', shadow: K });
  }
}
function renderWorld() {
  const A = area;
  // round the camera the same way as the hero so he never jitters against the screen
  let camx = Math.round(G.cam.x);
  if (G.state === 'play') camx = clamp(Math.round(P.x) - Math.round(P.x - G.cam.x), Math.floor(G.cam.x), Math.ceil(G.cam.x));
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
  if (A.water) drawSea(camx);
  drawWeather(A.theme, camx);
  drawHUD();
  if (G.starTally) drawStarTally();
  if (G.msg) drawMessage();
  if (G.fade > 0) { ctx.fillStyle = 'rgba(0,0,0,' + (G.fade / 14) + ')'; ctx.fillRect(0, 0, VW, VH); }
  if (G.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (G.flash * 0.07) + ')'; ctx.fillRect(0, 0, VW, VH); }
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
const LEVEL_TINT = { over: ['#5ec948', '#2a7a2a'], cave: ['#5a78e8', '#23264a'], sky: ['#ffc08a', '#e8708a'], ice: ['#a8dcf8', '#2a4a8a'], desert: ['#f0c060', '#a8541c'], castle: ['#e4372e', '#3a1620'], sea: ['#5ad4f0', '#0c3a80'] };
const LEVEL_THEME = ['over', 'cave', 'sky', 'ice', 'desert', 'castle', 'sea'];
// one row of cards on wide screens, otherwise a grid of two rows (4 + 3 for seven levels, each row centred)
function titleCards() {
  const n = LEVELS.length, gap = 8;
  if (VW >= 380) {
    const w = Math.min(60, Math.floor((VW - 24 - (n - 1) * gap) / n)), x0 = Math.round((VW - (n * w + (n - 1) * gap)) / 2);
    return LEVELS.map((L, i) => ({ x: x0 + i * (w + gap), y: 108, w, h: 40 }));
  }
  const cols = Math.ceil(n / 2), h = 26, w = Math.min(72, Math.floor((VW - 24 - (cols - 1) * gap) / cols));
  return LEVELS.map((L, i) => {
    const row = Math.floor(i / cols), inRow = row ? n - cols : cols, x0 = Math.round((VW - (inRow * w + (inRow - 1) * gap)) / 2);
    return { x: x0 + (i % cols) * (w + gap), y: 106 + row * (h + 6), w, h };
  });
}
// NORMAL | ZAMANA KARŞI mode switch between the logo and the cards (tap a side, or ▼ / B on the pad)
// KOLAY | NORMAL difficulty switch sits to its left on the same row (tap a side, or B / X on the pad / keyboard)
const TOGGLE_ROW = { dw: 84, gap: 8, mw: 144 };
function togglesX() { const R = TOGGLE_ROW; return Math.round((VW - (R.dw + R.gap + R.mw)) / 2); }
function modeToggle() { const w = TOGGLE_ROW.mw, split = 56; return { x: togglesX() + TOGGLE_ROW.dw + TOGGLE_ROW.gap, y: VW >= 380 ? 91 : 87, w, h: 13, split }; }
function diffToggle() { const w = TOGGLE_ROW.dw; return { x: togglesX(), y: modeToggle().y, w, h: 13, split: w / 2 }; }
function toggleDiff(d) {
  G.diff = d === undefined ? (G.diff === 'easy' ? 'normal' : 'easy') : d; store.set('diff', G.diff);
  SND.init(); SND.play('select');
}
function toggleMode(ta) {
  G.taMode = ta === undefined ? !G.taMode : ta; store.set('tamode', G.taMode);
  SND.init(); SND.play('select');
}
function cardTime(i) { const t = taBestOf(i); return t ? fmtTime(t).replace(/^0/, '') : '-:--.--'; }
function drawPadlock(lx, ly) {
  ctx.fillStyle = '#8a8698'; ctx.fillRect(lx + 1, ly - 4, 6, 2); ctx.fillRect(lx + 1, ly - 4, 2, 5); ctx.fillRect(lx + 5, ly - 4, 2, 5); ctx.fillRect(lx, ly, 8, 7);
  ctx.fillStyle = '#3a3648'; ctx.fillRect(lx + 3, ly + 2, 2, 3);
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
  const cards = titleCards(), grid = cards[cards.length - 1].y > cards[0].y, TA = G.taMode;
  const ty = grid ? [0, 172, 185, 222] : [0, 156, 170, 184]; // (mode switch), name, prompt, best
  // hero running, chestnut chasing
  const fr = ['s_w1', 's_w2', 's_w3', 's_w2'][(G.frame >> 3) % 4];
  const hx = Math.round(grid ? VW * 0.76 : VW / 2 + 78); // keep the runners clear of the centred texts
  D(ART.hero[fr.replace('s_', 'b_')][0], hx, 208 - 31);
  D(ART.kestane.walk[(G.frame >> 3) % 2], hx - 44 + Math.sin(G.frame / 30) * 6, 208 - 16);
  D(ART.beetle.walk[(G.frame >> 3) % 2][1], hx - 70 + Math.sin(G.frame / 24) * 4, 208 - 16);
  if (grid) D(ART.bee.fly[(G.frame >> 2) % 2][1], hx + 22, 160 + Math.sin(G.frame / 20) * 4);
  else D(ART.bee.fly[(G.frame >> 2) % 2][1], hx + 28, 158 + Math.sin(G.frame / 20) * 6);
  // logo
  const bob = Math.round(Math.sin(G.frame / 25) * 2) - (grid ? 5 : 0);
  drawText('SÜPER', VW / 2, 22 + bob, '#ffd84a', { scale: 2, align: 'center', outline: K });
  drawText('BIYIK', VW / 2 + 2, 48 + bob, K, { scale: 5, align: 'center' });
  drawText('BIYIK', VW / 2, 46 + bob, '#e4572e', { scale: 5, align: 'center', outline: K });
  // big stars found over all levels, top-left corner
  const nStars = LEVELS.reduce((a, L) => a + starCount(starsSaved(L.id)), 0);
  D(ART.bigStar.icon, 7, 7);
  drawText(nStars + '/' + LEVELS.length * 3, 17, 7, nStars === LEVELS.length * 3 ? '#ffd84a' : '#fff4e0', { shadow: K });
  // mode switch
  const mt = modeToggle();
  ctx.fillStyle = K; ctx.fillRect(mt.x - 2, mt.y - 2, mt.w + 4, mt.h + 4);
  ctx.fillStyle = '#fff4e0'; ctx.fillRect(mt.x - 1, mt.y - 1, mt.w + 2, mt.h + 2);
  for (const [on, x, w, label, col] of [[!TA, mt.x, mt.split, 'NORMAL', '#ffd84a'], [TA, mt.x + mt.split, mt.w - mt.split, 'ZAMANA KARŞI', '#6af0d8']]) {
    ctx.fillStyle = on ? col : '#3a2e5a'; ctx.fillRect(x, mt.y, w, mt.h);
    ctx.fillStyle = on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'; ctx.fillRect(x, mt.y, w, 2);
    drawText(label, x + w / 2, mt.y + 4, on ? K : '#a89cc0', { align: 'center' });
  }
  ctx.fillStyle = K; ctx.fillRect(mt.x + mt.split, mt.y, 1, mt.h);
  // difficulty switch (dimmed in time attack, which always plays by NORMAL rules)
  const dt = diffToggle(), EZ = G.diff === 'easy';
  ctx.fillStyle = K; ctx.fillRect(dt.x - 2, dt.y - 2, dt.w + 4, dt.h + 4);
  ctx.fillStyle = TA ? '#8a8698' : '#fff4e0'; ctx.fillRect(dt.x - 1, dt.y - 1, dt.w + 2, dt.h + 2);
  for (const [on, x, w, label, col] of [[EZ, dt.x, dt.split, 'KOLAY', '#6af08a'], [!EZ, dt.x + dt.split, dt.w - dt.split, 'NORMAL', '#ff9a3a']]) {
    ctx.fillStyle = on ? (TA ? '#7a7290' : col) : '#3a2e5a'; ctx.fillRect(x, dt.y, w, dt.h);
    ctx.fillStyle = on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'; ctx.fillRect(x, dt.y, w, 2);
    drawText(label, x + w / 2, dt.y + 4, on ? K : '#a89cc0', { align: 'center' });
  }
  ctx.fillStyle = K; ctx.fillRect(dt.x + dt.split, dt.y, 1, dt.h);
  // level cards
  const band = grid ? 6 : 12;
  cards.forEach((c, i) => {
    const locked = i >= G.unlocked, sel = i === G.sel, secret = !!LEVELS[i].secret;
    const [c1, c2] = LEVEL_TINT[LEVEL_THEME[i]];
    ctx.fillStyle = K; ctx.fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + 4);
    ctx.fillStyle = sel ? ((G.frame >> 3) % 2 ? '#ffd84a' : '#fff4e0') : secret && !locked ? '#6af0d8' : '#8a8698'; ctx.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
    ctx.fillStyle = locked ? (secret ? '#262236' : '#3a3648') : c2; ctx.fillRect(c.x, c.y, c.w, c.h);
    if (!locked) { ctx.fillStyle = c1; ctx.fillRect(c.x, c.y + c.h - band, c.w, band); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(c.x, c.y + c.h - band, c.w, 2); }
    if (secret && !locked) for (let k = 0; k < 3; k++) { // bubbles rising inside the secret card
      const bx = c.x + 4 + ((hash(k, 9) * (c.w - 8)) | 0), by = c.y + c.h - 2 - ((G.frame * 0.3 + k * 13) % (c.h - 4));
      ctx.fillStyle = 'rgba(230,250,255,.7)'; ctx.fillRect(Math.round(bx), Math.round(by), 2, 2);
    }
    const idCol = locked ? (secret ? '#5a5478' : '#8a8698') : secret ? '#ffd84a' : '#fff4e0';
    // the level's big stars: three 7x7 icons (gold = found)
    const stars = sy => { const m = starsSaved(LEVELS[i].id); for (let k = 0; k < 3; k++) D((m >> k) & 1 ? ART.bigStar.icon : ART.bigStar.iconOff, c.x + c.w / 2 - 13 + k * 10, sy); };
    if (TA && !locked) { // time attack: the best time sits on the card
      const has = taBestOf(i) > 0;
      if (grid) {
        drawText(LEVELS[i].id, c.x + c.w / 2, c.y + 1, idCol, { align: 'center', shadow: K });
        drawText(cardTime(i), c.x + c.w / 2, c.y + 10, has ? '#ffffff' : '#a89cc0', { align: 'center', shadow: K });
        stars(c.y + 18);
      } else {
        drawText(LEVELS[i].id, c.x + c.w / 2, c.y + 4, idCol, { align: 'center', scale: 2, shadow: K });
        stars(c.y + 20);
        drawText(cardTime(i), c.x + c.w / 2, c.y + c.h - 9, has ? K : '#1d16268c', { align: 'center' });
      }
      return;
    }
    if (!locked) stars(grid ? c.y + c.h - 9 : c.y + c.h - 10);
    if (locked && grid) drawPadlock(c.x + c.w / 2 + 14, c.y + 12); // padlock beside the id
    drawText(LEVELS[i].id, c.x + c.w / 2 - (locked && grid ? 6 : 0), c.y + (grid ? (locked ? 5 : 2) : 6), idCol, { align: 'center', scale: 2, shadow: K });
    if (locked && !grid) drawPadlock(c.x + c.w / 2 - 4, c.y + 26);
  });
  const selL = LEVELS[G.sel];
  drawText(selL.secret ? '★ ' + selL.name + ' ★' : selL.name, VW / 2, ty[1], selL.secret ? '#6af0d8' : '#ffd84a', { align: 'center', shadow: K });
  if ((G.frame >> 4) % 2 === 0) drawText(HAS_TOUCH ? 'OYNAMAK İÇİN DOKUN' : 'BAŞLAMAK İÇİN ENTER', VW / 2, ty[2], '#fff4e0', { align: 'center', shadow: K });
  if (TA) { const t = taBestOf(G.sel); drawText('EN İYİ SÜRE ' + (t ? fmtTime(t) : '--:--.--'), VW / 2, ty[3], '#6af0d8', { align: 'center', shadow: K }); }
  else drawText('EN YÜKSEK ' + String(G.best).padStart(6, '0'), VW / 2, ty[3], '#c8ecff', { align: 'center', shadow: K });
  if (!HAS_TOUCH && !grid) drawText('← → HAREKET  Z ZIPLA  X KOŞ/ATEŞ  P DURAKLAT', VW / 2, 228, '#fff4e0', { align: 'center', shadow: K });
}
const TIPS = ["İPUCU: B'YE BASILI TUT, HIZLI KOŞ!", 'İPUCU: GİZLİ BLOKLARI ARA!', 'İPUCU: DÜŞEN PLATFORMDA OYALANMA!', 'İPUCU: BUZDA KAYARSIN, ERKEN FREN YAP!', 'İPUCU: KUM PLATFORMU BATAR, ACELE ET!', 'İPUCU: BALTAYA ULAŞ, KÖPRÜYÜ YIK!', 'İPUCU: SUDA A İLE KULAÇ AT, YUKARI YÜZ!'];
function renderIntro() {
  ctx.fillStyle = '#0b0714'; ctx.fillRect(0, 0, VW, VH);
  const def = LEVELS[G.levelIdx];
  const [c1] = LEVEL_TINT[LEVEL_THEME[G.levelIdx]];
  drawText(def.secret ? 'GİZLİ DÜNYA' : 'DÜNYA ' + def.id, VW / 2, 62, def.secret ? '#ffd84a' : '#fff4e0', { scale: 2, align: 'center' });
  drawText(def.secret ? '★ ' + def.name + ' ★' : def.name, VW / 2, 90, c1, { align: 'center' });
  const set = P.size === 2 ? ART.fire : ART.hero;
  const TS = TILES[LEVEL_THEME[G.levelIdx]];
  ctx.drawImage(TS.gtop, VW / 2 - 34, 138); ctx.drawImage(TS.gtop, VW / 2 - 18, 138);
  D((P.size ? set.b_stand : set.s_stand)[0], VW / 2 - 26, P.size ? 107 : 122);
  if (G.ta) {
    const t = taBestOf(G.levelIdx);
    drawText('ZAMANA KARŞI', VW / 2 - 4, 120, '#6af0d8');
    drawText('EN İYİ ' + (t ? fmtTime(t) : '--:--.--'), VW / 2 - 4, 132, '#fff4e0');
    drawText('ÖLÜRSEN BÖLÜM HEMEN YENİDEN BAŞLAR', VW / 2, 176, '#8a8698', { align: 'center' });
    return;
  }
  drawText('× ' + G.lives, VW / 2 - 4, 127, '#fff4e0');
  drawText(isEasy() ? 'KOLAY' : 'NORMAL', VW / 2, 160, isEasy() ? '#6af08a' : '#ff9a3a', { align: 'center' });
  drawText(TIPS[G.levelIdx], VW / 2, 176, '#8a8698', { align: 'center' });
  drawText(String(G.score).padStart(6, '0'), VW / 2, 200, '#ffd84a', { align: 'center' });
}
// ---------- time attack result ----------
function taButtons() {
  const w = 96, h = 22, gap = 10, y = 178;
  return [{ id: 'retry', label: 'TEKRAR DENE', x: Math.round(VW / 2 - w - gap / 2), y, w, h }, { id: 'menu', label: 'ANA MENÜ', x: Math.round(VW / 2 + gap / 2), y, w, h }];
}
function taAct(id) {
  if (wipeBusy()) return;
  SND.play('select');
  if (id === 'retry') wipeOut(taRestart); else wipeOut(toTitle);
}
function updateTAResult() {
  G.stateT++;
  if (G.stateT === 24 && G.ta.rec) SND.play('record');
  if (G.stateT < 30 || wipeBusy()) return;
  const L = input.left && !G._pl, R = input.right && !G._pr;
  G._pl = input.left; G._pr = input.right;
  if (L || R || padTaps.left || padTaps.right) { G.rsel = 1 - G.rsel; SND.play('select'); }
  if (input.aP || input.startP || padTaps.a) { taAct(G.rsel ? 'menu' : 'retry'); return; }
  if (input.bP || padTaps.b) { taAct('menu'); return; }
  const tp = G.tap;
  if (tp && !tp.pad) for (const [i, b] of taButtons().entries()) if (tp.x >= b.x - 3 && tp.x <= b.x + b.w + 3 && tp.y >= b.y - 3 && tp.y <= b.y + b.h + 3) { G.rsel = i; taAct(b.id); }
}
function renderTAResult() {
  const R = G.ta, def = LEVELS[R.lv], best = taBestOf(R.lv);
  ctx.fillStyle = 'rgba(11,7,20,.62)'; ctx.fillRect(0, 0, VW, VH);
  const w = Math.min(VW - 20, 240), x = Math.round((VW - w) / 2);
  panel(x, 30, w, 178);
  drawText('ZAMANA KARŞI', VW / 2, 38, '#6af0d8', { align: 'center' });
  drawText((def.secret ? '' : def.id + ' ') + def.name, VW / 2, 52, '#ffd84a', { align: 'center' });
  drawText(fmtTime(R.t), VW / 2, 70, '#fff4e0', { scale: 3, align: 'center', outline: K });
  if (R.rec) {
    if ((G.frame >> 3) % 4) drawText('YENİ REKOR!', VW / 2, 104, (G.frame >> 2) % 2 ? '#ffd84a' : '#ff9a3a', { scale: 2, align: 'center', outline: K });
    for (let i = 0; i < 6; i++) { // twinkles around the record text
      const ph = (G.frame + i * 11) % 40, n = ph < 20 ? [0, 1, 2, 3, 2, 1][ph >> 2] || 0 : 0;
      if (!n) continue;
      const sx = Math.round(VW / 2 + (i % 2 ? 1 : -1) * (74 + hash(i, 3) * 14)), sy = Math.round(100 + hash(i, 4) * 20);
      ctx.fillStyle = '#fff4a0'; ctx.fillRect(sx - n, sy, n * 2 + 1, 1); ctx.fillRect(sx, sy - n, 1, n * 2 + 1);
    }
    if (R.prev) drawText('ESKİ REKOR ' + fmtTime(R.prev), VW / 2, 130, '#a89cc0', { align: 'center' });
  } else {
    drawText('REKOR ' + fmtTime(best), VW / 2, 108, '#6af0d8', { align: 'center' });
    drawText('+' + fmtTime(R.t - best).replace(/^00:/, ''), VW / 2, 122, '#ff8a7a', { align: 'center' });
  }
  drawText('DENEME ' + R.tries + '   ALTIN ' + G.coins, VW / 2, 150, '#c8c0d8', { align: 'center' });
  taButtons().forEach((b, i) => {
    const sel = i === G.rsel;
    ctx.fillStyle = K; ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2);
    ctx.fillStyle = sel ? '#ffd84a' : '#5a4a7a'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = sel ? '#e4572e' : '#3a2e5a'; ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, 2);
    drawText(b.label, b.x + b.w / 2, b.y + 8, sel ? '#fff4e0' : '#e8e0f0', { align: 'center', shadow: K });
  });
  drawText(HAS_TOUCH ? 'A TEKRAR   B MENÜ' : 'Z TEKRAR   X MENÜ', VW / 2, 218, '#8a8698', { align: 'center', shadow: K });
}
// ---------- the secret level's ending: credits under the sea ----------
const SEA_CREDITS = ['★ TEBRİKLER! ★', '', 'MERCAN DENİZİ KEŞFEDİLDİ', '', 'SÜPER BIYIK', '', 'KAHRAMAN', 'BIYIK', '', 'PRENSES', 'LALE', '', 'KÖTÜ ADAM', 'EJDER KRAL', '',
  'DENİZ DOSTLARI', 'BALON BALIĞI, DENİZANASI', 'VE RENGARENK BALIKLAR', '', 'GRAFİKLER', 'PİKSEL PİKSEL KODLA ÇİZİLDİ', '', 'MÜZİK VE SESLER', 'WEB AUDIO İLE SENTEZLENDİ', '',
  'OYNADIĞIN İÇİN', 'TEŞEKKÜRLER!', '', '', 'SON'];
const SEA_TOP = 30, SEA_BOT = 162;
const seaScroll = () => (SEA_CREDITS.length - 1) * 14 + (SEA_BOT + 4) - (SEA_TOP + SEA_BOT) / 2; // scroll until "SON" sits mid-window
function updateSeaEnd() {
  G.stateT++;
  if (G.stateT % 10 === 0) bubble(rnd(10, VW - 10), VH - 30);
  updateParts();
  if ((G.stateT > 150 && (input.aP || input.startP || G.tap)) || G.stateT > 30 + seaScroll() / 0.4 + 240) wipeOut(toTitle);
}
function renderSeaEnd() {
  const camx = G.frame * 0.5;
  drawParallax('sea', camx);
  const TS = TILES.sea, off = Math.round(camx) % 16;
  for (let x = -off; x < VW + 16; x += 16) { ctx.drawImage(TS.gtop, x, 208); ctx.drawImage(TS.gfill, x, 224); }
  const DS = DECOR.sea, span = VW + 80;
  for (const [k, x0] of [['coral0', 20], ['fan', 130], ['coral1', 230], ['anemone', 300], ['coral2', 380]]) { const img = DS[k], x = ((x0 - camx) % span + span) % span - 40; D(img, x, 209 - img.height); }
  // creatures crossing the band below the credits
  for (let i = 0; i < 3; i++) { const x = ((VW + 40) - (G.frame * (0.5 + i * 0.15) + i * 110) % (VW + 80)), y = 172 + i * 11 + Math.sin(G.frame / 20 + i) * 3; D(ART.fish[i % 2].swim[(G.frame >> 3) % 2][0], x, y); }
  D(ART.jelly.fr[(G.frame >> 5) % 2], VW - 30, 40 + Math.sin(G.frame / 40) * 10);
  D(ART.puffer.swim[(G.frame >> 3) % 2][0], VW - 56, 184 + Math.sin(G.frame / 30) * 4);
  // the hero (and the princess) swimming
  const set = P.size === 2 ? ART.fire : ART.hero, hy = 188 + Math.round(Math.sin(G.frame / 24) * 3);
  D(set.b_jump[0], 30, hy - 22);
  D(ART.princess, 50, hy - 20 + Math.round(Math.sin(G.frame / 24 + 1) * 2));
  drawParts();
  drawSea(camx);
  // scrolling credits
  const top = SEA_TOP, bottom = SEA_BOT;
  drawText('MERCAN DENİZİ', VW / 2, 10, '#ffd84a', { scale: 2, align: 'center', outline: K });
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, VW, bottom - top); ctx.clip();
  const y0 = bottom + 4 - clamp((G.stateT - 30) * 0.4, 0, seaScroll());
  SEA_CREDITS.forEach((s, i) => { const y = y0 + i * 14; if (y > top - 10 && y < bottom + 2 && s) drawText(s, VW / 2, y, s === 'SON' || i === 0 ? '#ffd84a' : i % 3 === 0 ? '#c8ecff' : '#fff4e0', { align: 'center', shadow: K }); });
  ctx.restore();
  drawText('SKOR ' + String(G.score).padStart(6, '0'), VW / 2, 228, '#fff4e0', { align: 'center', shadow: K });
  if (G.stateT > 150 && (G.frame >> 4) % 2) drawText('ANA MENÜ İÇİN DOKUN', VW / 2, 214, '#ffd84a', { align: 'center', shadow: K });
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
  if (G.stateT > 150 && (input.aP || input.startP || G.tap)) wipeOut(toTitle);
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
    case 'taresult': renderWorld(); renderTAResult(); break;
    case 'seaend': renderSeaEnd(); break;
  }
  if (G.paused) renderPause();
  if (G.wipe) drawWipe();
}

// ---------- pause menu ----------
// two pages: the main menu and AYARLAR (settings); every row stays >= ~36 CSS px tall when the screen allows it.
// AYARLAR is a 2-column grid (row-major: controls on the left, looks on the right) of two-line cells (name / value), GERİ spans both columns.
const PAUSE_PAGES = [['resume', 'restart', 'sound', 'settings', 'menu'], ['ctrl', 'padsize', 'autorun', 'padalpha', 'vib', 'pixel', 'back']];
function pauseIds() { return PAUSE_PAGES[G.ppage || 0]; }
function pauseItems() {
  const gap = 4, h = clamp(Math.ceil(36 / cssScale), 25, 29), y0 = 50;
  if (G.ppage) {
    const w = Math.min(VW - 24, 248), x = Math.round((VW - w) / 2), cw = (w - gap) / 2;
    return pauseIds().map((id, i) => id === 'back' ? { id, x, y: y0 + Math.ceil(i / 2) * (h + gap), w, h }
      : { id, x: Math.round(x + (i % 2) * (cw + gap)), y: y0 + (i >> 1) * (h + gap), w: Math.round(cw), h, two: true });
  }
  const w = Math.min(VW - 28, 204), x = Math.round((VW - w) / 2);
  return pauseIds().map((id, i) => ({ id, x, y: y0 + i * (h + gap), w, h }));
}
function canRestart() { return !G.seq && !G.timeStop && !G.msg && P.state !== 'flag'; }
const OPT_NAMES = { padSize: { s: 'KÜÇÜK', m: 'ORTA', l: 'BÜYÜK' }, padAlpha: { s: 'AZ', m: 'ORTA', l: 'ÇOK' }, ctrl: { pad: 'TUŞLAR', stick: 'JOYSTICK' } };
function pauseLabel(id) {
  switch (id) {
    case 'resume': return 'DEVAM ET';
    case 'restart': return 'BÖLÜMÜ YENİDEN BAŞLAT';
    case 'sound': return 'SES: ' + (SND.muted ? 'KAPALI' : 'AÇIK');
    case 'settings': return 'AYARLAR';
    case 'menu': return 'ANA MENÜ';
    case 'vib': return 'TİTREŞİM: ' + (!HAPTIC.ok ? 'YOK' : HAPTIC.on ? 'AÇIK' : 'KAPALI');
    case 'padsize': return 'TUŞ BOYUTU: ' + OPT_NAMES.padSize[OPT.padSize];
    case 'padalpha': return 'TUŞ SAYDAMLIĞI: ' + OPT_NAMES.padAlpha[OPT.padAlpha];
    case 'pixel': return 'PİKSEL ÖLÇEĞİ: ' + (pixMode() === 'tam' ? 'TAM' : 'UYDUR');
    case 'ctrl': return 'KONTROL: ' + OPT_NAMES.ctrl[OPT.ctrl];
    case 'autorun': return 'OTOMATİK KOŞU: ' + (OPT.autoRun ? 'AÇIK' : 'KAPALI');
    case 'back': return 'GERİ';
  }
}
function pauseEnabled(id) { return id === 'restart' ? canRestart() : id === 'vib' ? HAPTIC.ok : true; }
function renderPause() {
  ctx.fillStyle = 'rgba(11,7,20,.72)'; ctx.fillRect(0, 0, VW, VH);
  const items = pauseItems(), f = items[items.length - 1]; // the last row spans the full width on both pages
  panel(f.x - 10, 14, f.w + 20, f.y + f.h + 8 - 14);
  drawText(G.ppage ? 'AYARLAR' : 'DURAKLATILDI', VW / 2, 22, '#ffd84a', { scale: 2, align: 'center', outline: K });
  items.forEach((it, i) => {
    const sel = i === G.psel, on = pauseEnabled(it.id), press = sel && G.pflash > 0;
    const y = it.y + (press ? 1 : 0), ty = y + Math.floor((it.h - 7) / 2);
    ctx.fillStyle = K; ctx.fillRect(it.x - 1, y - 1, it.w + 2, it.h + 2);
    ctx.fillStyle = sel ? (press ? '#fff4e0' : '#ffd84a') : '#5a4a7a'; ctx.fillRect(it.x, y, it.w, it.h);
    ctx.fillStyle = sel ? '#e4572e' : '#3a2e5a'; ctx.fillRect(it.x + 1, y + 1, it.w - 2, it.h - 2);
    ctx.fillStyle = sel ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.08)'; ctx.fillRect(it.x + 1, y + 1, it.w - 2, 2);
    if (!press) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(it.x + 1, y + it.h - 3, it.w - 2, 2); }
    const col = !on ? '#6a6488' : sel ? '#fff4e0' : '#e8e0f0';
    if (it.two) { // "NAME: VALUE" split over two lines, the value in gold
      const [k, v] = pauseLabel(it.id).split(': '), t0 = y + Math.floor((it.h - 19) / 2) + 1;
      drawText(k, it.x + it.w / 2, t0, col, { align: 'center', shadow: on ? K : null });
      drawText(v, it.x + it.w / 2, t0 + 10, !on ? '#6a6488' : sel ? '#ffe9a0' : '#ffd84a', { align: 'center', shadow: on ? K : null });
    } else drawText(pauseLabel(it.id), it.x + it.w / 2, ty, col, { align: 'center', shadow: on ? K : null });
    if (sel && (G.frame >> 4) % 2 === 0) drawText('▶', it.x + 4, ty, '#ffd84a', { shadow: K });
    if (it.id === 'restart' && on && G.lives > 1) drawText('-1♥', it.x + it.w - 5, ty, '#ffb0a0', { align: 'right', shadow: K });
    if (it.id === 'settings') drawText('>', it.x + it.w - 8, ty, sel ? '#fff4e0' : '#8a8698', { align: 'right', shadow: K });
  });
  const hint = HAS_TOUCH ? (G.ppage ? '< > SEÇ   A DEĞİŞTİR   B GERİ' : '< > SEÇ   A TAMAM   B DEVAM') : (G.ppage ? 'OKLAR SEÇ   ENTER DEĞİŞTİR   ESC GERİ' : 'OKLAR SEÇ   ENTER TAMAM   ESC DEVAM');
  drawText(hint, VW / 2, VH - 16, '#8a8698', { align: 'center', shadow: K });
}
function movePause(d) { const n = pauseIds().length; G.psel = (G.psel + d + n) % n; SND.play('select'); }
// keyboard ↑/↓: the nearest item in the row above/below (wraps); on the one-column main page this is the same as movePause
function movePauseV(d) {
  const its = pauseItems(), c = its[G.psel], cx = it => it.x + it.w / 2;
  const near = list => list.sort((p, q) => Math.abs(p.y - c.y) - Math.abs(q.y - c.y) || Math.abs(cx(p) - cx(c)) - Math.abs(cx(q) - cx(c)))[0];
  let to = near(its.filter(it => (it.y - c.y) * d > 0));
  if (!to) { const ys = its.map(it => it.y), y = d > 0 ? Math.min(...ys) : Math.max(...ys); to = near(its.filter(it => it.y === y)); }
  G.psel = its.indexOf(to); SND.play('select');
}
function pausePage(pg) { G.ppage = pg; G.psel = pg ? 0 : PAUSE_PAGES[0].indexOf('settings'); SND.play('select'); }
const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
function pauseAct(id) {
  G.pflash = 6;
  switch (id) {
    case 'resume': unpause(); break;
    case 'restart':
      if (!canRestart()) { SND.play('bump'); break; }
      // same cost as losing a life (never below 1, so it can't cause a game over); restarts from the level start, small
      SND.play('select');
      wipeOut(() => { G.paused = false; G.lives = Math.max(1, G.lives - 1); P.size = 0; startLevel(G.levelIdx, true); }, 20, irisCenter());
      break;
    case 'sound': toggleMute(); SND.play('select'); break;
    case 'vib':
      if (!HAPTIC.ok) { SND.play('bump'); break; }
      HAPTIC.set(!HAPTIC.on); SND.play('select'); HAPTIC.buzz(30); break;
    case 'menu': SND.play('select'); wipeOut(() => { G.paused = false; toTitle(); }); break;
    case 'settings': pausePage(1); break;
    case 'back': pausePage(0); break;
    case 'padsize': setOpt('padSize', cycle(['s', 'm', 'l'], OPT.padSize)); SND.play('select'); break;
    case 'padalpha': setOpt('padAlpha', cycle(['s', 'm', 'l'], OPT.padAlpha)); SND.play('select'); break;
    case 'pixel': setOpt('pixel', pixMode() === 'tam' ? 'uydur' : 'tam'); SND.play('select'); break;
    case 'ctrl': setOpt('ctrl', OPT.ctrl === 'pad' ? 'stick' : 'pad'); SND.play('select'); break;
    case 'autorun': setOpt('autoRun', !OPT.autoRun); SND.play('select'); break;
  }
}
// B / X / Esc: back out of AYARLAR first, then resume
function pauseBack() { if (G.ppage) { G.pflash = 6; pausePage(0); } else pauseAct('resume'); }
function updatePause() {
  if (G.pflash > 0) G.pflash--;
  const t = input.touch, m = G._mt || {};
  G._mt = t;
  if (wipeBusy()) return;
  const edge = k => (t[k] && !m[k]) || padTaps[k];
  if (edge('left')) movePause(-1);
  if (edge('right') || edge('down')) movePause(1);
  if (edge('a')) { pauseAct(pauseIds()[G.psel]); return; }
  if (edge('b')) { pauseBack(); return; }
  const tp = G.tap;
  if (tp && !tp.pad) {
    const items = pauseItems();
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (tp.x >= it.x - 2 && tp.x <= it.x + it.w + 2 && tp.y >= it.y - 2 && tp.y <= it.y + it.h + 2) { G.psel = i; pauseAct(it.id); break; }
    }
  }
}

// ---------- screen transitions: pixel iris wipe ----------
// out: iris closes to black, then fn() runs and the iris holds shut until the game state changes, then opens again.
function wipeBusy() { return !!G.wipe && G.wipe.k !== 'in'; }
function irisCenter() {
  if ((G.state === 'play' || G.state === 'dying') && area) return { x: P.x + P.w / 2 - G.cam.x, y: clamp(P.y + P.h / 2, 16, VH - 16) };
  return { x: VW / 2, y: VH / 2 };
}
function wipeOut(fn, dur, c) {
  if (wipeBusy()) return;
  c = c || irisCenter();
  G.wipe = { k: 'out', t: 0, dur: dur || 18, fn, cx: c.x, cy: c.y };
}
function wipeIn() { const c = irisCenter(); G.wipe = { k: 'in', t: 0, dur: 20, cx: c.x, cy: c.y }; }
function updWipe() {
  const w = G.wipe; w.t++;
  if (w.k === 'out' && w.t >= w.dur) { w.k = 'hold'; w.t = 0; const f = w.fn; w.fn = null; if (f) f(); }
  else if (w.k === 'hold' && w.t > 40) wipeIn(); // safety: never stay black
  else if (w.k === 'in' && w.t >= w.dur) G.wipe = null;
}
function drawWipe() {
  const w = G.wipe;
  let f = w.k === 'out' ? 1 - w.t / w.dur : w.k === 'in' ? w.t / w.dur : 0;
  f = clamp(f, 0, 1); f = f * f * (3 - 2 * f);
  const B = 4, cx = Math.round(w.cx / B) * B, cy = w.cy;
  const R = Math.hypot(Math.max(cx, VW - cx), Math.max(cy, VH - cy)) + B, r = R * f;
  ctx.fillStyle = '#0b0714';
  if (r < B) { ctx.fillRect(0, 0, VW, VH); return; }
  for (let y = 0; y < VH; y += B) {
    const dy = y + B / 2 - cy;
    if (Math.abs(dy) >= r) { ctx.fillRect(0, y, VW, B); continue; }
    const hw = Math.round(Math.sqrt(r * r - dy * dy) / B) * B, x0 = cx - hw, x1 = cx + hw;
    if (x0 > 0) ctx.fillRect(0, y, x0, B);
    if (x1 < VW) ctx.fillRect(x1, y, VW - x1, B);
  }
}

// =====================================================================
//  FLOW CONTROL, INPUT WIRING, LAYOUT, LOOP
// =====================================================================
const HAS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function pause() {
  saveBest();
  if (G.state !== 'play' || G.paused || wipeBusy()) return;
  G.paused = true; G.psel = 0; G.ppage = 0; G.pflash = 0; G._mt = input.touch; layout(); G.resumeMusic = MUSIC.name; G.resumeSpeed = MUSIC.speed; MUSIC.stop(); SND.play('pause');
}
function unpause() {
  if (!G.paused || wipeBusy()) return;
  G.paused = false; input._pa = input._pb = input._ps = 1; // a held confirm key must not also jump
  layout();
  if (G.resumeMusic && SONGS[G.resumeMusic] && SONGS[G.resumeMusic].loop) MUSIC.play(G.resumeMusic, null, G.resumeSpeed || 1);
}
function updateTitle() {
  G.stateT++;
  const L = input.left && !G._pl, R = input.right && !G._pr;
  G._pl = input.left; G._pr = input.right;
  if (L) { G.sel = (G.sel + G.unlocked - 1) % G.unlocked; SND.play('select'); }
  if (R) { G.sel = (G.sel + 1) % G.unlocked; SND.play('select'); }
  const Dn = input.down && !G._pd; G._pd = input.down;
  if (Dn || padTaps.down) toggleMode();
  if (input.bP || padTaps.b) toggleDiff();
  let go = input.aP || input.startP;
  const mt = modeToggle(), dt = diffToggle();
  if (G.tap && !G.tap.pad && G.tap.x >= dt.x - 4 && G.tap.x <= dt.x + dt.w + 3 && G.tap.y >= dt.y - 5 && G.tap.y <= dt.y + dt.h + 5) {
    toggleDiff(G.tap.x >= dt.x + dt.split ? 'normal' : 'easy'); G.tap = null;
  }
  if (G.tap && !G.tap.pad && G.tap.x >= mt.x - 4 && G.tap.x <= mt.x + mt.w + 4 && G.tap.y >= mt.y - 5 && G.tap.y <= mt.y + mt.h + 5) {
    toggleMode(G.tap.x >= mt.x + mt.split); G.tap = null;
  }
  if (G.tap && !G.tap.pad) {
    const t = G.tap; let hit = -1;
    titleCards().forEach((c, i) => { if (t.x >= c.x - 4 && t.x <= c.x + c.w + 4 && t.y >= c.y - 4 && t.y <= c.y + c.h + 4) hit = i; });
    if (hit >= 0) { if (hit < G.unlocked) { G.sel = hit; go = true; } else SND.play('bump'); }
    else go = true;
  }
  if (go && G.stateT > 20) { SND.init(); SND.play('select'); const sel = G.sel, ta = G.taMode; wipeOut(() => ta ? startTimeAttack(sel) : newGame(sel)); }
}
function tick() {
  pollInput();
  G.frame++;
  if (G.fade > 0) G.fade--;
  if (G.shake > 0) G.shake--;
  if (G.flash > 0) G.flash--;
  switch (G.state) {
    case 'title': if (wipeBusy()) G.stateT++; else updateTitle(); break;
    case 'intro': if (--G.stateT === 18) wipeOut(null, 16); if (G.stateT <= 0) beginPlay(); break;
    case 'play':
      if (G.paused) { updatePause(); break; }
      if (input.startP) { pause(); break; }
      updatePlay(); updateParts();
      if (G.msg) {
        G.msg.t++;
        if (G.msg.t % 20 === 0) sparkle(P.x + 14, P.y - 4, '#ff6a8a');
        if (G.msg.t > 420 || (G.msg.t > 150 && (input.aP || G.tap))) wipeOut(toEnding);
      }
      break;
    case 'dying': updateDying(); updateParts(); break;
    case 'gameover': if (--G.stateT <= 0 || (G.stateT < 200 && (input.aP || G.tap || input.startP))) wipeOut(toTitle); break;
    case 'ending': updateEnding(); break;
    case 'taresult': updateTAResult(); break;
    case 'seaend': updateSeaEnd(); break;
  }
  if (G.wipe) updWipe();
  G.tap = null;
  for (const k in padTaps) delete padTaps[k];
  if (G.state !== G._lastState) { G._lastState = G.state; layout(); if (G.wipe && G.wipe.k === 'hold') wipeIn(); }
}

// ---------- layout ----------
const app = document.getElementById('app'), pad = document.getElementById('pad'), topBar = document.getElementById('top'), hintEl = document.getElementById('hint');
// player settings from the AYARLAR page; pixel: null = automatic (see layout)
const pick = (v, ok, d) => ok.includes(v) ? v : d;
const OPT = { padSize: pick(store.get('padSize', 'm'), ['s', 'm', 'l'], 'm'), padAlpha: pick(store.get('padAlpha', 'm'), ['s', 'm', 'l'], 'm'), pixel: pick(store.get('pixel', null), ['tam', 'uydur'], null),
  ctrl: pick(store.get('ctrl', 'pad'), ['pad', 'stick'], 'pad'), autoRun: store.get('autoRun', false) === true }; // ctrl: TUŞLAR (D-pad) or JOYSTICK; autoRun: always run speed
function setOpt(k, v) { OPT[k] = v; store.set(k, v); layout(); }
// [landscape, portrait]: landscape buttons float over the game, so they default a bit smaller and see-through
const PAD_MUL = { s: [0.72, 0.8], m: [0.88, 0.92], l: [1.05, 1.1] };
const PAD_ALPHA = { s: [1, 1.15], m: [0.62, 1], l: [0.36, 0.62] };
let cssScale = 1, pixAuto = 'uydur';
function pixMode() { return OPT.pixel || pixAuto; }
// "TAM": the largest scale that maps one game pixel onto a whole number of device pixels
function intScale(s) { const r = window.devicePixelRatio || 1; return Math.max(1, Math.floor(s * r + 1e-6)) / r; }
// default: phones fill the screen (bigger is better); elsewhere whole pixels when that costs < 15% of the size
function autoPix(W, H, s, si) { return HAS_TOUCH && Math.min(W, H) < 600 ? 'uydur' : si >= s * 0.85 ? 'tam' : 'uydur'; }
const snap = v => { const r = window.devicePixelRatio || 1; return Math.round(v * r) / r; };
function padLook(portrait) {
  const a = PAD_ALPHA[OPT.padAlpha][portrait ? 1 : 0], ink = v => `rgba(255,244,224,${(v * a).toFixed(3)})`;
  const vars = {
    '--btn': ink(0.13), '--btn-edge': ink(0.38), '--io': Math.min(1, 0.35 + 0.65 * a).toFixed(3),
    '--a-bg': `rgba(228,87,46,${(0.32 * a).toFixed(3)})`, '--a-edge': `rgba(255,160,120,${Math.min(1, 0.6 * a).toFixed(3)})`,
    '--b-bg': `rgba(255,216,74,${(0.18 * a).toFixed(3)})`, '--b-edge': `rgba(255,216,74,${Math.min(1, 0.5 * a).toFixed(3)})`,
  };
  for (const k in vars) pad.style.setProperty(k, vars[k]);
}
function layout() {
  const W = app.clientWidth, H = app.clientHeight;
  const portrait = H > W * 1.05 && H - Math.round(VH * W / 256) >= 220;
  let cw, ch;
  if (!portrait) {
    VW = clamp(Math.round(VH * W / H / 2) * 2, 256, 432);
    let s = Math.min(H / VH, W / VW);
    const si = intScale(s);
    pixAuto = autoPix(W, H, s, si);
    if (pixMode() === 'tam') { s = si; VW = clamp(Math.floor(W / s / 2) * 2, 256, 432); } // spend spare width on more view
    cw = VW * s; ch = VH * s; cssScale = s;
    Object.assign(cv.style, { width: cw + 'px', height: ch + 'px', left: snap((W - cw) / 2) + 'px', top: snap((H - ch) / 2) + 'px' });
    pad.classList.remove('portrait'); pad.style.top = '0px';
    const dp = Math.max(92, clamp(H * 0.4, 120, 200) * PAD_MUL[OPT.padSize][0]);
    pad.style.setProperty('--dp', dp + 'px'); pad.style.setProperty('--ab', dp * 1.02 + 'px');
    const inPlay = (G.state === 'play' || G.state === 'dying') && !G.paused; // paused: keep the menu title clear
    Object.assign(topBar.style, inPlay ? { top: 'calc(6px + env(safe-area-inset-top,0px))', left: '50%', right: 'auto', transform: 'translateX(-50%)' }
      : { top: 'calc(6px + env(safe-area-inset-top,0px))', left: 'auto', right: 'calc(8px + env(safe-area-inset-right,0px))', transform: 'none' });
    hintEl.classList.add('hide');
  } else {
    VW = 256;
    let s = W / VW;
    const si = intScale(s);
    pixAuto = autoPix(W, H, s, si);
    if (pixMode() === 'tam') { s = si; cw = VW * s; ch = VH * s; } else { cw = W; ch = Math.round(VH * W / VW); }
    cssScale = s;
    Object.assign(cv.style, { width: cw + 'px', height: ch + 'px', left: snap((W - cw) / 2) + 'px', top: 'env(safe-area-inset-top,0px)' });
    pad.classList.add('portrait'); pad.style.top = `calc(env(safe-area-inset-top,0px) + ${ch}px)`;
    const padH = H - ch;
    // both clusters must fit side by side: 14 px margins + a 12 px gap
    const dp = Math.max(92, Math.min(clamp(Math.min(W * 0.44, padH * 0.62), 110, 220) * PAD_MUL[OPT.padSize][1], (W - 40) / 2.02));
    pad.style.setProperty('--dp', dp + 'px'); pad.style.setProperty('--ab', dp * 1.02 + 'px');
    Object.assign(topBar.style, { top: `calc(env(safe-area-inset-top,0px) + ${ch + 10}px)`, right: 'calc(10px + env(safe-area-inset-right,0px))', left: 'auto', transform: 'none' });
    hintEl.classList.toggle('hide', padH < 330 || !HAS_TOUCH);
    hintEl.style.top = '62px';
  }
  padLook(portrait);
  pad.querySelectorAll('.cluster').forEach(c => c.classList.toggle('hide', !HAS_TOUCH));
  layoutStick(W, portrait);
  if (cv.width !== VW) { cv.width = VW; cv.height = VH; }
  if (area && G.state === 'play') G.cam.x = clamp(G.cam.x, area.w * 16 < VW ? (area.w * 16 - VW) / 2 : 0, Math.max(0, area.w * 16 - VW));
}

// ---------- joystick (KONTROL: JOYSTICK) ----------
// During play the D-pad gives way to #stickZone (left ~45% of the screen in landscape, the left part of the pad area in portrait,
// never under the A/B cluster; the top buttons sit above it). A touch there spawns the stick base under the finger:
// |dx| past the dead zone = left/right, |dx| past STICK.run = run (B not needed), a mostly-downward pull = down (duck / pipe).
// Dragging past the rim drags the base along, so reversing direction reacts at once. Menus keep the D-pad.
const STICK = { dead: 0.24, run: 0.7, down: 0.5, downCone: 1.2 };
const stickZone = document.getElementById('stickZone'), stickEl = document.getElementById('stick'), stickKnob = stickEl.querySelector('.knob');
let stick = null, stickR = 60, stickOn = false, stickRest = { x: 0, y: 0 };
function layoutStick(W, portrait) {
  stickOn = HAS_TOUCH && OPT.ctrl === 'stick' && !G.paused && (G.state === 'play' || G.state === 'dying');
  const showPad = HAS_TOUCH && (OPT.ctrl !== 'stick' || G.paused || G.state === 'title');
  pad.querySelector('.cluster.l').classList.toggle('hide', !showPad);
  stickZone.classList.toggle('hide', !stickOn);
  if (!stickOn && stick) { stick = null; updTouch(); }
  const dp = parseFloat(pad.style.getPropertyValue('--dp')) || 140;
  stickR = Math.round(dp * 0.42);
  stickEl.style.setProperty('--r', stickR + 'px');
  if (stickOn) {
    const pr = pad.getBoundingClientRect(), ab = pad.querySelector('.cluster.r').getBoundingClientRect();
    stickZone.style.width = Math.max(0, Math.min(W * (portrait ? 0.5 : 0.45), ab.left - pr.left - 12)) + 'px';
    // where the idle stick waits: same height as the A/B cluster's middle, one radius in from the left edge
    stickRest = { x: Math.round(Math.max(14 + stickR * 1.15, Math.min(ab.left - pr.left - 12, W * 0.45) * 0.42)), y: Math.round(ab.top + ab.height * 0.55 - pr.top) };
  }
  drawStick();
}
function stickInput(t) {
  if (!stick) return;
  const dx = stick.x - stick.bx, dy = stick.y - stick.by, R = stickR;
  if (dy > R * STICK.down && dy > Math.abs(dx) * STICK.downCone) t.down = 1;
  else if (Math.abs(dx) > R * STICK.dead) { t[dx < 0 ? 'left' : 'right'] = 1; if (Math.abs(dx) > R * STICK.run) t.run = 1; }
}
function drawStick() {
  stickEl.classList.toggle('hide', !stickOn);
  if (!stickOn) return;
  const s = stick, bx = s ? s.bx : stickRest.x, by = s ? s.by : stickRest.y;
  stickEl.style.transform = `translate(${bx}px,${by}px)`;
  stickKnob.style.transform = s ? `translate(${s.x - s.bx}px,${s.y - s.by}px)` : '';
  stickEl.classList.toggle('idle', !s); stickEl.classList.toggle('held', !!s); stickEl.classList.toggle('run', !!(s && input.touch.run));
}
function stickMove(x, y) {
  const r = stick.pr, px = x - r.left, py = y - r.top, dx = px - stick.bx, dy = py - stick.by, d = Math.hypot(dx, dy);
  if (d > stickR) { stick.bx += dx * (1 - stickR / d); stick.by += dy * (1 - stickR / d); }
  stick.x = px; stick.y = py;
}

// ---------- touch pad ----------
const ptrs = new Map(), padTaps = {};
const padBtns = [...document.querySelectorAll('[data-k]')];
function updTouch() {
  const t = {};
  for (const p of ptrs.values()) {
    const el = document.elementFromPoint(p.x, p.y);
    const b = el && el.closest ? el.closest('[data-k]') : null;
    if (b) t[b.dataset.k] = 1;
  }
  stickInput(t);
  input.touch = t;
  for (const el of padBtns) el.classList.toggle('on', !!t[el.dataset.k]);
  drawStick();
}
pad.addEventListener('pointerdown', e => {
  if (e.target === stickZone) {
    e.preventDefault();
    try { stickZone.releasePointerCapture(e.pointerId); } catch (err) { }
    if (stick) return; // one stick; extra fingers in the zone do nothing
    const pr = pad.getBoundingClientRect(), x = e.clientX - pr.left, y = e.clientY - pr.top;
    stick = { id: e.pointerId, pr, bx: x, by: y, x, y };
    updTouch();
    return;
  }
  if (!e.target.closest('[data-k]')) return;
  e.preventDefault();
  try { e.target.releasePointerCapture(e.pointerId); } catch (err) { }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  updTouch();
  Object.assign(padTaps, input.touch); // latch: a tap shorter than a frame still counts in menus
  if (G.state !== 'play' || G.paused) G.tap = G.tap || { x: -99, y: -99, pad: true };
});
window.addEventListener('pointermove', e => {
  if (ptrs.has(e.pointerId)) { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); updTouch(); }
  else if (stick && stick.id === e.pointerId) { stickMove(e.clientX, e.clientY); updTouch(); }
}, { passive: true });
const ptrEnd = e => { if (ptrs.delete(e.pointerId)) updTouch(); else if (stick && stick.id === e.pointerId) { stick = null; updTouch(); } };
window.addEventListener('pointerup', ptrEnd); window.addEventListener('pointercancel', ptrEnd);
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  G.tap = { x: (e.clientX - r.left) * VW / r.width, y: (e.clientY - r.top) * VH / r.height };
  if (G.state === 'play' && !G.paused && !HAS_TOUCH) G.tap = null;
});
window.addEventListener('pointerdown', () => { SND.init(); if (G.state === 'title' && !MUSIC.cur && SND.ctx) MUSIC.play('title'); }, { capture: true });
['touchend', 'click'].forEach(t => window.addEventListener(t, () => SND.init(), { capture: true }));
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault());

// ---------- keyboard ----------
window.addEventListener('keydown', e => {
  SND.init();
  if (G.state === 'title' && !MUSIC.cur && SND.ctx) MUSIC.play('title');
  if (G.paused && !wipeBusy() && !e.repeat) { // pause menu: arrows move, Enter/Z/Space confirm, X goes back
    const c = e.code;
    if (c === 'ArrowUp' || c === 'KeyW') { movePauseV(-1); e.preventDefault(); return; }
    if (c === 'ArrowDown' || c === 'KeyS') { movePauseV(1); e.preventDefault(); return; }
    if (c === 'ArrowLeft' || c === 'KeyA') { movePause(-1); e.preventDefault(); return; }
    if (c === 'ArrowRight' || c === 'KeyD') { movePause(1); e.preventDefault(); return; }
    if (c === 'Enter' || c === 'KeyZ' || c === 'Space' || c === 'KeyK') { pauseAct(pauseIds()[G.psel]); e.preventDefault(); return; }
    if (c === 'KeyX' || c === 'KeyJ' || c === 'Backspace') { pauseBack(); e.preventDefault(); return; }
  }
  const k = KEYMAP[e.code];
  if (k) { input.keys[k] = 1; e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'KeyP' || e.code === 'Escape') { if (G.paused && G.ppage && e.code === 'Escape') pauseBack(); else if (G.paused) unpause(); else pause(); }
  if (e.code === 'KeyM') toggleMute();
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) input.keys[k] = 0; });
window.addEventListener('pagehide', saveBest);
window.addEventListener('blur', () => { input.keys = {}; ptrs.clear(); stick = null; updTouch(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveBest(); pause(); if (SND.ctx) SND.ctx.suspend(); } else if (SND.ctx) SND.ctx.resume(); });

// ---------- top buttons ----------
const SND_ON = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>';
const SND_OFF = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4z"/>';
function toggleMute() { SND.init(); SND.setMuted(!SND.muted); document.getElementById('icoSnd').innerHTML = SND.muted ? SND_OFF : SND_ON; }
document.getElementById('icoSnd').innerHTML = SND.muted ? SND_OFF : SND_ON;
// top buttons: react on pointerup so a second finger works while the other hand holds the stick; keep click for keyboard/mouse
function topButton(id, fn) {
  const el = document.getElementById(id); let lastUp = 0;
  el.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') return; e.stopPropagation(); lastUp = performance.now(); el.blur(); fn(); });
  el.addEventListener('click', e => { e.stopPropagation(); el.blur(); if (performance.now() - lastUp > 600) fn(); });
}
topButton('bMute', toggleMute);
topButton('bPause', () => { if (G.paused) unpause(); else pause(); });
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
window.__SB = { G, P, input, get area() { return area; }, LEVELS, beginPlay, newGame, tick, render, pauseItems, HAPTIC, spawnEntity, T, OPT, pixMode, layout, STICK, get stick() { return stick && { ...stick, r: stickR }; } };
Object.assign(window.__SB, { diffToggle, isEasy, EASY, groundRowAt, titleCards, modeToggle, taButtons, startTimeAttack, fmtTime, SWIM, SONGS, MAIN_LEVELS });
window.__SB.stars = { saved: starsSaved, count: starCount, bank: bankStars };
})();
</script>
</body>
</html>
