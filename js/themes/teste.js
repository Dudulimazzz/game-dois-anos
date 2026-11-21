// Tema da fase de teste: gramado e terra ao pôr do sol.

import { VIEW_W, VIEW_H } from '../config.js';
import { TILE_PLANK } from '../systems/textures.js';

export const teste = {
  tileset: 'tiles',
  oneway: [TILE_PLANK],
  objects: {},

  // Índice do tile para cada caractere do mapa (-1 = vazio)
  tile(ch, c, r, at) {
    if (ch === '#') {
      const solid = (cc, rr) => at(cc, rr) === '#';
      let mask = 0;
      if (!solid(c, r - 1)) mask |= 1;
      if (!solid(c - 1, r)) mask |= 2;
      if (!solid(c + 1, r)) mask |= 4;
      if (!solid(c, r + 1)) mask |= 8;
      const variant = (c * 7 + r * 13) % 3 === 0 ? 1 : 0;
      return mask * 2 + variant;
    }
    if (ch === '=') return TILE_PLANK;
    return -1;
  },

  bg: {
    create(s) {
      s.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'sky_sunset').setOrigin(0);
      s.add.circle(360, 190, 26, 0xffe2a0, 1);
      s.add.circle(360, 190, 34, 0xffd38a, 0.25);
      s.clouds = [];
      const rnd = new Phaser.Math.RandomDataGenerator(['nuvens']);
      for (let i = 0; i < 6; i++) {
        const c = s.add.image(rnd.between(0, VIEW_W), rnd.between(20, 120), 'cloud').setAlpha(0.85);
        c.speed = rnd.realInRange(2, 6);
        c.factor = rnd.realInRange(0.05, 0.12);
        c.baseX = c.x;
        s.clouds.push(c);
      }
      s.layers = [
        { s: s.add.tileSprite(0, VIEW_H, VIEW_W, 120, 'hills_far').setOrigin(0, 1), fx: 0.15, fy: 0.05, oy: 20 },
        { s: s.add.tileSprite(0, VIEW_H, VIEW_W, 110, 'hills_mid').setOrigin(0, 1), fx: 0.3, fy: 0.1, oy: 20 },
        { s: s.add.tileSprite(0, VIEW_H + 10, VIEW_W, 90, 'hills_near').setOrigin(0, 1), fx: 0.5, fy: 0.18, oy: 30 },
      ];
    },
    update(s, dt, view, t) {
      for (const l of s.layers) {
        l.s.tilePositionX = Math.round(view.x * l.fx);
        l.s.y = Math.round(VIEW_H + l.oy - view.y * l.fy);
      }
      for (const c of s.clouds) {
        let x = c.baseX - view.x * c.factor + t * c.speed;
        x = ((x % (VIEW_W + 60)) + VIEW_W + 60) % (VIEW_W + 60) - 30;
        c.x = Math.round(x);
      }
    },
  },
};
