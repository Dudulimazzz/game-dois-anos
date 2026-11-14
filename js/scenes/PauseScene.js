// Menu de pausa: continuar, ver controles, reiniciar fase, voltar ao menu.

import { GAME_W, GAME_H, UI } from '../config.js';
import { txt, panel, Menu } from '../systems/ui.js';
import { InputReader, BINDS } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.level = data.level;
  }

  create() {
    Touch.setLayout(null);
    const bg = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x120c1a, 0.6).setOrigin(0);
    bg.setInteractive(); // bloqueia cliques na fase
    const w = 420, h = 340;
    panel(this, (GAME_W - w) / 2, (GAME_H - h) / 2, w, h);
    txt(this, GAME_W / 2, GAME_H / 2 - 120, 'Pausa', 40, UI.accent);

    const L = this.level;
    this.menu = new Menu(
      this,
      [
        { label: 'Continuar', action: () => this.resume() },
        { label: 'Ver controles', action: () => this.help() },
        { label: 'Reiniciar fase', action: () => L.restart() },
        { label: 'Voltar ao menu', action: () => L.toMenu() },
      ],
      { y: GAME_H / 2 - 40, gap: 50, size: 20 },
    );
    this.reader = new InputReader();
    this.events.on('resume', () => {
      this.reader.sync([...BINDS.pause, ...BINDS.menuBack]);
      this.menu.reader.sync([...BINDS.menuOk, ...BINDS.menuUp, ...BINDS.menuDown]);
    });
  }

  resume() {
    Touch.setLayout(this.level.mode);
    this.level.syncInputs();
    this.scene.resume('Level');
    this.scene.resume('HUD');
    this.scene.stop();
  }

  help() {
    this.scene.pause();
    this.scene.launch('Help', { mode: this.level.mode, returnTo: 'Pause' });
  }

  update(time) {
    if (this.reader.pressed([...BINDS.pause, 'Backspace'])) {
      this.resume();
      return;
    }
    this.menu.update(time);
  }
}
