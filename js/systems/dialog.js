// Diálogos em balões que aparecem letra por letra, com som.
// Não pausam o jogo: são pensamentos e falas curtas acima da cabeça de quem fala.
// Os textos ficam em data/memorias.json (fases[].dialogos).

import { Sfx } from './sfx.js';

const SPEED = 32; // letras por segundo
const WRAP = 116; // largura máxima do texto (pixels de mundo)

export class Dialog {
  constructor(scene, speakers) {
    this.scene = scene;
    this.speakers = speakers; // { ele: Player, ela: Player }
    this.queue = [];
    this.current = null;
    this.onIdle = [];
  }

  get busy() {
    return !!this.current || this.queue.length > 0;
  }

  // lines: [{ quem: 'ele'|'ela', texto, pensamento?: bool, pausa?: segundos }]
  play(lines, onDone) {
    if (!lines || !lines.length) {
      if (onDone) onDone();
      return;
    }
    lines.forEach((l, i) => this.queue.push({ ...l, onDone: i === lines.length - 1 ? onDone : null }));
    if (!this.current) this.next();
  }

  next() {
    this.clearBubble();
    const line = this.queue.shift();
    if (!line) {
      this.current = null;
      return;
    }
    const who = this.speakers[line.quem];
    if (!who || !line.texto) {
      if (line.onDone) line.onDone();
      this.next();
      return;
    }
    const s = this.scene;
    const text = s.add
      .text(0, 0, '', {
        fontFamily: '"Pixelify Sans"',
        fontSize: '10px',
        color: '#2a1d33',
        wordWrap: { width: WRAP },
        lineSpacing: 2,
      })
      .setResolution(2)
      .setDepth(41);
    // quebra as linhas antes de digitar (assim as palavras não pulam de linha no meio)
    const full = text.getWrappedText(line.texto).join('\n');
    text.setWordWrapWidth(null);
    text.setText(full);
    const w = Math.ceil(text.width) + 10;
    const h = Math.ceil(text.height) + 7;
    text.setText('');
    const g = s.add.graphics().setDepth(40);
    this.current = { line, who, text, g, w, h, full, shown: 0, hold: 0, done: false };
    this.drawBubble();
    this.blipTimer = 0;
  }

  drawBubble() {
    const { g, w, h, line } = this.current;
    g.clear();
    const fill = line.pensamento ? 0xf4ecff : 0xfff8ee;
    // contorno e fundo com cantos "pixelados"
    g.fillStyle(0x2a1d33, 1);
    g.fillRect(1, 0, w - 2, h);
    g.fillRect(0, 1, w, h - 2);
    g.fillStyle(fill, 1);
    g.fillRect(1, 1, w - 2, h - 2);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(2, 1, w - 4, 1);
    if (line.pensamento) {
      // bolinhas de pensamento
      g.fillStyle(0x2a1d33, 1);
      g.fillRect(w / 2 - 3, h + 1, 4, 4);
      g.fillRect(w / 2 - 6, h + 6, 3, 3);
      g.fillStyle(fill, 1);
      g.fillRect(w / 2 - 2, h + 2, 2, 2);
      g.fillRect(w / 2 - 5, h + 7, 1, 1);
    } else {
      // rabinho da fala
      g.fillStyle(0x2a1d33, 1);
      g.fillRect(w / 2 - 3, h - 1, 6, 2);
      g.fillRect(w / 2 - 2, h + 1, 4, 1);
      g.fillRect(w / 2 - 1, h + 2, 2, 2);
      g.fillStyle(fill, 1);
      g.fillRect(w / 2 - 2, h - 1, 4, 1);
      g.fillRect(w / 2 - 1, h, 2, 1);
    }
  }

  clearBubble() {
    if (!this.current) return;
    this.current.text.destroy();
    this.current.g.destroy();
  }

  skip() {
    const c = this.current;
    if (!c) return;
    if (c.shown < c.full.length) c.shown = c.full.length;
    else c.hold = 99;
  }

  update(dt) {
    const c = this.current;
    if (!c) return;
    const full = c.full;
    if (c.shown < full.length) {
      const before = Math.floor(c.shown);
      c.shown = Math.min(full.length, c.shown + dt * SPEED);
      const now = Math.floor(c.shown);
      if (now !== before) {
        c.text.setText(full.slice(0, now));
        this.blipTimer -= now - before;
        if (this.blipTimer <= 0 && full[now - 1] !== ' ' && full[now - 1] !== '\n') {
          this.blipTimer = 2;
          Sfx.blip(c.line.quem === 'ela' ? 760 : 430);
        }
      }
    } else {
      if (c.text.text !== full) c.text.setText(full);
      c.hold += dt;
      const wait = c.line.pausa ?? Math.max(1.4, full.length * 0.05);
      if (c.hold >= wait) {
        const cb = c.line.onDone;
        this.next();
        if (cb) cb();
        return;
      }
    }
    // acompanha a cabeça de quem fala, sem sair da tela
    const p = c.who;
    const view = this.scene.cameras.main.worldView;
    let x = Math.round(p.x - c.w / 2);
    const y = Math.round(p.feet - p.def.h - c.h - 16);
    x = Math.max(view.x + 4, Math.min(view.right - c.w - 4, x));
    c.g.setPosition(x, Math.max(view.y + 4, y));
    c.text.setPosition(x + 5, Math.max(view.y + 4, y) + 3);
  }

  destroy() {
    this.queue = [];
    this.clearBubble();
    this.current = null;
  }
}
