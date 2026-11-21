// Peças de interface reutilizáveis (coordenadas de tela: 960x540).
// Elementos de pixel art são ampliados 2x para casar com o tamanho do pixel do mundo.

import { FONT, UI, GAME_W, GAME_H, PX } from '../config.js';
import { InputReader, BINDS } from './controls.js';
import { Sfx } from './sfx.js';

export function txt(scene, x, y, str, size = 20, color = UI.text, extra = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    align: extra.align || 'center',
    lineSpacing: extra.lineSpacing ?? 6,
    wordWrap: extra.wrap ? { width: extra.wrap } : undefined,
  });
  t.setOrigin(extra.ox ?? 0.5, extra.oy ?? 0.5);
  if (extra.shadow !== false) t.setShadow(0, PX, extra.shadowColor || '#2a1d33', 0, false, true);
  return t;
}

// Painel com cantos "pixelados"
export function panel(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  const p = PX;
  const fill = opts.fill ?? UI.panel;
  const edge = opts.edge ?? UI.panelEdge;
  const dark = 0x140d1c;
  // contorno escuro
  g.fillStyle(dark, 1);
  g.fillRect(x + p * 2, y, w - p * 4, h);
  g.fillRect(x, y + p * 2, w, h - p * 4);
  g.fillRect(x + p, y + p, w - p * 2, h - p * 2);
  // borda clara
  g.fillStyle(edge, 1);
  g.fillRect(x + p * 2, y + p, w - p * 4, h - p * 2);
  g.fillRect(x + p, y + p * 2, w - p * 2, h - p * 4);
  // miolo
  g.fillStyle(fill, opts.alpha ?? 1);
  g.fillRect(x + p * 2, y + p * 2, w - p * 4, h - p * 4);
  // brilho no topo
  g.fillStyle(0xffffff, 0.08);
  g.fillRect(x + p * 2, y + p * 2, w - p * 4, p * 2);
  return g;
}

// Tecla desenhada (letra ou seta)
const GLYPHS = { '↑': 'glyph_up', '↓': 'glyph_down', '←': 'glyph_left', '→': 'glyph_right' };
export function keycap(scene, x, y, label, opts = {}) {
  const c = scene.add.container(x, y);
  const minW = 15 * PX;
  const t = GLYPHS[label] ? null : scene.add.text(0, -PX, label, { fontFamily: FONT, fontSize: '20px', color: '#2a1d33' }).setOrigin(0.5);
  const w = Math.max(minW, t ? t.width + 10 * PX - 4 : minW);
  const h = 15 * PX;
  const g = scene.add.graphics();
  g.fillStyle(0x140d1c, 1);
  g.fillRect(-w / 2 + PX, -h / 2, w - PX * 2, h + PX);
  g.fillRect(-w / 2, -h / 2 + PX, w, h - PX);
  g.fillStyle(opts.side ?? 0xb8a6c8, 1);
  g.fillRect(-w / 2 + PX, -h / 2 + PX, w - PX * 2, h - PX);
  g.fillStyle(opts.top ?? 0xfff4e6, 1);
  g.fillRect(-w / 2 + PX, -h / 2 + PX, w - PX * 2, h - PX * 4);
  c.add(g);
  if (t) c.add(t);
  else c.add(scene.add.image(0, -PX, GLYPHS[label]).setScale(PX));
  c.width = w;
  return c;
}

