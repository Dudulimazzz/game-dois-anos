// Som do jogo: efeitos e música chiptune, tudo sintetizado na hora com Web Audio
// (sem arquivos de áudio, sem licença de terceiros: as músicas são composições originais
// escritas em js/systems/musicas.js).
//
// Preferências (música / efeitos ligados) ficam salvas. Atalho: tecla M liga/desliga a música.

import { Save } from './save.js';
import { MUSICAS } from './musicas.js';

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let noiseBuf = null;

const prefs = Object.assign({ musica: true, efeitos: true }, Save.get('som', {}) || {});
const MUSIC_VOL = 0.55;
const SFX_VOL = 1;

function ac() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      // compressor suave: evita estourar quando muita coisa toca junto
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 3;
      master.connect(comp);
      comp.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = prefs.musica ? MUSIC_VOL : 0;
      musicBus.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = prefs.efeitos ? SFX_VOL : 0;
      sfxBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume().catch(() => {});
  return ctx;
}

// O navegador só libera o som depois de um toque/tecla
['keydown', 'pointerdown', 'touchstart'].forEach((ev) =>
  window.addEventListener(ev, () => {
    const a = ac();
    if (a && Music.wanted && !Music.current) Music.play(Music.wanted);
  }, { passive: true }),
);
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  try {
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  } catch (e) {
    /* ok */
  }
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) Sfx.setMusica(!prefs.musica);
});

function running() {
  const a = ac();
  return a && a.state === 'running' ? a : null;
}

// ---------------------------------------------------------------- efeitos

function tone(freq, dur, { type = 'square', vol = 0.2, slide = 0, delay = 0, attack = 0.004, bus = null } = {}) {
  const a = running();
  if (!a || !prefs.efeitos) return;
  try {
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) {
    /* sem som */
  }
}

function noise(dur, { vol = 0.1, freq = 2000, q = 1, type = 'bandpass', delay = 0, bus = null, sweep = 0 } = {}) {
  const a = running();
  if (!a) return;
  if (!bus && !prefs.efeitos) return;
  try {
    const t = a.currentTime + delay;
    const src = a.createBufferSource();
    src.buffer = noiseBuf;
    const f = a.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), t + dur);
    f.Q.value = q;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  } catch (e) {
    /* sem som */
  }
}

