'use strict';
(() => {
// =====================================================================
//  SÜPER BIYIK — tamamen kodla üretilmiş grafik, font, müzik ve sesler
// =====================================================================
const TILE = 16, ROWS = 15, VH = 240;
let VW = 320;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const approach = (v, t, d) => v < t ? Math.min(v + d, t) : Math.max(v - d, t);
const rnd = (a, b) => a + Math.random() * (b - a);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

// ---------- local save (optional) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('superbiyik.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('superbiyik.' + k, JSON.stringify(v)); } catch (e) { } }
};

// ---------- pixel toolkit ----------
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const colCache = new Map();
function c32(hex) {
  let v = colCache.get(hex);
  if (v === undefined) {
    let h = hex.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
    v = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
    colCache.set(hex, v);
  }
  return v;
}
class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  px(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = typeof c === 'number' ? c : c32(c); }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : 0; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); return this; }
  ell(cx, cy, rx, ry, c, clip) {
    const x0 = Math.max(0, Math.floor(cx - rx - 1)), x1 = Math.min(this.w - 1, Math.ceil(cx + rx + 1));
    const y0 = Math.max(0, Math.floor(cy - ry - 1)), y1 = Math.min(this.h - 1, Math.ceil(cy + ry + 1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && (!clip || clip(x, y))) this.px(x, y, c);
    }
    return this;
  }
  // recolor existing pixels inside a shape
  paint(fn, c) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.get(x, y) && fn(x, y)) this.px(x, y, c); return this; }
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(x, y);
    }
    for (let i = 0; i < add.length; i += 2) this.px(add[i], add[i + 1], c);
    return this;
  }
  canvas() {
    const c = mkCanvas(this.w, this.h), g = c.getContext('2d');
    const id = g.createImageData(this.w, this.h);
    new Uint32Array(id.data.buffer).set(this.d);
    g.putImageData(id, 0, 0);
    return c;
  }
}
function fromStrings(rows, pal, w) {
  w = w || Math.max(...rows.map(r => r.length));
  const p = new Pix(w, rows.length);
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < w; x++) {
    const col = pal[rows[y][x]];
    if (col) p.px(x, y, col);
  }
  return p.canvas();
}
function flipH(src) { const c = mkCanvas(src.width, src.height), g = c.getContext('2d'); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }
function flipV(src) { const c = mkCanvas(src.width, src.height), g = c.getContext('2d'); g.translate(0, src.height); g.scale(1, -1); g.drawImage(src, 0, 0); return c; }
function withFlip(c) { return [c, flipH(c)]; } // [facing-right-as-drawn, mirrored]

