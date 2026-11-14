// Personagem jogável (Ele ou Ela).
// A física usa uma "zona" invisível com o tamanho do corpo; o desenho é um sprite
// separado que acompanha a zona. Assim dá para esticar/achatar o desenho (squash &
// stretch) sem mexer na caixa de colisão.

import { FEEL, GRAVITY } from '../config.js';

function approach(v, target, step) {
  if (v < target) return Math.min(v + step, target);
  if (v > target) return Math.max(v - step, target);
  return v;
}

export class Player {
  constructor(scene, def, nome, x, feetY, fx) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.nome = nome;
    this.fx = fx;

    this.zone = scene.add.zone(x, feetY - def.h / 2, def.w, def.h);
    scene.physics.add.existing(this.zone);
    this.zone.player = this;
    this.body = this.zone.body;
    this.body.setMaxVelocityY(FEEL.maxFall);
    this.body.setMaxVelocityX(400);

    this.shadow = scene.add.ellipse(x, feetY, def.w + 4, 3, 0x1a0f1f, 0.3).setDepth(9);
    this.sprite = scene.add.image(x, feetY, `${def.id}_ph`).setOrigin(0.5, 1).setDepth(10);

    this.checkpoint = { x, y: feetY };
    this.facing = 1;
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
    this.onGround = false;
    this.wasOnGround = true;
    this.lastVy = 0;
    this.pushing = false;
    this.pushContact = null;
    this.standingOn = null;
    this.frozen = false;
    this.celebrating = false;
    this.walkTime = 0;
    this.squash = { x: 1, y: 1 };
    this.dir = 0;
  }

  get x() {
    return this.body.center.x;
  }
  get feet() {
    return this.body.bottom;
  }

  // Chamado a cada passo da física (60x por segundo)
  step(dt, input, opts = {}) {
    const b = this.body;
    if (this.frozen) return;

    // Carregado por quem está embaixo (caixa ou o outro personagem)
    if (this.standingOn && this.standingOn.enable) {
      const dx = this.standingOn.deltaX();
      if (dx) {
        b.position.x += dx;
        b.updateCenter();
      }
    }

    this.onGround = b.blocked.down || b.touching.down;

    // --- horizontal
    let dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (this.celebrating) dir = 0;
    if (opts.blockLeft && dir < 0) dir = 0;
    if (opts.blockRight && dir > 0) dir = 0;
    if (dir) this.facing = dir;
    this.dir = dir;

    // Empurrar caixa (só quem pode). O contato é medido pela geometria, com uma
    // pequena folga, para o empurrão ser contínuo e não "engasgar".
    this.pushing = false;
    this.pushContact = dir ? this.findBoxAhead(dir) : null;
    if (this.pushContact && this.onGround) {
      if (this.def.canPush) {
        this.pushing = true;
        this.pushContact.box.pushDir = dir;
      } else {
        this.pushing = 'tentando';
      }
    }

    if (this.pushing === true) {
      b.setVelocityX(dir * FEEL.pushSpeed); // anda junto com a caixa
    } else {
      const target = dir * this.def.speed;
      let accel;
      if (this.onGround) accel = dir && Math.sign(b.velocity.x) !== -dir ? FEEL.accelGround : FEEL.decelGround;
      else accel = dir ? FEEL.accelAir : FEEL.decelAir;
      b.setVelocityX(approach(b.velocity.x, target, accel * dt));
    }

    // --- pulo com coyote time e jump buffer
    if (this.onGround) this.coyote = FEEL.coyote;
    else this.coyote -= dt;
    if (input.jumpPressed && !this.celebrating) this.buffer = FEEL.buffer;
    else this.buffer -= dt;

    if (this.buffer > 0 && this.coyote > 0) {
      b.setVelocityY(-this.def.jump);
      this.buffer = 0;
      this.coyote = 0;
      this.jumping = true;
      this.onGround = false;
      this.standingOn = null;
      this.squash = { x: 0.8, y: 1.2 };
      this.fx.dust(this.x, this.feet, 4);
    }
    if (this.jumping && !input.jumpHeld && b.velocity.y < 0) {
      b.velocity.y *= FEEL.jumpCut;
      this.jumping = false;
    }
    if (b.velocity.y >= 0) this.jumping = false;

    // gravidade variável: cai mais rápido, flutua um pouquinho no topo do pulo
    const vy = b.velocity.y;
    let extra = 0;
    if (vy > 0) extra = GRAVITY * (FEEL.fallMult - 1);
    else if (!this.onGround && Math.abs(vy) < FEEL.apexBand && input.jumpHeld) extra = GRAVITY * (FEEL.apexMult - 1);
    b.setGravityY(extra);

    // aterrissagem
    if (this.onGround && !this.wasOnGround && this.lastVy > 120) {
      const k = Math.min(1, this.lastVy / 400);
      this.squash = { x: 1 + 0.3 * k, y: 1 - 0.25 * k };
      this.fx.dust(this.x, this.feet, 3 + Math.round(k * 4));
    }
    this.wasOnGround = this.onGround;
    this.lastVy = b.velocity.y;
  }

  findBoxAhead(dir) {
    const b = this.body;
    for (const box of this.scene.boxes || []) {
      const bb = box.body;
      const gap = dir > 0 ? bb.left - b.right : b.left - bb.right;
      const vOverlap = Math.min(b.bottom, bb.bottom) - Math.max(b.top, bb.top);
      if (gap > -3 && gap < 1.5 && vOverlap > 6) return { box, dir };
    }
    return null;
  }

  endStep() {
    this.standingOn = null;
  }

  // Atualização visual (a cada quadro de tela)
  render(dt, time) {
    const b = this.body;
    const s = this.sprite;
    this.squash.x += (1 - this.squash.x) * Math.min(1, dt * 12);
    this.squash.y += (1 - this.squash.y) * Math.min(1, dt * 12);

    if (this.frozen) {
      this.shadow.setVisible(false);
      return;
    }

    let bob = 0;
    let breathe = 1;
    if (this.onGround && Math.abs(b.velocity.x) > 10) {
      this.walkTime += dt * (this.pushing === true ? 7 : 12);
      bob = Math.abs(Math.sin(this.walkTime)) > 0.5 ? -1 : 0;
    } else if (this.onGround) {
      breathe = 1 + Math.sin(time / 400) * 0.025;
    }

    s.x = b.center.x + (this.pushing ? this.facing : 0);
    s.y = b.bottom + bob;
    s.setFlipX(this.facing < 0);
    s.setScale(this.squash.x, this.squash.y * breathe);

    this.shadow.setVisible(this.onGround);
    this.shadow.x = b.center.x;
    this.shadow.y = b.bottom;
  }

  // Volta ao último checkpoint com uma animação fofa (sem game over)
  respawn() {
    if (this.frozen) return;
    this.frozen = true;
    const b = this.body;
    b.setVelocity(0, 0);
    b.enable = false;
    const scene = this.scene;
    this.fx.hearts(this.sprite.x, this.sprite.y - this.def.h / 2, 5);
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 0,
      scaleY: 1.4,
      alpha: 0,
      duration: 260,
      ease: 'Back.easeIn',
      onComplete: () => {
        b.enable = true;
        b.reset(this.checkpoint.x, this.checkpoint.y - this.def.h / 2);
        b.setVelocity(0, 0);
        this.sprite.setPosition(this.checkpoint.x, this.checkpoint.y);
        this.sprite.setScale(0.2, 0.2).setAlpha(1);
        this.fx.sparkle(this.checkpoint.x, this.checkpoint.y - this.def.h / 2, 6);
        scene.tweens.add({
          targets: this.sprite,
          scaleX: 1,
          scaleY: 1,
          duration: 380,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.frozen = false;
            this.wasOnGround = true;
          },
        });
      },
    });
  }

  celebrate() {
    this.celebrating = true;
    const hop = () => {
      if (!this.sprite.active) return;
      this.body.setVelocityY(-170);
      this.squash = { x: 0.85, y: 1.15 };
    };
    hop();
    this.scene.time.addEvent({ delay: 650, repeat: 2, callback: hop });
  }

  destroy() {
    this.zone.destroy();
    this.sprite.destroy();
    this.shadow.destroy();
  }
}
