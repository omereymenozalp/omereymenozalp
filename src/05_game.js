
// =====================================================================
//  ASSET INIT
// =====================================================================
let ART = null;
const TILES = {}, LAYERS = {}, DECOR = {};
function makePodoboo() {
  const p = new Pix(16, 16);
  p.ell(8, 9.5, 6, 6, '#ff6a1a'); p.ell(8, 4.5, 3.4, 3.6, '#ff6a1a'); p.ell(8, 10.5, 4, 4, '#ffd84a');
  p.px(6, 9, K); p.px(10, 9, K); p.px(6, 8, '#ffffff'); p.px(10, 8, '#ffffff'); p.px(8, 12, '#a8161a');
  p.outline('#a8161a');
  return p.canvas();
}
function initArt() {
  ART = {
    hero: heroFrames(HERO_PAL), fire: heroFrames(FIRE_PAL), heroStar: STAR_PALS.map(heroFrames),
    kestane: makeKestane(), beetle: makeBeetle(), bee: makeBee(), spiky: makeSpiky(), piranha: makePiranha(),
    boss: makeBoss(), princess: makePrincess(), podoboo: makePodoboo(),
    mush: makeMushroom('#2bb3a0', '#ffd84a'), oneup: makeMushroom('#ff6aa8', '#fff4e0'), flower: makeFlower(), starItem: makeStar(), bigStar: makeBigStar(),
    coin: makeCoin(), mcoin: makeMiniCoin(), fireball: makeFireball(), bossfire: makeBossFire().map(withFlip), axe: makeAxe(), heart: makeHeart(),
    spring: makeSpring(), castle: makeCastle(), pole: makeFlagPole(), flag: makeFlag(), torch: makeTorch(),
    hill: makeHill(80, 36),
    penguin: makePenguin(), scorpion: makeScorpion(), tumble: makeTumbleweed(), icicle: makeIcicle(), sandslab: makeSandSlab(),
    puffer: makePuffer(), jelly: makeJelly(), fish: [makeFish('#ff6a4a', '#b8301a', '#ffc8a0'), makeFish('#4ab8f0', '#1a6aa8', '#c8f0ff')],
  };
  for (const th of ['over', 'cave', 'sky', 'castle', 'ice', 'desert', 'sea', 'beach']) {
    TILES[th] = tileArt(th);
    LAYERS[th] = makeLayers(th);
    const br = THEMES[th].brick;
    DECOR[th] = {
      bush32: makeBush(32, th), bush40: makeBush(40, th), bush56: makeBush(56, th), fence: makeFence(),
      flower0: makeFlowerDecor('#ff6a8a'), flower1: makeFlowerDecor('#fff4e0'), flower2: makeFlowerDecor('#8a7aff'),
      crystal0: makeCrystal(1), crystal1: makeCrystal(2), crystal2: makeCrystal(3), sign: makeSign(),
      debris: makeDebris(br[0], br[1]),
    };
  }
  Object.assign(DECOR.ice, { pine: makePine(), snowman: makeSnowman() });
  Object.assign(DECOR.desert, { cactus0: makeCactus(30, 2), cactus1: makeCactus(21, 1), rock: makeRock(), pyrwall: makePyrWall() });
  const seaBits = { shell: makeShell(), starfish: makeStarfish(), arrow: makeArrowDown() };
  Object.assign(DECOR.sea, seaBits, {
    coral0: makeCoral(3, ['#ff7a9a', '#b83a5a', '#ffd0dc']), coral1: makeCoral(7, ['#ff9a4a', '#b8582a', '#ffe0a8']), coral2: makeCoral(12, ['#ffd84a', '#b88a1a', '#fff4b0']),
    fan: makeFanCoral(), anemone: makeAnemone(), rock: makeSeaRock(), kelpL: makeKelpLeaf(false), kelpR: makeKelpLeaf(true),
  });
  Object.assign(DECOR.beach, seaBits, { palm: makePalm() });
}

// =====================================================================
//  INPUT
// =====================================================================
const input = { left: 0, right: 0, down: 0, up: 0, a: 0, b: 0, run: 0, aP: 0, bP: 0, start: 0, startP: 0, _pa: 0, _pb: 0, _ps: 0, keys: {}, touch: {} };
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down', ArrowUp: 'a', KeyW: 'a',
  Space: 'a', KeyZ: 'a', KeyK: 'a', KeyX: 'b', KeyJ: 'b', ShiftLeft: 'b', ShiftRight: 'b', Enter: 'start'
};
function pollInput() {
  const k = input.keys, t = input.touch;
  for (const n of ['left', 'right', 'down', 'a', 'b', 'start', 'run']) input[n] = (k[n] || t[n]) ? 1 : 0; // run: joystick pushed far
  input.aP = input.a && !input._pa; input.bP = input.b && !input._pb; input.startP = input.start && !input._ps;
  input._pa = input.a; input._pb = input.b; input._ps = input.start;
}

// =====================================================================
//  GAME STATE
// =====================================================================
const G = {
  state: 'title', stateT: 0, frame: 0, levelIdx: 0, level: null, areaIdx: 0, score: 0, coins: 0, lives: 3, time: 300, timeAcc: 0,
  cam: { x: 0 }, freeze: 0, parts: [], cp: false, seq: null, msg: null, hurry: false, shake: 0, sel: 0, tap: null, paused: false,
  unlocked: store.get('unlocked', 1), best: store.get('best', 0), fade: 0,
  starSaved: store.get('stars', {}), bigRun: 0, bigPre: 0, starTally: null,
};
let area = null;
const P = { x: 0, y: 0, w: 12, h: 15, vx: 0, vy: 0, size: 0, dir: 1, onGround: false, coyote: 0, jbuf: 0, jumping: false, inv: 0, star: 0, anim: 0, skid: false, ducking: false, combo: 0, state: 'play', stateT: 0, onPlat: null, fireCD: 0, throwT: 0, visible: true, pipeTop: 0, transform: 0, tfrom: 0 };

function solidAt(tx, ty) { return SOLID_ID[tileAt(area, tx, ty)] === 1; }
function moveBody(e, isPlayer) {
  const res = { wall: false, ground: false, head: false, tiles: null, ty: 0 };
  if (e.vx !== 0) {
    e.x += e.vx;
    const top = Math.floor(e.y / 16), bot = Math.floor((e.y + e.h - 1) / 16);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w - 1) / 16);
      for (let ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) { e.x = tx * 16 - e.w; res.wall = true; break; }
    } else {
      const tx = Math.floor(e.x / 16);
      for (let ty = top; ty <= bot; ty++) if (solidAt(tx, ty)) { e.x = (tx + 1) * 16; res.wall = true; break; }
    }
  }
  const prevBottom = e.y + e.h;
  e.y += e.vy;
  const l = Math.floor(e.x / 16), r = Math.floor((e.x + e.w - 1) / 16);
  if (e.vy > 0) {
    const ty = Math.floor((e.y + e.h - 0.01) / 16);
    for (let tx = l; tx <= r; tx++) {
      const t = tileAt(area, tx, ty);
      if (SOLID_ID[t] || (t === T.SEMI && prevBottom <= ty * 16 + 0.5)) { e.y = ty * 16 - e.h; e.vy = 0; res.ground = true; break; }
    }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y / 16);
    const hit = [];
    for (let tx = l; tx <= r; tx++) { const t = tileAt(area, tx, ty); if (SOLID_ID[t] || (isPlayer && t === T.HIDDEN)) hit.push(tx); }
    if (hit.length) {
      // corner forgiveness: slide around a block edge
      if (isPlayer && hit.length === 1) {
        const tx = hit[0], ovL = (tx + 1) * 16 - e.x, ovR = e.x + e.w - tx * 16;
        if (ovL <= 5 && ovL < ovR && !solidAt(tx + 1, ty) && tileAt(area, tx + 1, ty) !== T.HIDDEN) { e.x = (tx + 1) * 16; return res; }
        if (ovR <= 5 && ovR < ovL && !solidAt(tx - 1, ty) && tileAt(area, tx - 1, ty) !== T.HIDDEN) { e.x = tx * 16 - e.w; return res; }
      }
      e.y = (ty + 1) * 16; e.vy = 0; res.head = true; res.tiles = hit; res.ty = ty;
    }
  }
  return res;
}

// ---------- particles & popups ----------
function popup(text, x, y, col) { G.parts.push({ k: 'text', text: String(text), x, y, t: 0, col: col || '#fff4e0' }); }
function addScore(n, x, y) { G.score += n; if (x !== undefined) popup(n, x, y); }
const COMBO = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
function comboScore(x, y) {
  if (P.combo >= COMBO.length) { oneUp(x, y); } else addScore(COMBO[P.combo], x, y);
  P.combo++;
}
function oneUp(x, y) { G.lives++; SND.play('oneup'); popup('1UP', x, y, '#6af08a'); }
function addCoin() { G.coins++; SND.play('coin'); if (G.coins >= 100) { G.coins -= 100; oneUp(P.x, P.y - 8); } }
function dust(x, y) { G.parts.push({ k: 'dust', x, y, t: 0, vx: rnd(-0.3, 0.3) }); }
function sparkle(x, y, col) { G.parts.push({ k: 'spark', x, y, t: 0, vx: rnd(-1, 1), vy: rnd(-1.5, 0.2), col: col || '#fff4a0' }); }
// ---------- juice: haptics, hit-stop, extra particles ----------
const HAPTIC = {
  ok: typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function',
  on: store.get('vibrate', true),
  set(v) { this.on = !!v; store.set('vibrate', this.on); },
  buzz(p) { if (!this.on || !this.ok) return; try { navigator.vibrate(p); } catch (e) { } },
};
const BUZZ = { stomp: 18, hurt: [40, 40, 60], power: [20, 40, 20, 40, 40], death: [90, 60, 180], brick: 12, boss: 35 };
function hitStop(n) { G.freeze = Math.max(G.freeze, n); G.flash = 4; }
function landDust(x, y, n) { for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; G.parts.push({ k: 'dust', x: x + s * rnd(1, 5), y, t: 0, vx: s * rnd(0.4, 1.1) }); } }
function starBurst(x, y) {
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.39; G.parts.push({ k: 'star', x, y, vx: Math.cos(a) * 1.9, vy: Math.sin(a) * 1.9, t: 0, col: i % 2 ? '#ffd84a' : '#fff4e0' }); }
  G.parts.push({ k: 'twinkle', x, y, t: 0, big: 1 });
}
function coinSparkle(x, y) {
  G.parts.push({ k: 'twinkle', x, y, t: 0 });
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.78; G.parts.push({ k: 'spark', x, y, t: 0, vx: Math.cos(a) * 1.1, vy: Math.sin(a) * 1.1, col: i % 2 ? '#ffd84a' : '#ffffff' }); }
}

