// Interface por cima da fase: corações, nome da fase, botão de pausa e quem está ativo.

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, panel, keycap } from '../systems/ui.js';
import { Touch } from '../systems/touch.js';
import { ORIGIN_X, ORIGIN_Y } from '../systems/characters.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  init(data) {
    this.level = data.level;
  }

  create() {
    const L = this.level;

    // Corações coletados
    panel(this, 12, 12, 150, 48, { alpha: 0.9 });
    this.heartIcon = this.add.image(42, 36, 'heart').setScale(PX * 1.5);
    this.heartText = txt(this, 72, 36, '0/0', 20, UI.text, { ox: 0 });
    this.lastHearts = 0;

    // Nome da fase
    txt(this, GAME_W / 2, 34, L.lvl.nome, 20, UI.text).setAlpha(0.85);

    // Botão de pausa (mouse/toque)
    panel(this, GAME_W - 64, 12, 52, 48, { alpha: 0.9 });
    const pause = this.add.image(GAME_W - 38, 36, 'icon_pause').setScale(PX * 1.5);
    const hit = this.add.zone(GAME_W - 38, 36, 64, 60).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => L.openPause());
    hit.on('pointerover', () => pause.setScale(PX * 1.7));
    hit.on('pointerout', () => pause.setScale(PX * 1.5));

    // Modo 1 jogador: quem está sendo controlado
    if (L.mode === 'um') {
      // no celular os botões ocupam o rodapé: o indicador sobe para baixo do placar
      const y = Touch.isTouch ? 76 : GAME_H - 64;
      panel(this, 12, y - 4, 230, 56, { alpha: 0.9 });
      this.portrait = this.add.sprite(44, y + 50, 'ele-sheet', 'idle-0').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(1);
      this.activeName = txt(this, 72, y + 12, '', 20, UI.text, { ox: 0 });
      if (!Touch.isTouch) {
        keycap(this, 100, y + 36, 'Tab', { top: 0xffe9f0 }).setScale(0.8);
        txt(this, 128, y + 36, 'trocar', 20, UI.textDim, { ox: 0, shadow: false }).setScale(0.8);
      } else {
        txt(this, 72, y + 36, 'botão de troca', 20, UI.textDim, { ox: 0, shadow: false }).setScale(0.8);
      }
      this.lastActive = null;
    }
  }

  update() {
    const L = this.level;
    if (L.heartsGot !== this.lastHearts) {
      this.lastHearts = L.heartsGot;
      this.tweens.add({ targets: this.heartIcon, scale: PX * 2.2, duration: 120, yoyo: true });
    }
    this.heartText.setText(`${L.heartsGot}/${L.heartsTotal}`);

    if (L.mode === 'um' && L.active !== this.lastActive) {
      this.lastActive = L.active;
      const a = L.active;
      this.portrait.play(`${a.id}-idle`);
      this.activeName.setText(a.nome).setColor(a.def.corCss);
      this.tweens.add({ targets: this.portrait, scaleY: { from: 0.7, to: 1 }, duration: 200, ease: 'Back.easeOut' });
    }
  }
}
