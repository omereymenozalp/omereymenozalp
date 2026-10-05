
// =====================================================================
//  LEVELS
// =====================================================================
function newArea(theme, w) {
  return { theme, w, t: new Uint8Array(w * ROWS), q: {}, qn: {}, spawns: [], decor: [], warps: [], flag: null, castle: null, bridge: null, ents: [], bumps: [] };
}
function builder(A) {
  const set = (x, y, id) => { if (x >= 0 && x < A.w && y >= 0 && y < ROWS) A.t[y * A.w + x] = id; };
  const api = {
    set(x, y, id) { set(x, y, id); return api; },
    fill(x0, y0, x1, y1, id) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, id); return api; },
    ground(x0, x1, top = 13) { return api.fill(x0, top, x1, 14, T.GROUND); },
    lava(x0, x1) { return api.fill(x0, 13, x1, 14, T.LAVA); },
    pipe(x, h, o = {}) {
      const top = 13 - h;
      set(x, top, T.PTL); set(x + 1, top, T.PTR);
      for (let y = top + 1; y <= 12; y++) { set(x, y, T.PL); set(x + 1, y, T.PR); }
      if (o.piranha) A.spawns.push({ type: 'piranha', x, y: top });
      if (o.warp) A.warps.push({ tx: x, ty: top, to: o.warp });
      return api;
    },
    row(x, y, s) {
      for (let i = 0; i < s.length; i++) {
        const X = x + i, k = y * A.w + X;
        switch (s[i]) {
          case 'B': set(X, y, T.BRICK); break;
          case '?': set(X, y, T.Q); A.q[k] = 'coin'; break;
          case 'M': set(X, y, T.Q); A.q[k] = 'power'; break;
          case 'U': set(X, y, T.Q); A.q[k] = '1up'; break;
          case 'S': set(X, y, T.BRICK); A.q[k] = 'star'; break;
          case 'C': set(X, y, T.BRICK); A.q[k] = 'multi'; A.qn[k] = 8; break;
          case 'P': set(X, y, T.BRICK); A.q[k] = 'power'; break;
          case 'H': set(X, y, T.HIDDEN); A.q[k] = '1up'; break;
          case 'o': set(X, y, T.COIN); break;
          case '#': set(X, y, T.SOLID); break;
          case 'G': set(X, y, T.GROUND); break;
          case '=': set(X, y, T.SEMI); break;
          case '-': set(X, y, T.BRIDGE); break;
          case 'c': set(X, y, T.CLOUD); break;
          case 'X': set(X, y, T.CASTLE); break;
          case 'L': set(X, y, T.LAVA); break;
          case 'u': set(X, y, T.USED); break;
          case 'I': set(X, y, T.ICE); break;
          case '~': set(X, y, T.QSAND); break;
          case '.': set(X, y, T.EMPTY); break;
        }
      }
      return api;
    },
    art(x, y, rows) { rows.forEach((r, j) => api.row(x, y + j, r)); return api; },
    stairs(x, n, dir = 1, base = 12) {
      for (let i = 0; i < n; i++) { const h = dir > 0 ? i + 1 : n - i; for (let k = 0; k < h; k++) set(x + i, base - k, T.SOLID); }
      return api;
    },
    coins(x, y, n) { for (let i = 0; i < n; i++) set(x + i, y, T.COIN); return api; },
    tree(x, y, len) {
      for (let i = 0; i < len; i++) set(x + i, y, T.SEMI);
      const tx = x + Math.floor((len - 1) / 2);
      for (let yy = y + 1; yy < ROWS; yy++) set(tx, yy, T.TRUNK);
      if (len >= 7) for (let yy = y + 1; yy < ROWS; yy++) set(tx + 1, yy, T.TRUNK);
      return api;
    },
    e(type, x, y, o = {}) { A.spawns.push({ type, x, y, ...o }); return api; },
    plat(x, y, o) { A.spawns.push({ type: 'plat', x, y, ...o }); return api; },
    fall(x, y, w = 2) { A.spawns.push({ type: 'fallplat', x, y, w }); return api; },
    ice(x0, x1, y = 13) { return api.fill(x0, y, x1, y, T.ICE); },
    qsand(x0, x1) { return api.fill(x0, 13, x1, 14, T.QSAND); },
    sink(x, y, w = 2) { A.spawns.push({ type: 'sinkplat', x, y, w }); return api; },
    flag(x) { A.flag = { x }; set(x, 12, T.SOLID); return api; },
    castle(x) { A.castle = { x }; return api; },
  };
  return api;
}
function tileAt(A, x, y) { return (x < 0 || x >= A.w) ? T.SOLID : (y < 0 || y >= ROWS) ? T.EMPTY : A.t[y * A.w + x]; }