// Menu vertical (ou horizontal com horizontal: true): setas/WASD para escolher, Enter/Espaço para confirmar, mouse e toque funcionam.
export class Menu {
  constructor(scene, items, opts = {}) {
    this.scene = scene;
    this.items = items;
    this.index = 0;
    this.reader = new InputReader();
    this.enabled = true;
    const x = opts.x ?? GAME_W / 2;
    const y = opts.y ?? GAME_H / 2;
    const gap = opts.gap ?? 56;
    const size = opts.size ?? 20;
    this.horizontal = !!opts.horizontal;
    this.entries = items.map((it, i) => {
      const yy = this.horizontal ? y : y + i * gap;
      const xx = this.horizontal ? x + (i - (items.length - 1) / 2) * gap : x;
      return this.makeEntry(scene, it, i, xx, yy, size);
    });
    this.select(0, true);
    // entrada animada: cada opção aparece um pouquinho depois da outra
    if (opts.intro !== false) {
      this.entries.forEach((e, i) => {
        const parts = [e.label, e.sub, e.heartL, e.heartR].filter(Boolean);
        parts.forEach((o) => {
          const y0 = o.y;
          o.setAlpha(0).setY(y0 + 12);
          scene.tweens.add({ targets: o, alpha: 1, y: y0, duration: 260, delay: 80 + i * 70, ease: 'Cubic.easeOut' });
        });
      });
    }
  }
  makeEntry(scene, it, i, x, yy, size) {
    const label = txt(scene, x, yy, it.label, size, UI.text);
    const sub = it.sub ? txt(scene, x, yy + size + 6, it.sub, 20, UI.textDim, { shadow: false }) : null;
    const hitW = Math.max(label.width, sub ? sub.width : 0) + (this.horizontal ? 64 : 120);
    const hitH = sub ? size + 40 : size + 24;
    const zone = scene.add.zone(x, yy + (sub ? 12 : 0), hitW, hitH).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      if (this.enabled && this.index !== i) this.select(i);
    });
    zone.on('pointerdown', () => {
      this.select(i);
      this.confirm();
    });
    const heartL = scene.add.image(x - label.width / 2 - 24, yy, 'heart').setScale(PX);
    const heartR = scene.add.image(x + label.width / 2 + 24, yy, 'heart').setScale(PX);
    return { label, sub, zone, heartL, heartR };
  }
  select(i, silent = false) {
    const prev = this.index;
    this.index = (i + this.items.length) % this.items.length;
    if (!silent && prev !== this.index) {
      Sfx.menuMove();
      const l = this.entries[this.index].label;
      this.scene.tweens.add({ targets: l, scale: { from: 1.08, to: 1 }, duration: 140, ease: 'Sine.easeOut' });
    }
    this.entries.forEach((e, k) => {
      const on = k === this.index;
      e.label.setColor(on ? UI.accent : UI.text);
      e.heartL.setVisible(on);
      e.heartR.setVisible(on);
      if (e.sub) e.sub.setColor(on ? UI.text : UI.textDim);
    });
  }
  confirm() {
    if (!this.enabled) return;
    const it = this.items[this.index];
    const e = this.entries[this.index];
    this.scene.tweens.add({ targets: [e.label], scale: 1.12, duration: 80, yoyo: true });
    Sfx.menuOk();
    if (it.action) it.action();
  }
  update(time) {
    if (!this.enabled) return;
    const r = this.reader;
    const prev = this.horizontal ? BINDS.menuLeft : BINDS.menuUp;
    const next = this.horizontal ? BINDS.menuRight : BINDS.menuDown;
    if (r.pressed(prev)) this.select(this.index - 1);
    if (r.pressed(next)) this.select(this.index + 1);
    if (r.pressed(BINDS.menuOk)) this.confirm();
    const e = this.entries[this.index];
    const off = Math.round(Math.sin(time / 180) * 1.5) * PX;
    e.heartL.x = e.label.x - e.label.width / 2 - 24 - off;
    e.heartR.x = e.label.x + e.label.width / 2 + 24 + off;
  }
  destroy() {
    this.entries.forEach((e) => {
      e.label.destroy();
      if (e.sub) e.sub.destroy();
      e.zone.destroy();
      e.heartL.destroy();
      e.heartR.destroy();
    });
  }
}

