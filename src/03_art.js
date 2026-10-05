
// =====================================================================
//  ART — every sprite and tile is generated here
// =====================================================================
const K = '#1d1626';
const HERO_PAL = { K, C: '#e4572e', c: '#a8361c', w: '#fff4e0', S: '#ffc896', s: '#e09a6a', M: '#3b2416', E: K, G: '#2bb3a0', g: '#1a7d70', B: '#3f5bd8', b: '#2a3f9e', Y: '#ffd84a', O: '#7a3e1c' };
const FIRE_PAL = { ...HERO_PAL, C: '#f6f2ea', c: '#c4c0d4', w: '#e4572e', G: '#e4572e', g: '#a8361c', B: '#f6f2ea', b: '#c4c0d4', Y: '#e4572e' };
const STAR_PALS = [
  { ...HERO_PAL, C: '#ffd84a', c: '#c89a10', G: '#ff7a1a', g: '#b84a00', B: '#7a2ad8', b: '#4a1490' },
  { ...HERO_PAL, C: '#6af08a', c: '#2a9a4a', G: '#1d1626', g: '#000000', B: '#2bb3a0', b: '#1a7d70', S: '#ffe0b0' },
  { ...HERO_PAL, C: '#ffffff', c: '#c0c0d0', G: '#ff4a8a', g: '#b0205a', B: '#ffd84a', b: '#c89a10' },
];
const SM_HEAD = [
  '................',
  '.....KKKKK......',
  '....KCCwCCK.....',
  '...KCCCwCCCCK...',
  '...KccccccccccK.',
  '...KMSSSSESSK...',
  '...KSSSSSSSSSK..',
  '...KSSSMMMMMMK..',
  '....KSSSSSSKK...',
];
const SM_BODY = [
  '...KGGBGGGBGK...',
  '..KGGGBBBBBGGK..',
  '..KSKBYBBBYBKSK.',
  '..KSKBBBBBBBKSK.',
];
const SM_LEGS = {
  stand: ['...KKBBBBBBBKK..', '....KBBBKBBBK...', '...KOOOOKOOOOK..'],
  w1: ['...KKBBBBBBBKK..', '...KBBBK.KBBBK..', '..KOOOK...KOOOK.'],
  w2: ['...KKBBBBBBBKK..', '.....KBBBBK.....', '....KOOOOOOK....'],
  w3: ['...KKBBBBBBBKK..', '....KBBK.KBBK...', '...KOOOK.KOOOK..'],
};
const SM_JUMP = [
  '.KSKGGBGGGBGK...',
  '.KGGGGBBBBBGGKSK',
  '..KKKBYBBBYBKKK.',
  '....KBBBBBBBK...',
  '...KBBBBKBBBBK..',
  '..KOOOK...KBBK..',
  '..KKKK....KOOOK.',
];
const SM_DEAD = [
  '................',
  '.....KKKKK......',
  '....KCCwwCK.....',
  '...KCCwwwwCK....',
  '..KccccccccccK..',
  '..KSKKSSSSKKSK..',
  '..KSSWKSSKWSSK..',
  '..KSSSSSSSSSSK..',
  '..KSMMMMMMMMSK..',
  '.KSKSMKKKKMSKSK.',
  '.KSKGGBGGBGGKSK.',
  '..KKGGBBBBGGKK..',
  '...KBYBBBBYBK...',
  '...KBBBBBBBBK...',
  '...KOOOKKOOOK...',
  '...KKKK..KKKK...',
];
const BIG_HEAD = [
  '................',
  '.....KKKKKK.....',
  '....KCCCCCCK....',
  '...KCCCwwCCCK...',
  '...KCCwwwwCCCK..',
  '..KCCCCwwCCCCCK.',
  '..KccccccccccccK',
  '...KMSSSSSESSK..',
  '...KMSSSSSESSSK.',
  '...KSSSSSSSSSSSK',
  '...KSSSSMMMMMMMK',
  '...KSSSMMMMMMMK.',
  '....KSSSSSSSSK..',
  '....KKSSSSSSKK..',
];
const BIG_BODY = [
  '...KGGGBGGBGGGK.',
  '..KGGGGBGGBGGGK.',
  '.KGGGGGBBBBGGGGK',
  '.KGgGGBBBBBBGgGK',
  '.KGgGKBYBBYBKgGK',
  '.KGgGKBBBBBBKgGK',
  'KSSSKBBBBBBKSSSK',
  'KSSSKBBBBBBKSSSK',
  '.KKKBBBBBBBBKKK.',
  '...KBBBBBBBBK...',
];
const BIG_JUMP_BODY = [
  '...KGGGBGGBGGKSK',
  '..KGGGGBGGBGGKSK',
  '.KGGGGGBBBBGGGK.',
  '.KGgGGBBBBBBGGK.',
  '.KGgGKBYBBYBKK..',
  '.KGgGKBBBBBBK...',
  'KSSSKBBBBBBK....',
  'KSSSKBBBBBBK....',
  '.KKKBBBBBBBBK...',
  '...KBBBBBBBBK...',
];
const BIG_LEGS = {
  stand: ['...KBBBBBBBBK...', '...KBBBKKBBBK...', '...KBBBKKBBBK...', '...KbbbKKbbbK...', '..KOOOOKKOOOOK..', '..KOOOOKKOOOOOK.', '..KKKKKKKKKKKKK.', '................'],
  w1: ['..KBBBBKKBBBBK..', '..KBBBK..KBBBK..', '.KBBBK....KBBBK.', '.KbbbK....KbbbK.', 'KOOOOK....KOOOOK', 'KOOOOK....KOOOOK', 'KKKKKK....KKKKKK', '................'],
  w2: ['...KBBBBBBBBK...', '....KBBBBBBK....', '.....KBBBBK.....', '.....KbbbbK.....', '....KOOOOOOK....', '....KOOOOOOOK...', '....KKKKKKKKK...', '................'],
  w3: ['...KBBBKKBBBK...', '...KBBK..KBBK...', '..KBBK....KBBK..', '..KbbK....KbbK..', '.KOOOK...KOOOOK.', '.KOOOK...KOOOOK.', '.KKKKK...KKKKKK.', '................'],
};
const BIG_DUCK_BODY = [
  '.KGGGBBBBBBGGGK.',
  'KSSKBBYBBYBBKSSK',
  '.KKBBBBBBBBBBKK.',
  '..KOOOOKKOOOOK..',
  '..KKKKKKKKKKKKK.',
  '................',
];

function heroFrames(pal) {
  const S = {};
  const mk = rows => withFlip(fromStrings(rows, pal, 16));
  S.s_stand = mk([...SM_HEAD, ...SM_BODY, ...SM_LEGS.stand]);
  S.s_w1 = mk([...SM_HEAD, ...SM_BODY, ...SM_LEGS.w1]);
  S.s_w2 = mk([...SM_HEAD, ...SM_BODY, ...SM_LEGS.w2]);
  S.s_w3 = mk([...SM_HEAD, ...SM_BODY, ...SM_LEGS.w3]);
  S.s_jump = mk([...SM_HEAD, ...SM_JUMP]);
  S.s_skid = S.s_w3;
  S.s_dead = mk(SM_DEAD);
  const jhead = BIG_HEAD.slice(); jhead[12] = '....KSSSSSSSSKKK'; jhead[13] = '....KKSSSSSSKKSK';
  S.b_stand = mk([...BIG_HEAD, ...BIG_BODY, ...BIG_LEGS.stand]);
  S.b_w1 = mk([...BIG_HEAD, ...BIG_BODY, ...BIG_LEGS.w1]);
  S.b_w2 = mk([...BIG_HEAD, ...BIG_BODY, ...BIG_LEGS.w2]);
  S.b_w3 = mk([...BIG_HEAD, ...BIG_BODY, ...BIG_LEGS.w3]);
  S.b_jump = mk([...jhead, ...BIG_JUMP_BODY, ...BIG_LEGS.w1]);
  S.b_skid = S.b_w3;
  const blank = Array(12).fill('................');
  S.b_duck = mk([...blank, ...BIG_HEAD, ...BIG_DUCK_BODY]);
  // throwing pose: arm forward
  const tb = BIG_BODY.slice(); tb[6] = 'KSSSKBBBBBBKKSSK'; tb[7] = 'KSSSKBBBBBBK.KK.'; tb[4] = '.KGgGKBYBBYBGGGK'; tb[5] = '.KGgGKBBBBBBGSSK';
  S.b_throw = mk([...BIG_HEAD, ...tb, ...BIG_LEGS.stand]);
  return S;
}

