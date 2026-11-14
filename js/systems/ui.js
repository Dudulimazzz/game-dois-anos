// Peças de interface reutilizáveis (coordenadas de tela: 960x540).
// Elementos de pixel art são ampliados 2x para casar com o tamanho do pixel do mundo.

import { FONT, UI, GAME_W, GAME_H, PX } from '../config.js';
import { InputReader, BINDS } from './controls.js';

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

// Menu vertical: setas/W-S para escolher, Enter/Espaço para confirmar, mouse e toque funcionam.
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
    this.entries = items.map((it, i) => {
      const yy = y + i * gap;
      const label = txt(scene, x, yy, it.label, size, UI.text);
      const sub = it.sub ? txt(scene, x, yy + size + 6, it.sub, 20, UI.textDim, { shadow: false }) : null;
      const hitW = Math.max(label.width, sub ? sub.width : 0) + 120;
      const hitH = sub ? size + 40 : size + 24;
      const zone = scene.add.zone(x, yy + (sub ? 12 : 0), hitW, hitH).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.select(i));
      zone.on('pointerdown', () => {
        this.select(i);
        this.confirm();
      });
      const heartL = scene.add.image(x - label.width / 2 - 24, yy, 'heart').setScale(PX);
      const heartR = scene.add.image(x + label.width / 2 + 24, yy, 'heart').setScale(PX);
      return { label, sub, zone, heartL, heartR };
    });
    this.select(0);
  }
  select(i) {
    this.index = (i + this.items.length) % this.items.length;
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
    if (it.action) it.action();
  }
  update(time) {
    if (!this.enabled) return;
    const r = this.reader;
    if (r.pressed(BINDS.menuUp)) this.select(this.index - 1);
    if (r.pressed(BINDS.menuDown)) this.select(this.index + 1);
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
