// Galeria de sprites: mostra os dois personagens grandes com todas as animações,
// e também no tamanho real do jogo, para aprovar o visual.

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, panel, fadeTo } from '../systems/ui.js';
import { InputReader, BINDS } from '../systems/controls.js';
import { ANIM_NAMES, ORIGIN_X, ORIGIN_Y } from '../systems/characters.js';
import { Touch } from '../systems/touch.js';
import { Music } from '../systems/sfx.js';

const NOMES_ANIM = {
  idle: 'Parado',
  walk: 'Andando',
  jump: 'Pulando',
  fall: 'Caindo',
  push: 'Empurrando',
  celebrate: 'Comemorando',
};

export class GaleriaScene extends Phaser.Scene {
  constructor() {
    super('Galeria');
  }

  create() {
    Touch.setLayout(null);
    Music.play('titulo');
    this.cameras.main.fadeIn(300, 18, 12, 26);
    const nomes = this.registry.get('nomes');
    this.add.tileSprite(0, 0, GAME_W / PX, GAME_H / PX, 'sky_sunset').setOrigin(0).setScale(PX).setAlpha(0.55);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1b1326, 0.55).setOrigin(0);

    txt(this, GAME_W / 2, 34, 'Galeria de sprites', 40, UI.accent);

    // Palco
    const floorY = 360;
    this.add.rectangle(0, floorY, GAME_W, 4, 0x5a3f73).setOrigin(0);
    this.add.rectangle(0, floorY + 4, GAME_W, 200, 0x24182f, 0.8).setOrigin(0);

    const big = 6;
    this.ele = this.add.sprite(250, floorY, 'ele-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(big);
    this.ela = this.add.sprite(710, floorY, 'ela-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(big);
    txt(this, 250, floorY + 26, nomes.ele, 20, '#9fb8ff');
    txt(this, 710, floorY + 26, nomes.ela, 20, '#ffb3d1');

    // Os dois juntos, no tamanho do jogo (para comparar a altura)
    panel(this, GAME_W / 2 - 70, 120, 140, 150, { alpha: 0.85 });
    this.add.rectangle(GAME_W / 2 - 60, 244, 120, 2, 0x8a6aa8).setOrigin(0);
    this.smallEle = this.add.sprite(GAME_W / 2 - 16, 244, 'ele-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(PX);
    this.smallEla = this.add.sprite(GAME_W / 2 + 18, 244, 'ela-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(PX).setFlipX(true);
    txt(this, GAME_W / 2, 258, 'tamanho no jogo', 20, UI.textDim, { shadow: false }).setScale(0.7);

    // Abas das animações
    this.index = 0;
    this.flip = false;
    const tabY = floorY + 80;
    const gap = 150;
    const x0 = GAME_W / 2 - (gap * (ANIM_NAMES.length - 1)) / 2;
    this.tabs = ANIM_NAMES.map((name, i) => {
      const t = txt(this, x0 + i * gap, tabY, NOMES_ANIM[name], 20, UI.text);
      t.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.select(i));
      return t;
    });
    const virar = txt(this, GAME_W / 2 - 130, tabY + 60, 'Virar (F)', 20, UI.gold).setInteractive({ useHandCursor: true });
    virar.on('pointerdown', () => this.toggleFlip());
    const voltar = txt(this, GAME_W / 2 + 130, tabY + 60, 'Voltar (Esc)', 20, UI.gold).setInteractive({ useHandCursor: true });
    voltar.on('pointerdown', () => this.back());
    txt(this, GAME_W / 2, tabY + 30, '← → troca a animação', 20, UI.textDim, { shadow: false }).setScale(0.8);

    this.reader = new InputReader();
    this.select(0);
    this.smallEle.play('ele-idle');
    this.smallEla.play('ela-idle');
  }

  select(i) {
    this.index = (i + ANIM_NAMES.length) % ANIM_NAMES.length;
    const name = ANIM_NAMES[this.index];
    this.ele.play(`ele-${name}`);
    this.ela.play(`ela-${name}`);
    this.tabs.forEach((t, k) => t.setColor(k === this.index ? UI.accent : UI.textDim));
  }

  toggleFlip() {
    this.flip = !this.flip;
    this.ele.setFlipX(this.flip);
    this.ela.setFlipX(this.flip);
  }

  back() {
    fadeTo(this, 'Menu');
  }

  update() {
    const r = this.reader;
    if (r.pressed(['ArrowRight', 'KeyD'])) this.select(this.index + 1);
    if (r.pressed(['ArrowLeft', 'KeyA'])) this.select(this.index - 1);
    if (r.pressed(['KeyF'])) this.toggleFlip();
    if (r.pressed(BINDS.menuBack)) this.back();
  }
}
