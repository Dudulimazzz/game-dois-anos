// Mecanismos de puzzle: botão de pressão, alavanca e porta.

import { TILE } from '../config.js';
import { Sfx } from '../systems/sfx.js';

const rectHit = (b, x, y, w, h) => b.right > x && b.left < x + w && b.bottom > y && b.top < y + h;

// Botão de pressão: só fica ativo enquanto alguém (ou uma caixa) está em cima.
export class PressureButton {
  constructor(scene, c, r, fx) {
    this.scene = scene;
    this.fx = fx;
    this.x = c * TILE;
    this.y = r * TILE;
    this.sprite = scene.add.image(this.x, this.y, 'button_up').setOrigin(0, 0).setDepth(4);
    this.active = false;
  }
  update(bodies) {
    const was = this.active;
    this.active = bodies.some((b) => b.enable && rectHit(b, this.x + 2, this.y + 10, TILE - 4, 6));
    if (this.active !== was) {
      this.sprite.setTexture(this.active ? 'button_down' : 'button_up');
      Sfx.click();
      if (this.active) this.fx.sparkle(this.x + 8, this.y + 12, 4);
    }
  }
}

// Alavanca: aperte "interagir" perto dela para ligar/desligar.
export class Lever {
  constructor(scene, c, r, fx, keys = ['lever_off', 'lever_on']) {
    this.scene = scene;
    this.fx = fx;
    this.keys = keys;
    this.x = c * TILE;
    this.y = r * TILE;
    this.sprite = scene.add.image(this.x, this.y, keys[0]).setOrigin(0, 0).setDepth(4);
    this.active = false;
    this.hint = scene.add.image(this.x + 8, this.y - 6, 'marker').setDepth(15).setTint(0xffd36e).setVisible(false);
  }
  near(body) {
    return body.enable && rectHit(body, this.x - 6, this.y, TILE + 12, TILE);
  }
  toggle() {
    this.active = !this.active;
    this.sprite.setTexture(this.active ? this.keys[1] : this.keys[0]);
    Sfx.click();
    this.fx.sparkle(this.x + 8, this.y + 4, 6);
    this.scene.cameras.main.shake(80, 0.002);
  }
  showHint(on, time) {
    this.hint.setVisible(on);
    if (on) this.hint.y = this.y - 7 + Math.round(Math.sin(time / 150));
  }
}

// Porta: sobe para dentro do teto quando aberta.
// Regra de mapa: em cima de uma porta precisa ter parede/teto (ela se esconde ali).
export class Door {
  constructor(scene, c, r, height, fx, key = 'door') {
    this.scene = scene;
    this.fx = fx;
    this.x = c * TILE;
    this.baseY = r * TILE;
    this.h = height * TILE;
    this.sprite = scene.add.tileSprite(this.x, this.baseY, TILE, this.h, key).setOrigin(0, 0).setDepth(1);
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    this.body.moves = false;
    this.open = 0; // 0 = fechada, 1 = aberta
    this.sources = [];
  }
  get wantsOpen() {
    return this.sources.some((s) => s.active);
  }
  update(dt, bodies) {
    const prev = this.open;
    if (this.wantsOpen) {
      this.open = Math.min(1, this.open + dt * 2.8);
    } else {
      // não fecha em cima de ninguém
      const blocked = bodies.some((b) => b.enable && rectHit(b, this.x + 1, this.baseY, TILE - 2, this.h));
      if (!blocked) this.open = Math.max(0, this.open - dt * 2.2);
    }
    if (prev === 0 && this.open > 0) Sfx.door();
    if (prev !== this.open) {
      const e = this.open < 0.5 ? 2 * this.open * this.open : 1 - Math.pow(-2 * this.open + 2, 2) / 2;
      this.sprite.y = Math.round(this.baseY - e * this.h);
      this.body.updateFromGameObject();
      if (this.open === 0) {
        this.fx.dust(this.x + 4, this.baseY + this.h, 2);
        this.fx.dust(this.x + 12, this.baseY + this.h, 2);
      }
    }
  }
}