// ---------- bitmap font (5x7 + accent row + cedilla row) ----------
const FONT = {};
(function buildFont() {
  const g = (rows, top = 0, bot = 0) => ({ rows, top, bot });
  const F = {
    'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11], 'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
    'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E], 'D': [0x1C, 0x12, 0x11, 0x11, 0x11, 0x12, 0x1C],
    'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F], 'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
    'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F], 'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
    'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E], 'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
    'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11], 'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
    'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11], 'N': [0x11, 0x11, 0x19, 0x15, 0x13, 0x11, 0x11],
    'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], 'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
    'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D], 'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
    'S': [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E], 'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
    'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], 'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
    'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x15, 0x0A], 'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
    'Y': [0x11, 0x11, 0x11, 0x0A, 0x04, 0x04, 0x04], 'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
    '0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E], '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
    '2': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F], '3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
    '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02], '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
    '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E], '7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
    '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E], '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
    ' ': [0, 0, 0, 0, 0, 0, 0], '.': [0, 0, 0, 0, 0, 0x0C, 0x0C], ',': [0, 0, 0, 0, 0x0C, 0x04, 0x08],
    ':': [0, 0x0C, 0x0C, 0, 0x0C, 0x0C, 0], '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
    '?': [0x0E, 0x11, 0x01, 0x02, 0x04, 0, 0x04], '-': [0, 0, 0, 0x1F, 0, 0, 0],
    '×': [0, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0], '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
    "'": [0x04, 0x04, 0x08, 0, 0, 0, 0], '+': [0, 0x04, 0x04, 0x1F, 0x04, 0x04, 0],
    '<': [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02], '>': [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
    '♥': [0, 0x0A, 0x1F, 0x1F, 0x0E, 0x04, 0], '*': [0, 0x04, 0x15, 0x0E, 0x15, 0x04, 0],
    '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02], ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
    '"': [0x0A, 0x0A, 0, 0, 0, 0, 0], '=': [0, 0, 0x1F, 0, 0x1F, 0, 0], '%': [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
    '←': [0, 0x04, 0x08, 0x1F, 0x08, 0x04, 0], '→': [0, 0x04, 0x02, 0x1F, 0x02, 0x04, 0],
    '▶': [0x08, 0x0C, 0x0E, 0x0F, 0x0E, 0x0C, 0x08], '★': [0x04, 0x04, 0x1F, 0x0E, 0x0E, 0x1B, 0x11],
    '∞': [0, 0, 0x0A, 0x15, 0x15, 0x0A, 0], '▼': [0, 0x1F, 0x1F, 0x0E, 0x0E, 0x04, 0],
  };
  for (const k in F) FONT[k] = g(F[k]);
  FONT['Ç'] = g(F.C, 0, 0x04); FONT['Ş'] = g(F.S, 0, 0x04);
  FONT['Ö'] = g([0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E], 0x0A); FONT['Ü'] = g(F.U, 0x0A);
  FONT['Ğ'] = g(F.G, 0x0E); FONT['İ'] = g(F.I, 0x04);
  FONT['Â'] = g(F.A, 0x04);
})();
const glyphCache = new Map();
function glyph(ch, col) {
  const key = ch + col;
  let c = glyphCache.get(key);
  if (!c) {
    const gl = FONT[ch] || FONT['?'];
    const p = new Pix(5, 9);
    for (let x = 0; x < 5; x++) {
      const bit = 1 << (4 - x);
      if (gl.top & bit) p.px(x, 0, col);
      for (let y = 0; y < 7; y++) if (gl.rows[y] & bit) p.px(x, y + 1, col);
      if (gl.bot & bit) p.px(x, 8, col);
    }
    c = p.canvas(); glyphCache.set(key, c);
  }
  return c;
}
function textW(s, scale = 1) { return s.length * 6 * scale - scale; }
function upTR(s) { return String(s).toLocaleUpperCase('tr-TR'); }
// y is the top of the cap height (accent row sits 1 px above)
function drawText(s, x, y, col = '#fff4e0', opt = {}) {
  s = upTR(s);
  const sc = opt.scale || 1;
  if (opt.align === 'center') x -= textW(s, sc) / 2;
  else if (opt.align === 'right') x -= textW(s, sc);
  x = Math.round(x); y = Math.round(y);
  if (opt.shadow) drawTextRaw(s, x + sc, y + sc, opt.shadow, sc);
  if (opt.outline) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) drawTextRaw(s, x + dx * sc, y + dy * sc, opt.outline, sc); }
  drawTextRaw(s, x, y, col, sc);
}
function drawTextRaw(s, x, y, col, sc) {
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== ' ') ctx.drawImage(glyph(ch, col), x + i * 6 * sc, y - sc, 5 * sc, 9 * sc);
  }
}