// --- enemies & items built with shapes + auto outline ---
function makeKestane() {
  const pal = { K, N: '#8b4a24', L: '#c47a3c', W: '#fff4e0', F: '#f0c878', D: '#3a2010' };
  const body = [
    '................',
    '......KKKK......',
    '....KKNNNNKK....',
    '...KNNLNNNNNK...',
    '..KNNLLNNNNNNK..',
    '..KNLLNNNNNNNK..',
    '.KNNNNNNNNNNNNK.',
    '.KNWWKNNNNKWWNK.',
    '.KNWKKNNNNKKWNK.',
    '.KNNNNNNNNNNNNK.',
    '..KNNKKKKKKNNK..',
    '...KKFFFFFFKK...',
    '....KFFFFFFK....',
    '...KDDKKKKDDK...',
  ];
  const f1 = fromStrings([...body, '..KDDDK...KDDK..', '..KKKKK...KKKK..'], pal, 16);
  const f2 = flipH(f1);
  const flat = fromStrings(['................', '................', '................', '................', '................', '................', '................', '................', '................', '................',
    '..KKKKKKKKKKKK..', '.KNNLLNNNNNNNNK.', 'KNWKKNNNNNNKKWNK', 'KNNNNKKKKKKNNNNK', '.KDDDKKKKKKDDDK.', '.KKKKK....KKKKK.'], pal, 16);
  return { walk: [f1, f2], flat, dead: flipV(f1) };
}
function makeBeetle() {
  const out = { walk: [], shell: [] };
  for (let f = 0; f < 2; f++) {
    const p = new Pix(16, 16);
    p.ell(9.5, 11, 5.5, 6.5, '#6a3fc8', (x, y) => y <= 11);
    p.ell(8, 7.5, 2.6, 1.6, '#a98aff');
    p.px(10, 6, '#d8c8ff');
    p.paint((x, y) => (x + y) % 4 === 0 && y > 8 && y <= 11, '#55309e');
    p.rect(4, 12, 12, 1, '#3e2380');
    p.ell(3.4, 10.6, 2.4, 2.2, '#f0b84a');
    p.px(2, 10, '#ffffff'); p.px(2, 9, '#ffffff'); p.px(1, 10, K);
    const lx = f ? [5, 9, 13] : [6, 10, 13];
    for (const x of lx) p.rect(x, 13, 2, 1, '#2a1a3a'), p.px(x + (f ? 0 : 1), 14, '#2a1a3a');
    p.outline(K);
    out.walk.push(p.canvas());
  }
  for (let f = 0; f < 4; f++) {
    const p = new Pix(16, 16);
    p.ell(8, 10.5, 6.5, 5, '#6a3fc8');
    p.rect(2, 12, 12, 2, '#3e2380');
    p.ell(6.5, 8, 2.4, 1.4, '#a98aff');
    for (let x = 0; x < 16; x++) if ((x + f * 2) % 6 < 2) for (let y = 7; y <= 11; y++) if (p.get(x, y) === c32('#6a3fc8')) p.px(x, y, '#55309e');
    p.outline(K);
    out.shell.push(p.canvas());
  }
  out.walk = out.walk.map(withFlip);
  out.dead = flipV(out.shell[0]);
  return out;
}
function makeBee() {
  const fr = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(16, 16);
    if (f === 0) { p.ell(8, 4.5, 3, 3, '#e8f6ff'); p.ell(11.5, 5, 2.4, 2.6, '#cfe8ff'); }
    else { p.ell(8.5, 7.5, 4, 1.6, '#e8f6ff'); p.ell(12, 7.5, 2.5, 1.4, '#cfe8ff'); }
    p.ell(9, 10.5, 5, 3.6, '#ffd84a');
    p.paint((x, y) => x === 8 || x === 11 || x === 9 && y > 12, K);
    p.paint((x, y) => y === 8 && x > 5, '#fff4a0');
    p.ell(4, 9.5, 2.6, 2.6, '#3b2416');
    p.px(3, 8, '#ffffff'); p.px(3, 9, '#ffffff'); p.px(2, 9, '#ff5a5a');
    p.px(14, 11, K); p.px(15, 11, '#3b2416');
    p.px(4, 6, K); p.px(3, 5, K);
    p.outline(K);
    fr.push(withFlip(p.canvas()));
  }
  return { fly: fr, dead: flipV(fr[0][0]) };
}
function makeSpiky() {
  const fr = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(16, 16);
    // spikes
    for (let i = 0; i < 6; i++) {
      const x = 4 + i * 2, h = 3 + (i % 2);
      for (let j = 0; j < h; j++) p.px(x + (j > 1 ? 1 : 0), 7 - j, '#e8e2f0');
    }
    p.ell(9, 11, 6, 4.5, '#7a4a2a', (x, y) => y <= 13);
    p.paint((x, y) => y < 10 && (x + y) % 3 === 0, '#5a321a');
    p.paint((x, y) => y <= 7, '#d8d0e8');
    p.ell(3.8, 11.8, 2.6, 2.2, '#f0c8a0');
    p.px(3, 11, K); p.px(1, 12, '#3b2416');
    const fx = f ? [5, 11] : [7, 12];
    for (const x of fx) p.rect(x, 14, 2, 1, '#3b2416');
    p.outline(K);
    fr.push(withFlip(p.canvas()));
  }
  return { walk: fr, dead: flipV(fr[0][0]) };
}
function makePiranha() {
  const fr = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(16, 24);
    p.rect(7, 12, 2, 12, '#2fa84a');
    p.ell(4, 18, 3.2, 1.6, '#3cc85a'); p.ell(12, 20, 3.2, 1.6, '#3cc85a');
    p.ell(8, 7, 6.5, 6.2, '#d8343a');
    p.paint((x, y) => (x * 3 + y * 5) % 7 === 0, '#fff4e0');
    const open = f === 0 ? 3.2 : 1.2;
    p.ell(8, 4.5, 3.4, open, '#3a0a14');
    if (f === 0) { p.px(6, 2, '#ffffff'); p.px(9, 2, '#ffffff'); p.px(7, 7, '#ffffff'); p.px(10, 7, '#ffffff'); }
    p.outline(K);
    fr.push(p.canvas());
  }
  return fr;
}
function makeBoss() {
  const fr = [];
  for (let f = 0; f < 3; f++) {
    const p = new Pix(32, 32);
    // tail
    p.ell(29, 24, 2.5, 2, '#3ea85a');
    // shell
    p.ell(19, 18, 10, 9, '#2f7a3e', (x, y) => y <= 22);
    for (let i = 0; i < 5; i++) { const sx = 12 + i * 4; for (let j = 0; j < 4; j++) { p.px(sx + (j > 2 ? 1 : 0), 10 - j + Math.abs(i - 2), '#f6f2ea'); p.px(sx + 1, 10 - j + Math.abs(i - 2) + 1, '#c4c0d4'); } }
    p.paint((x, y) => y <= 22 && y > 10 && (x + y) % 5 === 0, '#245c30');
    p.rect(9, 22, 21, 2, '#ffd84a');
    // belly & legs
    p.ell(15, 24, 6, 6, '#f0d080');
    p.paint((x, y) => y > 22 && y % 3 === 0 && x > 10 && x < 20, '#c8a050');
    const lo = f === 1 ? 1 : 0;
    p.rect(11 + lo, 28, 5, 3, '#3ea85a'); p.rect(20 - lo, 28, 5, 3, '#3ea85a');
    p.rect(10 + lo, 30, 6, 1, '#f6f2ea'); p.rect(19 - lo, 30, 6, 1, '#f6f2ea');
    // arm
    p.ell(10, 21, 2.5, 2.5, '#3ea85a'); p.px(8, 22, '#f6f2ea'); p.px(8, 20, '#f6f2ea');
    // head
    p.ell(8, 11, 6.5, 5.5, '#3ea85a');
    p.ell(5, 13, 4.5, 3, '#6ad07a');
    p.px(9, 4, '#f6f2ea'); p.px(10, 4, '#f6f2ea'); p.px(10, 3, '#f6f2ea'); p.px(11, 2, '#f6f2ea');
    p.px(4, 5, '#f6f2ea'); p.px(4, 4, '#f6f2ea'); p.px(3, 3, '#f6f2ea');
    p.rect(5, 8, 3, 2, '#ffffff'); p.px(5, 9, '#d8343a'); p.px(5, 8, K);
    p.rect(4, 7, 5, 1, K);
    if (f === 2) { p.ell(3, 14, 3, 2, '#3a0a14'); p.px(2, 12, '#ffffff'); p.px(4, 16, '#ffffff'); }
    else { p.rect(1, 14, 7, 1, K); p.px(3, 15, '#ffffff'); p.px(6, 15, '#ffffff'); }
    p.px(1, 12, K);
    p.outline(K);
    fr.push(withFlip(p.canvas()));
  }
  return fr;
}
function makePrincess() {
  const p = new Pix(16, 32);
  p.ell(8, 25, 6.5, 7, '#ff7aa8', (x, y) => y >= 17);
  p.paint((x, y) => y > 26 && (x + y) % 4 === 0, '#e0508a');
  p.rect(5, 16, 6, 5, '#ff9ac0');
  p.rect(4, 17, 1, 4, '#ffc896'); p.rect(11, 17, 1, 4, '#ffc896');
  p.ell(8, 10, 4.2, 4.6, '#ffc896');
  p.ell(8, 8, 5, 4, '#f08a2e', (x, y) => y <= 8 || x <= 4 || x >= 12);
  p.rect(3, 9, 2, 8, '#f08a2e'); p.rect(11, 9, 2, 8, '#f08a2e');
  p.px(6, 10, K); p.px(10, 10, K); p.px(7, 13, '#d8343a'); p.px(8, 13, '#d8343a');
  p.px(5, 12, '#ffa0a0'); p.px(11, 12, '#ffa0a0');
  p.rect(5, 3, 7, 2, '#ffd84a'); p.px(5, 2, '#ffd84a'); p.px(8, 1, '#ffd84a'); p.px(8, 2, '#ffd84a'); p.px(11, 2, '#ffd84a'); p.px(8, 3, '#2bb3a0');
  p.outline(K);
  return p.canvas();
}
function makeMushroom(cap, dots) {
  const p = new Pix(16, 16);
  p.ell(8, 7, 7, 6, cap, (x, y) => y <= 9);
  p.paint((x, y) => (Math.hypot(x - 4.5, y - 5.5) < 1.8) || (Math.hypot(x - 10.5, y - 4) < 2) || (Math.hypot(x - 8, y - 8.5) < 1.2), dots);
  p.ell(8, 12, 4.5, 3.5, '#fff4e0', (x, y) => y >= 10);
  p.px(6, 11, K); p.px(6, 12, K); p.px(9, 11, K); p.px(9, 12, K);
  p.outline(K);
  return p.canvas();
}
function makeFlower() {
  const fr = [];
  const sets = [['#ff7a1a', '#ffd84a'], ['#ffd84a', '#ff4a4a'], ['#ff4a4a', '#fff4e0'], ['#fff4e0', '#ff7a1a']];
  for (const [a, b] of sets) {
    const p = new Pix(16, 16);
    p.rect(7, 9, 2, 6, '#2fa84a'); p.ell(4.5, 12, 3, 1.4, '#3cc85a'); p.ell(11.5, 12, 3, 1.4, '#3cc85a');
    for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2; p.ell(8 + Math.cos(an) * 3.6, 5.5 + Math.sin(an) * 3.2, 2.2, 2.2, a); }
    p.ell(8, 5.5, 2.4, 2.2, b);
    p.px(7, 5, K); p.px(9, 5, K);
    p.outline(K);
    fr.push(p.canvas());
  }
  return fr;
}
function makeStar() {
  const fr = [];
  for (const col of ['#ffd84a', '#ffb02e', '#fff4a0', '#ffe060']) {
    const p = new Pix(16, 16);
    const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7.2, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([8 + Math.cos(a) * r, 8.4 + Math.sin(a) * r]); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) p.px(x, y, col);
    }
    p.px(6, 7, K); p.px(6, 8, K); p.px(9, 7, K); p.px(9, 8, K);
    p.outline(K);
    fr.push(p.canvas());
  }
  return fr;
}
function makeCoin(w = 16, h = 16) {
  const fr = [];
  const widths = [5.5, 3.8, 1.2, 3.8];
  for (let f = 0; f < 4; f++) {
    const p = new Pix(w, h);
    const rx = widths[f] * w / 16, cx = w / 2, cy = h / 2, ry = 6.5 * h / 16;
    p.ell(cx, cy, rx, ry, '#f8b800');
    if (rx > 2) { p.ell(cx, cy, rx - 1.6, ry - 1.6, '#ffd84a'); p.paint((x, y) => Math.abs(x + .5 - cx) < 0.9 && Math.abs(y + .5 - cy) < ry - 2.5, '#c88400'); p.px(cx - rx + 1.6, cy - 2, '#fff8c8'); }
    else p.paint(() => true, '#ffe890');
    p.outline('#7a4a00');
    fr.push(p.canvas());
  }
  return fr;
}
function makeFireball() {
  const fr = [];
  for (let f = 0; f < 4; f++) {
    const p = new Pix(8, 8);
    p.ell(4, 4, 3.4, 3.4, '#ff6a1a'); p.ell(4, 4, 2.2, 2.2, '#ffd84a');
    const a = f * Math.PI / 2;
    p.px(4 + Math.round(Math.cos(a) * 3), 4 + Math.round(Math.sin(a) * 3), '#fff4e0');
    p.px(4 + Math.round(Math.cos(a + Math.PI) * 2), 4 + Math.round(Math.sin(a + Math.PI) * 2), '#e4372e');
    fr.push(p.canvas());
  }
  return fr;
}
function makeBossFire() {
  const fr = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(24, 10);
    p.ell(6, 5, 5.5, 4, '#ff6a1a'); p.ell(14, 5, 6, 3 - f * .5, '#ff8a2a'); p.ell(20, 5, 4, 2 + f * .5, '#ffb02e');
    p.ell(7, 5, 3.4, 2.2, '#ffd84a'); p.ell(5, 5, 1.6, 1.2, '#fff4e0');
    fr.push(p.canvas());
  }
  return fr;
}
function makeAxe() {
  const fr = [];
  for (let f = 0; f < 3; f++) {
    const p = new Pix(16, 16);
    p.rect(7, 2, 2, 14, '#8a5a2a');
    p.ell(4.5, 5.5, 4, 4.5, ['#c8d0e0', '#e8f0ff', '#ffffff'][f], (x) => x <= 7);
    p.paint((x, y) => x <= 2, '#f6f8ff');
    p.rect(9, 3, 2, 4, '#9aa0b0');
    p.outline(K);
    fr.push(p.canvas());
  }
  return fr;
}
function makeHeart() { return fromStrings(['.KK.KK.', 'KRRKRRK', 'KRWRRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...'], { K, R: '#ff4a6a', W: '#ffd0d8' }); }
function makeMiniCoin() { return fromStrings(['.KKK.', 'KYYOK', 'KYWOK', 'KYYOK', 'KYYOK', 'KYYOK', '.KKK.'], { K: '#7a4a00', Y: '#ffd84a', O: '#f8b800', W: '#fff8c8' }); }
function makeDebris(col, dark) {
  const p = new Pix(8, 8); p.ell(4, 4, 3.4, 3.4, col); p.paint((x, y) => x + y > 7, dark); p.outline(K); return p.canvas();
}
function makeSpring() {
  const fr = [];
  for (const h of [16, 11, 7]) {
    const p = new Pix(16, 16);
    const top = 16 - h;
    p.rect(1, top, 14, 3, '#e4572e'); p.rect(1, 13, 14, 3, '#e4572e');
    for (let y = top + 3; y < 13; y++) p.px(4 + ((y - top) % 4 < 2 ? 0 : 6), y, '#c4c0d4'), p.px(5 + ((y - top) % 4 < 2 ? 6 : 0), y, '#9aa0b0');
    p.rect(2, top, 12, 1, '#ff9a70');
    p.outline(K);
    fr.push(p.canvas());
  }
  return fr;
}
// --- ice & desert creatures (drawn facing left, like the others) ---
function makePenguin() {
  const BODY = '#2a3458', DARK = '#1a2040', WH = '#f4f8ff', OR = '#ffa82e', SC = '#e4572e';
  const walk = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(16, 16);
    p.ell(8.5, 10, 5.5, 5.6, BODY);
    p.ell(7.2, 11, 3.4, 4, WH);
    p.ell(8.5, 4.8, 4, 3.6, BODY);
    p.ell(6.6, 5.4, 2.2, 2, WH);
    p.px(6, 4, K); p.px(6, 5, K); p.px(7, 4, '#ffffff');
    p.rect(2, 5, 3, 2, OR); p.px(2, 6, '#c8741a');
    p.rect(4, 8, 9, 2, SC); p.rect(11, 10, 2, 2 + f, SC); p.paint((x, y) => y === 8 && p.get(x, y) === c32(SC), '#ff8a5a');
    p.ell(13.2, 11.5 - f, 1.4, 2.8, DARK);
    for (const x of f ? [5, 9] : [6, 10]) p.rect(x, 15, 3, 1, OR);
    p.outline(K);
    walk.push(withFlip(p.canvas()));
  }
  const s = new Pix(16, 16);
  s.ell(9.5, 11.5, 6.2, 3.6, BODY);
  s.ell(9.5, 13.2, 5, 1.8, WH);
  s.ell(4, 10.5, 3, 3, BODY);
  s.ell(3.4, 11.4, 1.8, 1.5, WH);
  s.px(3, 10, K); s.rect(0, 11, 2, 1, OR);
  s.rect(6, 8, 2, 6, SC); s.rect(8, 7, 3, 1, SC);
  s.ell(10, 9, 3, 1, DARK);
  s.rect(15, 10, 1, 2, OR);
  s.outline(K);
  const slide = withFlip(s.canvas());
  return { walk, slide, dead: flipV(walk[0][0]) };
}
function makeScorpion() {
  const B = '#d8822e', D = '#a8561a', L = '#f0b060';
  const walk = [];
  for (let f = 0; f < 2; f++) {
    const p = new Pix(16, 16);
    for (const [x, y] of [[13.4, 11], [14.6, 9], [14.6, 7], [13.6, 5.2], [11.8, 4.2], [10, 4.4]]) p.ell(x, y, 1.5, 1.4, B);
    p.px(14, 9, L); p.px(13, 5, L);
    p.rect(8, 5, 2, 2, '#4a2010'); p.px(8, 7, '#4a2010');
    p.ell(9.2, 12, 4.6, 2.6, B);
    p.paint((x, y) => y >= 10 && y <= 13 && x > 5 && x % 3 === 1, D);
    p.paint((x, y) => y === 10 && x > 5 && x < 13, L);
    p.ell(4.6, 12, 2.4, 2.2, B);
    p.px(4, 11, K); p.px(3, 11, '#ffffff');
    p.rect(2, 10 - f, 2, 1, B);
    p.ell(1.6, 9.2 - f, 1.6, 1.4, L); p.px(0, 9 - f, 0);
    p.rect(2, 13, 2, 1, B); p.ell(1.4, 13.2, 1.4, 1.2, L);
    for (const x of f ? [6, 9, 12] : [5, 8, 11]) { p.px(x, 14, '#6a3010'); p.px(x + (f ? -1 : 1), 15, '#6a3010'); }
    p.outline(K);
    walk.push(withFlip(p.canvas()));
  }
  return { walk, dead: flipV(walk[0][0]) };
}
function makeTumbleweed() {
  const fr = [];
  for (let f = 0; f < 4; f++) {
    const p = new Pix(16, 16), a0 = -f * Math.PI / 8;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + .5 - 8, dy = y + .5 - 8.5, r = Math.hypot(dx, dy);
      if (r > 7.2) continue;
      const ang = Math.atan2(dy, dx) + a0;
      const v1 = Math.sin(ang * 5 + r * 1.25), v2 = Math.sin(ang * 3 - r * 1.6 + 1);
      if (Math.abs(v1) < 0.3) p.px(x, y, r < 3.5 ? '#8a6428' : '#c49a52');
      else if (Math.abs(v2) < 0.22) p.px(x, y, '#a8803c');
      else if (r > 6.2 && hash(x, y) < 0.5) p.px(x, y, '#c49a52');
    }
    p.paint((x, y) => !p.get(x - 1, y - 1) && y < 9, '#ecc87a');
    p.outline('#4a3418');
    fr.push(p.canvas());
  }
  return { roll: fr, dead: flipV(fr[0]) };
}
function makeIcicle() {
  const p = new Pix(16, 16);
  p.rect(3, 0, 10, 2, '#e8f6ff'); p.rect(3, 0, 10, 1, '#ffffff');
  for (let y = 2; y < 16; y++) {
    const half = 3.6 * (1 - (y - 2) / 14.5);
    for (let x = 0; x < 16; x++) {
      const dx = x + .5 - 8;
      if (Math.abs(dx) <= half + 0.3) p.px(x, y, dx < -half * 0.35 ? '#f4fcff' : dx > half * 0.35 ? '#5aa8e0' : '#a8e0fc');
    }
  }
  p.outline('#1e3a78');
  return p.canvas();
}
function makeSandSlab() {
  const p = new Pix(32, 10);
  p.rect(0, 0, 32, 10, K);
  p.rect(1, 1, 30, 8, '#d89a50');
  p.rect(1, 1, 30, 2, '#f8d890');
  p.rect(1, 8, 30, 1, '#a86a30');
  p.rect(11, 3, 1, 5, '#a86a30'); p.rect(21, 3, 1, 5, '#a86a30');
  for (let x = 1; x < 31; x++) for (let y = 3; y < 8; y++) if (hash(x + 9, y + 31) < 0.1) p.px(x, y, '#f0c070');
  return p.canvas();
}