// ---------- entities ----------
function spawnEntity(s) {
  const x = s.x * 16, yb = (s.y + 1) * 16;
  const base = { type: s.type, active: false, dead: false, vx: 0, vy: 0, t: 0, dir: -1 };
  switch (s.type) {
    case 'kestane': return { ...base, x: x + 1, y: yb - 14, w: 14, h: 14, vx: -0.5, enemy: true, stomp: true, killable: true };
    case 'beetle': return { ...base, x: x + 1, y: yb - 12, w: 14, h: 12, vx: -0.5, enemy: true, stomp: true, killable: true, state: 'walk' };
    case 'bee': return { ...base, x: x + 1, y: yb - 12, baseY: yb - 12, w: 14, h: 12, vx: -0.45, enemy: true, stomp: true, killable: true };
    case 'spiky': return { ...base, x: x + 1, y: yb - 11, w: 14, h: 11, vx: -0.45, enemy: true, stomp: false, killable: true };
    case 'piranha': return { ...base, x: x + 8, y: s.y * 16, pipeTop: s.y * 16, w: 16, h: 24, enemy: true, stomp: false, killable: true, ph: 'hidden', pt: 60, keep: true };
    case 'podoboo': return { ...base, x: x + 2, y: 15 * 16, baseY: 15 * 16, w: 12, h: 14, enemy: true, stomp: false, killable: false, wait: s.delay || 0, keep: true };
    case 'firebar': return { ...base, x: x, y: s.y * 16, cx: x + 8, cy: s.y * 16 + 8, len: s.len || 6, speed: s.speed || 0.04, a: 0, w: 16, h: 16, enemy: true, killable: false, keep: true, active: true };
    case 'boss': return { ...base, x: x, y: yb - 28, w: 26, h: 28, hp: 5, vx: -0.4, enemy: true, stomp: false, killable: false, fireT: 120, mouth: 0, flash: 0, keep: true, homeX: x };
    case 'axe': return { ...base, x, y: s.y * 16, w: 16, h: 16, keep: true };
    case 'princess': return { ...base, x, y: yb - 32, w: 16, h: 32, keep: true };
    case 'plat': return { ...base, x, y: s.y * 16, bx: x, by: s.y * 16, w: s.w * 16, h: 8, axis: s.axis, dist: s.dist, period: s.period, dx: 0, dy: 0, plat: true, keep: true, active: true };
    case 'fallplat': return { ...base, x, y: s.y * 16, w: s.w * 16, h: 8, dx: 0, dy: 0, plat: true, fall: 0, keep: true, active: true };
    case 'spring': return { ...base, x, y: yb - 16, w: 16, h: 16, comp: 0, keep: true };
    case 'penguin': return { ...base, x: x + 1, y: yb - 14, w: 14, h: 14, vx: -0.45, enemy: true, stomp: true, killable: true, state: 'walk', cool: 40 };
    case 'scorpion': return { ...base, x: x + 1, y: yb - 12, w: 14, h: 12, vx: -0.4, enemy: true, stomp: true, killable: true, hopT: 60 };
    case 'tumble': return { ...base, x: x + 1, y: yb - 14, w: 14, h: 14, vx: -1.15, enemy: true, stomp: true, killable: true, bn: 0 };
    case 'icicle': return { ...base, x: x + 4, y: s.y * 16, w: 8, h: 15, st: 'hang' };
    case 'sinkplat': return { ...base, x, y: s.y * 16, by: s.y * 16, w: s.w * 16, h: 8, dx: 0, dy: 0, plat: true, keep: true, active: true };
    // sea creatures: in water, touching them hurts; fireballs and the star kill them
    case 'puffer': return { ...base, x: x + 2, y: s.y * 16 + 2, cx: x + 8, cy: s.y * 16 + 8, homeX: x + 8, baseY: s.y * 16 + 8, w: 12, h: 12, vx: -0.3, inf: 0, puff: 0, enemy: true, stomp: false, killable: true };
    case 'jelly': return { ...base, x: x + 2, y: s.y * 16 - 2, floorY: s.y * 16 - 2, w: 12, h: 14, enemy: true, stomp: false, killable: true, pulse: 30 + ((s.x * 7) % 40) };
    case 'fish': return { ...base, x: x + 1, y: s.y * 16 + 3, baseY: s.y * 16 + 3, w: 14, h: 10, vx: s.vx || -0.75, kind: s.x % 2, enemy: true, stomp: false, killable: true };
    // a star already picked up in this run (kept through a checkpoint respawn) does not come back
    case 'bigstar': return (G.bigRun >> s.idx) & 1 ? null : { ...base, x, y: s.y * 16, w: 16, h: 16, idx: s.idx, ghost: !!((starsSaved(G.level.def.id) >> s.idx) & 1), keep: true };
  }
  return null;
}
function enterArea(idx) {
  G.areaIdx = idx;
  area = G.level.areas[idx];
  P.safe = null; // KOLAY: the last safe ground is per area
  if (!area.spawned) { area.ents = area.spawns.map(spawnEntity).filter(Boolean); area.spawned = true; }
  area.ents = area.ents.filter(e => e.type !== 'fireball' && e.type !== 'bossfire');
}
function flipKill(e, dir) {
  e.dying = true; e.vy = -3.6; e.vx = (dir || 1) * 0.9; e.enemy = false;
  if (e.type === 'piranha') e.dead = true;
}
function spawnItem(kind, tx, ty) {
  const it = { type: 'item', kind, x: tx * 16 + 1, y: ty * 16, w: 14, h: 16, vx: 0, vy: 0, emerge: 16, active: true, t: 0 };
  G.area_new.push(it);
  SND.play('sprout');
}
function spawnCoinPop(tx, ty) {
  G.parts.push({ k: 'coinpop', x: tx * 16, y: ty * 16 - 16, vy: -5.5, t: 0 });
  addCoin(); G.score += 200;
}
function spawnFireball() {
  // launched from about knee height with a gentle downward arc so it lands right away and skims the floor
  const fb = { type: 'fireball', x: P.dir > 0 ? P.x + P.w - 2 : P.x - 6, y: P.y + P.h - 16, w: 8, h: 8, vx: P.dir * 4.2, vy: 1.5, active: true, t: 0 };
  G.area_new.push(fb);
  SND.play('fire');
}
function debris(tx, ty) {
  for (const [dx, dy, vx, vy] of [[0, 0, -1.4, -5.5], [8, 0, 1.4, -5.5], [0, 8, -1.2, -3.8], [8, 8, 1.2, -3.8]])
    G.parts.push({ k: 'debris', x: tx * 16 + dx, y: ty * 16 + dy, vx, vy, t: 0, spin: vx < 0 ? -1 : 1 });
}
function bumpAnim(tx, ty) { area.bumps.push({ tx, ty, t: 0 }); }
function hitBlock(tx, ty, big) {
  const A = area, k = ty * A.w + tx, id = A.t[k], content = A.q[k];
  if (id === T.Q || id === T.HIDDEN || (id === T.BRICK && content)) {
    if (content === 'multi') {
      A.qn[k]--; spawnCoinPop(tx, ty); bumpAnim(tx, ty);
      if (A.qn[k] <= 0) { A.t[k] = T.USED; delete A.q[k]; }
    } else {
      A.t[k] = T.USED; delete A.q[k]; bumpAnim(tx, ty);
      if (!content || content === 'coin') spawnCoinPop(tx, ty);
      else if (content === 'power') spawnItem(P.size === 0 ? 'mush' : 'flower', tx, ty);
      else spawnItem(content, tx, ty);
    }
  } else if (id === T.BRICK) {
    if (big) { A.t[k] = T.EMPTY; debris(tx, ty); G.score += 50; SND.play('brk'); HAPTIC.buzz(BUZZ.brick); G.shake = Math.max(G.shake, 3); }
    else { bumpAnim(tx, ty); SND.play('bump'); }
  } else SND.play('bump');
  // things standing on the block get knocked
  const top = ty * 16;
  for (const e of A.ents) {
    if (e.dead || e.dying) continue;
    if (Math.abs(e.y + e.h - top) < 5 && e.x + e.w > tx * 16 - 2 && e.x < tx * 16 + 18) {
      if (e.enemy && e.killable && e.type !== 'piranha') { flipKill(e, e.x + e.w / 2 < tx * 16 + 8 ? -1 : 1); addScore(100, e.x, e.y); SND.play('kick'); }
      else if (e.type === 'item' && !e.emerge && e.kind !== 'flower') { e.vy = -4; e.vx = (e.x + e.w / 2 < tx * 16 + 8 ? -1 : 1) * Math.abs(e.vx || 1); }
    }
  }
  if (tileAt(A, tx, ty - 1) === T.COIN) { A.t[(ty - 1) * A.w + tx] = T.EMPTY; spawnCoinPop(tx, ty - 1); }
}

