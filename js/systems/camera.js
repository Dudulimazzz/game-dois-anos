// Câmera cooperativa.
// 2 jogadores: enquadra os dois e afasta o zoom suavemente quando eles se separam.
// 1 jogador: segue o personagem ativo, olhando um pouco para a frente.

import { PX, VIEW_W, VIEW_H } from '../config.js';

export const ZOOM_MIN = 0.65;
const MARGIN_X = 150;
const MARGIN_Y = 110;

// Distância horizontal máxima entre os dois no modo 2 jogadores
export const MAX_SPAN = VIEW_W / ZOOM_MIN - MARGIN_X;

export class CoopCamera {
  // mapH = altura real do mapa; worldH inclui o chão extra desenhado embaixo
  constructor(scene, players, worldW, worldH, mode, mapH = worldH) {
    this.cam = scene.cameras.main;
    this.players = players;
    this.mode = mode;
    this.mapH = mapH;
    // limites com folga em cima: se a fase for mais baixa que a tela, ela fica centralizada
    this.cam.setBounds(0, -VIEW_H * 2, worldW, worldH + VIEW_H * 2);
    this.z = 1;
    this.look = 0;
    const t = this.target(players[0]);
    this.x = t.x;
    this.y = t.y;
    this.apply();
  }

  target(active) {
    if (this.mode === 'dois') {
      const [a, b] = this.players;
      return { x: (a.x + b.x) / 2, y: (a.feet + b.feet) / 2 - 24 };
    }
    return { x: active.x + this.look, y: active.feet - 30 };
  }

  // foco: aproxima a câmera de um ponto (ex.: a mesa no fim da fase do Bulls)
  setFoco(x, y, zoom) {
    this.foco = { x, y, zoom };
  }

  update(dt, active) {
    let zt = 1;
    if (this.foco) {
      const k = 1 - Math.exp(-dt * 2.5);
      this.x += (this.foco.x - this.x) * k;
      this.y += (this.foco.y - this.y) * k;
      this.z += (this.foco.zoom - this.z) * k;
      this.apply();
      return;
    }
    if (this.mode === 'dois') {
      const [a, b] = this.players;
      const sx = Math.abs(a.x - b.x) + MARGIN_X;
      const sy = Math.abs(a.feet - b.feet) + MARGIN_Y;
      zt = Math.max(ZOOM_MIN, Math.min(1, VIEW_W / sx, VIEW_H / sy));
    } else {
      const want = active.facing * 28;
      this.look += (want - this.look) * (1 - Math.exp(-dt * 2));
    }
    const t = this.target(active);
    const k = 1 - Math.exp(-dt * 6);
    this.x += (t.x - this.x) * k;
    this.y += (t.y - this.y) * (1 - Math.exp(-dt * 4));
    this.z += (zt - this.z) * (1 - Math.exp(-dt * 3));
    this.apply();
  }

  apply() {
    this.cam.setZoom(PX * this.z);
    // Não mostra o chão extra além do necessário: o fundo da tela fica no fim do mapa
    const halfH = VIEW_H / this.z / 2;
    let y;
    if (this.foco) y = this.y;
    else if (halfH * 2 >= this.mapH) y = this.mapH / 2;
    else y = Math.max(halfH, Math.min(this.y, this.mapH - halfH));
    this.cam.centerOn(this.x, y);
  }
}
