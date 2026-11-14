// Menu principal: 1 jogador ou 2 jogadores.

import { GAME_W, UI, PX } from '../config.js';
import { txt, nightScenery, Menu, fadeTo } from '../systems/ui.js';
import { Touch } from '../systems/touch.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    Touch.setLayout(null);
    this.cameras.main.fadeIn(350, 18, 12, 26);
    const mem = this.registry.get('memorias') || {};
    const titulo = (mem.jogo && mem.jogo.titulo) || 'Nossa Jornada';
    this.scenery = nightScenery(this, { heartFreq: 1100 });

    txt(this, GAME_W / 2, 96 + 6, titulo, 40, '#5a1630', { shadow: false });
    txt(this, GAME_W / 2, 96, titulo, 40, '#ffd3df', { shadowColor: '#a8335a' });

    const nomes = this.registry.get('nomes');
    const go = (mode) => {
      this.menu.enabled = false;
      fadeTo(this, 'Level', { fase: 'teste', mode });
    };
    this.menu = new Menu(
      this,
      [
        { label: '1 jogador', sub: 'Controle um de cada vez e troque quando quiser', action: () => go('um') },
        { label: '2 jogadores', sub: `${nomes.ele} e ${nomes.ela} juntos, cada um no seu controle`, action: () => go('dois') },
      ],
      { y: 230, gap: 100, size: 40 },
    );

    txt(this, GAME_W / 2, 470, 'Fase 1 (Fundação): fase de teste', 20, UI.textDim, { shadow: false }).setAlpha(0.7);
    this.add.image(GAME_W / 2, 440, 'heart').setScale(PX).setAlpha(0.6);
  }

  update(time, delta) {
    this.scenery.update(delta / 1000);
    this.menu.update(time);
  }
}
