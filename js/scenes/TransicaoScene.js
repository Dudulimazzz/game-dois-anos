// Tela de transição entre fases: nome do lugar, data e um ônibus andando na estrada.

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, fadeTo } from '../systems/ui.js';
import { Input } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Sfx } from '../systems/sfx.js';
import { getTheme } from '../themes/index.js';
import { makeCanvas } from '../systems/textures.js';

export class TransicaoScene extends Phaser.Scene {
  constructor() {
    super('Transicao');
  }

  init(data) {
    this.next = data; // { fase, mode }
    this.leaving = false;
  }

  create() {
    Touch.setLayout(null);
    getTheme('onibus').textures(this); // ícone do ônibus
    this.cameras.main.fadeIn(400, 18, 12, 26);
    const mem = this.registry.get('memorias') || {};
    const fases = mem.fases || [];
    const idx = fases.findIndex((f) => f.id === this.next.fase);
    const fase = fases[idx] || { nome: this.next.fase, data: '' };

    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1b1326).setOrigin(0);
    // estrelinhas
    for (let i = 0; i < 40; i++) {
      const s = this.add.image(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, 260), 'pixel').setScale(PX).setAlpha(Math.random() * 0.6 + 0.2);
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(800, 2000), yoyo: true, repeat: -1 });
    }

    if (idx >= 0) txt(this, GAME_W / 2, 150, `Fase ${idx + 1}`, 20, UI.textDim);
    txt(this, GAME_W / 2, 200, fase.nome, 40, UI.accent, { wrap: 860 });
    if (fase.data) txt(this, GAME_W / 2, 252, fase.data, 20, UI.gold);

    // estrada pixelada
    const roadY = 380;
    this.add.rectangle(0, roadY, GAME_W, 36, 0x3d3943).setOrigin(0);
    this.add.rectangle(0, roadY, GAME_W, 4, 0x6b6575).setOrigin(0);
    this.add.rectangle(0, roadY + 36, GAME_W, 4, 0x6b6575).setOrigin(0);
    const dashKey = this.textures.exists('faixa_transicao')
      ? 'faixa_transicao'
      : makeCanvas(this, 'faixa_transicao', 24, 2, (ctx, px) => px(0, 0, '#f1e4c6', 10, 2)).key;
    this.dashes = this.add.tileSprite(0, roadY + 17, GAME_W / PX, 2, dashKey).setOrigin(0).setScale(PX);
    this.bus = this.add.image(-60, roadY + 2, 'onibus_icone').setOrigin(0.5, 1).setScale(PX);
    this.tweens.add({ targets: this.bus, x: GAME_W / 2, duration: 1600, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: this.bus, y: this.bus.y - 2, duration: 160, yoyo: true, repeat: -1 });

    this.leaving = false;
    this.time.delayedCall(3200, () => this.go());
    this.time.delayedCall(500, () => {
      this.off = Input.onAnyKey(() => this.go());
      this.input.once('pointerdown', () => this.go());
    });
    this.events.once('shutdown', () => this.off && this.off());
  }

  go() {
    if (this.leaving) return;
    this.leaving = true;
    Sfx.whoosh();
    this.tweens.add({ targets: this.bus, x: GAME_W + 80, duration: 700, ease: 'Cubic.easeIn' });
    this.time.delayedCall(300, () => fadeTo(this, 'Level', this.next, 400));
  }

  update(time, delta) {
    this.dashes.tilePositionX += (delta / 1000) * (this.leaving ? 200 : 90);
  }
}