// =====================================================================
//  AUDIO — synthesized chiptune
// =====================================================================
const SND = {
  ctx: null, master: null, music: null, sfx: null, waves: {}, noise: null,
  muted: store.get('muted', false),
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume().catch(() => { }); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.6;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = 0.42; this.music.connect(this.master);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.master);
    for (const d of [0.125, 0.25, 0.5]) {
      const n = 48, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * d);
      this.waves[d] = c.createPeriodicWave(re, im);
    }
    const len = c.sampleRate;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const ch = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    if (c.state === 'suspended') c.resume();
  },
  setMuted(m) {
    this.muted = m; store.set('muted', m);
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.02);
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  // generic tone
  tone(freq, t, dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const osc = c.createOscillator();
    if (o.wave === 'tri') osc.type = 'triangle';
    else if (o.wave === 'saw') osc.type = 'sawtooth';
    else if (o.wave === 'sine') osc.type = 'sine';
    else osc.setPeriodicWave(this.waves[o.duty || 0.25]);
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideT || dur));
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6; lg.gain.value = freq * 0.012; l.connect(lg); lg.connect(osc.frequency); l.start(t + 0.08); l.stop(t + dur + 0.05); }
    const g = c.createGain(), v = o.vol || 0.2, a = o.att || 0.005, r = o.rel || 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    if (o.decay) g.gain.setTargetAtTime(v * (o.sus ?? 0.5), t + a, o.decay);
    g.gain.setValueAtTime(o.decay ? v * (o.sus ?? 0.5) : v, Math.max(t + a, t + dur - r));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || this.sfx);
    osc.start(t); osc.stop(t + dur + 0.02);
  },
  noiseHit(t, dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = o.type || 'highpass'; f.frequency.value = o.freq || 1000;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
    const g = c.createGain(), v = o.vol || 0.2;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || this.sfx);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.005, f = SFX[name];
    if (f) f(this, t);
  }
};
const NOTE_IDX = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
function nf(n) { // 'C#5' -> Hz
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  let s = NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3]) - 4) * 12;
  return 440 * Math.pow(2, s / 12);
}
const SFX = {
  jump: (S, t) => S.tone(330, t, 0.16, { duty: 0.25, slide: 760, slideT: 0.14, vol: 0.13 }),
  bigjump: (S, t) => S.tone(240, t, 0.18, { duty: 0.25, slide: 620, slideT: 0.16, vol: 0.14 }),
  coin: (S, t) => { S.tone(1047, t, 0.06, { duty: 0.5, vol: 0.12 }); S.tone(1568, t + 0.06, 0.32, { duty: 0.5, vol: 0.12, decay: 0.08, sus: 0.2 }); },
  stomp: (S, t) => { S.tone(520, t, 0.1, { duty: 0.5, slide: 140, vol: 0.18 }); S.noiseHit(t, 0.08, { freq: 600, vol: 0.12, type: 'lowpass' }); },
  kick: (S, t) => { S.tone(880, t, 0.05, { duty: 0.5, vol: 0.15 }); S.tone(660, t + 0.04, 0.05, { duty: 0.5, vol: 0.12 }); },
  bump: (S, t) => { S.tone(140, t, 0.09, { duty: 0.5, slide: 90, vol: 0.22 }); },
  brk: (S, t) => { S.noiseHit(t, 0.25, { freq: 2200, sweep: 300, type: 'lowpass', vol: 0.35 }); S.tone(180, t, 0.08, { wave: 'tri', slide: 60, vol: 0.3 }); },
  sprout: (S, t) => { for (let i = 0; i < 6; i++) S.tone(nf(['C4', 'G4', 'C5', 'D4', 'A4', 'D5'][i]), t + i * 0.045, 0.06, { duty: 0.125, vol: 0.12 }); },
  power: (S, t) => { const n = ['C5', 'E5', 'G5', 'C6', 'D5', 'F#5', 'A5', 'D6', 'E5', 'G#5', 'B5', 'E6']; n.forEach((x, i) => S.tone(nf(x), t + i * 0.04, 0.05, { duty: 0.25, vol: 0.13 })); },
  shrink: (S, t) => { const n = ['A5', 'E5', 'A4', 'F5', 'C5', 'F4', 'D5', 'A4', 'D4']; n.forEach((x, i) => S.tone(nf(x), t + i * 0.05, 0.06, { duty: 0.5, vol: 0.12 })); },
  fire: (S, t) => { S.tone(1200, t, 0.06, { duty: 0.125, slide: 400, vol: 0.1 }); S.noiseHit(t, 0.05, { freq: 3000, vol: 0.06 }); },
  oneup: (S, t) => { ['C6', 'E6', 'G6', 'C7', 'E7', 'G7'].forEach((x, i) => S.tone(nf(x), t + i * 0.08, 0.09, { duty: 0.25, vol: 0.12 })); },
  pipe: (S, t) => { for (let i = 0; i < 3; i++) S.tone(300, t + i * 0.13, 0.08, { duty: 0.5, slide: 90, vol: 0.18 }); },
  flag: (S, t) => S.tone(1400, t, 1.1, { duty: 0.25, slide: 180, slideT: 1.05, vol: 0.12 }),
  tick: (S, t) => S.tone(1760, t, 0.025, { duty: 0.5, vol: 0.06 }),
  hurry: (S, t) => { for (let i = 0; i < 3; i++) { S.tone(nf('G5'), t + i * 0.22, 0.09, { vol: 0.12 }); S.tone(nf('D6'), t + i * 0.22 + 0.1, 0.09, { vol: 0.12 }); } },
  burst: (S, t) => { S.noiseHit(t, 0.5, { freq: 900, sweep: 120, type: 'lowpass', vol: 0.4 }); },
  bossfire: (S, t) => { S.noiseHit(t, 0.4, { freq: 400, sweep: 1500, type: 'bandpass', vol: 0.3 }); },
  bosshit: (S, t) => { S.tone(200, t, 0.15, { duty: 0.5, slide: 80, vol: 0.25 }); S.noiseHit(t, 0.12, { freq: 800, vol: 0.15 }); },
  collapse: (S, t) => { S.noiseHit(t, 0.12, { freq: 500, type: 'lowpass', vol: 0.25 }); },
  pause: (S, t) => { S.tone(nf('E6'), t, 0.06, { vol: 0.1 }); S.tone(nf('C6'), t + 0.07, 0.06, { vol: 0.1 }); S.tone(nf('E6'), t + 0.14, 0.06, { vol: 0.1 }); S.tone(nf('C6'), t + 0.21, 0.1, { vol: 0.1 }); },
  select: (S, t) => { S.tone(nf('A5'), t, 0.05, { duty: 0.5, vol: 0.1 }); S.tone(nf('E6'), t + 0.05, 0.08, { duty: 0.5, vol: 0.1 }); },
  checkpoint: (S, t) => { ['G5', 'B5', 'D6', 'G6'].forEach((x, i) => S.tone(nf(x), t + i * 0.07, 0.1, { duty: 0.125, vol: 0.12 })); },
  spring: (S, t) => S.tone(200, t, 0.25, { duty: 0.25, slide: 900, vol: 0.14, vib: true }),
  crack: (S, t) => { S.noiseHit(t, 0.06, { freq: 5000, vol: 0.07 }); S.tone(2600, t, 0.04, { duty: 0.125, vol: 0.05 }); },
  swim: (S, t) => { S.tone(240, t, 0.13, { wave: 'sine', slide: 560, slideT: 0.11, vol: 0.16 }); S.noiseHit(t, 0.07, { freq: 1300, type: 'bandpass', vol: 0.05 }); },
  puff: (S, t) => { S.tone(160, t, 0.22, { duty: 0.5, slide: 520, slideT: 0.2, vol: 0.12 }); S.noiseHit(t, 0.12, { freq: 700, type: 'lowpass', vol: 0.08 }); },
  record: (S, t) => { ['C6', 'E6', 'G6', 'E6', 'G6', 'C7'].forEach((x, i) => S.tone(nf(x), t + i * 0.07, i === 5 ? 0.3 : 0.08, { duty: 0.25, vol: 0.12 })); },
  shatter: (S, t) => { S.noiseHit(t, 0.18, { freq: 4000, sweep: 9000, type: 'bandpass', vol: 0.18 }); [2093, 2637, 3136].forEach((f, i) => S.tone(f, t + i * 0.03, 0.06, { duty: 0.125, vol: 0.06 })); },
};

