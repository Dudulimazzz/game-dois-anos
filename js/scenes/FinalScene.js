// Tela final: o envelope se abre, a carta (data/memorias.json → cartaFinal) aparece
// letra por letra, e no fim vem "Capítulo 3: em breve". Depois, os créditos.

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, nightScenery, Pager, fadeTo } from '../systems/ui.js';
import { Input } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Sfx, Music } from '../systems/sfx.js';
import { Progresso } from '../systems/progresso.js';
import { ORIGIN_X, ORIGIN_Y } from '../systems/characters.js';

const PAPER_W = 660;
const PAPER_H = 440;
const LINE_H = 34;
const INK = '#4a2638';

export class FinalScene extends Phaser.Scene {
  constructor() {
    super('Final');
  }

  init(data) {
    this.mode = (data && data.mode) || 'dois';
    this.busy = false;
    this.stage = 'envelope';
    this.pager = null;
  }

  create() {
    Touch.setLayout(null);
    Music.play('memoria');
    Progresso.marcarFinal();
    const mem = this.registry.get('memorias') || {};
    const nomes = this.registry.get('nomes');
    let carta = mem.cartaFinal || {};
    if (typeof carta === 'string') carta = { texto: carta };
    this.carta = {
      titulo: carta.titulo || `Para ${nomes.ela}`,
      texto: carta.texto || '',
      assinatura: carta.assinatura || nomes.ele,
    };
    this.capitulo = mem.capitulo3 || { titulo: 'Capítulo 3', subtitulo: 'em breve' };

    this.scenery = nightScenery(this, { heartFreq: 1400 });
    const groundY = GAME_H - 64;
    this.ele = this.add.sprite(GAME_W / 2 - 20, groundY, 'ele-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(PX).play('ele-idle');
    this.ela = this.add.sprite(GAME_W / 2 + 18, groundY, 'ela-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(PX).setFlipX(true).play('ela-idle');
    this.ela.anims.setProgress(0.5);

    // --- envelope
    this.stage = 'envelope';
    this.env = this.add.image(GAME_W / 2, 220, 'envelope').setScale(0.05).setDepth(20);
    this.tweens.add({ targets: this.env, scale: PX * 6, duration: 700, ease: 'Back.easeOut', delay: 400 });
    this.tweens.add({ targets: this.env, y: 212, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1100 });
    this.hint = txt(this, GAME_W / 2, 360, 'Toque ou aperte uma tecla para abrir', 20, UI.text).setAlpha(0).setDepth(20);
    this.tweens.add({ targets: this.hint, alpha: 1, duration: 400, delay: 1200 });
    this.time.delayedCall(1300, () => this.tweens.add({ targets: this.hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 }));

    this.offKey = Input.onAnyKey(() => this.advance());
    this.input.on('pointerdown', () => this.advance());
    this.events.once('shutdown', () => this.offKey());
    this.cameras.main.fadeIn(600, 18, 12, 26);
    this.readyAt = this.time.now + 1100;
  }

  advance() {
    if (this.time.now < this.readyAt || this.busy) return;
    if (this.stage === 'envelope') this.openLetter();
    else if (this.stage === 'carta') {
      if (this.pager.finished) this.closeLetter();
      else this.pager.advance();
    } else if (this.stage === 'capitulo') this.toCredits();
  }

  openLetter() {
    this.busy = true;
    this.stage = 'carta';
    Sfx.heart();
    this.tweens.killTweensOf([this.env, this.hint]);
    this.hint.setVisible(false);
    this.tweens.add({ targets: this.env, scale: PX * 7, alpha: 0, duration: 350, ease: 'Cubic.easeIn' });
    this.add.particles(GAME_W / 2, 220, 'heart_small', {
      emitting: false, lifespan: 1000, speed: { min: 60, max: 160 }, scale: { start: PX, end: PX * 0.5 }, alpha: { start: 1, end: 0 },
    }).setDepth(21).explode(16);

    // escurece o fundo e desdobra o papel
    this.dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120c1a, 0).setOrigin(0).setDepth(25);
    this.tweens.add({ targets: this.dim, fillAlpha: 0.55, duration: 400 });
    const paper = this.add.container(GAME_W / 2, GAME_H / 2).setDepth(30);
    this.paper = paper;
    const x0 = -PAPER_W / 2, y0 = -PAPER_H / 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRect(x0 + 10, y0 + 12, PAPER_W, PAPER_H);
    g.fillStyle(0xfff6ea, 1);
    g.fillRect(x0, y0, PAPER_W, PAPER_H);
    g.fillStyle(0xf1e4d4, 1);
    g.fillRect(x0, y0 + PAPER_H - PX * 3, PAPER_W, PX * 3);
    // linhas do caderno, alinhadas com o texto (mede a altura de uma linha da fonte)
    this.textTop = y0 + 96;
    const probe = txt(this, 0, 0, 'Ág', 20, INK, { shadow: false });
    const oneLine = probe.height;
    probe.destroy();
    g.fillStyle(0xe6d3c3, 1);
    for (let yy = this.textTop + oneLine - 2; yy < y0 + PAPER_H - 40; yy += LINE_H) g.fillRect(x0 + 40, yy, PAPER_W - 80, PX);
    g.fillStyle(0xffb3c7, 1);
    g.fillRect(x0 + 60, y0 + 16, PX, PAPER_H - 32);
    paper.add(g);
    paper.add(this.add.image(x0 + PAPER_W - 46, y0 + 40, 'heart_big').setScale(PX * 1.5));
    paper.add(txt(this, x0 + 80, y0 + 48, this.carta.titulo, 40, '#c2335f', { ox: 0, shadow: false }));
    this.bodyText = txt(this, x0 + 80, this.textTop, '', 20, INK, { ox: 0, oy: 0, align: 'left', wrap: PAPER_W - 140, lineSpacing: LINE_H - oneLine, shadow: false });
    paper.add(this.bodyText);
    this.more = this.add.image(x0 + PAPER_W - 40, y0 + PAPER_H - 30, 'marker').setScale(PX).setTint(0xc2335f).setVisible(false);
    this.tweens.add({ targets: this.more, y: this.more.y + 6, duration: 380, yoyo: true, repeat: -1 });
    paper.add(this.more);
    this.pageNum = txt(this, 0, y0 + PAPER_H - 30, '', 20, '#b39a8c', { shadow: false });
    paper.add(this.pageNum);

    paper.setScale(1, 0.02).setAlpha(0);
    this.tweens.add({
      targets: paper,
      scaleY: 1,
      alpha: 1,
      duration: 500,
      delay: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.busy = false;
        // assinatura vai junto na última página
        const texto = `${this.carta.texto}\n\n${this.carta.assinatura}`;
        const maxLines = Math.floor((PAPER_H - 96 - 50) / LINE_H);
        this.pager = new Pager(this, this.bodyText, texto, maxLines, {
          speed: 36,
          pitch: 640,
          onWait: (on) => this.more.setVisible(on),
          onPage: (i, n) => this.pageNum.setText(n > 1 ? `${i + 1}/${n}` : ''),
          onDone: () => this.more.setVisible(true),
        });
      },
    });
  }

