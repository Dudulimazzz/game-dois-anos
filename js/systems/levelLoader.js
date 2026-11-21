// Lê uma fase desenhada em texto (data/fases/*.json) e transforma em dados prontos
// para a cena: matriz de tiles, posições de objetos, portas, decoração e gatilhos.
// O "tema" da fase decide como cada caractere de chão/parede é desenhado.

const OBJECT_CHARS = {
  '1': 'startEle', '2': 'startEla', B: 'buttons', L: 'levers', C: 'boxes', '^': 'spikes',
  K: 'checkpoints', h: 'hearts', E: 'exitCells',
};

export function parseLevel(data, theme) {
  const rows = data.mapa;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (c, r) => (r < 0 || r >= h || c < 0 || c >= w ? '#' : rows[r][c] || '.');
  const triggers = data.gatilhos || {};

  const tiles = [];
  for (let r = 0; r < h; r++) {
    const line = [];
    for (let c = 0; c < w; c++) line.push(theme.tile(at(c, r), c, r, at));
    tiles.push(line);
  }

  const out = {
    nome: data.nome || 'Fase',
    memoria: data.memoria || null,
    cols: w,
    rows: h,
    at,
    tiles,
    starts: {},
    buttons: [],
    levers: [],
    doors: [],
    boxes: [],
    spikes: [],
    checkpoints: [],
    hearts: [],
    exitCells: [],
    decor: [],
    triggers: [],
    links: data.ligacoes || null,
    data,
  };

  const usedDoor = new Set();
  // percorre por coluna: assim B1, L1, P1... ficam numerados da esquerda para a direita
  for (let c = 0; c < w; c++) {
    for (let r = 0; r < h; r++) {
      const ch = at(c, r);
      const kind = OBJECT_CHARS[ch];
      if (kind === 'startEle') out.starts.ele = { c, r };
      else if (kind === 'startEla') out.starts.ela = { c, r };
      else if (kind) out[kind].push({ c, r });
      else if (ch === 'P') {
        if (usedDoor.has(`${c},${r}`)) continue;
        let r2 = r;
        while (at(c, r2 + 1) === 'P') r2++;
        for (let k = r; k <= r2; k++) usedDoor.add(`${c},${k}`);
        out.doors.push({ c, r, height: r2 - r + 1 });
      } else if (theme.decorChars && theme.decorChars[ch]) {
        out.decor.push({ type: theme.decorChars[ch], c, r });
      }
      if (triggers[ch]) out.triggers.push({ ch, c, r, ...triggers[ch] });
    }
  }
  if (!out.starts.ele) out.starts.ele = { c: 2, r: 2 };
  if (!out.starts.ela) out.starts.ela = { c: 4, r: 2 };
  return out;
}