// ---------- tiles ----------
const T = { EMPTY: 0, GROUND: 1, BRICK: 2, Q: 3, USED: 4, SOLID: 5, PTL: 6, PTR: 7, PL: 8, PR: 9, SEMI: 10, BRIDGE: 11, LAVA: 12, COIN: 13, HIDDEN: 14, CASTLE: 15, TRUNK: 16, CLOUD: 17, ICE: 18, QSAND: 19 };
const SOLID_ID = new Uint8Array(32);
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 17, 18]) SOLID_ID[id] = 1;

const THEMES = {
  over: {
    grass: ['#5ec948', '#3a9a34', '#a4ec74'], dirt: ['#c97a40', '#9a5528', '#e8a468'],
    brick: ['#c8572a', '#6e2810', '#f09060'], solid: ['#b88a5a', '#6e4a2a', '#e8c098'], semi: ['#ff7a5a', '#b8402a', '#ffc0a0'],
    music: 'over'
  },
  cave: {
    grass: ['#5a78e8', '#2e3a8a', '#a8c0ff'], dirt: ['#3a3f7a', '#23264a', '#5a62a8'],
    brick: ['#4a5ab8', '#1a2050', '#8a9eff'], solid: ['#5a5a8a', '#2a2a4a', '#9a9ac8'], semi: ['#2bb3a0', '#1a6d60', '#8af0d8'],
    music: 'cave'
  },
  sky: {
    grass: ['#ffffff', '#c8d8f0', '#ffffff'], dirt: ['#e0e8f8', '#b8c8e8', '#ffffff'],
    brick: ['#d8743a', '#7a3010', '#ffb070'], solid: ['#c8a070', '#7a5a30', '#f0d0a0'], semi: ['#5ec948', '#2a7a2a', '#b8f088'],
    music: 'sky'
  },
  castle: {
    grass: ['#8a8a9a', '#4a4658', '#c4c0d4'], dirt: ['#6a6678', '#3a3648', '#8a8698'],
    brick: ['#8a8a9a', '#3a3648', '#c4c0d4'], solid: ['#6a6678', '#2a2638', '#a4a0b4'], semi: ['#8a5a2a', '#4a2a10', '#c08a50'],
    music: 'castle'
  },
  ice: {
    grass: ['#eef6ff', '#a8c4e4', '#ffffff'], dirt: ['#5a6ea8', '#3a4a80', '#8aa0d0'],
    brick: ['#7ab8e8', '#2a5a98', '#d8f4ff'], solid: ['#a8dcf8', '#4a88c0', '#f0fbff'], semi: ['#e8f6ff', '#7aa8d8', '#ffffff'],
    music: 'ice'
  },
  desert: {
    grass: ['#f4d080', '#d0a050', '#fff0b8'], dirt: ['#d89a50', '#a86a30', '#f0c078'],
    brick: ['#e8b060', '#9a5a20', '#ffe0a0'], solid: ['#d8a058', '#8a5420', '#f8d090'], semi: ['#2bb3a0', '#1a6d60', '#8af0d8'],
    music: 'desert'
  },
};
function tileArt(theme) {
  const th = THEMES[theme], out = {};
  const pal = (arr) => ({ b: arr[0], d: arr[1], l: arr[2] });
  // ground (fill)
  const dirt = pal(th.dirt), grass = pal(th.grass);
  const gfill = new Pix(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash(x + 3, y + 7);
    gfill.px(x, y, h < 0.08 ? dirt.d : h > 0.94 ? dirt.l : dirt.b);
  }
  if (theme === 'castle') { gfill.rect(0, 0, 16, 1, dirt.d); gfill.rect(0, 8, 16, 1, dirt.d); gfill.rect(0, 0, 1, 8, dirt.d); gfill.rect(8, 8, 1, 8, dirt.d); gfill.rect(1, 1, 15, 1, dirt.l); gfill.rect(0, 9, 8, 1, dirt.l); gfill.rect(9, 9, 7, 1, dirt.l); }
  if (theme === 'cave') { for (let i = 0; i < 3; i++) { const x = (hash(i, 9) * 14) | 0, y = (hash(i, 4) * 14) | 0; gfill.px(x, y, '#8af0ff'); } }
  if (theme === 'desert') for (let x = 0; x < 16; x++) { gfill.px(x, 5 + ((x >> 2) % 2), dirt.d); gfill.px(x, 12 + (x % 7 === 3 ? 1 : 0), dirt.l); }
  if (theme === 'ice') { for (let i = 0; i < 4; i++) { const x = (hash(i, 19) * 15) | 0, y = (hash(i, 23) * 15) | 0; gfill.px(x, y, '#c8ecff'); gfill.px(x + 1, y, '#a8c8f0'); } }
  out.gfill = gfill.canvas();
  const gtop = new Pix(16, 16);
  gtop.d.set(gfill.d);
  if (theme === 'castle') { gtop.rect(0, 0, 16, 2, grass.l); gtop.rect(0, 2, 16, 1, grass.d); }
  else {
    for (let x = 0; x < 16; x++) {
      const depth = 4 + (hash(x, 1) < 0.35 ? 1 : 0) + (x % 5 === 2 ? 1 : 0);
      for (let y = 0; y < depth; y++) gtop.px(x, y, y === 0 ? grass.l : y === depth - 1 ? grass.d : grass.b);
      if (hash(x, 2) < 0.25) gtop.px(x, 1, grass.l);
      if (theme === 'ice' && (x === 3 || x === 11)) { gtop.px(x, depth, grass.d); gtop.px(x, depth + 1, '#c8ecff'); if (x === 11) gtop.px(x, depth + 2, '#c8ecff'); }
      if (theme === 'desert' && hash(x, 5) < 0.2) gtop.px(x, 2, grass.d);
    }
  }
  out.gtop = gtop.canvas();
  // brick
  const br = pal(th.brick), bp = new Pix(16, 16);
  bp.rect(0, 0, 16, 16, br.b);
  for (let y = 0; y < 16; y++) {
    if (y % 4 === 3) bp.rect(0, y, 16, 1, br.d);
    const off = (y >> 2) % 2 ? 4 : 12;
    if (y % 4 !== 3) { bp.px(off, y, br.d); bp.px((off + 8) % 16, y, br.d); }
    if (y % 4 === 0) for (let x = 0; x < 16; x++) if (x !== off && x !== (off + 8) % 16 && x !== off - 1 && x !== (off + 7) % 16) bp.px(x, y, br.l);
  }
  out.brick = bp.canvas();
  // solid block (bevel)
  const so = pal(th.solid), sp = new Pix(16, 16);
  sp.rect(0, 0, 16, 16, so.b);
  sp.rect(0, 0, 16, 1, so.l); sp.rect(0, 0, 1, 16, so.l); sp.rect(1, 1, 14, 1, so.l); sp.rect(1, 1, 1, 14, so.l);
  sp.rect(0, 15, 16, 1, so.d); sp.rect(15, 0, 1, 16, so.d); sp.rect(1, 14, 14, 1, so.d); sp.rect(14, 1, 1, 14, so.d);
  sp.rect(4, 4, 8, 8, so.b); sp.rect(4, 4, 8, 1, so.d); sp.rect(4, 4, 1, 8, so.d); sp.rect(4, 11, 8, 1, so.l); sp.rect(11, 4, 1, 8, so.l);
  out.solid = sp.canvas();
  // question block frames
  const qcols = ['#ffd84a', '#ffe680', '#f8c020', '#ffd84a'];
  out.q = qcols.map((qc, f) => {
    const p = new Pix(16, 16);
    p.rect(0, 0, 16, 16, '#f8a800'); p.rect(1, 1, 14, 14, qc);
    p.rect(0, 15, 16, 1, '#7a4a00'); p.rect(15, 0, 1, 16, '#7a4a00'); p.rect(0, 0, 16, 1, '#c87a00'); p.rect(0, 0, 1, 16, '#c87a00');
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) p.px(x, y, '#7a4a00');
    const qm = ['..KKKK..', '.KK..KK.', '.....KK.', '....KK..', '...KK...', '...KK...', '........', '...KK...'];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (qm[y][x] === 'K') { p.px(x + 4, y + 4, f === 1 ? '#e4572e' : '#a8361c'); p.px(x + 5, y + 5, '#c87a00'); }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (qm[y][x] === 'K') p.px(x + 4, y + 4, f === 1 ? '#ff7a3a' : '#c84a1c');
    return p.canvas();
  });
  const up = new Pix(16, 16);
  up.rect(0, 0, 16, 16, '#7a4a2a'); up.rect(1, 1, 14, 14, '#9a6a3a'); up.rect(0, 15, 16, 1, '#3a2010'); up.rect(15, 0, 1, 16, '#3a2010');
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) up.px(x, y, '#3a2010');
  out.used = up.canvas();
  // pipes
  const PG = ['#3cc85a', '#1e7a34', '#a8f0a0', '#0e4a1e'];
  const pipeCol = (p, x0, x1, light) => {
    for (let x = x0; x <= x1; x++) {
      const rel = (x - x0) / (x1 - x0);
      let c = PG[0];
      if (rel < 0.12) c = PG[1]; else if (rel < 0.3 && light) c = PG[2]; else if (rel > 0.75) c = PG[1];
      for (let y = 0; y < 16; y++) p.px(x, y, c);
    }
  };
  const mkPipe = (top, left) => {
    const p = new Pix(16, 16);
    if (top) {
      // lip spans 32px: left tile 0..15 is x 0..15 of 32
      for (let x = 0; x < 16; x++) {
        const gx = left ? x : x + 16, rel = gx / 31;
        let c = PG[0]; if (rel < 0.06 || rel > 0.94) c = PG[3]; else if (rel < 0.14 || rel > 0.72) c = PG[1]; else if (rel < 0.3) c = PG[2];
        for (let y = 0; y < 16; y++) p.px(x, y, c);
      }
      p.rect(0, 0, 16, 1, PG[3]); p.rect(0, 15, 16, 1, PG[3]); p.rect(0, 14, 16, 1, PG[1]);
      if (left) p.rect(0, 0, 1, 16, PG[3]); else p.rect(15, 0, 1, 16, PG[3]);
    } else {
      for (let x = 0; x < 16; x++) {
        const gx = left ? x + 2 : x + 16, rel = (gx - 2) / 27;
        let c = PG[0]; if (rel < 0.05 || rel > 0.95) c = PG[3]; else if (rel < 0.14 || rel > 0.72) c = PG[1]; else if (rel < 0.32) c = PG[2];
        for (let y = 0; y < 16; y++) p.px(x, y, c);
      }
      if (left) p.rect(0, 0, 2, 16, 0); else p.rect(14, 0, 2, 16, 0);
      if (left) p.rect(2, 0, 1, 16, PG[3]); else p.rect(13, 0, 1, 16, PG[3]);
    }
    return p.canvas();
  };
  out.ptl = mkPipe(true, true); out.ptr = mkPipe(true, false); out.pl = mkPipe(false, true); out.pr = mkPipe(false, false);
  // semi-solid platform (treetop / mushroom cap)
  const se = pal(th.semi);
  const semi = (kind) => {
    const p = new Pix(16, 16);
    const x0 = kind === 'l' ? 2 : 0, x1 = kind === 'r' ? 13 : 15;
    for (let x = x0; x <= x1; x++) for (let y = 0; y < 9; y++) {
      if ((kind === 'l' && x === x0 && (y < 1 || y > 7)) || (kind === 'r' && x === x1 && (y < 1 || y > 7))) continue;
      p.px(x, y, y < 2 ? se.l : y > 6 ? se.d : se.b);
    }
    if (theme !== 'sky') p.paint((x, y) => y > 2 && y < 6 && hash(x, y + 40) < 0.2, se.l);
    else p.paint((x, y) => y > 1 && y < 7 && hash(x, y) < 0.15, se.d);
    p.outline(K);
    return p.canvas();
  };
  out.semiL = semi('l'); out.semiM = semi('m'); out.semiR = semi('r'); out.semiS = (() => { const p = new Pix(16, 16); for (let x = 1; x <= 14; x++) for (let y = 0; y < 9; y++) if (!((x === 1 || x === 14) && (y === 0 || y === 8))) p.px(x, y, y < 2 ? se.l : y > 6 ? se.d : se.b); p.outline(K); return p.canvas(); })();
  // trunk (decor)
  const tr = new Pix(16, 16);
  const trunkC = theme === 'sky' ? ['#a87a4a', '#6a4a2a', '#c89a6a'] : theme === 'cave' ? ['#3a5a8a', '#1a2a4a', '#5a7aa8'] : ['#c89a5a', '#8a5a2a', '#e8c088'];
  tr.rect(4, 0, 8, 16, trunkC[0]); tr.rect(4, 0, 1, 16, trunkC[1]); tr.rect(11, 0, 1, 16, trunkC[1]); tr.rect(6, 0, 1, 16, trunkC[2]);
  tr.paint((x, y) => x > 4 && x < 11 && (y * 3 + x) % 9 === 0, trunkC[1]);
  out.trunk = tr.canvas();
  // bridge
  const bd = new Pix(16, 16);
  bd.rect(0, 0, 16, 1, '#3a2010'); bd.rect(0, 1, 16, 5, '#a86a30'); bd.rect(0, 1, 16, 1, '#d8a060'); bd.rect(0, 6, 16, 1, '#3a2010');
  for (let x = 0; x < 16; x += 4) bd.rect(x, 1, 1, 5, '#6a3a10');
  for (let x = 0; x < 16; x++) { const y = 8 + Math.round(Math.sin(x / 15 * Math.PI) * 3); bd.px(x, y, '#9aa0b0'); bd.px(x, y + 1, '#5a5a6a'); }
  out.bridge = bd.canvas();
  // castle stone (decor solid)
  const cs = new Pix(16, 16);
  cs.rect(0, 0, 16, 16, '#5a5668');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(x + 50, y) < 0.12) cs.px(x, y, '#4a4658');
  cs.rect(0, 7, 16, 1, '#2a2638'); cs.rect(0, 15, 16, 1, '#2a2638'); cs.rect(7, 0, 1, 7, '#2a2638'); cs.rect(15, 8, 1, 7, '#2a2638');
  cs.rect(0, 0, 7, 1, '#7a7688'); cs.rect(8, 8, 7, 1, '#7a7688');
  out.castle = cs.canvas();
  // cloud solid
  const cl = new Pix(16, 16);
  cl.ell(8, 9, 8.5, 7, '#ffffff'); cl.ell(5, 5, 4, 4, '#ffffff'); cl.ell(11, 5, 4.5, 4, '#ffffff');
  cl.paint((x, y) => y > 12, '#c8d8f0');
  out.cloud = cl.canvas();
  // lava frames
  out.lavaTop = []; out.lava = [];
  for (let f = 0; f < 4; f++) {
    const p = new Pix(16, 16), q = new Pix(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const w = Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.5;
      const n = hash(x + f * 16, y);
      q.px(x, y, n < 0.1 ? '#ff9a1a' : n > 0.93 ? '#ffd84a' : '#e4372e');
      if (y >= 3 + w) p.px(x, y, y < 5 + w ? '#ffd84a' : y < 7 + w ? '#ff8a1a' : (n < 0.1 ? '#ff9a1a' : '#e4372e'));
    }
    out.lavaTop.push(p.canvas()); out.lava.push(q.canvas());
  }
  // slippery ice block
  const ic = new Pix(16, 16);
  ic.rect(0, 0, 16, 16, '#8ccff4');
  ic.paint((x, y) => (x - y + 32) % 13 < 2 && y > 2 && y < 14, '#d8f4ff');
  ic.paint((x, y) => (x - y + 32) % 13 === 2 && y > 2 && y < 14, '#f4fcff');
  ic.rect(0, 0, 16, 2, '#f4fcff'); ic.rect(0, 2, 16, 1, '#c8ecff');
  ic.rect(0, 14, 16, 2, '#5a9ad8'); ic.rect(15, 2, 1, 12, '#6aaae0');
  ic.px(4, 9, '#5a9ad8'); ic.px(5, 10, '#5a9ad8'); ic.px(5, 11, '#5a9ad8'); ic.px(11, 6, '#6aaae0');
  ic.rect(0, 15, 16, 1, '#3a6aa8');
  out.ice = ic.canvas();
  // quicksand frames
  out.qsandTop = []; out.qsand = [];
  for (let f = 0; f < 4; f++) {
    const p = new Pix(16, 16), q = new Pix(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const sw = Math.sin((x * 0.7 + y * 1.3) + f * Math.PI / 2), n = hash(x + f * 5, y + 60);
      const col = sw > 0.72 ? '#8e5020' : sw > 0.45 ? '#a86630' : n < 0.07 ? '#e0a050' : '#c07a38';
      q.px(x, y, col);
      const w = Math.round(Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.2);
      if (y >= 5 + w) p.px(x, y, y === 5 + w ? '#f0b868' : y === 6 + w ? '#d08c44' : col);
    }
    for (const [bx, by] of [[4, 10], [11, 8]]) { const r = (f + bx) % 4; if (r < 3) { p.px(bx, by - r, '#e8a858'); p.px(bx + 1, by - r, '#7a4418'); } }
    out.qsandTop.push(p.canvas()); out.qsand.push(q.canvas());
  }
  return out;
}