// ---------- player helpers ----------
function setSize(n) {
  const old = P.size;
  if (old === 0 && n > 0) { P.y -= 14; P.h = 29; }
  else if (old > 0 && n === 0) { if (P.ducking) { P.ducking = false; } else { P.y += 14; } P.h = 15; }
  P.size = n;
}
function setDuck(d) {
  if (P.size === 0) { P.ducking = false; return; }
  if (d && !P.ducking) { P.ducking = true; P.y += 14; P.h = 15; }
  else if (!d && P.ducking) {
    const ny = P.y - 14;
    const l = Math.floor(P.x / 16), r = Math.floor((P.x + P.w - 1) / 16), ty = Math.floor(ny / 16);
    for (let tx = l; tx <= r; tx++) if (solidAt(tx, ty)) return;
    P.ducking = false; P.y = ny; P.h = 29;
  }
}
function grow(to) {
  if (to <= P.size) { if (to === 2 && P.size === 2) { } return; }
  P.tfrom = P.size;
  setSize(to);
  P.transform = 48; G.freeze = 48;
  SND.play('power'); HAPTIC.buzz(BUZZ.power);
}
function hurtPlayer() {
  if (P.inv > 0 || P.star > 0 || P.state !== 'play') return;
  if (P.size > 0) {
    P.tfrom = P.size; setSize(P.size === 2 ? 1 : 0);
    P.transform = 48; G.freeze = 48; P.inv = 130; SND.play('shrink'); HAPTIC.buzz(BUZZ.hurt);
  } else killPlayer(false);
}
function killPlayer(fell) {
  if (G.state !== 'play') return;
  G.state = 'dying'; G.stateT = 0; P.state = 'dead'; P.diedBig = P.size > 0;
  if (P.size > 0) { setSize(0); }
  P.vx = 0; P.vy = fell ? -2 : -5.2; P.star = 0; P.ducking = false; P.sq = 0;
  MUSIC.play('death'); HAPTIC.buzz(BUZZ.death);
}

function playerControl() {
  const I = input;
  // carried by platform
  if (P.onPlat) {
    const pl = P.onPlat;
    if (P.x + P.w > pl.x && P.x < pl.x + pl.w && !pl.dead) { P.x += pl.dx; P.y = pl.y - P.h; } else P.onPlat = null;
  }
  setDuck(P.size > 0 && I.down && (P.onGround || P.ducking));
  // slippery ice: weaker grip while standing on ICE tiles
  const slip = P.onGround && !P.onPlat && tileAt(area, Math.floor((P.x + P.w / 2) / 16), Math.floor((P.y + P.h + 1) / 16)) === T.ICE;
  const grip = slip ? 0.33 : 1;
  if (slip && Math.abs(P.vx) > 1 && G.frame % 7 === 0) sparkle(P.x + P.w / 2, P.y + P.h - 1, '#e8f8ff');
  let ax = 0;
  if (I.left && !I.right) ax = -1; else if (I.right && !I.left) ax = 1;
  if (P.ducking && P.onGround) ax = 0;
  // underwater: no running, slower top speed (a bit faster while swimming than while wading on the floor)
  const W = !!area.water, run = (I.b || I.run || OPT.autoRun) && !W, max = W ? (P.onGround ? 1.1 : 1.35) : run ? 2.6 : 1.55;
  P.skid = false;
  if (ax) {
    if (P.onGround && P.vx * ax < 0 && Math.abs(P.vx) > 0.6) {
      P.vx += ax * 0.24 * grip; P.skid = true;
      if (G.frame % 4 === 0) dust(P.x + P.w / 2, P.y + P.h);
    } else {
      P.dir = ax;
      if (P.vx * ax < max) P.vx = ax * Math.min(P.vx * ax + (P.onGround ? (run ? 0.1 : 0.075) * (slip ? 0.45 : 1) : 0.07), max);
      else P.vx = approach(P.vx, ax * max, P.onGround ? 0.12 * grip : 0.03);
    }
  } else P.vx = approach(P.vx, 0, P.onGround ? (P.ducking ? 0.06 : 0.09) * grip : 0.025);
  // jump (buffered + coyote time for touch screens)
  if (I.aP) P.jbuf = 7; else if (P.jbuf > 0) P.jbuf--;
  if (P.onGround) P.coyote = 6; else if (P.coyote > 0) P.coyote--;
  if (!W && P.jbuf > 0 && P.coyote > 0) {
    P.vy = -(4.8 + Math.min(Math.abs(P.vx), 2.6) * 0.2);
    P.jumping = true; P.jbuf = 0; P.coyote = 0; P.onGround = false; P.onPlat = null;
    SND.play(P.size ? 'bigjump' : 'jump'); P.sq = -0.8;
  }
  if (!I.a) P.jumping = false;
  P.vy = W ? swimVy(I) : Math.min(P.vy + ((P.jumping && P.vy < 0) ? 0.18 : 0.55), 5.6);
  // fire
  if (P.fireCD > 0) P.fireCD--;
  if (P.throwT > 0) P.throwT--;
  if (I.bP && P.size === 2 && P.fireCD === 0 && !P.ducking) {
    let n = 0; for (const e of area.ents) if (e.type === 'fireball' && !e.dead) n++;
    for (const e of G.area_new) if (e.type === 'fireball') n++;
    if (n < 2) { spawnFireball(); P.fireCD = 8; P.throwT = 8; }
  }
  // move
  const prevBottom = P.y + P.h;
  const wasGround = P.onGround, fallV = P.vy;
  const res = moveBody(P, true);
  if (P.x < G.cam.x) { P.x = G.cam.x; if (P.vx < 0) P.vx = 0; }
  if (res.wall) P.vx = 0;
  if (W && P.y < 6) { P.y = 6; if (P.vy < 0) P.vy = 0; } // the water surface
  P.onGround = res.ground;
  // platforms
  P.onPlat = null;
  if (P.vy >= 0) {
    for (const e of area.ents) {
      if (!e.plat || e.dead) continue;
      if (P.x + P.w > e.x + 1 && P.x < e.x + e.w - 1 && prevBottom <= e.y + Math.max(0, e.dy) + 1 && P.y + P.h >= e.y) {
        P.y = e.y - P.h; P.vy = 0; P.onGround = true; P.onPlat = e;
        if (e.type === 'fallplat' && !e.fall) e.fall = 1;
        break;
      }
    }
  }
  // render-only squash/stretch + dust (no effect on the hitbox)
  if (P.sq) { P.sq *= 0.72; if (Math.abs(P.sq) < 0.05) P.sq = 0; }
  if (P.onGround) {
    if (!wasGround && fallV > 1.5) { P.sq = Math.min(1, fallV / 5.6); if (fallV >= 4.2) landDust(P.x + P.w / 2, P.y + P.h, 6); }
    else if (Math.abs(P.vx) >= 2.5 && !P.skid && G.frame % 6 === 0) dust(P.x + P.w / 2 - Math.sign(P.vx) * 5, P.y + P.h);
    P.combo = 0;
  }
  if (res.head) {
    const cx = P.x + P.w / 2; let best = res.tiles[0], bd = 1e9;
    for (const tx of res.tiles) { const d = Math.abs(tx * 16 + 8 - cx); if (d < bd) { bd = d; best = tx; } }
    hitBlock(best, res.ty, P.size > 0);
    P.jumping = false;
  }
  // tiles touched
  const l = Math.floor(P.x / 16), r = Math.floor((P.x + P.w - 1) / 16), t0 = Math.floor(P.y / 16), t1 = Math.floor((P.y + P.h - 1) / 16);
  for (let ty = t0; ty <= t1; ty++) for (let tx = l; tx <= r; tx++) {
    const id = tileAt(area, tx, ty);
    if (id === T.COIN) { area.t[ty * area.w + tx] = T.EMPTY; addCoin(); G.score += 200; coinSparkle(tx * 16 + 8, ty * 16 + 8); }
    else if ((id === T.LAVA || id === T.QSAND) && P.y + P.h > ty * 16 + 5) { killPlayer(true); return; }
  }
  if (P.y > VH + 16) { if (canRescue()) startRescue(); else killPlayer(true); return; }
  // pipes
  if (I.down && P.onGround) {
    for (const w of area.warps) {
      if (P.y + P.h === w.ty * 16 && P.x >= w.tx * 16 + 1 && P.x + P.w <= w.tx * 16 + 31) {
        P.state = 'pipeIn'; P.stateT = 0; P.vx = 0; P.warp = w; P.x = w.tx * 16 + 16 - P.w / 2; setDuck(false);
        SND.play('pipe'); return;
      }
    }
  }
  // checkpoint
  if (isEasy()) easyCheckpoints();
  else if (!G.cp && G.level.checkpoint && G.areaIdx === 0 && P.x > G.level.checkpoint * 16) { G.cp = true; G.bigPre = G.bigRun; SND.play('checkpoint'); popup('KONTROL NOKTASI', P.x - 30, P.y - 14, '#6af0d8'); }
  if (isEasy()) easyTick();
  // goal flag
  if (area.flag && P.x + P.w >= area.flag.x * 16 - 1) startFlag();
  // animation
  if (P.onGround) {
    if (Math.abs(P.vx) > 0.1) P.anim += Math.abs(P.vx) * 0.11; else P.anim = 0;
  }
  if (P.inv > 0) P.inv--;
  if (P.star > 0) {
    P.star--;
    if (G.frame % 5 === 0) sparkle(P.x + rnd(0, P.w), P.y + rnd(0, P.h));
    if (P.star === 0) MUSIC.play(THEMES[area.theme].music, null, G.hurry ? 1.3 : 1);
  }
}
// swimming: A = one stroke upward (repeatable), otherwise a slow sink with a capped speed
const SWIM = { stroke: -2.35, sink: 0.07, maxSink: 1.1 };
function swimVy(I) {
  P.jumping = false; P.jbuf = 0; P.coyote = 0;
  if (P.swimT > 0) P.swimT--;
  if (!P.onGround) P.anim += P.swimT > 0 ? 0.2 : 0.05;
  if (G.frame % 72 === 0) bubble(P.x + P.w / 2 + P.dir * 5, P.y + 3);
  if (I.aP) {
    P.swimT = 16; P.onGround = false; P.onPlat = null;
    SND.play('swim'); bubble(P.x + P.w / 2, P.y + P.h - 4); bubble(P.x + P.w / 2 - P.dir * 4, P.y + P.h - 2);
    return SWIM.stroke;
  }
  return Math.min(P.vy + SWIM.sink, SWIM.maxSink);
}
function bubble(x, y) { G.parts.push({ k: 'bubble', x, y, t: 0, ph: Math.random() * 6, r: Math.random() < 0.3 ? 2 : 1 }); }
function startFlag() {
  P.state = 'flag'; P.stateT = 0; P.vx = 0; P.vy = 0; P.onPlat = null; P.star = 0; setDuck(false);
  const fx = area.flag.x * 16;
  P.x = fx + 4 - P.w + 2;
  const top = 2 * 16;
  const h = P.y - top;
  const pts = h < 40 ? 5000 : h < 64 ? 2000 : h < 96 ? 800 : h < 128 ? 400 : 100;
  addScore(pts, fx + 10, P.y);
  G.flagY = 3 * 16 + 2; G.timeStop = true;
  bankStars();
  MUSIC.stop(); SND.play('flag');
}
function updatePlayerState() {
  switch (P.state) {
    case 'play': playerControl(); break;
    case 'rescue': updateRescue(); break;
    case 'pipeIn':
      P.y += 0.8;
      if (++P.stateT > 40) {
        const w = P.warp.to;
        enterArea(w.area);
        MUSIC.play(THEMES[area.theme].music, null, G.hurry ? 1.3 : 1);
        if (w.mode === 'up') {
          P.x = w.tx * 16 + 16 - P.w / 2; P.y = w.ty * 16 + 4; P.pipeTop = w.ty * 16; P.state = 'pipeOut'; SND.play('pipe');
        } else { P.x = w.tx * 16; P.y = w.ty * 16; P.vy = 0; P.state = 'play'; }
        G.cam.x = clamp(P.x - VW * 0.4, 0, Math.max(0, area.w * 16 - VW));
        if (area.w * 16 < VW) G.cam.x = (area.w * 16 - VW) / 2;
        G.fade = 12;
      }
      break;
    case 'pipeOut':
      P.y -= 0.8;
      if (P.y + P.h <= P.pipeTop) { P.y = P.pipeTop - P.h; P.state = 'play'; P.vy = 0; }
      break;
    case 'flag': {
      const baseTop = 12 * 16;
      if (P.y + P.h < baseTop) P.y = Math.min(P.y + 2.2, baseTop - P.h);
      if (G.flagY < 11 * 16 - 2) G.flagY += 2.2;
      if (P.y + P.h >= baseTop && G.flagY >= 11 * 16 - 2) {
        if (++P.stateT === 16) { P.x += P.w + 4; P.dir = -1; }
        if (P.stateT > 30) { P.state = 'walk'; P.dir = 1; MUSIC.play('clear'); }
      }
      break;
    }
    case 'walk': {
      P.vx = 1.25; P.vy = Math.min(P.vy + 0.5, 5);
      const r = moveBody(P, true); P.onGround = r.ground;
      P.anim += 0.14;
      if (area.castle && P.x + P.w / 2 >= area.castle.x * 16 + 40) { P.visible = false; P.state = 'castle'; P.stateT = 0; G.seq = { k: 'tally', t: 0 }; }
      break;
    }
    case 'axe': { P.vx = 0; P.vy = Math.min(P.vy + 0.5, 5); const r = moveBody(P, true); P.onGround = r.ground; break; }
    case 'walkP': {
      P.vx = 1.1; P.vy = Math.min(P.vy + 0.5, 5);
      const r = moveBody(P, true); P.onGround = r.ground; P.anim += 0.13; P.dir = 1;
      const pr = area.ents.find(e => e.type === 'princess');
      if (pr && P.x + P.w >= pr.x - 10) { P.vx = 0; P.anim = 0; P.state = 'meet'; P.stateT = 0; G.msg = { t: 0 }; }
      break;
    }
    case 'meet': P.stateT++; break;
    case 'castle': break;
  }
}