// ---------- music: compact step sequencer ----------
// tracks: lead (pulse), harm (pulse 12.5%), bass (triangle), drum (k/s/h)
function parseTrack(str) {
  const ev = []; let step = 0;
  for (const tok of str.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [n, d] = tok.split(':'); const len = parseInt(d || '1');
    if (n !== 'r') ev.push({ step, n, len });
    step += len;
  }
  return { ev, len: step };
}
const SONGS = {
  over: {
    bpm: 138, loop: true, tracks: {
      lead: `E5:2 G5:2 C6:2 G5:2 A5:3 G5:1 E5:2 C5:2 | D5:2 F5:2 A5:2 F5:2 G5:4 r:4 | E5:2 G5:2 C6:2 E6:2 D6:3 C6:1 A5:2 G5:2 | F5:2 E5:2 D5:2 B4:2 C5:4 r:4 |
             A5:2 A5:1 B5:1 C6:2 A5:2 G5:2 E5:2 C5:4 | F5:2 F5:1 G5:1 A5:2 F5:2 E5:4 r:4 | D5:2 E5:2 F5:2 A5:2 G5:2 F5:2 E5:2 D5:2 | C5:2 G4:2 C5:2 E5:2 C5:4 r:4`,
      harm: `C5:2 E5:2 E5:2 E5:2 F5:3 E5:1 C5:2 G4:2 | A4:2 D5:2 F5:2 D5:2 B4:4 r:4 | C5:2 E5:2 G5:2 C6:2 B5:3 A5:1 F5:2 E5:2 | D5:2 C5:2 B4:2 G4:2 E4:4 r:4 |
             F5:2 F5:1 G5:1 A5:2 F5:2 E5:2 C5:2 A4:4 | D5:2 D5:1 E5:1 F5:2 D5:2 C5:4 r:4 | B4:2 C5:2 D5:2 F5:2 E5:2 D5:2 C5:2 B4:2 | G4:2 E4:2 G4:2 C5:2 G4:4 r:4`,
      bass: `C3:2 r:2 G3:2 r:2 C3:2 r:2 G3:2 C3:2 | D3:2 r:2 A3:2 r:2 G2:2 r:2 B2:2 D3:2 | C3:2 r:2 G3:2 r:2 A2:2 r:2 E3:2 A2:2 | F2:2 r:2 G2:2 r:2 C3:2 G2:2 C3:4 |
             F2:2 r:2 C3:2 r:2 A2:2 r:2 E3:2 A2:2 | D3:2 r:2 A2:2 r:2 C3:2 r:2 G2:2 C3:2 | G2:2 r:2 D3:2 r:2 G2:2 r:2 B2:2 G2:2 | C3:2 G2:2 E2:2 G2:2 C3:4 r:4`,
      drum: `k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 s:1 s:1 s:2 s:2 |
             k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 s:1 s:1 s:2 s:2`
    }
  },
  cave: {
    bpm: 116, loop: true, tracks: {
      lead: `A4:1 r:1 A5:1 r:1 E5:1 r:1 C5:1 r:1 B4:1 r:1 C5:1 r:1 E5:2 r:2 | D5:1 r:1 F5:1 r:1 A5:1 r:1 F5:1 r:1 E5:1 r:1 D5:1 r:1 C5:2 B4:2 |
             A4:1 r:1 C5:1 r:1 E5:1 r:1 A5:1 r:1 G#5:1 r:1 E5:1 r:1 B4:2 r:2 | A4:2 E4:2 A4:2 B4:2 C5:2 B4:2 A4:4 |
             r:16 | r:8 E5:1 r:1 D#5:1 r:1 E5:1 r:1 B4:2 | r:16 | C5:2 B4:2 A4:2 G#4:2 A4:8`,
      bass: `A2:2 r:2 A2:2 r:2 E2:2 r:2 E2:2 r:2 | D2:2 r:2 D2:2 r:2 F2:2 r:2 E2:2 r:2 | A2:2 r:2 A2:2 r:2 E2:2 r:2 E2:2 r:2 | A2:4 E2:4 A2:4 E2:4 |
             A2:1 r:1 A3:1 r:1 A2:1 r:1 A3:1 r:1 F2:1 r:1 F3:1 r:1 F2:1 r:1 F3:1 r:1 | E2:1 r:1 E3:1 r:1 E2:1 r:1 E3:1 r:1 E2:1 r:1 E3:1 r:1 G#2:1 r:1 B2:1 r:1 |
             A2:1 r:1 A3:1 r:1 A2:1 r:1 A3:1 r:1 F2:1 r:1 F3:1 r:1 F2:1 r:1 F3:1 r:1 | E2:2 r:2 E2:2 r:2 A2:4 r:4`,
      drum: `h:2 h:2 s:2 h:2 h:2 h:2 s:2 h:2 | h:2 h:2 s:2 h:2 h:2 h:2 s:2 h:2 | h:2 h:2 s:2 h:2 h:2 h:2 s:2 h:2 | k:4 s:4 k:4 s:4 |
             k:4 h:4 s:4 h:4 | k:4 h:4 s:4 h:2 h:2 | k:4 h:4 s:4 h:4 | k:4 s:4 k:2 k:2 s:4`
    }
  },
  sky: {
    bpm: 150, loop: true, tracks: {
      lead: `D5:2 G5:2 B5:2 D6:2 C6:2 B5:2 A5:4 | G5:2 A5:2 B5:2 G5:2 E5:4 D5:4 | E5:2 G5:2 C6:2 E6:2 D6:2 C6:2 B5:4 | A5:2 B5:2 A5:2 F#5:2 G5:8 |
             B5:3 A5:1 G5:2 B5:2 D6:4 B5:4 | C6:3 B5:1 A5:2 C6:2 E6:4 C6:4 | B5:2 D6:2 G6:2 D6:2 C6:2 A5:2 F#5:2 A5:2 | G5:4 D5:4 G5:8`,
      harm: `B4:4 D5:4 E5:4 F#5:4 | E5:4 G5:4 C5:4 B4:4 | C5:4 E5:4 G5:4 G5:4 | F#5:4 D5:4 B4:8 |
             G5:4 D5:4 B5:4 G5:4 | A5:4 E5:4 C6:4 A5:4 | G5:4 B5:4 A5:4 D5:4 | B4:4 A4:4 B4:8`,
      bass: `G2:2 r:2 D3:2 r:2 G2:2 r:2 D3:2 r:2 | E2:2 r:2 B2:2 r:2 C3:2 r:2 D3:2 r:2 | C3:2 r:2 G3:2 r:2 G2:2 r:2 D3:2 r:2 | D3:2 r:2 D2:2 r:2 G2:4 D3:4 |
             G2:2 D3:2 G3:2 D3:2 G2:2 D3:2 G3:2 D3:2 | A2:2 E3:2 A3:2 E3:2 C3:2 G3:2 C4:2 G3:2 | G2:2 D3:2 G3:2 D3:2 D3:2 A3:2 D4:2 A3:2 | G2:4 D3:4 G2:8`,
      drum: `k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 k:2 | k:4 h:2 h:2 s:4 h:2 h:2 | k:2 k:2 h:2 h:2 s:4 s:2 s:2 |
             k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 k:2 | k:4 h:2 h:2 s:4 h:2 h:2 | k:2 k:2 h:2 h:2 s:2 s:2 s:2 s:2`
    }
  },
  castle: {
    bpm: 112, loop: true, tracks: {
      lead: `E4:1 F4:1 E4:1 D#4:1 E4:4 r:2 B4:1 C5:1 B4:1 A#4:1 B4:2 | E4:1 F4:1 E4:1 D#4:1 E4:4 r:2 G4:2 F#4:2 F4:2 | C5:2 B4:2 A#4:2 B4:2 G4:2 F#4:2 E4:4 | D#4:2 E4:2 F4:2 F#4:2 G4:2 G#4:2 A4:2 A#4:2`,
      harm: `B3:8 r:4 F#4:4 | B3:8 r:4 D4:4 | G4:4 F#4:4 D#4:4 B3:4 | A3:4 B3:4 C4:4 D4:4`,
      bass: `E2:2 E2:2 E3:2 E2:2 E2:2 E2:2 E3:2 E2:2 | E2:2 E2:2 E3:2 E2:2 E2:2 E2:2 E3:2 E2:2 | C2:2 C2:2 C3:2 C2:2 B1:2 B1:2 B2:2 B1:2 | A1:2 A2:2 B1:2 B2:2 C2:2 C3:2 D2:2 D3:2`,
      drum: `k:2 h:2 h:2 k:2 s:2 h:2 h:2 h:2 | k:2 h:2 h:2 k:2 s:2 h:2 h:2 h:2 | k:2 h:2 h:2 k:2 s:2 h:2 h:2 h:2 | k:2 s:2 k:2 s:2 k:2 s:2 s:1 s:1 s:2`
    }
  },
  ice: {
    bpm: 128, loop: true, tracks: {
      lead: `B5:2 G5:2 E5:2 G5:2 B5:4 A5:2 G5:2 | F#5:2 D5:2 B4:2 D5:2 F#5:4 E5:2 D5:2 | E5:2 G5:2 B5:2 E6:2 D6:3 C6:1 B5:2 A5:2 | B5:4 F#5:4 G5:2 F#5:2 E5:4 |
             C6:2 B5:2 A5:2 G5:2 A5:4 E5:4 | D6:2 C6:2 B5:2 A5:2 B5:4 F#5:4 | E6:3 D6:1 C6:2 B5:2 A5:2 G5:2 F#5:2 A5:2 | G5:2 F#5:2 D#5:2 F#5:2 E5:8`,
      harm: `E6:1 B5:1 G5:1 B5:1 E6:1 B5:1 G5:1 B5:1 E6:1 B5:1 G5:1 B5:1 E6:1 B5:1 G5:1 B5:1 | D6:1 B5:1 F#5:1 B5:1 D6:1 B5:1 F#5:1 B5:1 D6:1 B5:1 F#5:1 B5:1 D6:1 B5:1 F#5:1 B5:1 |
             E6:1 B5:1 G5:1 B5:1 E6:1 B5:1 G5:1 B5:1 E6:1 B5:1 G5:1 B5:1 E6:1 B5:1 G5:1 B5:1 | D#6:1 B5:1 F#5:1 B5:1 D#6:1 B5:1 F#5:1 B5:1 D#6:1 B5:1 F#5:1 B5:1 D#6:1 B5:1 F#5:1 B5:1 |
             E6:1 C6:1 A5:1 C6:1 E6:1 C6:1 A5:1 C6:1 E6:1 C6:1 A5:1 C6:1 E6:1 C6:1 A5:1 C6:1 | D6:1 B5:1 F#5:1 B5:1 D6:1 B5:1 F#5:1 B5:1 D6:1 B5:1 F#5:1 B5:1 D6:1 B5:1 F#5:1 B5:1 |
             E6:1 C6:1 G5:1 C6:1 E6:1 C6:1 G5:1 C6:1 D6:1 A5:1 F#5:1 A5:1 D6:1 A5:1 F#5:1 A5:1 | D#6:1 B5:1 F#5:1 B5:1 D#6:1 B5:1 F#5:1 B5:1 E6:1 B5:1 G5:1 B5:1 E6:4`,
      bass: `E2:4 B2:4 E3:4 B2:4 | B1:4 F#2:4 B2:4 F#2:4 | E2:4 B2:4 E3:4 B2:4 | B1:4 D#2:4 F#2:4 B2:4 |
             A1:4 E2:4 A2:4 E2:4 | B1:4 F#2:4 B2:4 F#2:4 | C2:4 G2:4 D2:4 A2:4 | B1:4 F#2:4 E2:8`,
      drum: `k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 h:2 |
             k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:4 h:2 h:2 | k:4 h:2 h:2 s:2 s:2 s:2 h:2`
    }
  },
  desert: {
    bpm: 132, loop: true, tracks: {
      lead: `E5:2 F5:1 G#5:1 A5:2 G#5:2 F5:2 E5:2 r:4 | A5:2 B5:1 C6:1 B5:2 A5:2 G#5:2 A5:2 r:4 | B5:2 C6:2 D6:2 C6:1 B5:1 A5:2 G#5:2 F5:2 G#5:2 | A5:1 G#5:1 F5:2 E5:4 F5:1 E5:1 D5:2 E5:4 |
             E6:2 D6:1 C6:1 B5:2 C6:2 A5:4 r:4 | D6:2 C6:1 B5:1 A5:2 B5:2 G#5:4 r:4 | C6:2 B5:2 A5:2 G#5:2 F5:2 G#5:2 A5:2 B5:2 | G#5:2 F5:2 E5:12`,
      harm: `E4:8 G#4:8 | A4:8 C5:8 | D5:8 B4:8 | F4:8 E4:8 | A4:8 C5:8 | F4:8 E4:8 | A4:8 D5:8 | B4:4 G#4:4 E4:8`,
      bass: `E2:3 E2:1 r:2 E3:2 E2:2 r:2 B2:2 E2:2 | A2:3 A2:1 r:2 A3:2 A2:2 r:2 E3:2 A2:2 | D2:3 D2:1 r:2 D3:2 D2:2 r:2 A2:2 D2:2 | F2:3 F2:1 r:2 F3:2 E2:2 r:2 B2:2 E2:2 |
             A2:3 A2:1 r:2 A3:2 A2:2 r:2 E3:2 A2:2 | D2:3 D2:1 r:2 D3:2 E2:2 r:2 B2:2 E2:2 | A2:3 A2:1 r:2 A3:2 D2:2 r:2 A2:2 D2:2 | E2:3 E2:1 r:2 E3:2 E2:4 B1:2 E2:2`,
      drum: `k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 |
             k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:3 h:1 s:2 h:2 k:2 k:2 s:2 h:1 h:1 | k:2 s:1 s:1 k:2 s:2 k:2 s:1 s:1 s:2 s:2`
    }
  },
  // MERCAN DENİZİ: a slow, swaying D-minor waltz-like tune for the secret underwater level
  sea: {
    bpm: 104, loop: true, tracks: {
      lead: `A4:2 D5:2 F5:2 A5:4 G5:2 F5:2 E5:2 | F5:3 E5:1 D5:4 r:4 A4:4 | Bb4:2 D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:2 | A5:6 G5:2 E5:8 |
             G5:2 A5:2 Bb5:2 A5:2 G5:2 F5:2 E5:2 D5:2 | F5:4 E5:2 C5:2 D5:8 | Bb4:2 C5:2 D5:2 F5:2 E5:2 D5:2 C#5:2 E5:2 | D5:12 r:4`,
      harm: `D4:2 F4:2 A4:2 D5:2 A4:2 F4:2 D4:2 F4:2 | C4:2 E4:2 A4:2 C5:2 A4:2 E4:2 C4:2 E4:2 | Bb3:2 D4:2 F4:2 Bb4:2 F4:2 D4:2 Bb3:2 D4:2 | A3:2 C#4:2 E4:2 A4:2 E4:2 C#4:2 A3:2 C#4:2 |
             G3:2 Bb3:2 D4:2 G4:2 D4:2 Bb3:2 G3:2 Bb3:2 | F3:2 A3:2 D4:2 F4:2 D4:2 A3:2 F3:2 A3:2 | Bb3:2 D4:2 F4:2 D4:2 A3:2 C#4:2 E4:2 C#4:2 | D4:2 F4:2 A4:2 D5:2 A4:8`,
      bass: `D2:4 A2:4 D3:4 A2:4 | A1:4 E2:4 A2:4 E2:4 | Bb1:4 F2:4 Bb2:4 F2:4 | A1:4 E2:4 A2:4 C#3:4 |
             G1:4 D2:4 G2:4 D2:4 | D2:4 A2:4 D3:4 A2:4 | Bb1:4 F2:4 A1:4 E2:4 | D2:8 A1:4 D2:4`,
      drum: `k:4 h:2 h:2 h:4 h:4 | k:4 h:2 h:2 h:4 h:4 | k:4 h:2 h:2 h:4 h:4 | k:4 h:2 h:2 s:4 h:4 |
             k:4 h:2 h:2 h:4 h:4 | k:4 h:2 h:2 h:4 h:4 | k:4 h:2 h:2 h:4 h:4 | k:4 h:2 h:2 s:4 s:2 h:2`
    }
  },
  star: {
    bpm: 176, loop: true, tracks: {
      lead: `C5:1 r:1 E5:1 r:1 G5:1 r:1 C6:1 G5:1 r:1 E5:1 r:1 G5:1 C6:2 r:2 | D5:1 r:1 F5:1 r:1 A5:1 r:1 D6:1 A5:1 r:1 F5:1 r:1 A5:1 D6:2 r:2`,
      bass: `C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 | D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1 D3:1 D4:1`,
      drum: `k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 | k:2 h:2 s:2 h:2 k:2 h:2 s:1 s:1 s:2`
    }
  },
  boss: {
    bpm: 150, loop: true, tracks: {
      lead: `E5:1 r:1 E5:1 F5:1 E5:1 r:1 D#5:2 E5:1 r:1 B4:1 C5:1 B4:1 r:1 A#4:2 | E5:1 r:1 E5:1 F5:1 E5:1 r:1 G5:2 F#5:1 r:1 F5:1 E5:1 D#5:2 B4:2`,
      bass: `E2:1 E2:1 E3:1 E2:1 E2:1 E2:1 E3:1 E2:1 E2:1 E2:1 E3:1 E2:1 F2:1 F2:1 F3:1 F2:1 | E2:1 E2:1 E3:1 E2:1 E2:1 E2:1 E3:1 E2:1 C2:1 C2:1 C3:1 C2:1 B1:1 B1:1 B2:1 B1:1`,
      drum: `k:2 s:2 k:2 s:2 k:2 s:2 k:2 s:1 s:1 | k:2 s:2 k:2 s:2 k:1 k:1 s:2 s:2 s:2`
    }
  },
  title: {
    bpm: 120, loop: true, tracks: {
      lead: `G5:2 E5:2 C5:2 E5:2 G5:4 A5:4 | F5:2 D5:2 B4:2 D5:2 F5:4 G5:4 | E5:2 C5:2 A4:2 C5:2 E5:4 F5:2 E5:2 | D5:2 E5:2 F5:2 D5:2 C5:8`,
      bass: `C3:4 G2:4 C3:4 E3:4 | G2:4 D3:4 G2:4 B2:4 | A2:4 E3:4 F2:4 C3:4 | G2:4 G2:4 C3:8`,
      drum: `k:4 h:4 s:4 h:4 | k:4 h:4 s:4 h:4 | k:4 h:4 s:4 h:4 | k:4 h:2 h:2 s:2 s:2 s:4`
    }
  },
  clear: { bpm: 150, loop: false, tracks: {
      lead: `C5:1 E5:1 G5:1 C6:3 r:2 G5:1 C6:1 E6:4 r:2 | F5:1 A5:1 C6:1 F6:3 r:2 D6:1 F6:1 G6:4 r:2 | G6:1 G6:1 G6:1 A6:1 B6:1 r:1 C7:10`,
      bass: `C3:6 r:2 G2:6 r:2 | F2:6 r:2 G2:6 r:2 | G2:4 C3:12` } },
  castleclear: { bpm: 132, loop: false, tracks: {
      lead: `G5:2 C6:2 E6:2 G6:4 E6:2 G6:4 | A5:2 D6:2 F6:2 A6:4 F6:2 A6:4 | B5:2 D6:2 G6:2 B6:4 r:2 C7:4 | C7:16`,
      harm: `E5:2 G5:2 C6:2 E6:4 C6:2 E6:4 | F5:2 A5:2 D6:2 F6:4 D6:2 F6:4 | G5:2 B5:2 D6:2 G6:4 r:2 E6:4 | E6:16`,
      bass: `C3:4 G3:4 C3:4 G3:4 | D3:4 A3:4 D3:4 A3:4 | G2:4 D3:4 G2:4 B2:4 | C3:16` } },
  death: { bpm: 140, loop: false, tracks: {
      lead: `C6:2 B5:2 A#5:2 A5:4 r:2 G5:1 F#5:1 F5:1 E5:9`,
      bass: `C3:4 B2:4 A#2:4 r:2 A2:2 A2:8` } },
  gameover: { bpm: 100, loop: false, tracks: {
      lead: `E5:4 D5:4 C5:4 B4:4 A4:8 r:4 E4:4 A3:12`,
      bass: `A2:8 G2:8 F2:8 E2:8 A1:12` } },
};
for (const k in SONGS) {
  const s = SONGS[k]; s.parsed = {}; s.len = 0;
  for (const tn in s.tracks) { const p = parseTrack(s.tracks[tn]); s.parsed[tn] = p; s.len = Math.max(s.len, p.len); }
  s.at = [];
  for (const tn in s.parsed) for (const e of s.parsed[tn].ev) (s.at[e.step] = s.at[e.step] || []).push({ tn, n: e.n, len: e.len, f: tn === 'drum' ? 0 : nf(e.n) });
}
const MUSIC = {
  cur: null, name: '', step: 0, next: 0, speed: 1, timer: null, onEnd: null,
  play(name, onEnd, speed = 1) {
    this.stop();
    if (!SND.ctx) { if (onEnd) setTimeout(onEnd, 1500); return; }
    this.cur = SONGS[name]; this.name = name; this.step = 0; this.speed = speed; this.onEnd = onEnd || null;
    this.next = SND.now() + 0.06;
    this.timer = setInterval(() => this.tick(), 25);
    this.tick();
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; this.name = ''; },
  setSpeed(s) { this.speed = s; },
  tick() {
    const s = this.cur; if (!s || !SND.ctx) return;
    const stepDur = 60 / (s.bpm * this.speed) / 4;
    while (this.next < SND.now() + 0.12) {
      if (this.step >= s.len) {
        if (s.loop) this.step = 0;
        else { const cb = this.onEnd; this.stop(); if (cb) setTimeout(cb, 300); return; }
      }
      const evs = s.at[this.step];
      if (evs) for (const e of evs) this.voice(e, this.next, e.len * stepDur);
      this.step++; this.next += stepDur;
    }
  },
  voice(e, t, d) {
    const S = SND, dest = S.music;
    if (e.tn === 'lead') S.tone(e.f, t, Math.max(0.05, d * 0.92), { duty: 0.25, vol: 0.13, dest, rel: 0.03, vib: d > 0.3 });
    else if (e.tn === 'harm') S.tone(e.f, t, Math.max(0.05, d * 0.85), { duty: 0.125, vol: 0.06, dest });
    else if (e.tn === 'bass') S.tone(e.f, t, Math.max(0.05, d * 0.9), { wave: 'tri', vol: 0.26, dest, rel: 0.02 });
    else if (e.tn === 'drum') {
      if (e.n === 'k') S.tone(150, t, 0.11, { wave: 'sine', slide: 40, slideT: 0.1, vol: 0.4, dest });
      else if (e.n === 's') S.noiseHit(t, 0.11, { freq: 1800, vol: 0.13, dest });
      else S.noiseHit(t, 0.03, { freq: 7000, vol: 0.06, dest });
    }
  }
};