// Cenário noturno de título/menu (estrelas piscando, lua, colinas, corações subindo)
export function nightScenery(scene, opts = {}) {
  const S = PX;
  scene.add.tileSprite(0, 0, GAME_W / S, GAME_H / S, 'sky_night').setOrigin(0).setScale(S);
  const rnd = new Phaser.Math.RandomDataGenerator(['estrelas']);
  for (let i = 0; i < 70; i++) {
    const x = rnd.between(0, GAME_W / S) * S;
    const y = rnd.between(0, 150) * S;
    const star = scene.add.image(x, y, 'pixel').setScale(S).setAlpha(rnd.realInRange(0.3, 1));
    if (rnd.frac() < 0.15) star.setScale(S * 2).setTint(0xfff2b0);
    scene.tweens.add({
      targets: star,
      alpha: { from: star.alpha, to: 0.15 },
      duration: rnd.between(900, 2600),
      yoyo: true,
      repeat: -1,
      delay: rnd.between(0, 2000),
    });
  }
  scene.add.image(780, 96, 'moon').setScale(S);
  const far = scene.add.tileSprite(0, GAME_H, GAME_W / S, 120, 'hills_far').setOrigin(0, 1).setScale(S).setTint(0x6a4c8c);
  const mid = scene.add.tileSprite(0, GAME_H, GAME_W / S, 110, 'hills_mid').setOrigin(0, 1).setScale(S).setTint(0x8a6aa8);
  const near = scene.add.tileSprite(0, GAME_H, GAME_W / S, 90, 'hills_near').setOrigin(0, 1).setScale(S);
  const layers = [far, mid, near];
  const hearts = scene.add.particles(0, 0, 'heart_small', {
    x: { min: 0, max: GAME_W },
    y: GAME_H + 10,
    lifespan: 9000,
    speedY: { min: -60, max: -30 },
    speedX: { min: -10, max: 10 },
    scale: { min: S, max: S * 1.5 },
    alpha: { start: 0.7, end: 0 },
    frequency: opts.heartFreq ?? 700,
  });
  return {
    layers,
    hearts,
    update(dt) {
      far.tilePositionX += dt * 2;
      mid.tilePositionX += dt * 5;
      near.tilePositionX += dt * 9;
    },
  };
}