// ---------- entity update ----------
function playerHits(e) {
  if (P.state !== 'play' || !e.enemy || e.dying || e.flat || !overlap(P, e)) return;
  if (P.star > 0 && e.killable) {
    flipKill(e, P.x < e.x ? 1 : -1); comboScore(e.x, e.y); SND.play('kick'); return;
  }
  const fromAbove = P.vy > 0 && (P.y + P.h) - e.y < Math.max(9, P.vy + 5);
  if (e.stomp && fromAbove) { stomp(e); return; }
  if (e.type === 'beetle' && e.state === 'shell') { kickShell(e); return; }
  if (e.type === 'beetle' && e.state === 'slide' && e.kickT > 0) return;
  hurtPlayer();
}
function bounce() { P.vy = input.a ? -5.4 : -3.9; P.jumping = !!input.a; P.onGround = false; }
function stomp(e) {
  SND.play('stomp'); HAPTIC.buzz(BUZZ.stomp); hitStop(3); starBurst(e.x + e.w / 2, e.y + 2);
  if (e.type === 'kestane') { e.flat = 30; e.enemy = false; comboScore(e.x, e.y - 4); }
  else if (e.type === 'beetle') {
    if (e.state === 'walk' || e.state === 'slide') { e.state = 'shell'; e.vx = 0; e.shellT = 400; comboScore(e.x, e.y - 4); }
    else { kickShell(e); }
  } else if (e.type === 'bee' || e.type === 'penguin' || e.type === 'scorpion' || e.type === 'tumble') { flipKill(e, P.dir); comboScore(e.x, e.y - 4); }
  P.y = e.y - P.h; bounce();
}
function kickShell(e) {
  e.state = 'slide'; e.vx = (P.x + P.w / 2 < e.x + e.w / 2) ? 3.7 : -3.7; e.kickT = 14;
  SND.play('kick'); addScore(400, e.x, e.y - 4);
  if (P.vy > 0 && P.y + P.h - e.y < 9) { P.y = e.y - P.h; bounce(); }
}
function walkerCollide(e) {
  for (const o of area.ents) {
    if (o === e || !o.active || o.dying || o.dead || !o.enemy || o.flat) continue;
    if (!(o.type === 'kestane' || o.type === 'beetle' || o.type === 'spiky' || o.type === 'penguin' || o.type === 'scorpion' || o.type === 'tumble')) continue;
    if (!overlap(e, o)) continue;
    if (e.type === 'beetle' && e.state === 'slide') {
      flipKill(o, Math.sign(e.vx)); e.combo = (e.combo || 0) + 1;
      if (e.combo > COMBO.length) oneUp(o.x, o.y); else addScore(COMBO[e.combo - 1], o.x, o.y); SND.play('kick');
    } else if (!(o.type === 'beetle' && o.state === 'slide') && !(e.type === 'beetle' && e.state === 'shell') && !(o.type === 'beetle' && o.state === 'shell')) {
      if ((e.x < o.x && e.vx > 0) || (e.x > o.x && e.vx < 0)) e.vx = -e.vx;
    }
  }
}
function updateEnt(e) {
  if (!e.active) {
    if (e.x < G.cam.x + VW + 24 && e.x + e.w > G.cam.x - 24) e.active = true; else return;
  }
  if (!e.keep && e.x + e.w < G.cam.x - 80) { e.dead = true; return; }
  e.t++;
  if (e.dying) { e.vy += 0.3; e.y += e.vy; e.x += e.vx; if (e.y > VH + 32) e.dead = true; return; }
  if (e.water) { waterFire(e); return; }
  switch (e.type) {
    case 'kestane': case 'spiky': {
      if (e.flat) { if (--e.flat <= 0) e.dead = true; return; }
      e.vy = Math.min(e.vy + 0.3, 5);
      const r = moveBody(e); if (r.wall) e.vx = -e.vx;
      if (e.y > VH + 16) e.dead = true;
      walkerCollide(e); playerHits(e);
      break;
    }
    case 'beetle': {
      e.vy = Math.min(e.vy + 0.3, 5);
      if (e.state === 'shell') { e.vx = 0; if (--e.shellT <= 0) { e.state = 'walk'; e.vx = P.x < e.x ? -0.5 : 0.5; } }
      const r = moveBody(e);
      if (r.wall) {
        e.vx = -e.vx;
        if (e.state === 'slide' && Math.abs(e.x - G.cam.x - VW / 2) < VW) SND.play('bump');
      }
      if (e.kickT > 0) e.kickT--;
      if (e.y > VH + 16) e.dead = true;
      if (e.state === 'slide' && (e.x > G.cam.x + VW + 64)) e.dead = true;
      walkerCollide(e); playerHits(e);
      break;
    }
    case 'bee': {
      e.x += e.vx; e.y = e.baseY + Math.sin(e.t * 0.045) * 26;
      playerHits(e); break;
    }
    case 'piranha': {
      const near = Math.abs(P.x + P.w / 2 - (e.x + 8)) < 30;
      e.pt--;
      if (e.ph === 'hidden') { e.y = e.pipeTop; if (e.pt <= 0 && !near) { e.ph = 'up'; e.pt = 24; } }
      else if (e.ph === 'up') { e.y -= 1; if (e.pt <= 0) { e.ph = 'out'; e.pt = 70; } }
      else if (e.ph === 'out') { if (e.pt <= 0) { e.ph = 'down'; e.pt = 24; } }
      else if (e.ph === 'down') { e.y += 1; if (e.pt <= 0) { e.ph = 'hidden'; e.pt = 80; } }
      const exposed = e.pipeTop - e.y;
      if (exposed > 6 && P.state === 'play') {
        const box = { x: e.x + 3, y: e.y + 2, w: 10, h: exposed - 2 };
        if (overlap(P, box)) { if (P.star > 0) { e.dead = true; addScore(200, e.x, e.y); SND.play('kick'); } else hurtPlayer(); }
      }
      break;
    }
    case 'podoboo': {
      if (e.wait > 0) { e.wait--; e.y = e.baseY; break; }
      if (e.y >= e.baseY && e.vy >= 0) e.vy = -6.4;
      e.vy += 0.18; e.y += e.vy;
      if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; e.wait = 70 + ((Math.random() * 60) | 0); }
      if (P.state === 'play' && overlap(P, { x: e.x + 2, y: e.y + 2, w: 8, h: 10 })) hurtPlayer();
      break;
    }
    case 'firebar': {
      e.a += e.speed;
      if (P.state !== 'play') break;
      const box = { x: P.x + 2, y: P.y + 2, w: P.w - 4, h: P.h - 4 };
      for (let i = 0; i < e.len; i++) {
        const bx = e.cx + Math.cos(e.a) * i * 8 - 3, by = e.cy + Math.sin(e.a) * i * 8 - 3;
        if (overlap(box, { x: bx, y: by, w: 6, h: 6 })) { hurtPlayer(); break; }
      }
      break;
    }
    case 'plat': {
      const ph = e.t / e.period * Math.PI * 2;
      const nx = e.axis === 'x' ? e.bx + Math.sin(ph) * e.dist : e.bx;
      const ny = e.axis === 'y' ? e.by + Math.sin(ph) * e.dist : e.by;
      e.dx = nx - e.x; e.dy = ny - e.y; e.x = nx; e.y = ny;
      break;
    }
    case 'fallplat': {
      e.dx = 0; e.dy = 0;
      if (e.fall) { e.fall++; if (e.fall > 24) { const v = Math.min(4, (e.fall - 24) * 0.12); e.y += v; e.dy = v; } }
      if (e.y > VH + 20) e.dead = true;
      break;
    }
    case 'spring': {
      if (e.comp > 0) e.comp--;
      if (P.state === 'play' && P.vy > 0 && overlap(P, e) && P.y + P.h - e.y < 10) {
        P.y = e.y - P.h; P.vy = input.a ? -9.2 : -7; P.jumping = false; e.comp = 12; SND.play('spring');
      }
      break;
    }
    case 'penguin': {
      if (e.state === 'slide') {
        if (--e.slideT <= 0) { e.state = 'walk'; e.y -= 4; e.h = 14; e.vx = Math.sign(e.vx) * 0.45; e.cool = 100; }
        else if (G.frame % 5 === 0 && e.onGround) dust(e.x + (e.vx > 0 ? 0 : e.w), e.y + e.h);
      } else {
        if (e.cool > 0) e.cool--;
        const dx = P.x + P.w / 2 - (e.x + e.w / 2);
        if (!e.cool && e.onGround && P.state === 'play' && Math.abs(dx) < 110 && Math.abs(P.y + P.h - e.y - e.h) < 24) {
          e.state = 'slide'; e.slideT = 75; e.vx = Math.sign(dx || -1) * 2.1; e.y += 4; e.h = 10;
        }
      }
      e.vy = Math.min(e.vy + 0.3, 5);
      const r = moveBody(e); e.onGround = r.ground; if (r.wall) e.vx = -e.vx;
      if (e.y > VH + 16) e.dead = true;
      walkerCollide(e); playerHits(e);
      break;
    }
    case 'scorpion': {
      e.vy = Math.min(e.vy + 0.3, 5);
      const r = moveBody(e); if (r.wall) e.vx = -e.vx;
      if (r.ground) {
        if (e.hop) { e.hop = false; e.vx = (e.vx < 0 ? -1 : 1) * 0.4; e.hopT = 70 + ((Math.random() * 50) | 0); }
        else if (--e.hopT <= 0 && P.state === 'play' && Math.abs(P.x - e.x) < 140) { e.hop = true; e.vy = -4.2; e.vx = (P.x < e.x ? -1 : 1) * 1.1; }
      }
      if (e.y > VH + 16) e.dead = true;
      walkerCollide(e); playerHits(e);
      break;
    }
    case 'tumble': {
      e.vy = Math.min(e.vy + 0.22, 5);
      const r = moveBody(e); if (r.wall) e.vx = -e.vx;
      if (r.ground) { e.bn++; e.vy = e.bn % 3 === 0 ? -3.8 : -2.3; }
      if (e.y > VH + 16) e.dead = true;
      playerHits(e);
      break;
    }
    case 'icicle': {
      if (e.st === 'hang') {
        const loose = !solidAt(Math.floor((e.x + 4) / 16), Math.floor(e.y / 16) - 1);
        const near = P.state === 'play' && P.x + P.w > e.x - 30 && P.x < e.x + e.w + 18 && P.y > e.y;
        if (near || loose) { e.st = 'shake'; e.shT = loose ? 6 : 26; SND.play('crack'); }
      } else if (e.st === 'shake') { if (--e.shT <= 0) e.st = 'fall'; }
      else {
        e.vy = Math.min(e.vy + 0.32, 6); e.y += e.vy;
        const hitP = P.state === 'play' && overlap(P, { x: e.x + 1, y: e.y + 4, w: e.w - 2, h: e.h - 4 });
        if (hitP) hurtPlayer();
        if (hitP || solidAt(Math.floor((e.x + e.w / 2) / 16), Math.floor((e.y + e.h) / 16)) || e.y > VH) {
          e.dead = true; SND.play('shatter');
          for (let i = 0; i < 6; i++) G.parts.push({ k: 'spark', x: e.x + 4, y: e.y + e.h - 2, t: 0, vx: rnd(-1.4, 1.4), vy: rnd(-2.2, -0.4), col: i % 2 ? '#ffffff' : '#8ccff4' });
        }
      }
      break;
    }
    case 'sinkplat': {
      const on = P.onPlat === e && P.state === 'play';
      const ny = on ? e.y + 0.42 : Math.max(e.by, e.y - 0.6);
      e.dx = 0; e.dy = ny - e.y; e.y = ny;
      if (on && G.frame % 5 === 0) G.parts.push({ k: 'spark', x: e.x + rnd(2, e.w - 2), y: e.y + e.h, t: 0, vx: 0, vy: 0.5, col: '#f0c878' });
      break;
    }
    case 'puffer': {
      // patrols around its home and puffs up into a big spiky ball while the hero is close
      const near = P.state === 'play' && Math.abs(P.x + P.w / 2 - e.cx) < 46 && Math.abs(P.y + P.h / 2 - e.cy) < 40;
      if (near) { if (e.puff <= 0) SND.play('puff'); e.puff = Math.max(e.puff, 50); }
      else if (e.puff > 0) e.puff--;
      e.inf = approach(e.inf, e.puff > 0 ? 1 : 0, 0.1);
      if (e.inf < 0.5) {
        e.cx += e.vx;
        if (e.cx < e.homeX - 36) e.vx = Math.abs(e.vx); else if (e.cx > e.homeX + 36) e.vx = -Math.abs(e.vx);
        else if (solidAt(Math.floor((e.cx + Math.sign(e.vx) * 9) / 16), Math.floor(e.cy / 16))) e.vx = -e.vx;
      }
      e.cy = e.baseY + Math.sin(e.t * 0.035) * 5;
      const s = 12 + e.inf * 8; e.w = s; e.h = s; e.x = e.cx - s / 2; e.y = e.cy - s / 2;
      playerHits(e);
      break;
    }
    case 'jelly': {
      // drifts down slowly; every so often it pulses upward, toward the hero when he is above it
      if (e.vy < 0) e.vy *= 0.96;
      e.vy = Math.min(e.vy + 0.015, 0.35); e.vx *= 0.985;
      if (--e.pulse <= 0) {
        const above = P.state === 'play' && P.y + P.h / 2 < e.y + 4 && Math.abs(P.x - e.x) < 120;
        e.pulse = above ? 70 : 110;
        e.vy = above ? -1.5 : -0.8;
        if (above) e.vx = clamp((P.x - e.x) * 0.01, -0.5, 0.5);
      }
      moveBody(e);
      if (e.y > e.floorY) { e.y = e.floorY; if (e.vy > 0) e.vy = 0; }
      if (e.y < 8) { e.y = 8; if (e.vy < 0) e.vy = 0; }
      playerHits(e);
      break;
    }
    case 'fish': {
      // swims in a straight line with a gentle wiggle; turns at rocks
      e.x += e.vx; e.y = e.baseY + Math.sin(e.t * 0.07 + e.baseY) * 3;
      if (solidAt(Math.floor((e.vx < 0 ? e.x : e.x + e.w) / 16), Math.floor((e.y + e.h / 2) / 16))) e.vx = -e.vx;
      playerHits(e);
      break;
    }
    case 'item': updateItem(e); break;
    case 'bigstar':
      if (e.t % (e.ghost ? 40 : 18) === 0) G.parts.push({ k: 'twinkle', x: e.x + 2 + ((e.t * 7) % 13), y: e.y + 1 + ((e.t * 5) % 14), t: 0 });
      if (P.state === 'play' && overlap(P, { x: e.x - 1, y: e.y - 1, w: e.w + 2, h: e.h + 2 })) collectBigStar(e);
      break;
    case 'fireball': {
      e.vy = Math.min(e.vy + 0.35, 4.5);
      const ox = e.x, r = moveBody(e);
      // low, fixed bounce (apex ~10 px): stays under the top of every ground enemy (spiky is 11 px tall)
      if (r.ground) e.vy = -FB_BOUNCE;
      // hop up a one-tile step instead of fizzling on it (only when there is room above the step)
      if (r.wall && fbStep(e, ox)) r.wall = false;
      if (r.wall || e.x < G.cam.x - 16 || e.x > G.cam.x + VW + 16 || e.y > VH) { e.dead = true; puff(e.x, e.y); break; }
      for (const o of area.ents) {
        if (o.dead || o.dying || !o.enemy || !o.active) continue;
        if (o.type === 'piranha') { const ex = o.pipeTop - o.y; if (ex > 6 && overlap(e, { x: o.x + 3, y: o.y, w: 10, h: ex })) { o.dead = true; e.dead = true; addScore(200, o.x, o.y); SND.play('kick'); puff(e.x, e.y); } continue; }
        if (!overlap(e, o)) continue;
        if (o.type === 'boss') { e.dead = true; puff(e.x, e.y); hitBoss(o); break; }
        if (o.type === 'bossfire') { e.dead = true; puff(e.x, e.y); break; }
        if (!o.killable) continue;
        flipKill(o, Math.sign(e.vx)); addScore(200, o.x, o.y); SND.play('kick'); e.dead = true; puff(e.x, e.y); break;
      }
      break;
    }
    case 'boss': updateBoss(e); break;
    case 'bossfire': {
      e.x += e.vx; e.y = approach(e.y, e.ty, 0.4);
      if (e.x < G.cam.x - 40) e.dead = true;
      if (P.state === 'play' && overlap(P, { x: e.x + 2, y: e.y + 2, w: e.w - 4, h: e.h - 4 })) hurtPlayer();
      break;
    }
    case 'axe': if (P.state === 'play' && overlap(P, e)) startBridgeSeq(e); break;
  }
}
const FB_BOUNCE = 2.6;
function fbStep(e, ox) {
  const lead = e.vx > 0 ? ox + e.vx + e.w - 1 : ox + e.vx, tx = Math.floor(lead / 16);
  const back = Math.floor((e.vx > 0 ? ox + e.w - 1 : ox) / 16);
  let r = -1;
  for (let ty = Math.floor(e.y / 16); ty <= Math.floor((e.y + e.h - 1) / 16); ty++) if (solidAt(tx, ty)) { r = ty; break; }
  if (r < 1 || e.y + e.h - r * 16 > 16 || solidAt(tx, r - 1) || solidAt(back, r - 1)) return false;
  e.x = ox + e.vx; e.y = r * 16 - e.h; e.vy = -FB_BOUNCE;
  return true;
}
// fireballs keep working underwater: they shoot straight (no bounce), trail bubbles and fizzle out after a while
function waterFire(e) {
  e.x += e.vx; e.y += Math.sin(e.t * 0.3) * 0.4;
  if (e.t % 6 === 0) bubble(e.x + 4, e.y + 2);
  if (e.t > 75 || solidAt(Math.floor((e.x + 4) / 16), Math.floor((e.y + 4) / 16)) || e.x < G.cam.x - 16 || e.x > G.cam.x + VW + 16) { e.dead = true; puff(e.x, e.y); return; }
  for (const o of area.ents) {
    if (o.dead || o.dying || !o.enemy || !o.active || !o.killable || !overlap(e, o)) continue;
    flipKill(o, Math.sign(e.vx)); addScore(200, o.x, o.y); SND.play('kick'); e.dead = true; puff(e.x, e.y); break;
  }
}
// ---------- BÜYÜK YILDIZ: 3 hidden big stars per level ----------
// G.bigRun: bitmask picked up in this run; it only counts (store 'stars') once the level is finished.
// Dying loses the ones picked up since the last checkpoint (G.bigPre = snapshot of G.bigRun when the latest checkpoint was reached).
function starsSaved(id) { return G.starSaved[id] || 0; }
function starCount(m) { return (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1); }
function collectBigStar(e) {
  e.dead = true;
  const bit = 1 << e.idx;
  G.bigRun |= bit;
  G.bigT = G.frame; G.bigI = e.idx;
  const cx = e.x + 8, cy = Math.max(e.y + 8, 44); // (popup stays on screen for the one above the sky)
  addScore(e.ghost ? 1000 : 2000, cx - 10, cy - 14);
  popup(e.ghost ? 'YILDIZ' : 'BÜYÜK YILDIZ!', cx - (e.ghost ? 15 : 36), cy - 24, '#ffd84a');
  SND.play('bigstar'); HAPTIC.buzz(BUZZ.power); hitStop(2);
  starBurst(cx, cy);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; G.parts.push({ k: 'fw', x: cx, y: cy, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, t: 22, col: i % 2 ? '#ffd84a' : '#fff4e0' }); }
}
// at the flag / axe: bank this run's stars and show the tally
function bankStars() {
  const id = G.level.def.id, old = starsSaved(id), now = old | G.bigRun;
  G.starTally = { got: G.bigRun, old, t: G.frame };
  if (now !== old) { G.starSaved = { ...G.starSaved, [id]: now }; store.set('stars', G.starSaved); }
}
function puff(x, y) { for (let i = 0; i < 4; i++) G.parts.push({ k: 'spark', x: x + 4, y: y + 4, t: 0, vx: rnd(-1, 1), vy: rnd(-1, 1), col: i % 2 ? '#ffd84a' : '#ff6a1a' }); }
function updateItem(e) {
  if (e.emerge > 0) { e.y -= 0.5; e.emerge -= 0.5; if (e.emerge <= 0) { e.emerge = 0; if (e.kind === 'mush' || e.kind === '1up') e.vx = 1; if (e.kind === 'star') { e.vx = 1.3; e.vy = -4; } } return; }
  if (e.kind !== 'flower') {
    e.vy = Math.min(e.vy + (e.kind === 'star' ? 0.22 : 0.3), 5);
    const r = moveBody(e);
    if (r.wall) e.vx = -e.vx;
    if (r.ground && e.kind === 'star') e.vy = -4.6;
    if (e.y > VH + 16) e.dead = true;
  }
  e.t++;
  if (P.state === 'play' && overlap(P, e)) {
    e.dead = true;
    if (e.kind === 'mush') { addScore(1000, e.x, e.y); grow(1); }
    else if (e.kind === 'flower') { addScore(1000, e.x, e.y); if (P.size === 0) grow(1); else grow(2); }
    else if (e.kind === '1up') { oneUp(e.x, e.y); }
    else if (e.kind === 'star') { addScore(1000, e.x, e.y); P.star = 620; SND.play('power'); HAPTIC.buzz(BUZZ.power); MUSIC.play('star'); }
  }
}
function hitBoss(b) {
  if (b.dying) return;
  b.hp--; b.flash = 12; SND.play('bosshit'); HAPTIC.buzz(BUZZ.boss); hitStop(4); starBurst(b.x + b.w / 2, b.y + 8);
  if (b.hp <= 0) { flipKill(b, 1); b.vy = -4; addScore(5000, b.x, b.y); SND.play('burst'); G.shake = 20; }
}
function updateBoss(e) {
  if (e.flash > 0) e.flash--;
  if (e.mouth > 0) e.mouth--;
  if (e.frozen) { if (e.falling) { e.vy = Math.min(e.vy + 0.3, 6); e.y += e.vy; if (e.y > VH + 40) e.dead = true; } return; }
  if (!e.fight) { if (e.x < G.cam.x + VW - 20) { e.fight = true; MUSIC.play('boss'); } else return; }
  e.dir = P.x + P.w / 2 < e.x + e.w / 2 ? -1 : 1;
  if (e.t % 110 === 0) e.vx = Math.random() < 0.55 ? -0.45 : 0.45;
  const minX = area.bridge.x0 * 16 + 48, maxX = area.bridge.x1 * 16 - e.w - 4;
  if (e.x < minX) e.vx = Math.abs(e.vx); if (e.x > maxX) e.vx = -Math.abs(e.vx);
  e.vy = Math.min(e.vy + 0.28, 6);
  const r = moveBody(e);
  if (r.ground && e.t % 150 === 75) { e.vy = -4.8; }
  if (r.ground && e.vy === 0 && e.t % 150 === 76) G.shake = 6;
  if (e.y > VH + 20) e.dead = true;
  if (--e.fireT <= 0 && e.dir < 0) {
    e.fireT = 110 + ((Math.random() * 70) | 0); e.mouth = 24;
    const ty = [P.y + P.h - 20, 10 * 16 - 20, 10 * 16 - 40][(Math.random() * 3) | 0];
    G.area_new.push({ type: 'bossfire', x: e.x - 20, y: e.y + 4, ty: clamp(ty, 4 * 16, 10 * 16 - 12), w: 24, h: 10, vx: -1.7, enemy: true, killable: false, active: true, t: 0 });
    SND.play('bossfire');
  }
  if (P.state === 'play' && overlap(P, { x: e.x + 3, y: e.y + 3, w: e.w - 6, h: e.h - 3 })) {
    if (P.star > 0) { if (!e.flash) hitBoss(e); } else hurtPlayer();
  }
}
function startBridgeSeq(axe) {
  axe.dead = true;
  P.state = 'axe'; P.vx = 0; P.vy = 0; G.timeStop = true; P.star = 0;
  P.x = Math.max(P.x, (area.bridge.x1 + 1) * 16 + 1);
  bankStars();
  MUSIC.stop();
  for (const e of area.ents) { if (e.type === 'bossfire') e.dead = true; if (e.type === 'boss') { e.frozen = true; } }
  G.seq = { k: 'bridge', t: 0, i: area.bridge.x1 };
}
function updateSeq() {
  const s = G.seq; if (!s) return;
  s.t++;
  if (s.k === 'bridge') {
    if (s.i >= area.bridge.x0) {
      if (s.t % 4 === 0) { area.t[area.bridge.y * area.w + s.i] = T.EMPTY; s.i--; SND.play('collapse'); }
    } else if (!s.fell) {
      s.fell = s.t;
      const b = area.ents.find(e => e.type === 'boss' && !e.dead);
      if (b && !b.dying) { b.falling = true; b.vy = -2; SND.play('burst'); }
    } else if (s.t - s.fell === 90) {
      MUSIC.play('castleclear'); P.state = 'walkP'; G.score += G.time * 50; popup(G.time * 50, P.x, P.y - 10);
    }
  } else if (s.k === 'tally') {
    if (G.time > 0) {
      const d = Math.min(G.time, 2); G.time -= d; G.score += d * 50;
      if (s.t % 3 === 0) SND.play('tick');
    } else {
      if (!s.done) { s.done = s.t; s.fw = 3; }
      const since = s.t - s.done;
      if (s.fw > 0 && since % 26 === 10) {
        s.fw--;
        const cx = area.castle.x * 16 + 40 + rnd(-40, 40), cy = rnd(50, 110);
        for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; G.parts.push({ k: 'fw', x: cx, y: cy, vx: Math.cos(a) * rnd(1.2, 2), vy: Math.sin(a) * rnd(1.2, 2), t: 0, col: ['#ffd84a', '#ff6a8a', '#6af0d8', '#fff4e0'][i % 4] }); }
        SND.play('burst'); G.score += 500;
      }
      if (since > 130 && (!MUSIC.cur || !SND.ctx || SND.ctx.state !== 'running' || since > 430)) wipeOut(nextLevel);
    }
  }
}