function autoDecor(A, seed) {
  const r = rng(seed);
  const th = A.theme;
  const groundTopAt = (x) => { for (let y = 3; y < ROWS; y++) { const t = tileAt(A, x, y); if (t === T.GROUND) return y; if (t !== T.EMPTY) return -1; } return -1; };
  if (th === 'over' || th === 'cave') {
    let x = 3;
    while (x < A.w - 4) {
      const gy = groundTopAt(x);
      if (gy > 0 && groundTopAt(x + 1) === gy && groundTopAt(x + 2) === gy && groundTopAt(x + 3) === gy) {
        const k = r();
        if (th === 'over') {
          if (k < 0.45) { const w = [32, 40, 56][(r() * 3) | 0]; A.decor.push({ k: 'bush' + w, x: x * 16, y: gy * 16, layer: 0 }); x += w / 16 + 2; }
          else if (k < 0.65) { A.decor.push({ k: 'fence', x: x * 16, y: gy * 16 }); A.decor.push({ k: 'fence', x: x * 16 + 16, y: gy * 16 }); x += 4; }
          else if (k < 0.85) { for (let i = 0; i < 3; i++) A.decor.push({ k: 'flower' + (i % 3), x: x * 16 + i * 6 + 2, y: gy * 16 }); x += 3; }
          else x += 2;
        } else {
          if (k < 0.5) { A.decor.push({ k: 'crystal' + ((r() * 3) | 0), x: x * 16 + 1, y: gy * 16 }); x += 3; }
          else if (k < 0.62) { A.decor.push({ k: 'bush32', x: x * 16, y: gy * 16 }); x += 4; }
        }
      }
      x += 3 + ((r() * 7) | 0);
    }
  }
  if (th === 'ice' || th === 'desert') {
    let x = 3;
    while (x < A.w - 4) {
      const gy = groundTopAt(x);
      if (gy > 0 && groundTopAt(x + 1) === gy && groundTopAt(x + 2) === gy) {
        const k = r();
        if (th === 'ice') {
          if (k < 0.32) { A.decor.push({ k: 'pine', x: x * 16 - 4, y: gy * 16 + 1 }); x += 2; }
          else if (k < 0.44) { A.decor.push({ k: 'snowman', x: x * 16, y: gy * 16 + 1 }); x += 2; }
          else if (k < 0.72) { A.decor.push({ k: 'bush' + [32, 40][(r() * 2) | 0], x: x * 16, y: gy * 16 }); x += 3; }
        } else {
          if (k < 0.4) { A.decor.push({ k: 'cactus' + ((r() * 2) | 0), x: x * 16 - 1, y: gy * 16 + 1 }); x += 2; }
          else if (k < 0.58) { A.decor.push({ k: 'rock', x: x * 16, y: gy * 16 + 1 }); x += 2; }
          else if (k < 0.72) { A.decor.push({ k: 'bush32', x: x * 16, y: gy * 16 }); x += 3; }
        }
      }
      x += 3 + ((r() * 6) | 0);
    }
  }
  if (th === 'castle') {
    for (let x = 6; x < A.w - 2; x += 11) A.decor.push({ k: 'torch', x: x * 16 + 3, y: 7 * 16, anim: true });
  }
  if (th === 'sky') {
    for (let x = 0; x < A.w; x++) for (let y = 3; y < ROWS; y++) {
      if (tileAt(A, x, y) === T.SEMI && tileAt(A, x, y - 1) === T.EMPTY && r() < 0.18) A.decor.push({ k: 'flower' + ((r() * 3) | 0), x: x * 16 + 4, y: y * 16 });
    }
  }
}