export function fadeTo(scene, key, data, ms = 350) {
  scene.cameras.main.fadeOut(ms, 18, 12, 26);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

// Barra de progresso com os 7 corações grandes (um por fase concluída)
export function heartBar(scene, cx, y, total, filled, opts = {}) {
  const scale = opts.scale ?? PX;
  const gap = opts.gap ?? 40;
  const x0 = cx - ((total - 1) * gap) / 2;
  const g = scene.add.graphics();
  // fitinha ligando os corações
  g.fillStyle(0x140d1c, 1);
  g.fillRect(x0, y - PX, (total - 1) * gap, PX * 3);
  g.fillStyle(0x6e5a84, 1);
  g.fillRect(x0, y, (total - 1) * gap, PX);
  const slots = [];
  for (let i = 0; i < total; i++) {
    const x = x0 + i * gap;
    const empty = scene.add.image(x, y, 'heart_slot').setScale(scale);
    const full = scene.add.image(x, y, 'heart_big').setScale(scale).setVisible(i < filled);
    slots.push({ x, y, empty, full });
  }
  return {
    slots,
    // Enche o espaço i com um "pop"
    fill(i) {
      const s = slots[i];
      if (!s) return;
      s.full.setVisible(true).setScale(scale * 1.8);
      scene.tweens.add({ targets: s.full, scale, duration: 380, ease: 'Back.easeOut' });
    },
    pulse(i) {
      const s = slots[i];
      if (!s) return;
      scene.tweens.add({ targets: s.full, scale: scale * 1.35, duration: 160, yoyo: true, ease: 'Sine.easeOut' });
    },
  };
}

// Texto que aparece letra por letra, com som. O texto é quebrado em linhas antes
// de começar, para as palavras não "pularem" de linha enquanto são escritas.
export class Typewriter {
  constructor(scene, textObj, full, opts = {}) {
    this.t = textObj;
    const wrapped = textObj.getWrappedText ? textObj.getWrappedText(full) : [full];
    this.full = wrapped.join('\n');
    textObj.setWordWrapWidth(null);
    textObj.setText('');
    this.speed = opts.speed ?? 40; // letras por segundo
    this.pitch = opts.pitch ?? 560;
    this.n = 0;
    this.acc = 0;
    this.done = this.full.length === 0;
    this.onDone = opts.onDone || null;
    this.lastBlip = 0;
  }
  update(dt) {
    if (this.done) return;
    this.acc += dt * this.speed;
    const before = this.n;
    while (this.acc >= 1 && this.n < this.full.length) {
      this.acc -= 1;
      this.n++;
      const ch = this.full[this.n - 1];
      if (ch === '.' || ch === '!' || ch === '?') this.acc -= 6; // respira no fim da frase
      else if (ch === ',') this.acc -= 2.5;
    }
    if (this.n !== before) {
      this.t.setText(this.full.slice(0, this.n));
      this.lastBlip += this.n - before;
      if (this.lastBlip >= 2 && this.full[this.n - 1] !== ' ') {
        this.lastBlip = 0;
        Sfx.blip(this.pitch);
      }
    }
    if (this.n >= this.full.length) this.finish();
  }
  finish() {
    if (this.done) return;
    this.n = this.full.length;
    this.t.setText(this.full);
    this.done = true;
    if (this.onDone) this.onDone();
  }
}

// Porta-retrato estilo foto instantânea, com fita adesiva.
// Se a foto existir (textura carregada), ela é recortada para preencher o quadro;
// senão aparece um espaço reservado avisando onde colocar a foto.
export function polaroid(scene, x, y, w, h, opts = {}) {
  const c = scene.add.container(x, y);
  const pad = 14;
  const bottom = opts.caption ? 52 : pad;
  const fw = w - pad * 2;
  const fh = h - pad - bottom;
  const g = scene.add.graphics();
  // sombra
  g.fillStyle(0x000000, 0.35);
  g.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
  // papel
  g.fillStyle(0xfff6ea, 1);
  g.fillRect(-w / 2, -h / 2, w, h);
  g.fillStyle(0xe8dccb, 1);
  g.fillRect(-w / 2, h / 2 - PX * 2, w, PX * 2);
  // fundo da foto
  g.fillStyle(0x2e2140, 1);
  g.fillRect(-w / 2 + pad, -h / 2 + pad, fw, fh);
  c.add(g);

  const fx = 0;
  const fy = -h / 2 + pad + fh / 2;
  if (opts.texture && scene.textures.exists(opts.texture)) {
    const img = scene.add.image(fx, fy, opts.texture);
    const tw = img.width, th = img.height;
    const s = Math.max(fw / tw, fh / th);
    const cw = fw / s, ch = fh / s;
    img.setCrop((tw - cw) / 2, (th - ch) / 2, cw, ch);
    img.setScale(s);
    c.add(img);
  } else {
    // espaço reservado: moldura tracejada com coração
    const d = scene.add.graphics();
    d.fillStyle(0x6e5a84, 1);
    const x0 = -fw / 2 + 12, y0 = fy - fh / 2 + 12, ww = fw - 24, hh = fh - 24;
    for (let k = 0; k < ww; k += 16) {
      d.fillRect(x0 + k, y0, 8, PX);
      d.fillRect(x0 + k, y0 + hh - PX, 8, PX);
    }
    for (let k = 0; k < hh; k += 16) {
      d.fillRect(x0, y0 + k, PX, 8);
      d.fillRect(x0 + ww - PX, y0 + k, PX, 8);
    }
    c.add(d);
    c.add(scene.add.image(fx, fy - 22, 'heart_big').setScale(PX * 1.5).setAlpha(0.8));
    c.add(txt(scene, fx, fy + 24, opts.placeholder || 'foto aqui', 20, UI.textDim, { shadow: false }));
  }
  if (opts.caption) {
    c.add(txt(scene, 0, h / 2 - bottom / 2 - 2, opts.caption, 20, '#5a3f73', { shadow: false, wrap: w - 24 }));
  }
  // fitas nos cantos
  c.add(scene.add.image(-w / 2 + 18, -h / 2 + 2, 'tape').setScale(PX).setAngle(-35));
  c.add(scene.add.image(w / 2 - 18, -h / 2 + 2, 'tape').setScale(PX).setAngle(35));
  if (opts.angle) c.setAngle(opts.angle);
  return c;
}

// Carrega a foto de uma memória (data/memorias.json → foto) se ainda não estiver na memória.
// Fotos não são pixel art: usam filtro suave para não ficarem serrilhadas ao reduzir.
export function queuePhoto(scene, key, path) {
  if (!path || scene.textures.exists(key)) return;
  scene.load.image(key, path);
}
export function smoothPhoto(scene, key) {
  if (scene.textures.exists(key)) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
}

// Pergunta de sim/não por cima da cena (ex.: apagar o progresso)
export function confirmBox(scene, pergunta, onYes, onNo) {
  const layer = scene.add.container(0, 0).setDepth(100);
  const bg = scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x120c1a, 0.75).setOrigin(0).setInteractive();
  layer.add(bg);
  const w = 560, h = 220;
  layer.add(panel(scene, (GAME_W - w) / 2, (GAME_H - h) / 2, w, h));
  layer.add(txt(scene, GAME_W / 2, GAME_H / 2 - 44, pergunta, 20, UI.text, { wrap: w - 60 }));
  const close = (fn) => {
    menu.enabled = false;
    menu.destroy();
    layer.destroy();
    box.closed = true;
    if (fn) fn();
  };
  const menu = new Menu(
    scene,
    [
      { label: 'Não', action: () => close(onNo) },
      { label: 'Sim', action: () => close(onYes) },
    ],
    { y: GAME_H / 2 + 44, gap: 180, size: 20, horizontal: true },
  );
  menu.entries.forEach((e) => [e.label, e.zone, e.heartL, e.heartR].forEach((o) => o.setDepth(101)));
  menu.reader.sync([...BINDS.menuOk]);
  const box = { closed: false, update: (time) => menu.update(time), cancel: () => close(onNo) };
  return box;
}