// ---------- level flow ----------
function startLevel(idx, fresh) {
  G.levelIdx = idx;
  if (fresh) { G.cp = false; G.cpx = 0; }
  G.state = 'intro'; G.stateT = G.ta ? 80 : 150;
  MUSIC.stop();
}
function beginPlay() {
  const def = LEVELS[G.levelIdx];
  G.level = def.make();
  G.level.def = def;
  G.time = def.time + (isEasy() ? EASY.time : 0); G.timeAcc = 0; G.hurry = false; G.timeStop = false; G.seq = null; G.msg = null; G.parts = []; G.freeze = 0;
  G.bigRun = (G.cp || G.cpx) ? G.bigPre : 0; G.bigPre = G.bigRun; G.starTally = null; // big stars: only the ones from before the checkpoint survive a death
  enterArea(G.level.start.area);
  Object.assign(P, { vx: 0, vy: 0, size: P.size || 0, dir: 1, onGround: false, coyote: 0, jbuf: 0, jumping: false, inv: 0, star: 0, anim: 0, ducking: false, combo: 0, state: 'play', stateT: 0, onPlat: null, fireCD: 0, throwT: 0, visible: true, transform: 0 });
  P.h = P.size ? 29 : 15;
  let sx = G.level.start.x, sy = G.level.start.y;
  if (G.cp && G.level.checkpoint) { sx = G.level.checkpoint; sy = groundRowAt(sx); }
  G.level.cps = isEasy() ? easyCheckpointList() : null; G.rescued = false;
  if (G.level.cps && G.cpx) { sx = G.cpx; sy = groundRowAt(sx); }
  P.x = sx * 16 + 2; P.y = (sy + 1) * 16 - P.h;
  G.cam.x = clamp(P.x - VW * 0.4, 0, Math.max(0, area.w * 16 - VW));
  if (G.level.checkpoint) G.level.cpY = (groundRowAt(G.level.checkpoint) + 1) * 16;
  // remove enemies that would be right on top of the spawn point
  for (const e of area.ents) if (e.enemy && e.x > P.x - 48 && e.x < P.x + 64 && e.type !== 'firebar' && e.type !== 'podoboo') e.dead = true;
  G.state = 'play'; G.fade = 0; G.cam.look = 0; P.sq = 0; P.swimT = 0;
  if (G.ta) { G.ta.t = 0; G.ta.after = 0; }
  if (isEasy()) { P.inv = EASY.grace; P.grace = EASY.grace; } // KOLAY: a star-like second of safety after every (re)spawn
  MUSIC.play(THEMES[area.theme].music);
}
// lowest standable spot with two tiles of headroom (ignores ceilings and blocks floating above the floor)
function groundRowAt(tx) {
  for (let y = ROWS - 1; y >= 3; y--) {
    const t = tileAt(area, tx, y);
    if ((SOLID_ID[t] || t === T.SEMI) && !SOLID_ID[tileAt(area, tx, y - 1)] && !SOLID_ID[tileAt(area, tx, y - 2)]) return y - 1;
  }
  return 12;
}
function nextLevel() {
  G.cp = false; saveBest(); // level cleared: bank the score so a closed tab can't lose it
  if (G.ta) { taFinish(); return; }
  if (LEVELS[G.levelIdx].secret) { toSeaEnding(); return; }
  if (G.levelIdx + 1 < MAIN_LEVELS) {
    G.unlocked = Math.max(G.unlocked, G.levelIdx + 2); store.set('unlocked', G.unlocked);
    startLevel(G.levelIdx + 1, true);
  } else toEnding();
}
function toEnding() {
  G.unlocked = LEVELS.length; store.set('unlocked', G.unlocked);
  saveBest();
  G.state = 'ending'; G.stateT = 0; G.parts = [];
  MUSIC.play('title');
}
// cheap: only touches storage when the record actually moves (called at level clear, pause, tab hide, game end)
function saveBest() { if (G.ta) return; if (G.score > G.best) { G.best = G.score; store.set('best', G.best); } } // time-attack runs never touch the normal high score
function gameOver() {
  saveBest();
  G.state = 'gameover'; G.stateT = 260;
  MUSIC.play('gameover');
}
// the secret level's own ending: an underwater credits roll, then back to the title
function toSeaEnding() {
  saveBest();
  G.state = 'seaend'; G.stateT = 0; G.parts = [];
  MUSIC.play('sea');
}
function toTitle() {
  if (G.ta) { G.ta = null; G.score = 0; } // time-attack runs never count towards the high score
  saveBest();
  G.state = 'title'; G.stateT = 0; G.parts = [];
  if (SND.ctx) MUSIC.play('title'); else MUSIC.stop();
}
function newGame(levelIdx) {
  G.ta = null; G.score = 0; G.coins = 0; G.lives = isEasy() ? EASY.lives : 3; P.size = 0; G.cp = false;
  startLevel(levelIdx, true);
}