export const Sfx = {
  blip(freq = 520) {
    tone(freq + Math.random() * 40, 0.045, { type: 'square', vol: 0.05 });
  },
  ding() {
    tone(1320, 0.5, { type: 'sine', vol: 0.18 });
    tone(990, 0.6, { type: 'sine', vol: 0.14, delay: 0.18 });
  },
  thud() {
    tone(90, 0.18, { type: 'triangle', vol: 0.25, slide: -40 });
    noise(0.08, { vol: 0.05, freq: 300, type: 'lowpass' });
  },
  click() {
    tone(700, 0.05, { type: 'square', vol: 0.07 });
  },
  heart() {
    tone(880, 0.08, { type: 'square', vol: 0.06 });
    tone(1320, 0.12, { type: 'square', vol: 0.06, delay: 0.07 });
    tone(1760, 0.16, { type: 'sine', vol: 0.06, delay: 0.13 });
  },
  door() {
    tone(220, 0.25, { type: 'sawtooth', vol: 0.04, slide: 120 });
    noise(0.25, { vol: 0.03, freq: 900, sweep: 600 });
  },
  // pulo: ele um pouco mais grave, ela mais aguda
  jump(who) {
    const f = who === 'ela' ? 520 : 380;
    tone(f, 0.12, { type: 'square', vol: 0.045, slide: f * 0.9 });
  },
  land(force = 1) {
    noise(0.07, { vol: 0.04 * force, freq: 500, type: 'lowpass' });
  },
  step() {
    noise(0.03, { vol: 0.012, freq: 1400, q: 2 });
  },
  push() {
    noise(0.09, { vol: 0.02, freq: 260, type: 'lowpass' });
  },
  // voltou ao checkpoint: "plim" descendo e subindo
  respawn() {
    tone(660, 0.12, { type: 'triangle', vol: 0.12, slide: -300 });
    tone(523, 0.1, { type: 'square', vol: 0.04, delay: 0.32 });
    tone(784, 0.1, { type: 'square', vol: 0.04, delay: 0.4 });
    tone(1046, 0.16, { type: 'square', vol: 0.04, delay: 0.48 });
  },
  checkpoint() {
    tone(784, 0.12, { type: 'triangle', vol: 0.12 });
    tone(1175, 0.25, { type: 'triangle', vol: 0.1, delay: 0.09 });
  },
  switchChar(who) {
    const f = who === 'ela' ? 880 : 587;
    tone(f * 0.75, 0.06, { type: 'square', vol: 0.05 });
    tone(f, 0.09, { type: 'square', vol: 0.05, delay: 0.05 });
  },
  menuMove() {
    tone(980, 0.035, { type: 'square', vol: 0.04 });
  },
  menuOk() {
    tone(660, 0.06, { type: 'square', vol: 0.06 });
    tone(990, 0.1, { type: 'square', vol: 0.06, delay: 0.06 });
  },
  menuBack() {
    tone(660, 0.06, { type: 'square', vol: 0.05 });
    tone(440, 0.09, { type: 'square', vol: 0.05, delay: 0.06 });
  },
  pause() {
    tone(523, 0.07, { type: 'square', vol: 0.05 });
    tone(392, 0.12, { type: 'square', vol: 0.05, delay: 0.07 });
  },
  page() {
    noise(0.12, { vol: 0.05, freq: 3000, sweep: -2200, q: 0.7 });
  },
  whoosh() {
    noise(0.35, { vol: 0.04, freq: 400, sweep: 2400, q: 0.8 });
  },
  // grilo: três "cri" bem agudos e baixinhos
  grilo() {
    for (let i = 0; i < 3; i++) tone(4200 + Math.random() * 200, 0.035, { type: 'sine', vol: 0.025, delay: i * 0.07 });
  },
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, { type: 'square', vol: 0.05, delay: i * 0.09 }));
    tone(1318, 0.5, { type: 'triangle', vol: 0.12, delay: 0.38 });
  },

  get musica() {
    return prefs.musica;
  },
  get efeitos() {
    return prefs.efeitos;
  },
  setMusica(on) {
    prefs.musica = !!on;
    Save.set('som', prefs);
    if (musicBus && ctx) musicBus.gain.setTargetAtTime(on ? MUSIC_VOL : 0, ctx.currentTime, 0.15);
  },
  setEfeitos(on) {
    prefs.efeitos = !!on;
    Save.set('som', prefs);
    if (sfxBus && ctx) sfxBus.gain.setTargetAtTime(on ? SFX_VOL : 0, ctx.currentTime, 0.05);
  },
};

// ---------------------------------------------------------------- música

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  let n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return n + (parseInt(m[3], 10) + 1) * 12;
}
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Converte "C5 - E5 . G5" em eventos { step, notas[], len } ('-' segura, '.' pausa)
function parseLine(str) {
  const toks = str.trim().split(/\s+/);
  const evs = [];
  toks.forEach((t, i) => {
    if (t === '-' || t === '.') return;
    if (/^[khs]$/.test(t)) {
      evs.push({ step: i, drum: t, len: 1 });
      return;
    }
    const notas = t.split('+').map(midi).filter((x) => x !== null);
    let len = 1;
    while (toks[i + len] === '-') len++;
    if (notas.length) evs.push({ step: i, notas, len });
  });
  return { steps: toks.length, evs };
}

class Track {
  constructor(def) {
    this.def = def;
    this.stepDur = 60 / def.bpm / (def.div || 2);
    this.voices = def.voices.map((v) => ({ ...v, ...parseLine(v.notas) }));
    this.steps = Math.max(...this.voices.map((v) => v.steps));
    this.byStep = new Map();
    this.voices.forEach((v) => v.evs.forEach((e) => {
      if (!this.byStep.has(e.step)) this.byStep.set(e.step, []);
      this.byStep.get(e.step).push({ v, e });
    }));
  }
}