// Texto longo em páginas: escreve uma página letra por letra e espera um aperto para a próxima.
// advance(): durante a escrita mostra a página inteira; parado, vai para a próxima página.
export class Pager {
  constructor(scene, textObj, full, maxLines, opts = {}) {
    this.scene = scene;
    this.t = textObj;
    this.opts = opts;
    const lines = textObj.getWrappedText(full || '');
    textObj.setWordWrapWidth(null);
    this.pages = [];
    let cur = [];
    for (const l of lines) {
      if (!cur.length && !l.trim()) continue; // página não começa com linha vazia
      cur.push(l);
      if (cur.length >= Math.max(1, maxLines)) {
        this.pages.push(cur);
        cur = [];
      }
    }
    while (cur.length && !cur[cur.length - 1].trim()) cur.pop();
    if (cur.length || !this.pages.length) this.pages.push(cur);
    this.i = 0;
    this.waiting = false;
    this.finished = false;
    this.start();
  }
  start() {
    this.waiting = false;
    this.tw = new Typewriter(this.scene, this.t, this.pages[this.i].join('\n'), {
      speed: this.opts.speed,
      pitch: this.opts.pitch,
      onDone: () => this.pageDone(),
    });
    if (this.opts.onPage) this.opts.onPage(this.i, this.pages.length);
    if (this.tw.done) this.pageDone();
  }
  pageDone() {
    if (this.i >= this.pages.length - 1) {
      this.finished = true;
      if (this.opts.onDone) this.opts.onDone();
    } else {
      this.waiting = true;
      if (this.opts.onWait) this.opts.onWait(true);
    }
  }
  get typing() {
    return !this.tw.done;
  }
  advance() {
    if (!this.tw.done) {
      this.tw.finish();
    } else if (this.waiting) {
      if (this.opts.onWait) this.opts.onWait(false);
      this.i++;
      Sfx.page();
      this.start();
    }
  }
  update(dt) {
    this.tw.update(dt);
  }
}

// Painel que "salta" ao abrir. O container precisa ter os filhos em coordenadas de tela.
export function popIn(scene, container, ms = 260) {
  container.setPosition(GAME_W / 2, GAME_H / 2);
  container.each((ch) => {
    ch.x -= GAME_W / 2;
    ch.y -= GAME_H / 2;
  });
  container.setScale(0.9).setAlpha(0);
  scene.tweens.add({ targets: container, scale: 1, alpha: 1, duration: ms, ease: 'Back.easeOut' });
  return container;
}