// ---------- time attack ("ZAMANA KARŞI") ----------
// one unlocked level against a precise clock; dying restarts it instantly, best times per level live in store 'ta'
G.taMode = store.get('tamode', false); G.taBest = store.get('ta', {}); G.ta = null;
function fmtTime(f) {
  const cs = Math.floor(f * 100 / 60), m = Math.floor(cs / 6000), s = Math.floor(cs / 100) % 60;
  return String(Math.min(99, m)).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(cs % 100).padStart(2, '0');
}
function taBestOf(i) { return G.taBest[LEVELS[i].id] || 0; }
function startTimeAttack(idx) {
  G.ta = { lv: idx, t: 0, after: 0, tries: 1 };
  G.score = 0; G.coins = 0; G.lives = 1; P.size = 0; G.cp = false;
  startLevel(idx, true);
}
function taRestart() { G.ta.tries++; G.score = 0; G.coins = 0; P.size = 0; G.cp = false; beginPlay(); }
function taTick() {
  if (!G.timeStop) { G.ta.t++; return; }
  // the clock stopped at the flag / axe: let the moment play a little, then show the result
  if (++G.ta.after === (G.seq && G.seq.k === 'bridge' ? 170 : 100)) wipeOut(taFinish);
}
function taFinish() {
  const id = LEVELS[G.ta.lv].id, prev = G.taBest[id] || 0, t = G.ta.t;
  G.ta.prev = prev; G.ta.rec = !prev || t < prev;
  if (G.ta.rec) { G.taBest[id] = t; store.set('ta', G.taBest); }
  G.state = 'taresult'; G.stateT = 0; G.rsel = 0; G.parts = [];
  if (MUSIC.name !== 'clear' && MUSIC.name !== 'castleclear') MUSIC.play('clear');
}