const LEVELS = [
  {
    id: '1-1', name: 'YEŞİL VADİ', time: 300, make() {
      const A = newArea('over', 214), b = builder(A);
      b.ground(0, 68).ground(71, 86).ground(89, 150).ground(153, 213);
      A.decor.push({ k: 'sign', x: 6 * 16, y: 13 * 16 });
      b.row(12, 9, '?');
      b.row(18, 9, 'BMB?B'); b.row(20, 5, '?');
      b.e('kestane', 24, 12);
      b.pipe(28, 2); b.pipe(38, 3);
      b.e('kestane', 33, 12).e('kestane', 43, 12).e('kestane', 45, 12);
      b.pipe(50, 4, { warp: { area: 1, tx: 3, ty: 3, mode: 'drop' } });
      b.e('kestane', 56, 12).e('kestane', 58, 12);
      b.row(63, 8, 'H');
      b.coins(60, 10, 2);
      b.row(74, 9, 'BMB');
      b.row(78, 5, 'BBBBBBBB');
      b.e('kestane', 80, 4).e('kestane', 83, 4);
      b.row(92, 5, 'BBB?'); b.row(95, 9, 'C');
      b.e('beetle', 98, 12);
      b.row(101, 9, 'BS');
      b.row(106, 9, '?'); b.row(109, 9, '?'); b.row(112, 9, '?'); b.row(109, 5, 'M');
      b.e('kestane', 114, 12).e('kestane', 116, 12);
      b.row(118, 9, 'B'); b.row(121, 5, 'BBB');
      b.e('kestane', 124, 12).e('kestane', 126, 12);
      b.row(128, 5, 'B??B'); b.row(129, 9, 'BB');
      b.stairs(134, 4, 1); b.stairs(140, 4, -1);
      b.stairs(145, 5, 1); b.fill(150, 8, 150, 12, T.SOLID);
      b.stairs(153, 4, -1);
      b.pipe(161, 2); b.e('kestane', 165, 12).e('kestane', 167, 12);
      b.row(169, 9, 'BB?B');
      b.pipe(176, 2);
      b.stairs(180, 8, 1); b.fill(188, 5, 188, 12, T.SOLID);
      b.flag(197); b.castle(201);
      autoDecor(A, 11);
      // bonus room
      const R = newArea('cave', 28), rb = builder(R);
      rb.ground(0, 27).fill(0, 2, 27, 2, T.BRICK).fill(0, 3, 0, 12, T.BRICK).fill(27, 3, 27, 12, T.BRICK);
      rb.fill(5, 11, 19, 12, T.BRICK);
      rb.coins(5, 10, 15); rb.coins(6, 7, 13); rb.coins(8, 4, 9);
      rb.pipe(23, 2, { warp: { area: 0, tx: 176, ty: 11, mode: 'up' } });
      autoDecor(R, 5);
      return { areas: [A, R], start: { area: 0, x: 3, y: 12 }, checkpoint: 102 };
    }
  },
  {
    id: '1-2', name: 'KRİSTAL MAĞARA', time: 300, make() {
      const A = newArea('cave', 190), b = builder(A);
      b.ground(0, 44).ground(47, 79).ground(86, 119).ground(123, 189);
      b.fill(0, 2, 152, 2, T.BRICK).fill(0, 3, 0, 12, T.BRICK);
      b.row(10, 9, 'M???');
      b.e('beetle', 16, 12).e('kestane', 19, 12).e('kestane', 21, 12);
      b.fill(24, 11, 24, 12, T.SOLID).fill(26, 10, 26, 12, T.SOLID).fill(28, 9, 28, 12, T.SOLID).fill(30, 10, 30, 12, T.SOLID);
      b.row(24, 6, 'o o o o');
      b.art(33, 4, [
        'BBBBBBBBBB',
        'B        B',
        'B oooooo B',
        'B   U    B',
        'BBBB  BBBB']);
      b.e('kestane', 36, 12).e('kestane', 39, 12);
      b.pipe(50, 3, { piranha: true }); b.e('spiky', 55, 12); b.pipe(58, 2, { piranha: true }); b.e('spiky', 64, 12);
      b.row(66, 9, 'B?BCB'); b.row(71, 5, 'H');
      b.e('beetle', 75, 12);
      b.plat(81, 9, { w: 3, axis: 'y', dist: 40, period: 220 });
      b.coins(81, 4, 3);
      b.row(90, 9, 'BBBBBBBB'); b.coins(90, 8, 8);
      b.e('kestane', 94, 12).e('kestane', 96, 12);
      b.row(104, 9, 'S');
      b.e('spiky', 108, 12).e('spiky', 111, 12).e('spiky', 114, 12).e('kestane', 117, 12);
      b.row(127, 9, '?B?'); b.row(128, 5, 'M');
      b.e('beetle', 132, 12).e('beetle', 135, 12);
      b.pipe(139, 2, { piranha: true });
      b.row(144, 6, 'BBBBBB'); b.coins(144, 5, 6);
      b.e('kestane', 146, 12).e('kestane', 148, 12);
      b.stairs(160, 6, 1); b.fill(166, 7, 166, 12, T.SOLID);
      b.flag(176); b.castle(180);
      autoDecor(A, 22);
      return { areas: [A], start: { area: 0, x: 3, y: 12 }, checkpoint: 100 };
    }
  },
  {
    id: '1-3', name: 'BULUT TEPELERİ', time: 300, make() {
      const A = newArea('sky', 204), b = builder(A);
      b.ground(0, 14);
      b.tree(17, 10, 5).coins(18, 8, 3);
      b.tree(24, 7, 4).e('kestane', 26, 6);
      b.tree(31, 11, 6).e('beetle', 34, 10);
      b.tree(40, 8, 5).coins(41, 5, 3);
      b.plat(48, 9, { w: 3, axis: 'x', dist: 32, period: 200 });
      b.tree(54, 10, 5);
      b.tree(62, 7, 6).e('beetle', 65, 6);
      b.e('bee', 70, 7);
      b.tree(72, 11, 10).row(76, 7, 'B?B');
      b.e('kestane', 79, 10);
      b.tree(86, 8, 4);
      b.fall(92, 9).fall(96, 8).fall(100, 9);
      b.tree(105, 10, 6);
      b.e('bee', 111, 6);
      b.plat(113, 8, { w: 3, axis: 'y', dist: 36, period: 200 });
      b.tree(119, 7, 5).row(121, 3, 'M');
      b.e('bee', 124, 5);
      b.tree(125, 11, 7);
      b.plat(133, 8, { w: 3, axis: 'x', dist: 40, period: 240 });
      b.tree(140, 9, 7).e('kestane', 143, 8).e('kestane', 145, 8);
      b.row(149, 6, 'ccccc').coins(149, 5, 5);
      b.tree(156, 10, 6); b.e('bee', 160, 7);
      b.tree(164, 8, 4).e('spring', 165, 7);
      b.coins(164, 2, 4);
      b.ground(170, 203);
      b.stairs(176, 8, 1); b.fill(184, 5, 184, 12, T.SOLID);
      b.flag(193); b.castle(197);
      autoDecor(A, 33);
      return { areas: [A], start: { area: 0, x: 3, y: 12 }, checkpoint: 107 };
    }
  },
  {
    id: '1-4', name: 'BUZ GEÇİDİ', time: 300, make() {
      const A = newArea('ice', 200), b = builder(A);
      b.ground(0, 30).ground(34, 63).ground(67, 100).ground(104, 142).ground(146, 199);
      A.decor.push({ k: 'sign', x: 6 * 16, y: 13 * 16 });
      // warm-up: first slippery patch
      b.row(10, 9, '?');
      b.row(14, 9, 'B?BMB');
      b.ice(20, 27).coins(21, 10, 5);
      b.e('penguin', 25, 12);
      // icicle hall
      b.row(38, 6, 'BBBB?BBBBBBBBB');
      b.e('icicle', 40, 7).e('icicle', 43, 7).e('icicle', 47, 7).e('icicle', 50, 7);
      b.ice(41, 52).coins(44, 10, 3);
      b.e('penguin', 56, 12);
      b.row(58, 9, 'B?B');
      // snowy ledges + hidden 1UP
      b.row(69, 10, '====');
      b.row(74, 8, '====').coins(74, 7, 4);
      b.row(77, 4, 'H');
      b.row(80, 6, '====').coins(80, 4, 4);
      b.e('spiky', 78, 12);
      b.ice(87, 97);
      b.e('penguin', 91, 12).e('penguin', 96, 12);
      // checkpoint, star, long ice run with icicles
      b.row(108, 9, 'S');
      b.row(112, 9, 'BBB');
      b.e('icicle', 112, 10).e('icicle', 114, 10);
      b.ice(111, 138);
      b.row(121, 9, 'BBBB'); b.row(123, 5, '?M?');
      b.e('penguin', 119, 12).e('penguin', 127, 12).e('spiky', 131, 12).e('penguin', 135, 12);
      b.row(130, 6, 'BBBBB');
      b.e('icicle', 130, 7).e('icicle', 132, 7).e('icicle', 134, 7);
      // finale
      b.e('penguin', 152, 12);
      b.row(155, 9, 'B?B?B');
      b.ice(159, 168);
      b.e('spiky', 164, 12).e('penguin', 167, 12);
      b.stairs(172, 8, 1); b.fill(180, 5, 180, 12, T.SOLID);
      b.flag(189); b.castle(193);
      autoDecor(A, 55);
      return { areas: [A], start: { area: 0, x: 3, y: 12 }, checkpoint: 105 };
    }
  },
  {
    id: '1-5', name: 'KUM ÇÖLÜ', time: 300, make() {
      const A = newArea('desert', 206), b = builder(A);
      b.ground(0, 26);
      A.decor.push({ k: 'sign', x: 6 * 16, y: 13 * 16 });
      b.row(10, 9, '?');
      b.row(14, 9, 'B?BMB'); b.row(16, 5, '?');
      b.e('scorpion', 22, 12);
      // first quicksand pit with a sinking slab
      b.qsand(27, 30).sink(28, 11);
      b.ground(31, 64);
      b.row(36, 9, '?B?');
      b.e('tumble', 44, 11);
      b.e('scorpion', 48, 12).e('scorpion', 51, 12);
      b.row(55, 8, '=====').coins(55, 7, 5);
      b.row(58, 4, 'H');
      b.e('tumble', 62, 11);
      // the pyramid: climb over it or take the tunnel through its treasure room
      b.ground(65, 100);
      for (let y = 4; y <= 12; y++) { const k = 12 - y; b.fill(66 + k, y, 92 - k, y, T.SOLID); }
      const hollow = [];
      for (let x = 68; x <= 90; x++) for (let y = 9; y <= 10; y++) hollow.push([x, y]);
      for (let x = 73; x <= 85; x++) for (let y = 7; y <= 8; y++) hollow.push([x, y]);
      for (const [x, y] of hollow) {
        b.set(x, y, T.EMPTY);
        if (x >= 68 + (y < 9 ? 5 : 1) && x <= 90 - (y < 9 ? 5 : 1)) A.decor.push({ k: 'pyrwall', x: x * 16, y: (y + 1) * 16 });
      }
      b.row(76, 6, '??C??');
      b.coins(75, 8, 9);
      b.e('scorpion', 82, 10);
      b.coins(76, 3, 7);
      // checkpoint, then a quicksand field with stepping slabs
      b.e('scorpion', 97, 12);
      b.qsand(101, 111).sink(103, 11).sink(107, 10);
      b.ground(112, 150);
      b.row(116, 9, 'B?S?B');
      b.e('scorpion', 122, 12).e('scorpion', 126, 12);
      b.row(129, 8, '====').coins(129, 7, 4);
      b.row(134, 5, '====').coins(134, 4, 4);
      b.e('tumble', 140, 11);
      b.row(144, 9, '?M?');
      b.qsand(151, 158).sink(152, 11).sink(155, 10);
      b.ground(159, 205);
      b.e('scorpion', 164, 12).e('tumble', 172, 11);
      b.row(165, 9, '?B?');
      b.stairs(178, 8, 1); b.fill(186, 5, 186, 12, T.SOLID);
      b.flag(195); b.castle(199);
      autoDecor(A, 66);
      return { areas: [A], start: { area: 0, x: 3, y: 12 }, checkpoint: 97 };
    }
  },
  {
    id: '1-6', name: 'EJDER KALESİ', time: 300, make() {
      const A = newArea('castle', 176), b = builder(A);
      b.fill(0, 2, 175, 3, T.CASTLE);
      b.fill(0, 8, 14, 14, T.GROUND);
      b.lava(15, 17).e('podoboo', 16, 14);
      b.ground(18, 40);
      b.row(22, 9, 'M');
      b.set(27, 9, T.SOLID).e('firebar', 27, 9, { len: 6, speed: 0.035 });
      b.e('spiky', 32, 12).e('spiky', 36, 12);
      b.lava(41, 46).row(43, 10, '##').e('podoboo', 42, 14).e('podoboo', 45, 14, { delay: 60 });
      b.ground(47, 80);
      b.fill(52, 4, 64, 7, T.CASTLE);
      b.set(58, 8, T.SOLID).e('firebar', 58, 8, { len: 5, speed: -0.04 });
      b.e('kestane', 66, 12).e('kestane', 69, 12).e('beetle', 74, 12);
      b.lava(81, 88).plat(83, 10, { w: 3, axis: 'x', dist: 40, period: 220 });
      b.ground(89, 120);
      b.row(93, 9, 'U');
      b.set(98, 9, T.SOLID).e('firebar', 98, 9, { len: 6, speed: -0.04 });
      b.set(106, 6, T.SOLID).e('firebar', 106, 6, { len: 5, speed: 0.045 });
      b.e('spiky', 102, 12).e('beetle', 111, 12).e('kestane', 115, 12);
      b.lava(121, 123).e('podoboo', 122, 14, { delay: 30 });
      b.fill(124, 10, 130, 14, T.GROUND);
      b.lava(131, 147).fill(131, 10, 147, 10, T.BRIDGE);
      b.fill(148, 10, 175, 14, T.GROUND);
      A.bridge = { x0: 131, x1: 147, y: 10 };
      b.e('boss', 141, 9).e('axe', 148, 9).e('princess', 167, 9);
      autoDecor(A, 44);
      return { areas: [A], start: { area: 0, x: 2, y: 7 }, checkpoint: 90 };
    }
  },
];