const cache = {};
function getTrack(name) {
  if (!MUSICAS[name]) return null;
  if (!cache[name]) cache[name] = new Track(MUSICAS[name]);
  return cache[name];
}

function playVoice(v, e, t, dur, out) {
  const a = ctx;
  if (e.drum) {
    if (e.drum === 'k') {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(v.vol * 2.2, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 0.18);
    } else {
      const src = a.createBufferSource();
      src.buffer = noiseBuf;
      const f = a.createBiquadFilter();
      f.type = e.drum === 'h' ? 'highpass' : 'bandpass';
      f.frequency.value = e.drum === 'h' ? 7000 : 1800;
      const g = a.createGain();
      const d = e.drum === 'h' ? 0.04 : 0.12;
      g.gain.setValueAtTime(v.vol * (e.drum === 'h' ? 0.6 : 1), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 0.5);
      src.stop(t + d + 0.02);
    }
    return;
  }
  const len = v.curto ? Math.min(dur, v.curto) : dur;
  for (const n of e.notas) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = v.onda || 'square';
    o.frequency.setValueAtTime(hz(n), t);
    if (v.vibrato && len > 0.3) {
      const lfo = a.createOscillator();
      const lg = a.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(hz(n) * 0.006, t + 0.25);
      lfo.connect(lg);
      lg.connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + len + 0.1);
    }
    const vol = v.vol / Math.sqrt(e.notas.length);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setTargetAtTime(vol * (v.sustain ?? 0.6), t + 0.02, 0.08);
    g.gain.setTargetAtTime(0.0001, t + len * 0.92, v.release ?? 0.04);
    let node = o;
    if (v.filtro) {
      const f = a.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = v.filtro;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + len + 0.5);
  }
}

export const Music = {
  current: null, // nome da música tocando
  wanted: null, // nome pedido (toca assim que o som for liberado)
  play(name) {
    this.wanted = name;
    if (this.current === name) {
      this.duck(false);
      return;
    }
    const a = running();
    if (!a) return;
    this.stopCurrent(0.6);
    const track = getTrack(name);
    if (!track) return;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, a.currentTime);
    out.gain.linearRampToValueAtTime(1, a.currentTime + 0.8);
    out.connect(musicBus);
    const st = { name, track, out, step: 0, next: a.currentTime + 0.1 };
    st.timer = setInterval(() => this.tick(st), 25);
    this.state = st;
    this.current = name;
  },
  tick(st) {
    const a = ctx;
    if (!a || a.state !== 'running') {
      if (a) st.next = a.currentTime + 0.1;
      return;
    }
    if (st.next < a.currentTime - 0.3) st.next = a.currentTime + 0.05; // voltou de uma pausa longa
    const tr = st.track;
    while (st.next < a.currentTime + 0.15) {
      const list = tr.byStep.get(st.step % tr.steps);
      if (list) for (const { v, e } of list) {
        try {
          playVoice(v, e, st.next, e.len * tr.stepDur, st.out);
        } catch (err) {
          if (window.__somDebug) console.warn(err); // ignora uma nota
        }
      }
      st.step++;
      st.next += tr.stepDur;
    }
  },
  stopCurrent(fade = 0.5) {
    const st = this.state;
    if (!st) return;
    clearInterval(st.timer);
    try {
      st.out.gain.cancelScheduledValues(ctx.currentTime);
      st.out.gain.setValueAtTime(st.out.gain.value, ctx.currentTime);
      st.out.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
      setTimeout(() => st.out.disconnect(), fade * 1000 + 600);
    } catch (e) {
      /* ok */
    }
    this.state = null;
    this.current = null;
  },
  stop() {
    this.wanted = null;
    this.stopCurrent();
  },
  // abaixa a música (ex.: menu de pausa)
  duck(on) {
    const st = this.state;
    if (!st || !ctx) return;
    st.out.gain.setTargetAtTime(on ? 0.35 : 1, ctx.currentTime, 0.12);
  },
};
