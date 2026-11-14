// Objetos de cenário com os quais os personagens interagem só encostando:
// corações colecionáveis, checkpoints, espinhos e a saída.

import { TILE } from '../config.js';

const rectHit = (b, x, y, w, h) => b.right > x && b.left < x + w && b.bottom > y && b.top < y + h;

export class Heart {
  constructor(scene, c, r, fx) {
    this.scene = scene;
    this.fx = fx;
    this.x = c * TILE + 8;
    this.y = r * TILE + 8;
    this.phase = c * 0.7;
    this.sprite = scene.add.image(this.x, this.y, 'heart').setDepth(6);
    this.collected = false;
  }
  update(bodies, time) {
    if (this.collected) return false;
    this.sprite.y = this.y + Math.round(Math.sin(time / 300 + this.phase) * 2);
    if (bodies.some((b) => b.enable && rectHit(b, this.x - 5, this.y - 5, 10, 10))) {
      this.collected = true;
      this.fx.sparkle(this.x, this.y, 8);
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.y - 14,
        scale: 1.8,
        alpha: 0,
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => this.sprite.destroy(),
      });
      return true;
    }
    return false;
  }
}

export class Checkpoint {
  constructor(scene, c, r, fx) {
    this.scene = scene;
    this.fx = fx;
    this.x = c * TILE;
    this.y = r * TILE;
    this.sprite = scene.add.image(this.x, this.y + TILE, 'checkpoint_off').setOrigin(0, 1).setDepth(3);
    this.lit = false;
  }
  update(players) {
    for (const p of players) {
      if (!p.body.enable) continue;
      if (rectHit(p.body, this.x, this.y - TILE, TILE, TILE * 2)) {
        const spot = { x: this.x + 8, y: this.y + TILE };
        if (p.checkpoint.x !== spot.x || p.checkpoint.y !== spot.y) {
          p.checkpoint = spot;
          if (!this.lit) {
            this.lit = true;
            this.sprite.setTexture('checkpoint_on');
          }
          this.fx.hearts(this.x + 10, this.y - 10, 4);
        }
      }
    }
  }
}

export class Spikes {
  constructor(scene, c, r) {
    this.x = c * TILE;
    this.y = r * TILE;
    scene.add.image(this.x, this.y, 'spikes').setOrigin(0, 0).setDepth(3);
  }
  hits(body) {
    return body.enable && rectHit(body, this.x + 2, this.y + 9, TILE - 4, 7);
  }
}

// Saída: os dois precisam estar aqui ao mesmo tempo.
export class Exit {
  constructor(scene, cells, fx) {
    this.scene = scene;
    this.fx = fx;
    const xs = cells.map((c) => c.c);
    const ys = cells.map((c) => c.r);
    const c0 = Math.min(...xs), c1 = Math.max(...xs), r0 = Math.min(...ys), r1 = Math.max(...ys);
    this.rect = { x: c0 * TILE, y: r0 * TILE, w: (c1 - c0 + 1) * TILE, h: (r1 - r0 + 1) * TILE };
    const cx = this.rect.x + this.rect.w / 2;
    const bottom = this.rect.y + this.rect.h;
    this.glow = scene.add.ellipse(cx, bottom - 20, 52, 60, 0xffd36e, 0.12).setDepth(2);
    this.sprite = scene.add.image(cx, bottom, 'exit').setOrigin(0.5, 1).setDepth(2);
    this.cx = cx;
    this.bottom = bottom;
    this.label = scene.add
      .text(cx, this.rect.y - 22, '', { fontFamily: '"Pixelify Sans"', fontSize: '10px', color: '#fff4e6' })
      .setOrigin(0.5, 1)
      .setResolution(2)
      .setDepth(16)
      .setShadow(1, 1, '#2a1d33', 0, false, true);
    this.timer = 0;
  }
  inside(body) {
    const r = this.rect;
    return body.enable && body.center.x > r.x && body.center.x < r.x + r.w && body.bottom > r.y && body.top < r.y + r.h;
  }
  update(dt, time, count) {
    this.glow.setAlpha(0.1 + 0.06 * Math.sin(time / 400));
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.35;
      this.fx.rise(this.cx + (Math.random() - 0.5) * 18, this.bottom - 4);
    }
    this.label.setText(count === 1 ? 'Esperando o outro... 1/2' : '');
  }
}