// ---------- difficulty: KOLAY / NORMAL ----------
// KOLAY (normal mode only; time attack always plays by NORMAL rules): 5 lives, +100 time, a big hero respawns big,
// two extra checkpoints (about 1/4 and 3/4 of the way), a 1 s star-like grace after every (re)spawn and,
// once per life, a bubble that carries the hero back out of a pit. NORMAL never touches any of this.
const EASY = { lives: 5, time: 100, grace: 60, rescueInv: 90, rescueT: 84 };
G.diff = store.get('diff', 'normal') === 'easy' ? 'easy' : 'normal';
function isEasy() { return G.diff === 'easy' && !G.ta; }
Object.assign(SFX, {
  rescue: (S, t) => {
    S.tone(180, t, 0.5, { wave: 'tri', slide: 720, slideT: 0.48, vol: 0.16 });
    ['C5', 'G5', 'E5', 'C6', 'G5', 'E6', 'C7'].forEach((n, i) => S.tone(nf(n), t + i * 0.06, 0.07, { wave: 'sine', slide: nf(n) * 1.5, vol: 0.13 }));
  },
  pop: (S, t) => { S.noiseHit(t, 0.07, { freq: 2600, vol: 0.12 }); S.tone(700, t, 0.09, { wave: 'sine', slide: 1900, vol: 0.15 }); },
});
// a soap bubble: faint fill, a rim lit from the top left, a curved highlight and a glint
function makeRescueBubble(w, h) {
  const p = new Pix(w, h), cx = w / 2, cy = h / 2, rx = w / 2 - 0.5, ry = h / 2 - 0.5;
  const inside = (x, y, k) => { const dx = (x + .5 - cx) / (rx - k), dy = (y + .5 - cy) / (ry - k); return dx * dx + dy * dy <= 1; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!inside(x, y, 0)) continue;
    const a = Math.atan2(y + .5 - cy, x + .5 - cx);
    if (!inside(x, y, 1.1)) p.px(x, y, a < -Math.PI / 2 || a > 2.6 ? '#ffffff' : a > 0.2 && a < 1.9 ? '#3aa8e0f0' : '#8adcf8f0');
    else if (!inside(x, y, 2.1)) p.px(x, y, a > 0.2 && a < 1.9 ? '#8adcf880' : '#d8f6ff70');
    else if (!inside(x, y, 3.4) && inside(x, y, 2.4) && a > -2.7 && a < -1.7) p.px(x, y, '#ffffffee');
    else p.px(x, y, '#c8f2ff38');
  }
  const gx = Math.round(cx + rx * 0.45), gy = Math.round(cy + ry * 0.5);
  p.px(gx, gy, '#ffffffd0'); p.px(gx - 1, gy, '#ffffff80'); p.px(gx, gy - 1, '#ffffff80');
  return p.canvas();
}
function easyTick() {
  // remember the last spot of real ground under both feet (not a moving / falling / sinking platform)
  if (P.state === 'play' && P.onGround && !P.onPlat) {
    const row = Math.floor((P.y + P.h + 1) / 16), ok = t => SOLID_ID[t] === 1 || t === T.SEMI;
    if (P.y + P.h === row * 16 && ok(tileAt(area, Math.floor((P.x + 1) / 16), row)) && ok(tileAt(area, Math.floor((P.x + P.w - 2) / 16), row))) P.safe = { x: P.x, y: row * 16, area: G.areaIdx };
  }
  if (P.grace > 0) { P.grace--; if (G.frame % 4 === 0) sparkle(P.x + rnd(0, P.w), P.y + rnd(0, P.h), ['#ffd84a', '#6af0d8', '#ff6a8a'][(G.frame >> 2) % 3]); }
}
// ---- pit rescue ----
function canRescue() { return isEasy() && !G.rescued && !!P.safe && P.safe.area === G.areaIdx; }
function startRescue() {
  G.rescued = true; setDuck(false);
  Object.assign(P, { state: 'rescue', stateT: 0, vx: 0, vy: 0, onPlat: null, onGround: false, jumping: false, sq: 0, inv: 0, grace: 0 });
  P.rx0 = P.x; P.ry0 = VH + 2 - P.h; P.rx1 = P.safe.x; P.ry1 = P.safe.y - P.h;
  SND.play('rescue');
}
function updateRescue() {
  const t = Math.min(1, ++P.stateT / EASY.rescueT), e = t * t * (3 - 2 * t);
  P.x = P.rx0 + (P.rx1 - P.rx0) * e;
  P.y = P.ry0 + (P.ry1 - P.ry0) * e - Math.sin(t * Math.PI) * 26;
  if (P.stateT % 7 === 0) bubble(P.x + rnd(0, P.w), P.y + P.h);
  // the camera may step back so the landing spot is on screen
  const want = clamp(Math.min(G.cam.x, P.rx1 - 72), 0, Math.max(0, area.w * 16 - VW)), wide = area.w * 16 >= VW;
  if (wide) G.cam.x = approach(G.cam.x, want, Math.max(2, (G.cam.x - want) * 0.08));
  if (P.stateT >= EASY.rescueT + 10) {
    if (wide) G.cam.x = Math.min(G.cam.x, want);
    P.x = P.rx1; P.y = P.ry1; P.state = 'play'; P.inv = EASY.rescueInv; P.vy = 0; P.jbuf = 0; P.coyote = 0;
    SND.play('pop'); starBurst(P.x + P.w / 2, P.y + P.h / 2);
    for (let i = 0; i < 6; i++) bubble(P.x + rnd(-4, P.w + 4), P.y + rnd(0, P.h));
  }
}
// ---- extra checkpoints: about 1/4 and 3/4 of the way, on flat standable floor away from enemies, hazards and pipes ----
function cpColumnOK(A, tx, avoid, minRow) {
  if (avoid.some(a => Math.abs(a - tx) < 10)) return false;
  const y = groundRowAt(tx);
  if (y < minRow || y > 12) return false;
  for (let dx = -2; dx <= 2; dx++) {
    const t = tileAt(A, tx + dx, y + 1);
    if (!(SOLID_ID[t] === 1 || t === T.SEMI) || groundRowAt(tx + dx) !== y) return false;
  }
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) { const t = tileAt(A, tx + dx, y + dy); if (t === T.LAVA || t === T.QSAND) return false; }
  // walkers near the spawn are cleared by beginPlay; keep clear of the things it leaves alone
  const KEEP_AWAY = { firebar: 0, piranha: 3, icicle: 3, boss: 12, plat: 2, fallplat: 2, sinkplat: 2, spring: 2 };
  for (const s of A.spawns) {
    const r = KEEP_AWAY[s.type]; if (r === undefined) continue;
    const reach = (s.type === 'firebar' ? Math.ceil((s.len || 6) / 2) + 3 : r) + (s.axis === 'x' ? Math.ceil((s.dist || 0) / 16) : 0);
    if (tx >= s.x - reach && tx <= s.x + (s.w || 1) - 1 + reach) return false;
  }
  for (const w of A.warps) if (tx >= w.tx - 1 && tx <= w.tx + 2) return false;
  return true;
}
function easyCheckpointList() {
  const L = G.level, A = L.areas[0], mid = L.checkpoint;
  if (!mid || area !== A) return mid ? [{ x: mid, y: L.cpY || (groundRowAt(mid) + 1) * 16 }] : [];
  const end = A.flag ? A.flag.x : A.bridge ? A.bridge.x0 : A.w - 12, xs = [mid];
  for (const want of [(L.start.x + mid) / 2, (mid + end) / 2]) {
    let found = 0;
    for (const minRow of [8, 3]) // prefer the main floor over high bonus clouds / ledges
      for (let d = 0; d <= 24 && !found; d++) for (const tx of d ? [Math.round(want) + d, Math.round(want) - d] : [Math.round(want)]) if (cpColumnOK(A, tx, [L.start.x, mid, end], minRow)) { found = tx; break; }
    if (found) xs.push(found);
  }
  return xs.sort((a, b) => a - b).map(x => ({ x, y: (groundRowAt(x) + 1) * 16 }));
}
function easyCheckpoints() {
  if (G.areaIdx !== 0 || !G.level.cps) return;
  for (const c of G.level.cps) {
    if (c.x <= (G.cpx || 0) || P.x <= c.x * 16) continue;
    G.cpx = c.x; G.bigPre = G.bigRun; if (c.x === G.level.checkpoint) G.cp = true;
    SND.play('checkpoint'); popup('KONTROL NOKTASI', P.x - 30, P.y - 14, '#6af0d8');
  }
}

