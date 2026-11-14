// Fundo da fase em camadas com parallax.
// Fica numa cena separada para não ser afetado pelo zoom da câmera cooperativa.

import { PX, VIEW_W, VIEW_H } from '../config.js';

export class LevelBGScene extends Phaser.Scene {
  constructor() {
    super('LevelBG');
  }

  init(data) {
    this.level = data.level;
  }

  create() {
    const cam = this.cameras.main;
    cam.setZoom(PX);
    cam.centerOn(VIEW_W / 2, VIEW_H / 2);

    this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'sky_sunset').setOrigin(0);
    this.sun = this.add.circle(360, 190, 26, 0xffe2a0, 1);
    this.add.circle(360, 190, 34, 0xffd38a, 0.25);

    this.clouds = [];
    const rnd = new Phaser.Math.RandomDataGenerator(['nuvens']);
    for (let i = 0; i < 6; i++) {
      const c = this.add.image(rnd.between(0, VIEW_W), rnd.between(20, 120), 'cloud').setAlpha(0.85);
      c.speed = rnd.realInRange(2, 6);
      c.factor = rnd.realInRange(0.05, 0.12);
      c.baseX = c.x;
      this.clouds.push(c);
    }

    this.layers = [
      { s: this.add.tileSprite(0, VIEW_H, VIEW_W, 120, 'hills_far').setOrigin(0, 1), fx: 0.15, fy: 0.05 },
      { s: this.add.tileSprite(0, VIEW_H, VIEW_W, 110, 'hills_mid').setOrigin(0, 1), fx: 0.3, fy: 0.1 },
      { s: this.add.tileSprite(0, VIEW_H + 10, VIEW_W, 90, 'hills_near').setOrigin(0, 1), fx: 0.5, fy: 0.18 },
    ];
    this.drift = 0;
  }

  update(time, delta) {
    const lc = this.level.cameras.main;
    const view = lc.worldView;
    const sx = view.x;
    const sy = view.y;
    this.drift += delta / 1000;
    for (const l of this.layers) {
      l.s.tilePositionX = Math.round(sx * l.fx);
      l.s.y = Math.round(VIEW_H + 20 - sy * l.fy) + (l === this.layers[2] ? 10 : 0);
    }
    for (const c of this.clouds) {
      let x = c.baseX - sx * c.factor + this.drift * c.speed;
      x = ((x % (VIEW_W + 60)) + VIEW_W + 60) % (VIEW_W + 60) - 30;
      c.x = Math.round(x);
    }
  }
}
