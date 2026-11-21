// Menu de pausa: continuar, ver controles, reiniciar fase, voltar ao menu.

import { GAME_W, GAME_H, UI } from '../config.js';
import { txt, panel, Menu, popIn } from '../systems/ui.js';
import { InputReader, BINDS } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Sfx, Music } from '../systems/sfx.js';

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
    const w = 440, h = 430;
    this.box = this.add.container(0, 0);
    this.box.add(panel(this, (GAME_W - w) / 2, (GAME_H - h) / 2, w, h));
    this.box.add(txt(this, GAME_W / 2, GAME_H / 2 - 168, 'Pausa', 40, UI.accent));
    const musica = () => `Música: ${Sfx.musica ? 'ligada' : 'desligada'}`;
    const efeitos = () => `Sons: ${Sfx.efeitos ? 'ligados' : 'desligados'}`;

    const L = this.level;
    this.menu = new Menu(
      this,
      [
        { label: 'Continuar', action: () => this.resume() },
        { label: 'Ver controles', action: () => this.help() },
        { label: musica(), action: () => {
          Sfx.setMusica(!Sfx.musica);
          this.menu.entries[2].label.setText(musica());
          this.menu.select(2);
        } },
        { label: efeitos(), action: () => {
          Sfx.setEfeitos(!Sfx.efeitos);
          this.menu.entries[3].label.setText(efeitos());
          this.menu.select(3);
        } },
        { label: 'Reiniciar fase', action: () => L.restart() },
        { label: 'Voltar ao menu', action: () => L.toMenu() },
      ],
      { y: GAME_H / 2 - 92, gap: 48, size: 20 },
    );
    popIn(this, this.box);
    this.reader = new InputReader();
    this.events.on('resume', () => {
      this.reader.sync([...BINDS.pause, ...BINDS.menuBack]);
      this.menu.reader.sync([...BINDS.menuOk, ...BINDS.menuUp, ...BINDS.menuDown]);
    });
  }

  resume() {
    Music.duck(false);
    Sfx.menuBack();
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