  closeLetter() {
    this.busy = true;
    Sfx.click();
    this.tweens.add({
      targets: this.paper,
      scaleY: 0.02,
      alpha: 0,
      duration: 380,
      ease: 'Cubic.easeIn',
      onComplete: () => this.showChapter(),
    });
    this.tweens.add({ targets: this.dim, fillAlpha: 0, duration: 600 });
  }

  showChapter() {
    this.stage = 'capitulo';
    const cy = 170;
    const t1 = txt(this, GAME_W / 2, cy + 8, this.capitulo.titulo, 80, '#5a1630', { shadow: false }).setAlpha(0);
    const t2 = txt(this, GAME_W / 2, cy, this.capitulo.titulo, 80, '#ffd3df', { shadowColor: '#a8335a' }).setAlpha(0);
    const t3 = txt(this, GAME_W / 2, cy + 72, this.capitulo.subtitulo, 40, UI.gold).setAlpha(0);
    this.tweens.add({ targets: [t1, t2], alpha: 1, y: '-=10', duration: 900, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: t3, alpha: 1, duration: 700, delay: 900 });
    this.time.delayedCall(500, () => {
      Sfx.ding();
      this.ele.play('ele-celebrate');
      this.ela.play('ela-celebrate');
    });
    // corações subindo dos dois
    this.time.addEvent({
      delay: 260,
      repeat: 14,
      callback: () => {
        const h = this.add.image(GAME_W / 2 + Phaser.Math.Between(-30, 30), GAME_H - 140, 'heart').setScale(PX);
        this.tweens.add({ targets: h, y: h.y - Phaser.Math.Between(90, 160), x: h.x + Phaser.Math.Between(-40, 40), alpha: 0, duration: 1800, ease: 'Sine.easeOut', onComplete: () => h.destroy() });
      },
    });
    const p = txt(this, GAME_W / 2, 330, 'Toque ou aperte uma tecla para ver os créditos', 20, UI.text).setAlpha(0);
    this.time.delayedCall(2400, () => {
      this.busy = false;
      this.tweens.add({ targets: p, alpha: { from: 0, to: 1 }, duration: 500, onComplete: () => this.tweens.add({ targets: p, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 }) });
    });
    this.busy = true;
  }

  toCredits() {
    this.busy = true;
    fadeTo(this, 'Creditos', { mode: this.mode }, 700);
  }

  update(time, delta) {
    this.scenery.update(delta / 1000);
    if (this.pager && this.stage === 'carta') this.pager.update(Math.min(delta, 50) / 1000);
  }
}