// ---------- background decor ----------
function makeBush(w, theme) {
  const cols = theme === 'cave' ? ['#2bb3a0', '#1a6d60', '#8af0d8'] : theme === 'ice' ? ['#d8ecfc', '#7a9ccc', '#ffffff'] : theme === 'desert' ? ['#a8a848', '#6a6a24', '#d8d878'] : ['#4ab83c', '#2a7a2a', '#9ae86a'];
  const p = new Pix(w, 18);
  const n = Math.max(2, Math.round(w / 12));
  for (let i = 0; i < n; i++) { const cx = 8 + i * (w - 16) / (n - 1 || 1); p.ell(cx, 11, 7, 7 - (i % 2) * 1.5, cols[0]); }
  p.rect(1, 14, w - 2, 4, cols[0]);
  p.paint((x, y) => hash(x, y) < 0.12 && y > 6, cols[1]);
  p.paint((x, y) => !p.get(x, y - 2) && y < 14, cols[2]);
  p.outline(cols[1]);
  return p.canvas();
}
function makeHill(w, h) {
  const p = new Pix(w, h);
  p.ell(w / 2, h, w / 2 - 1, h - 1, '#5ab84a');
  p.paint((x, y) => !p.get(x, y - 2), '#8ad86a');
  p.paint((x, y) => (hash(x >> 2, y >> 2) < 0.12) && x % 4 === 1 && y % 4 === 1 && y > 8, '#2a7a2a');
  p.outline('#2a7a2a');
  return p.canvas();
}
function makeCloud(w, h, cols) {
  const p = new Pix(w, h);
  const n = Math.max(2, Math.round(w / 14));
  for (let i = 0; i < n; i++) { const cx = 8 + i * (w - 16) / (n - 1); const r = (i === 0 || i === n - 1) ? h * .3 : h * .42; p.ell(cx, h - r - 2, r + 2, r, cols[0]); }
  p.rect(6, h - 8, w - 12, 6, cols[0]);
  p.paint((x, y) => y > h - 6, cols[1]);
  p.outline(cols[2]);
  return p.canvas();
}
function makeCastle() {
  // 80 x 80 end castle
  const p = new Pix(80, 80);
  const stone = '#c8743c', dark = '#7a3a1a', light = '#f0a868';
  const brickFill = (x0, y0, w, h) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const row = Math.floor((y - y0) / 5), off = row % 2 ? 4 : 0;
      p.px(x, y, (y - y0) % 5 === 4 || ((x - x0 + off) % 8 === 0) ? dark : ((y - y0) % 5 === 0 ? light : stone));
    }
  };
  brickFill(0, 40, 80, 40);
  brickFill(16, 12, 48, 28);
  for (let i = 0; i < 5; i++) brickFill(i * 18, 32, 8, 8);
  for (let i = 0; i < 3; i++) brickFill(16 + i * 20, 4, 8, 8);
  p.ell(40, 80, 9, 18, K, (x, y) => y < 80);
  p.rect(31, 66, 18, 14, K);
  p.ell(40, 26, 4, 7, K); p.rect(24, 20, 6, 10, K); p.rect(50, 20, 6, 10, K);
  return p.canvas();
}
function makeFlagPole() {
  const p = new Pix(8, 160);
  p.rect(3, 6, 2, 154, '#d8e0d8'); p.rect(3, 6, 1, 154, '#ffffff');
  p.ell(4, 4, 3.5, 3.5, '#2bb3a0'); p.px(3, 3, '#aaf0e0');
  p.outline(K);
  return p.canvas();
}
function makeFlag() {
  const fr = [];
  for (let f = 0; f < 3; f++) {
    const p = new Pix(18, 16);
    for (let x = 0; x < 16; x++) {
      const yo = Math.round(Math.sin(x / 5 + f * 2) * 1.2);
      const h = Math.round(14 - x * 0.75);
      for (let y = 0; y < h; y++) p.px(x + 1, 1 + y + yo + Math.round(x * 0.37), '#e4572e');
    }
    p.ell(6, 6, 2.6, 2.6, '#fff4e0'); p.px(6, 6, '#ffd84a');
    p.outline(K);
    fr.push(p.canvas());
  }
  return fr;
}
function makeTorch() {
  const fr = [];
  for (let f = 0; f < 3; f++) {
    const p = new Pix(10, 20);
    p.rect(3, 10, 4, 10, '#4a4658'); p.rect(2, 10, 6, 2, '#8a8a9a');
    const s = [0, 1, -1][f];
    p.ell(5 + s * .5, 6, 3.2, 4.5, '#ff6a1a'); p.ell(5, 7.5, 2, 2.8, '#ffd84a'); p.px(5 + s, 2, '#ff8a2a');
    fr.push(p.canvas());
  }
  return fr;
}
function makeCrystal(seed) {
  const r = rng(seed); const p = new Pix(14, 18);
  for (let k = 0; k < 3; k++) {
    const x = 3 + k * 4 + (r() * 2 | 0), h = 7 + (r() * 9 | 0);
    for (let y = 0; y < h; y++) { const w = y < 2 ? 1 : 2; p.rect(x - (w > 1 ? 1 : 0), 18 - h + y, w + (y < 2 ? 0 : 1), 1, y < 3 ? '#e0ffff' : k % 2 ? '#5ad0ff' : '#8a7aff'); }
  }
  p.outline('#1a1640');
  return p.canvas();
}
function makeFence() {
  const p = new Pix(16, 12);
  for (const x of [2, 10]) { p.rect(x, 1, 3, 11, '#f6f2ea'); p.px(x + 1, 0, '#f6f2ea'); }
  p.rect(0, 4, 16, 2, '#f6f2ea'); p.rect(0, 8, 16, 2, '#f6f2ea');
  p.outline('#7a6a5a');
  return p.canvas();
}
function makeFlowerDecor(col) {
  const p = new Pix(8, 10);
  p.rect(3, 4, 1, 6, '#2a8a2a'); p.px(2, 7, '#3cc85a'); p.px(4, 6, '#3cc85a');
  p.ell(3.5, 2.5, 2.5, 2.5, col); p.px(3, 2, '#ffd84a');
  return p.canvas();
}
function makeSign() {
  const p = new Pix(16, 20);
  p.rect(7, 8, 2, 12, '#8a5a2a');
  p.rect(1, 1, 14, 9, '#c89a5a'); p.rect(1, 1, 14, 1, '#e8c088');
  const ar = ['....K...', '....KK..', 'KKKKKKK.', 'KKKKKKKK', 'KKKKKKK.', '....KK..', '....K...'];
  for (let y = 0; y < 7; y++) for (let x = 0; x < 8; x++) if (ar[y][x] === 'K') p.px(x + 4, y + 2, '#5a2a10');
  p.outline(K);
  return p.canvas();
}

