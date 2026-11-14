// Fim de fase (provisório da Fase 1).
// Na Fase 4 esta tela vira a "tela de memória" com foto, data e texto.

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, panel, Menu } from '../systems/ui.js';
import { Touch } from '../systems/touch.js';

export class FaseConcluidaScene extends Phaser.Scene {
  constructor() {
    super('FaseConcluida');
  }

  init(data) {
    this.level = data.level;
  }

  create() {
    Touch.setLayout(null);
    const L = this.level;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120c1a, 0.65).setOrigin(0).setInteractive();
    const w = 520, h = 340;
    const box = this.add.container(0, 0);
    box.add(panel(this, (GAME_W - w) / 2, (GAME_H - h) / 2, w, h));
    const heart = this.add.image(GAME_W / 2, GAME_H / 2 - 110, 'heart_big').setScale(PX * 2);
    this.tweens.add({ targets: heart, scale: PX * 2.3, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    txt(this, GAME_W / 2, GAME_H / 2 - 50, 'Fase concluída!', 40, UI.accent);
    txt(this, GAME_W / 2, GAME_H / 2, `Corações: ${L.heartsGot} de ${L.heartsTotal}`, 20, UI.gold);

    this.menu = new Menu(
      this,
      [
        { label: 'Jogar de novo', action: () => L.restart() },
        { label: 'Voltar ao menu', action: () => L.toMenu() },
      ],
      { y: GAME_H / 2 + 60, gap: 48, size: 20 },
    );
    this.cameras.main.fadeIn(300, 18, 12, 26);
  }

  update(time) {
    this.menu.update(time);
  }
}
