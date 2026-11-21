// Carrega dados e gera as texturas antes de abrir o título.

import { generateTextures } from '../systems/textures.js';
import { buildCharacter } from '../systems/characters.js';

// Barra da tela de carregamento (HTML, em index.html)
function setLoad(f) {
  const el = document.getElementById('load-fill');
  if (el) el.style.width = `${Math.round(f * 100)}%`;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }
  preload() {
    setLoad(0.5);
    this.load.json('memorias', 'data/memorias.json');
    this.load.json('fasesProntas', 'data/fases/index.json');
  }
  create() {
    generateTextures(this);
    buildCharacter(this, 'ele');
    buildCharacter(this, 'ela');
    const mem = this.cache.json.get('memorias') || {};
    this.registry.set('memorias', mem);
    const casal = mem.casal || {};
    this.registry.set('nomes', { ele: casal.ele || 'Ele', ela: casal.ela || 'Ela' });

    // Carrega os mapas das fases listadas em data/fases/index.json.
    // Fase fora da lista aparece como "em construção" na seleção.
    const prontas = new Set(((this.cache.json.get('fasesProntas') || {}).prontas) || []);
    (mem.fases || []).forEach((f) => {
      if (f.id && prontas.has(f.id) && !this.cache.json.exists(`fase:${f.id}`)) this.load.json(`fase:${f.id}`, `data/fases/${f.id}.json`);
    });
    this.load.on('progress', (p) => setLoad(0.6 + p * 0.4));
    this.load.once('complete', () => this.go());
    this.load.start();
  }

  go() {
    setLoad(1);
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('saindo');
      setTimeout(() => loading.remove(), 450);
    }

    // Atalhos para testes:
    //   ?fase=teste&modo=um|dois  abre direto na fase
    //   ?selecao  ?final  ?creditos  ?galeria  abrem essas telas
    //   ?tudo  desbloqueia todas as fases
    const q = new URLSearchParams(window.location.search);
    const modo = q.get('modo') === 'um' ? 'um' : 'dois';
    if (q.has('selecao')) {
      this.scene.start('Selecao', { mode: modo });
    } else if (q.has('final')) {
      this.scene.start('Final', { mode: modo });
    } else if (q.has('creditos')) {
      this.scene.start('Creditos', { mode: modo });
    } else if (q.has('galeria')) {
      this.scene.start('Galeria');
    } else if (q.get('fase')) {
      this.scene.start('Level', { fase: q.get('fase'), mode: modo, skipHelp: q.has('semajuda') });
    } else {
      this.scene.start('Title');
    }
  }
}