function makePine() {
  const p = new Pix(24, 44);
  p.rect(10, 34, 4, 10, '#6a4a2a'); p.rect(10, 34, 1, 10, '#8a6a4a');
  for (let i = 3; i >= 0; i--) {
    const y0 = 1 + i * 8, y1 = y0 + 12, w = 4 + i * 2.6;
    for (let y = y0; y <= y1; y++) {
      const hw = (y - y0) / (y1 - y0) * w;
      for (let x = Math.round(12 - hw); x <= Math.round(11 + hw); x++) p.px(x, y, x > 12 + hw * 0.25 ? '#1e5a52' : '#2e7a68');
    }
  }
  p.paint((x, y) => !p.get(x, y - 1) || (!p.get(x, y - 2) && hash(x, y) < 0.6), '#f4faff');
  p.paint((x, y) => y > 2 && p.get(x, y - 1) === c32('#f4faff') && p.get(x, y) !== c32('#f4faff') && hash(x, y + 3) < 0.4, '#c8dcf0');
  p.outline(K);
  return p.canvas();
}
function makeSnowman() {
  const p = new Pix(20, 27);
  p.ell(10, 20, 7, 6.5, '#f4faff'); p.ell(10, 11.5, 5, 4.6, '#f4faff'); p.ell(10, 5, 3.8, 3.6, '#f4faff');
  p.paint((x, y) => (x - 10) * 0.7 + (y % 9) * 0.25 > 3.2, '#c8dcf0');
  p.rect(6, 0, 8, 2, '#3a3648'); p.rect(7, 0, 6, 1, '#5a5668');
  p.px(8, 4, K); p.px(11, 4, K); p.rect(12, 6, 3, 1, '#ff8a2a'); p.px(12, 5, '#ff8a2a');
  p.rect(6, 8, 9, 2, '#e4572e'); p.rect(12, 10, 2, 3, '#e4572e');
  p.px(10, 12, K); p.px(10, 15, K); p.px(10, 19, K);
  for (let i = 0; i < 4; i++) { p.px(4 - i, 11 - i, '#6a4a2a'); p.px(16 + i, 11 - i, '#6a4a2a'); }
  p.px(1, 7, '#6a4a2a'); p.px(19, 7, '#6a4a2a');
  p.outline(K);
  return p.canvas();
}
function makeCactus(h, arms) {
  const p = new Pix(18, h);
  const G = '#4aa84a';
  p.rect(6, 3, 6, h - 3, G); p.ell(9, 3.5, 3, 3, G);
  if (arms > 0) { const y = Math.round(h * 0.5); p.rect(2, y, 4, 3, G); p.rect(2, y - 6, 3, 7, G); p.ell(3.5, y - 6, 1.6, 1.6, G); }
  if (arms > 1) { const y = Math.round(h * 0.36); p.rect(12, y, 4, 3, G); p.rect(13, y - 5, 3, 8, G); p.ell(14.5, y - 5, 1.6, 1.6, G); }
  p.paint((x, y) => x === 8 || x === 10 || (x === 3 || x === 14) && y < h - 2, '#2f8a3a');
  p.paint((x, y) => x === 6 || x === 2 || x === 13, '#8ad86a');
  p.paint((x, y) => x === 11 || x === 15, '#2f8a3a');
  p.paint((x, y) => (x + y * 3) % 7 === 0 && hash(x, y) < 0.5, '#e8f0c0');
  p.px(9, 0, '#ff6aa8'); p.px(8, 1, '#ff6aa8'); p.px(10, 1, '#ff6aa8'); p.px(9, 1, '#ffd84a');
  p.outline(K);
  return p.canvas();
}
function makeRock() {
  const p = new Pix(18, 9);
  p.ell(8, 9, 7, 6.5, '#b8875a'); p.ell(13, 9, 4, 4, '#a87a4a');
  p.paint((x, y) => !p.get(x, y - 1), '#e0b080');
  p.paint((x, y) => hash(x, y + 9) < 0.12, '#8a6038');
  p.outline(K);
  return p.canvas();
}
function makePyrWall() {
  const p = new Pix(16, 16);
  p.rect(0, 0, 16, 16, '#7a4a22');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const off = (y >> 2) % 2 ? 4 : 0;
    if (y % 4 === 3 || (x + off) % 8 === 7) p.px(x, y, '#4a2a12');
    else if (y % 4 === 0) p.px(x, y, '#8a5a2a');
  }
  p.px(3, 9, '#c8a050'); p.px(4, 9, '#c8a050'); p.px(3, 10, '#c8a050'); p.px(11, 1, '#c8a050'); p.px(12, 2, '#c8a050');
  return p.canvas();
}

