// Progresso do jogo: quais fases foram concluídas, corações de cada uma e o que está desbloqueado.
// A ordem e os nomes das fases vêm de data/memorias.json (fases[]).
// Cada fase jogável tem um arquivo data/fases/<id>.json; sem o arquivo, ela aparece "em construção".
//
// Atalho para testes: abra o jogo com ?tudo no fim do endereço para desbloquear todas as fases.

import { Save } from './save.js';

const KEY = 'progresso';
const liberarTudo = new URLSearchParams(window.location.search).has('tudo');

function dados() {
  const d = Save.get(KEY, null);
  if (d && typeof d === 'object' && d.feitas) return d;
  return { feitas: {}, final: false };
}

export const Progresso = {
  // Lista de fases do memorias.json
  fases(scene) {
    const mem = scene.registry.get('memorias') || {};
    return mem.fases || [];
  },

  feita(id) {
    return !!dados().feitas[id];
  },

  // { coracoes, total } da melhor vez em que a fase foi concluída
  resultado(id) {
    return dados().feitas[id] || null;
  },

  quantasFeitas(scene) {
    return this.fases(scene).filter((f) => this.feita(f.id)).length;
  },

  desbloqueada(scene, idx) {
    if (liberarTudo || idx <= 0) return true;
    const fases = this.fases(scene);
    const ant = fases[idx - 1];
    return !!ant && this.feita(ant.id);
  },

  // A fase existe de verdade (tem arquivo em data/fases/)?
  pronta(scene, id) {
    return scene.cache.json.exists(`fase:${id}`);
  },

  // Guarda o resultado. Devolve true se é a primeira vez que a fase é concluída.
  concluir(id, coracoes, total) {
    const d = dados();
    const antes = d.feitas[id];
    const melhor = antes ? Math.max(antes.coracoes || 0, coracoes) : coracoes;
    d.feitas[id] = { coracoes: melhor, total };
    Save.set(KEY, d);
    return !antes;
  },

  finalVisto() {
    return liberarTudo || !!dados().final;
  },

  marcarFinal() {
    const d = dados();
    d.final = true;
    Save.set(KEY, d);
  },

  // A carta final fica disponível depois da última fase
  finalLiberado(scene) {
    if (liberarTudo) return true;
    const fases = this.fases(scene);
    return fases.length > 0 && fases.every((f) => this.feita(f.id));
  },

  // Próxima fase na ordem (ou null se era a última)
  proxima(scene, id) {
    const fases = this.fases(scene);
    const i = fases.findIndex((f) => f.id === id);
    return i >= 0 && i < fases.length - 1 ? fases[i + 1] : null;
  },

  recomecar() {
    Save.set(KEY, { feitas: {}, final: false });
  },
};
