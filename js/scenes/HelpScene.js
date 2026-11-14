// Tela de controles (aparece na primeira vez de cada modo e pelo menu de pausa).

import { GAME_W, GAME_H, PX, UI, PERSONAGENS } from '../config.js';
import { txt, panel, keycap } from '../systems/ui.js';
import { Input } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';

export class HelpScene extends Phaser.Scene {
  constructor() {
    super('Help');
  }

  init(data) {
    this.mode = data.mode;
    this.returnTo = data.returnTo || 'Level';
  }

  create() {
    Touch.setLayout(null);
    const nomes = this.registry.get('nomes');
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120c1a, 0.7).setOrigin(0).setInteractive();
    const w = 820, h = 470;
    const x0 = (GAME_W - w) / 2, y0 = (GAME_H - h) / 2;
    panel(this, x0, y0, w, h);
    txt(this, GAME_W / 2, y0 + 40, this.mode === 'um' ? 'Controles: 1 jogador' : 'Controles: 2 jogadores', 40, UI.accent);

    const touch = Touch.isTouch;
    let y = y0 + 110;

    // Uma linha: [teclas] descrição
    const row = (x, yy, keys, label) => {
      let cx = x;
      keys.forEach((k) => {
        if (k === 'ou') {
          const t = txt(this, cx + 4, yy, 'ou', 20, UI.textDim, { ox: 0, shadow: false });
          cx += t.width + 12;
          return;
        }
        const kc = keycap(this, 0, yy, k);
        kc.x = cx + kc.width / 2;
        cx += kc.width + 6;
      });
      txt(this, cx + 10, yy, label, 20, UI.text, { ox: 0 });
    };

    if (touch) {
      const lines = this.mode === 'um'
        ? ['Esquerda e direita (lado esquerdo da tela): andar', 'Seta para cima (lado direito): pular', 'Botão "!": interagir (alavancas)', 'Botão de troca: trocar de personagem']
        : [`${nomes.ele} usa os botões da esquerda, ${nomes.ela} os da direita`, 'Setas: andar  ·  seta para cima: pular', 'Botão "!": interagir (alavancas)'];
      lines.forEach((l) => {
        txt(this, GAME_W / 2, y, l, 20, UI.text);
        y += 40;
      });
    } else if (this.mode === 'dois') {
      const cols = [
        { x: x0 + 70, nome: nomes.ele, cor: PERSONAGENS.ele.corCss, k: [['A', 'D'], ['W'], ['S']] },
        { x: x0 + w / 2 + 30, nome: nomes.ela, cor: PERSONAGENS.ela.corCss, k: [['←', '→'], ['↑'], ['↓']] },
      ];
      cols.forEach((c) => {
        txt(this, c.x, y, c.nome, 20, c.cor, { ox: 0 });
        row(c.x, y + 44, c.k[0], 'andar');
        row(c.x, y + 84, c.k[1], 'pular');
        row(c.x, y + 124, c.k[2], 'interagir');
      });
      y += 170;
    } else {
      const x = x0 + 90;
      row(x, y, ['A', 'D', 'ou', '←', '→'], 'andar');
      row(x, y + 40, ['W', 'ou', '↑', 'ou', 'Espaço'], 'pular');
      row(x, y + 80, ['S', 'ou', '↓', 'ou', 'E'], 'interagir');
      row(x, y + 120, ['Tab'], 'trocar de personagem');
      y += 170;
    }

    if (!touch) {
      row(this.mode === 'dois' ? x0 + 70 : x0 + 90, y, ['Esc', 'ou', 'P'], 'pausar');
      y += 30;
    }

    // Dicas de cooperação
    y = Math.max(y + 20, y0 + 330);
    const tips = [
      `${nomes.ele} pula mais alto e consegue empurrar caixas.`,
      `${nomes.ela} é menor e passa por passagens baixas.`,
      'Suba na cabeça do outro para alcançar lugares altos!',
    ];
    tips.forEach((t, i) => {
      this.add.image(x0 + 70, y + i * 30, 'heart').setScale(PX);
      txt(this, x0 + 90, y + i * 30, t, 20, UI.textDim, { ox: 0, shadow: false });
    });

    this.prompt = txt(this, GAME_W / 2, y0 + h - 30, touch ? 'Toque para continuar' : 'Pressione qualquer tecla para continuar', 20, UI.gold);
    this.tweens.add({ targets: this.prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    // Pequeno atraso para o mesmo toque/tecla que abriu não fechar na hora
    this.closing = false;
    this.time.delayedCall(350, () => {
      this.off = Input.onAnyKey(() => this.close());
      this.input.once('pointerdown', () => this.close());
    });
    this.events.once('shutdown', () => this.off && this.off());
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    const level = this.scene.get('Level');
    if (this.returnTo === 'Pause') {
      this.scene.resume('Pause');
    } else {
      Touch.setLayout(level.mode);
      level.syncInputs();
      this.scene.resume('Level');
      this.scene.resume('HUD');
    }
    this.scene.stop();
  }
}
