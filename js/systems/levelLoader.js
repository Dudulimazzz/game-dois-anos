// Lê uma fase desenhada em texto (data/fases/*.json) e transforma em dados prontos
// para a cena: matriz de tiles, posições de objetos, portas e ligações.

import { TILE_PLANK } from './textures.js';

const SOLID = '#';
const PLANK = '=';

export function parseLevel(data) {
  const rows = data.mapa;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (c, r) => (r < 0 || r >= h || c < 0 || c >= w ? SOLID : rows[r][c] || '.');
  const isSolid = (c, r) => at(c, r) === SOLID;

  const tiles = [];
  for (let r = 0; r < h; r++) {
    const line = [];
    for (let c = 0; c < w; c++) {
      const ch = at(c, r);
      if (ch === SOLID) {
        let mask = 0;
        if (!isSolid(c, r - 1)) mask |= 1;
        if (!isSolid(c - 1, r)) mask |= 2;
        if (!isSolid(c + 1, r)) mask |= 4;
        if (!isSolid(c, r + 1)) mask |= 8;
        const variant = (c * 7 + r * 13) % 3 === 0 ? 1 : 0;
        line.push(mask * 2 + variant);
      } else if (ch === PLANK) {
        line.push(TILE_PLANK);
      } else {
        line.push(-1);
      }
    }
    tiles.push(line);
  }

  const out = {
    nome: data.nome || 'Fase',
    fundo: data.fundo || 'por-do-sol',
    cols: w,
    rows: h,
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
    links: data.ligacoes || null,
  };

  const usedDoor = new Set();
  for (let c = 0; c < w; c++) {
    for (let r = 0; r < h; r++) {
      const ch = at(c, r);
      switch (ch) {
        case '1': out.starts.ele = { c, r }; break;
        case '2': out.starts.ela = { c, r }; break;
        case 'B': out.buttons.push({ c, r }); break;
        case 'L': out.levers.push({ c, r }); break;
        case 'C': out.boxes.push({ c, r }); break;
        case '^': out.spikes.push({ c, r }); break;
        case 'K': out.checkpoints.push({ c, r }); break;
        case 'h': out.hearts.push({ c, r }); break;
        case 'E': out.exitCells.push({ c, r }); break;
        case 'P': {
          if (usedDoor.has(`${c},${r}`)) break;
          let r2 = r;
          while (at(c, r2 + 1) === 'P') r2++;
          for (let k = r; k <= r2; k++) usedDoor.add(`${c},${k}`);
          out.doors.push({ c, r, height: r2 - r + 1 });
          break;
        }
        default: break;
      }
    }
  }
  // Numeração da esquerda para a direita (o laço já percorre por coluna)
  if (!out.starts.ele) out.starts.ele = { c: 2, r: 2 };
  if (!out.starts.ela) out.starts.ela = { c: 4, r: 2 };
  return out;
}
