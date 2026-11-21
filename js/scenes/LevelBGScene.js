// Fundo da fase em camadas com parallax (cada tema desenha o seu).
// Fica numa cena separada para não ser afetado pelo zoom da câmera cooperativa.

import { PX, VIEW_W, VIEW_H } from '../config.js';

export class LevelBGScene extends Phaser.Scene {
  constructor() {
    super('LevelBG');
  }

  init(data) {
    this.level = data.level;
    this.theme = data.theme;
  }

  create() {
    const cam = this.cameras.main;
    cam.setZoom(PX);
    cam.centerOn(VIEW_W / 2, VIEW_H / 2);
    this.t = 0;
    this.theme.bg.create(this);
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.t += dt;
    this.theme.bg.update(this, dt, this.level.cameras.main.worldView, this.t);
  }
}
