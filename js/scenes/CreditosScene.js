// Créditos: as fotos das memórias passam do lado esquerdo enquanto os nomes sobem do lado direito.
// Os textos ficam em data/memorias.json → creditos. Os créditos de terceiros (Phaser, fonte)
// são acrescentados automaticamente no fim (licenças: veja CREDITS.md).

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, polaroid, queuePhoto, smoothPhoto, fadeTo } from '../systems/ui.js';
import { Input, BINDS, InputReader } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Music } from '../systems/sfx.js';

const COL_X = 690; // centro da coluna de texto
const PHOTO_X = 262;
const SPEED = 38; // pixels por segundo

const TERCEIROS = [
  { titulo: 'Feito com', nomes: ['Phaser (licença MIT)', 'Fonte Pixelify Sans, de Stefie Justprince (SIL OFL)'] },
];

export class CreditosScene extends Phaser.Scene {
  constructor() {
    super('Creditos');
  }

  init(data) {
    this.mode = (data && data.mode) || 'dois';
    this.leaving = false;
    this.canLeave = false;
    this.ended = false;
    this.photo = null;
  }

  preload() {
    this.fotos = this.listPhotos();
    this.fotos.forEach((f) => queuePhoto(this, f.key, f.path));
  }

  listPhotos() {
    const mem = this.registry.get('memorias') || {};
    const cr = mem.creditos || {};
    const list = [];
    (mem.fases || []).forEach((f) => list.push({ key: `foto:${f.id}`, path: f.foto, legenda: f.legenda || f.nome }));
    (cr.fotosExtras || []).forEach((f, i) => {
      const path = typeof f === 'string' ? f : f.foto;
      if (path) list.push({ key: `foto:extra${i}`, path, legenda: (f && f.legenda) || '' });
    });
    return list;
  }

  create() {
    Touch.setLayout(null);
    Music.play('titulo');
    const mem = this.registry.get('memorias') || {};
    const cr = mem.creditos || {};
    const nomes = this.registry.get('nomes');
    this.fotos.forEach((f) => smoothPhoto(this, f.key));

    // --- fundo
    this.add.tileSprite(0, 0, GAME_W / PX, GAME_H / PX, 'sky_night').setOrigin(0).setScale(PX);
    const rnd = new Phaser.Math.RandomDataGenerator(['creditos']);
    for (let i = 0; i < 60; i++) {
      const s = this.add.image(rnd.between(0, GAME_W / PX) * PX, rnd.between(0, GAME_H / PX) * PX, 'pixel').setScale(PX).setAlpha(rnd.realInRange(0.2, 0.8));
      this.tweens.add({ targets: s, alpha: 0.1, duration: rnd.between(900, 2400), yoyo: true, repeat: -1, delay: rnd.between(0, 2000) });
    }
    this.add.particles(0, 0, 'heart_small', {
      x: { min: 0, max: GAME_W }, y: GAME_H + 10, lifespan: 11000,
      speedY: { min: -40, max: -20 }, speedX: { min: -8, max: 8 },
      scale: { min: PX, max: PX * 1.5 }, alpha: { start: 0.4, end: 0 }, frequency: 1100,
    });

    // --- rolagem de nomes
    const roll = this.add.container(0, GAME_H + 20);
    this.roll = roll;
    let y = 0;
    const add = (str, size, color, gap) => {
      const t = txt(this, COL_X, y, str, size, color, { oy: 0, wrap: 420 });
      roll.add(t);
      y += t.height + gap;
      return t;
    };
    const titulo = (mem.jogo && mem.jogo.titulo) || 'Nossa Jornada';
    add(titulo, 40, '#ffd3df', 12);
    add((mem.jogo && mem.jogo.subtitulo) || `${nomes.ele} & ${nomes.ela}`, 20, UI.gold, 70);

    const secoes = cr.secoes || [{ titulo: 'Estrelando', nomes: [nomes.ele, nomes.ela] }];
    const lugares = { titulo: 'Os lugares', nomes: (mem.fases || []).map((f) => f.nome) };
    [...secoes, lugares, ...TERCEIROS].forEach((s) => {
      add(s.titulo, 20, UI.textDim, 14);
      (s.nomes || []).forEach((n) => add(n, 20, UI.text, 10));
      y += 54;
    });
    this.rollEnd = y;

    // mensagem final (fica parada no centro)
    const fim = cr.fim && cr.fim.length ? cr.fim : ['Feliz 2 anos!'];
    this.fim = this.add.container(COL_X, GAME_H / 2).setAlpha(0);
    let fy = -((fim.length - 1) * 56) / 2;
    fim.forEach((l, i) => {
      this.fim.add(txt(this, 0, fy, l, i === 0 ? 40 : 20, i === 0 ? UI.accent : UI.text, { wrap: 420 }));
      fy += 56;
    });
    this.fim.add(this.add.image(0, fy + 10, 'heart_big').setScale(PX * 1.5));
    this.voltar = txt(this, COL_X, GAME_H - 46, 'Toque ou aperte uma tecla para voltar ao menu', 20, UI.textDim, { shadow: false }).setAlpha(0);

    // --- fotos passando
    this.photoIdx = 0;
    this.nextPhoto();
    this.time.addEvent({ delay: 4200, loop: true, callback: () => this.nextPhoto() });

    this.reader = new InputReader();
    this.ended = false;
    this.offKey = Input.onAnyKey(() => this.onKey());
    this.input.on('pointerdown', () => this.onKey());
    this.events.once('shutdown', () => this.offKey());
    this.cameras.main.fadeIn(700, 18, 12, 26);
  }

  nextPhoto() {
    if (!this.fotos.length) return;
    const f = this.fotos[this.photoIdx % this.fotos.length];
    this.photoIdx++;
    const ang = (this.photoIdx % 2 ? -1 : 1) * Phaser.Math.FloatBetween(2, 5);
    const p = polaroid(this, PHOTO_X + 40, GAME_H / 2 + 30, 340, 330, {
      texture: f.key, caption: f.legenda, placeholder: 'TODO: foto', angle: ang,
    }).setAlpha(0);
    const old = this.photo;
    this.photo = p;
    this.tweens.add({ targets: p, x: PHOTO_X, y: GAME_H / 2, alpha: 1, duration: 800, ease: 'Cubic.easeOut' });
    if (old) {
      this.tweens.add({ targets: old, x: PHOTO_X - 60, alpha: 0, angle: old.angle - 6, duration: 700, ease: 'Cubic.easeIn', onComplete: () => old.destroy() });
    }
  }

  onKey() {
    if (this.leaving) return;
    if (this.canLeave) {
      this.leaving = true;
      fadeTo(this, 'Menu', null, 600);
    }
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.ended) return;
    // segurar Enter/Espaço (ou o dedo na tela) acelera
    const fast = this.reader.held([...BINDS.menuOk, ...BINDS.menuDown]) || this.input.activePointer.isDown;
    this.roll.y -= dt * SPEED * (fast ? 5 : 1);
    if (this.reader.pressed(BINDS.menuBack)) this.roll.y = -this.rollEnd;
    if (this.roll.y < -this.rollEnd) {
      this.ended = true;
      this.tweens.add({ targets: this.fim, alpha: 1, duration: 1200 });
      this.tweens.add({ targets: this.voltar, alpha: 1, duration: 600, delay: 1600 });
      this.time.delayedCall(1600, () => (this.canLeave = true));
    }
  }
}
