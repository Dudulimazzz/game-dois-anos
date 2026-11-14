// Progresso salvo no localStorage.
// Toda leitura/escrita fica em try/catch: em alguns navegadores (aba anônima,
// armazenamento bloqueado) o localStorage pode falhar, e o jogo continua sem salvar.

const KEY = 'nossaJornada.v1';
let memoria = null; // cópia em memória, usada se o localStorage falhar

function carregar() {
  if (memoria) return memoria;
  memoria = {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) memoria = JSON.parse(raw) || {};
  } catch (e) {
    memoria = {};
  }
  return memoria;
}

function gravar() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memoria));
  } catch (e) {
    /* sem armazenamento: segue só em memória */
  }
}

export const Save = {
  get(chave, padrao = null) {
    const d = carregar();
    return chave in d ? d[chave] : padrao;
  },
  set(chave, valor) {
    carregar()[chave] = valor;
    gravar();
  },
  apagarTudo() {
    memoria = {};
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) {
      /* ignora */
    }
  },
};
