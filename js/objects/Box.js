// Caixa pesada: só Ele consegue empurrar. Pode segurar botões de pressão.

import { FEEL, TILE } from '../config.js';

export class Box {
  constructor(scene, c, r) {
    this.scene = scene;
    this.home = { x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 };
    this.sprite = scene.physics.add.image(this.home.x, this.home.y, 'box').setDepth(5);
    this.sprite.box = this;
    this.body = this.sprite.body;
    this.body.pushable = false;
    this.body.setMaxVelocityY(FEEL.maxFall);
    this.pushDir = 0;
    this.wasOnGround = true;
    this.pushTime = 0;
  }

  step(dt, worldH, fx) {
    const b = this.body;
    b.setVelocityX(this.pushDir * FEEL.pushSpeed);
    const onGround = b.blocked.down || b.touching.down;
    if (this.pushDir && onGround && Math.abs(b.deltaX()) > 0.1) {
      this.pushTime += dt;
      if (this.pushTime > 0.18) {
        this.pushTime = 0;
        fx.dust(this.pushDir > 0 ? b.left : b.right, b.bottom, 1);
      }
    }
    if (onGround && !this.wasOnGround) fx.dust(b.center.x, b.bottom, 6);
    this.wasOnGround = onGround;
    this.pushDir = 0;
    // Se cair para fora do mapa, volta ao lugar original
    if (b.top > worldH + 32) {
      b.reset(this.home.x, this.home.y);
      fx.sparkle(this.home.x, this.home.y, 6);
    }
  }
}
