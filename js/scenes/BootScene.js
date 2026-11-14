// Carrega dados e gera as texturas antes de abrir o título.

import { generateTextures } from '../systems/textures.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    this.load.json('memorias', 'data/memorias.json');
  }
  create() {
    generateTextures(this);
    const mem = this.cache.json.get('memorias') || {};
    this.registry.set('memorias', mem);
    const casal = mem.casal || {};
    this.registry.set('nomes', { ele: casal.ele || 'Ele', ela: casal.ela || 'Ela' });
    const loading = document.getElementById('loading');
    if (loading) loading.remove();

    // Atalho para testes: ?fase=teste&modo=um|dois abre direto na fase
    const q = new URLSearchParams(window.location.search);
    if (q.get('fase')) {
      this.scene.start('Level', { fase: q.get('fase'), mode: q.get('modo') === 'um' ? 'um' : 'dois', skipHelp: q.has('semajuda') });
    } else {
      this.scene.start('Title');
    }
  }
}