// ---------- parallax layers ----------
function bandGradient(stops, h = VH) {
  const c = mkCanvas(1, h), g = c.getContext('2d');
  const n = stops.length - 1;
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i;
    const q = Math.round(f * 6) / 6; // banded
    const a = stops[i], b = stops[i + 1];
    const mix = (k) => Math.round(parseInt(a.slice(k, k + 2), 16) * (1 - q) + parseInt(b.slice(k, k + 2), 16) * q);
    g.fillStyle = `rgb(${mix(1)},${mix(3)},${mix(5)})`; g.fillRect(0, y, 1, 1);
  }
  return c;
}
function makeLayers(theme) {
  const L = [];
  const W = 512;
  if (theme === 'over') {
    L.sky = bandGradient(['#4aa8f0', '#7cc8f8', '#c8ecff']);
    // far mountains
    const m = new Pix(W, VH);
    for (let x = 0; x < W; x++) {
      const t = x / W * Math.PI * 2;
      const h = 70 + Math.sin(t * 2) * 22 + Math.sin(t * 5 + 1) * 10 + Math.sin(t * 9) * 4;
      for (let y = Math.round(VH - 40 - h); y < VH; y++) {
        const snow = y < VH - 40 - h + 6 && h > 88;
        m.px(x, y, snow ? '#f0f8ff' : (hash(x >> 1, y >> 1) < 0.04 ? '#7aa8d0' : '#9cc4e4'));
      }
    }
    L.push({ img: m.canvas(), f: 0.15, y: 0 });
    const hl = new Pix(W, VH);
    for (let x = 0; x < W; x++) {
      const t = x / W * Math.PI * 2;
      const h = 40 + Math.sin(t * 3 + 2) * 16 + Math.sin(t * 7) * 6;
      for (let y = Math.round(VH - 24 - h); y < VH; y++) hl.px(x, y, y < VH - 24 - h + 2 ? '#a8e090' : '#6ec060');
    }
    for (let i = 0; i < 26; i++) { const x = (hash(i, 77) * W) | 0; const y = VH - 30 - ((hash(i, 78) * 30) | 0); hl.ell(x, y, 4, 7, '#3e9a4a'); hl.rect(x, y + 6, 1, 4, '#5a3a20'); }
    L.push({ img: hl.canvas(), f: 0.35, y: 0 });
    const cl = mkCanvas(W, 120), g = cl.getContext('2d');
    for (let i = 0; i < 7; i++) { const w = 32 + ((hash(i, 5) * 40) | 0); g.drawImage(makeCloud(w, 20 + (w > 50 ? 6 : 0), ['#ffffff', '#dceeff', '#a8cce8']), (i * 73 + hash(i, 6) * 30) % (W - w), 20 + hash(i, 9) * 60); }
    L.push({ img: cl, f: 0.25, y: 0, drift: 0.08 });
  } else if (theme === 'cave') {
    L.sky = bandGradient(['#06040e', '#120c26', '#1a1236']);
    const r = new Pix(W, VH);
    for (let y = 0; y < VH; y++) for (let x = 0; x < W; x++) {
      const n = hash(x >> 3, y >> 3) * 0.6 + hash(x >> 1, y >> 1) * 0.4;
      if (n > 0.62) r.px(x, y, n > 0.9 ? '#2e2650' : '#221c40');
    }
    for (let i = 0; i < 40; i++) { const x = (hash(i, 1) * W) | 0, y = (hash(i, 2) * VH) | 0; r.px(x, y, '#6af0ff'); if (i % 3 === 0) { r.px(x + 1, y, '#3a8ab0'); r.px(x - 1, y, '#3a8ab0'); r.px(x, y + 1, '#3a8ab0'); r.px(x, y - 1, '#3a8ab0'); } }
    L.push({ img: r.canvas(), f: 0.3, y: 0 });
    const st = new Pix(W, 60);
    for (let x = 0; x < W; x += 1) { const h = Math.max(0, Math.round(Math.sin(x / 9) * 8 + Math.sin(x / 23) * 14 + hash(x >> 2, 3) * 6)); for (let y = 0; y < h; y++) st.px(x, y, y > h - 3 ? '#3a3070' : '#2a2258'); }
    L.push({ img: st.canvas(), f: 0.5, y: 28 });
  } else if (theme === 'sky') {
    L.sky = bandGradient(['#ff9a8a', '#ffc08a', '#ffe0a8', '#a8d8ff']);
    const sun = new Pix(W, VH);
    sun.ell(380, 70, 26, 26, '#fff0b0'); sun.ell(380, 70, 22, 22, '#fff8d8');
    L.push({ img: sun.canvas(), f: 0.05, y: 0 });
    for (const [f, cols, y0, n] of [[0.2, ['#ffd8e0', '#f8b8c8', '#e898b0'], 100, 6], [0.45, ['#ffffff', '#ffe8f0', '#d8b8d0'], 150, 5]]) {
      const c = mkCanvas(W, VH), g = c.getContext('2d');
      for (let i = 0; i < n; i++) { const w = 60 + ((hash(i, n) * 70) | 0); g.drawImage(makeCloud(w, 34, cols), (i * (W / n) + hash(i, 3) * 20) % W, y0 + hash(i, 4) * 40); }
      const base = new Pix(W, VH);
      for (let x = 0; x < W; x++) { const h = 20 + Math.sin(x / 30 + f * 10) * 6 + Math.sin(x / 11) * 3; for (let y = Math.round(VH - h); y < VH; y++) base.px(x, y, cols[0]); }
      g.drawImage(base.canvas(), 0, f > 0.3 ? 0 : -30);
      L.push({ img: c, f, y: 0, drift: f * 0.15 });
    }
  } else if (theme === 'ice') {
    L.sky = bandGradient(['#203c88', '#4a74c0', '#8cb8e8', '#d8ecff']);
    const tri = t => 1 - Math.abs((((t % 1) + 1) % 1) * 2 - 1);
    // aurora curtains
    const au = new Pix(W, 110);
    for (let x = 0; x < W; x++) {
      const t = x / W * Math.PI * 2, c = 22 + Math.sin(t * 3) * 10 + Math.sin(t * 8 + 1) * 4, len = 26 + Math.sin(t * 5 + 2) * 10;
      for (let y = Math.round(c); y < c + len; y++) {
        const k = (y - c) / len, a = Math.round((1 - k) * 6) / 6 * (0.32 + 0.12 * Math.sin(x / 3)) * 255;
        if (a > 8) au.px(x, y, (k < 0.2 ? '#b8ffe0' : '#6af0c0') + Math.round(a).toString(16).padStart(2, '0'));
      }
    }
    for (let i = 0; i < 50; i++) au.px((hash(i, 31) * W) | 0, (hash(i, 32) * 90) | 0, hash(i, 33) < 0.3 ? '#ffffff' : '#c8dcff');
    L.push({ img: au.canvas(), f: 0.06, y: 0 });
    // far snowy peaks
    const m = new Pix(W, VH);
    const mh = x => 46 + tri(x * 3 / W) * 58 + tri(x * 7 / W + .3) * 20 + tri(x * 19 / W + .7) * 6;
    for (let x = 0; x < W; x++) {
      const h = mh(x), shade = mh(x + 1) < h, top = Math.round(VH - 52 - h), snow = top + Math.max(3, (h - 55) * 0.55);
      for (let y = top; y < VH; y++) m.px(x, y, y < snow ? (shade ? '#c4d8f2' : '#f4faff') : (shade ? '#6a88c4' : '#88a8dc'));
    }
    L.push({ img: m.canvas(), f: 0.15, y: 0 });
    // near snow hills with pines
    const hl = new Pix(W, VH);
    const hh = x => { const t = x / W * Math.PI * 2; return 30 + Math.sin(t * 3 + 2) * 12 + Math.sin(t * 7) * 5; };
    for (let x = 0; x < W; x++) {
      const top = Math.round(VH - 22 - hh(x));
      for (let y = top; y < VH; y++) hl.px(x, y, y < top + 2 ? '#ffffff' : y > top + 17 || (y > top + 14 && (x + y) % 2) ? '#d0e0f4' : '#e2eefc');
    }
    for (let i = 0; i < 24; i++) {
      const x = (hash(i, 71) * W) | 0, base = Math.round(VH - 22 - hh(x)) + 4, ht = 12 + ((hash(i, 72) * 10) | 0);
      for (let y = 0; y < ht; y++) { const hw = (y + 2) * 0.33; for (let dx = -Math.round(hw); dx <= Math.round(hw); dx++) hl.px(x + dx, base - ht + y, y < 2 || (y % 4 === 0 && Math.abs(dx) > hw - 1.5) ? '#f4faff' : dx > 0 ? '#2e5a8a' : '#3e6e9e'); }
      hl.rect(x, base, 1, 3, '#4a3a3a');
    }
    L.push({ img: hl.canvas(), f: 0.35, y: 0 });
  } else if (theme === 'desert') {
    L.sky = bandGradient(['#ee8250', '#f8a868', '#ffd498', '#fff0c8']);
    const sun = new Pix(W, VH);
    sun.ell(360, 64, 34, 34, '#ffe8a8'); sun.ell(360, 64, 29, 29, '#fff4c8'); sun.ell(360, 64, 25, 25, '#fffbe8');
    L.push({ img: sun.canvas(), f: 0.05, y: 0 });
    // far pyramids on the horizon
    const fp = new Pix(W, VH), base = VH - 62;
    for (const [cx, sz] of [[70, 46], [128, 30], [300, 58], [372, 34], [452, 22]]) {
      for (let y = 0; y <= sz; y++) for (let dx = -y; dx <= y; dx++) fp.px(cx + dx, base - sz + y, dx > 0 ? '#c88a58' : (y % 6 === 5 ? '#d89a64' : '#e8b07a'));
    }
    for (let x = 0; x < W; x++) for (let y = base; y < VH; y++) fp.px(x, y, y === base ? '#f0c088' : '#e8b276');
    L.push({ img: fp.canvas(), f: 0.15, y: 0 });
    // rolling dunes
    const du = new Pix(W, VH);
    const dh = x => { const t = x / W * Math.PI * 2; return 34 + Math.sin(t * 2 + 1) * 13 + Math.sin(t * 5) * 6; };
    for (let x = 0; x < W; x++) {
      const h = dh(x), top = Math.round(VH - 18 - h), shade = dh(x + 1) < h;
      for (let y = top; y < VH; y++) du.px(x, y, y < top + 2 ? '#fde4a8' : shade ? '#d8a05a' : (hash(x >> 2, y >> 1) < 0.05 ? '#d8a868' : '#eebe7a'));
    }
    L.push({ img: du.canvas(), f: 0.4, y: 0 });
  } else {
    L.sky = bandGradient(['#0a0610', '#1a0c18', '#2a1018']);
    const w = new Pix(W, VH);
    for (let y = 0; y < VH; y++) for (let x = 0; x < W; x++) {
      const row = y >> 3, off = row % 2 ? 8 : 0;
      const mortar = (y % 8 === 7) || ((x + off) % 16 === 15);
      w.px(x, y, mortar ? '#160c14' : (hash(x >> 2, y >> 2) < 0.15 ? '#2e1c26' : '#261620'));
    }
    for (let i = 0; i < 4; i++) {
      const cx = 64 + i * 128;
      w.ell(cx, 96, 14, 18, '#1a2040', (x, y) => y < 96); w.rect(cx - 14, 96, 28, 34, '#1a2040');
      for (let k = 0; k < 6; k++) w.px(cx - 10 + (hash(i, k) * 20 | 0), 84 + (hash(k, i) * 40 | 0), '#ffffff');
      w.ell(cx + 6, 90, 4, 4, '#f0f0d0'); w.rect(cx - 1, 78, 2, 52, '#3a2a30'); w.rect(cx - 14, 104, 28, 2, '#3a2a30');
    }
    L.push({ img: w.canvas(), f: 0.4, y: 0 });
  }
  return L;
}