function updatePlay() {
  G.area_new = [];
  if (G.ta) taTick();
  if (G.freeze > 0) {
    G.freeze--; if (P.transform > 0) P.transform--;
    return;
  }
  if (!G.ta && !G.timeStop && P.state === 'play') {
    if (++G.timeAcc >= 24) {
      G.timeAcc = 0; G.time--;
      if (G.time === 100 && !G.hurry) { G.hurry = true; SND.play('hurry'); MUSIC.setSpeed(1.3); }
      if (G.time <= 0) { G.time = 0; killPlayer(false); return; }
    }
  }
  // platforms first so riders can be carried
  for (const e of area.ents) if (e.plat && !e.dead) updateEnt(e);
  updatePlayerState();
  if (G.state !== 'play') return;
  for (const e of area.ents) if (!e.plat && !e.dead) updateEnt(e);
  if (area.water) for (const n of G.area_new) if (n.type === 'fireball' && !n.water) { n.water = true; n.vx = Math.sign(n.vx) * 2.6; n.vy = 0; n.y = P.y + Math.min(6, P.h - 10); } // straight shot at chest height, not the knee-height land arc
  if (G.area_new.length) area.ents.push(...G.area_new);
  if (G.frame % 30 === 0) area.ents = area.ents.filter(e => !e.dead);
  updateSeq();
  // camera
  if (P.state === 'play' || P.state === 'walk' || P.state === 'walkP') {
    // smoothed follow with a small look-ahead; the camera only ever moves right
    const C = G.cam, base = P.x + P.w / 2 - VW * 0.42;
    const lt = P.vx > 0.6 ? Math.min(24, (P.vx - 0.6) * 14) : P.vx < -0.3 ? 0 : (C.look || 0);
    C.look = approach(C.look || 0, lt, 0.5);
    const target = base + C.look;
    if (target > C.x) C.x += target - C.x < 0.5 ? target - C.x : (target - C.x) * 0.18;
    if (C.x < base - 14) C.x = base - 14;
    G.cam.x = clamp(G.cam.x, 0, Math.max(0, area.w * 16 - VW));
    if (area.w * 16 < VW) G.cam.x = (area.w * 16 - VW) / 2;
  }
}
function updateParts() {
  for (const p of G.parts) {
    p.t++;
    switch (p.k) {
      case 'text': p.y -= 0.6; if (p.t > 45) p.dead = 1; break;
      case 'coinpop': p.vy += 0.38; p.y += p.vy; if (p.t > 26) { p.dead = 1; popup(200, p.x + 2, p.y); coinSparkle(p.x + 8, p.y + 8); } break;
      case 'debris': p.vy += 0.35; p.x += p.vx; p.y += p.vy; if (p.y > VH + 10) p.dead = 1; break;
      case 'dust': p.y -= 0.3; p.x += p.vx; if (p.t > 16) p.dead = 1; break;
      case 'spark': p.x += p.vx; p.y += p.vy; p.vy += 0.04; if (p.t > 22) p.dead = 1; break;
      case 'fw': p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.03; if (p.t > 55) p.dead = 1; break;
      case 'star': p.x += p.vx; p.y += p.vy; p.vx *= 0.86; p.vy *= 0.86; if (p.t > 16) p.dead = 1; break;
      case 'twinkle': if (p.t > (p.big ? 10 : 14)) p.dead = 1; break;
      case 'bubble': p.y -= 0.4 + p.r * 0.12; p.x += Math.sin(p.t * 0.15 + p.ph) * 0.3; if (p.t > 120 || p.y < 7) p.dead = 1; break;
    }
  }
  if (G.parts.length > 0) G.parts = G.parts.filter(p => !p.dead);
}
function updateDying() {
  if (G.ta) { // time attack: no lives, no game over, just a quick restart of the level
    G.stateT++;
    if (G.stateT > 20) { P.vy = Math.min(P.vy + 0.25, 6); P.y += P.vy; }
    if (G.stateT === 36) wipeOut(taRestart, 12);
    return;
  }
  G.stateT++;
  if (G.stateT === 170) wipeOut(null, 18);
  if (G.stateT > 28) { P.vy = Math.min(P.vy + 0.25, 6); P.y += P.vy; }
  if (G.stateT === 190) {
    G.lives--;
    if (G.lives <= 0) gameOver();
    else { P.size = isEasy() && P.diedBig ? 1 : 0; startLevel(G.levelIdx, false); } // KOLAY: a big hero comes back big (fire is lost)
  }
}
