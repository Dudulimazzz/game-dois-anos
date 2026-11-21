// Tema da fase 4: a calçada do condomínio Flores do Cerrado (DF), à noite — o primeiro beijo.
// Rua de bloquete, calçada com meio-fio, casas modernas de laje reta com janelas acesas,
// postes com fios, coqueiros no meio-fio, vaga-lumes e grilos. Desenhado a partir das fotos de referência.
// Os desenhos são feitos "de dia" e escurecidos com um tom azul de noite; as luzes são pintadas por cima.

import { TILE, VIEW_W, VIEW_H } from '../config.js';
import { makeCanvas as mkBase, rng } from '../systems/textures.js';
import { Sfx } from '../systems/sfx.js';

// quanto cada desenho escurece à noite (objetos de puzzle ficam mais visíveis)
const NOITE_OBJ = ['cn_portao_rua', 'cn_interfone_off', 'cn_interfone_on', 'cn_caixote', 'cn_cone_rua'];
function makeCanvas(scene, key, w, h, draw, lit) {
  return mkBase(scene, key, w, h, (ctx, px) => {
    draw(ctx, px);
    if (!key.startsWith('cn_ceu') && !key.startsWith('cn_poste')) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = NOITE_OBJ.includes(key) ? 'rgba(24,26,70,0.32)' : 'rgba(14,16,48,0.55)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (lit) lit(ctx, px);
  });
}
function fromRows(scene, key, rows, pal) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return makeCanvas(scene, key, w, h, (ctx, px) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c !== '.' && c !== ' ' && pal[c]) px(x, y, pal[c]);
      }
    });
  });
}
const LUZ = '#ffd98a', LUZ_HI = '#fff2c4';

// Índices dos tiles (MURO ocupa 8 variações seguidas, pela máscara de vizinhos)
const T = { TOP: 0, TOP_L: 1, TOP_R: 2, FILL: 3, FILL_L: 4, FILL_R: 5, LAJE: 6, MURO: 9, DEEP: 17, DEEP_L: 18, DEEP_R: 19 };

const C = {
  outline: '#2a2630',
  // bloquete
  blq: '#c8673f', blqHi: '#dd8458', blqLo: '#a9532f', blqJoint: '#e9a57c', blqDark: '#8f4527',
  earth: '#a8502f', earthLo: '#8a3f24', earthHi: '#c06642', earthDeep: '#6a2e1c',
  // concreto e pedra
  conc: '#8e9196', concHi: '#a9acb1', concLo: '#6f7277', stone: '#bdb9b0', stoneLo: '#9d998f', stoneHi: '#d6d2c9',
  slab: '#4a4d54', slabHi: '#62666e', slabLo: '#33363c',
  metal: '#7d838d', metalHi: '#a3a9b3', metalLo: '#5a606a',
  white: '#efeeea', whiteLo: '#d4d2cc',
  orange: '#e8622c', orangeLo: '#b84a1f',
  card: '#c9995e', cardLo: '#a87a44', cardHi: '#e2b97e', tape: '#d8c7a0',
  leaf: '#4f8a3a', leafLo: '#3a6a2a', leafHi: '#78b04f',
  trunk: '#8a7a62', trunkLo: '#6a5c48', trunkHi: '#a8987c',
};

function speckle(px, ox, oy, w, h, seed, cols, n) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) px(ox + Math.floor(r() * w), oy + Math.floor(r() * h), cols[i % cols.length]);
}

// ---------------------------------------------------------------- tiles
function makeTiles(scene) {
  makeCanvas(scene, 'cn_tiles_rua', TILE * 20, TILE, (ctx, px) => {
    // rua de bloquete: a face de cima mostra o desenho das peças encaixadas
    const top = (ox, l, r) => {
      px(ox, 0, C.blqJoint, 16, 8);
      const tones = [C.blq, C.blqHi, C.blqLo, C.blq];
      for (let row = 0; row < 2; row++) {
        const y = row * 4;
        const off = row % 2 ? 4 : 0;
        for (let k = -1; k < 3; k++) {
          const x = k * 8 + off;
          const t = tones[(k + row * 3 + ox / 16) & 3];
          // peça em "S": retângulo com um dente em cima e um embaixo
          px(ox + Math.max(0, x + 1), y + 1, t, Math.min(6, 16 - Math.max(0, x + 1)), 2);
          if (x + 2 >= 0 && x + 2 < 16) px(ox + x + 2, y, t, 2, 1);
          if (x + 4 >= 0 && x + 4 < 16) px(ox + x + 4, y + 3, t, 2, 1);
        }
      }
      px(ox, 0, 'rgba(255,255,255,0.18)', 16, 1);
      px(ox, 8, C.blqDark, 16, 1);
      px(ox, 9, C.earth, 16, 7);
      speckle(px, ox, 9, 16, 7, ox + 11, [C.earthLo, C.earthHi], 9);
      if (l) { px(ox, 0, C.outline, 1, 16); px(ox + 1, 9, C.earthLo, 1, 7); }
      if (r) { px(ox + 15, 0, C.outline, 1, 16); px(ox + 14, 9, C.earthLo, 1, 7); }
    };
    const fill = (ox, l, r) => {
      px(ox, 0, C.earth, 16, 16);
      px(ox, 10, C.earthLo, 16, 6);
      speckle(px, ox, 0, 16, 16, ox + 5, [C.earthLo, C.earthHi, C.earthDeep], 14);
      if (l) px(ox, 0, C.outline, 1, 16);
      if (r) px(ox + 15, 0, C.outline, 1, 16);
    };
    const deep = (ox, l, r) => {
      px(ox, 0, C.earthDeep, 16, 16);
      speckle(px, ox, 0, 16, 16, ox + 9, ['#5a2716', C.earthLo], 10);
      if (l) px(ox, 0, C.outline, 1, 16);
      if (r) px(ox + 15, 0, C.outline, 1, 16);
    };
    top(T.TOP * TILE, false, false);
    top(T.TOP_L * TILE, true, false);
    top(T.TOP_R * TILE, false, true);
    fill(T.FILL * TILE, false, false);
    fill(T.FILL_L * TILE, true, false);
    fill(T.FILL_R * TILE, false, true);
    deep(T.DEEP * TILE, false, false);
    deep(T.DEEP_L * TILE, true, false);
    deep(T.DEEP_R * TILE, false, true);

    // laje de garagem (dá para subir por baixo): placa de concreto cinza-escuro
    const laje = (ox, edgeL, edgeR) => {
      px(ox, 0, C.outline, 16, 1);
      px(ox, 1, C.slabHi, 16, 1);
      px(ox, 2, C.slab, 16, 4);
      px(ox, 6, C.slabLo, 16, 1);
      px(ox, 7, C.outline, 16, 1);
      // luminária embutida embaixo da laje
      px(ox + 7, 8, '#fff2c0', 2, 1);
      if (edgeL) px(ox, 0, C.outline, 1, 8);
      if (edgeR) px(ox + 15, 0, C.outline, 1, 8);
    };
    laje(T.LAJE * TILE, false, false);
    laje((T.LAJE + 1) * TILE, true, false);
    laje((T.LAJE + 2) * TILE, false, true);
    lajeLuz = [T.LAJE, T.LAJE + 1, T.LAJE + 2];

    // muro/pilar de concreto com painel de pedra: 8 variações (1 = topo livre, 2 = esquerda, 4 = direita)
    for (let m = 0; m < 8; m++) {
      const ox = (T.MURO + m) * TILE;
      px(ox, 0, C.stone, 16, 16);
      speckle(px, ox, 0, 16, 16, 90 + m, [C.stoneLo, C.stoneHi, C.stoneLo], 18);
      // juntas das placas de pedra
      px(ox, 7, C.stoneLo, 16, 1);
      px(ox + (m % 2 ? 5 : 10), 0, C.stoneLo, 1, 7);
      px(ox + (m % 2 ? 11 : 4), 8, C.stoneLo, 1, 8);
      if (m & 1) {
        px(ox, 0, C.outline, 16, 1);
        px(ox, 1, C.slab, 16, 3);
        px(ox, 1, C.slabHi, 16, 1);
      }
      if (m & 2) px(ox, 0, C.outline, 1, 16);
      if (m & 4) px(ox + 15, 0, C.outline, 1, 16);
    }
  }, (ctx, px) => {
    // luminárias embaixo das lajes acesas
    for (const i of lajeLuz) {
      px(i * TILE + 6, 8, LUZ, 4, 1);
      px(i * TILE + 7, 8, LUZ_HI, 2, 1);
    }
  });
}
let lajeLuz = [];

// ---------------------------------------------------------------- objetos
function makeObjects(scene) {
  // portão de garagem de enrolar (repete na vertical)
  makeCanvas(scene, 'cn_portao_rua', 16, 16, (ctx, px) => {
    px(0, 0, C.outline, 16, 16);
    for (let y = 0; y < 16; y += 4) {
      px(1, y, C.metalHi, 14, 1);
      px(1, y + 1, C.metal, 14, 2);
      px(1, y + 3, C.metalLo, 14, 1);
    }
  });

  // interfone no pilar (apagado / aceso)
  const interfone = (key, on) => fromRows(scene, key, [
    '................',
    '.....oooooo.....',
    '....oGGGGGGo....',
    '....oGgggggo....',
    '....oGgkgkgo....',
    '....oGgggggo....',
    '....oGgkgkgo....',
    '....oGgggggo....',
    '....oGgLLggo....',
    '....oGgLLggo....',
    '....oGgggggo....',
    '.....oooooo.....',
    '.......pp.......',
    '.......pp.......',
    '.......pp.......',
    '.....oooooo.....',
  ], { o: C.outline, G: '#cfd6df', g: '#3a3e46', k: '#8a909a', p: '#5a606a', L: on ? '#5ee08a' : '#e04a5a' });
  interfone('cn_interfone_off', false);
  interfone('cn_interfone_on', true);

  // caixa de encomenda (papelão, com fita e etiqueta)
  fromRows(scene, 'cn_caixote', [
    'oooooooooooooooo',
    'oHHHHHHttHHHHHHo',
    'oCCCCCCttCCCCCCo',
    'oooooooooooooooo',
    'oCCCCCCttCCCCCCo',
    'oCCCCCCttCCCCCCo',
    'oCCwwwwttCCCCCCo',
    'oCCwkkwttCCCCCCo',
    'oCCwwwwttCCCCCCo',
    'oCCCCCCttCCCCCCo',
    'oCCCCCCttCCaCaCo',
    'oCCCCCCttCCCaCCo',
    'oCCCCCCttCCaCaCo',
    'oLLLLLLttLLLLLLo',
    'oLLLLLLLLLLLLLLo',
    'oooooooooooooooo',
  ], { o: C.outline, C: C.card, H: C.cardHi, L: C.cardLo, t: C.tape, w: '#fff8ee', k: '#6a6a72', a: '#5a4a3a' });

  // vasinho (checkpoint): botão fechado / flor aberta
  const vaso = (key, on) => fromRows(scene, key, [
    on ? '.....pppp.......' : '................',
    on ? '....pPPPPp......' : '................',
    on ? '...pPPyyPPp.....' : '................',
    on ? '...pPPyyPPp.....' : '......bb........',
    on ? '....pPPPPp......' : '.....bBBb.......',
    on ? '.....pppp.......' : '.....bBBb.......',
    '.......g........',
    '.......g..ll....',
    '..ll...g.lLl....',
    '.lLll..glll.....',
    '..lll..g........',
    '.......g........',
    '...ooooooooo....',
    '...oTTTTTTTo....',
    '....oTtttTo.....',
    '....oTtttTo.....',
    '....oTtttTo.....',
    '.....ooooo......',
  ], { o: C.outline, T: '#6e727a', t: '#575b62', g: C.leaf, l: C.leaf, L: C.leafHi, b: C.leafLo, B: '#ff8fb0', p: '#c2335f', P: '#ff8fb0', y: '#ffd36e' });
  vaso('cn_vaso_off', false);
  vaso('cn_vaso_on', true);
}

// coqueiro: tronco fino com anéis, levemente curvo, e copa de folhas compridas caídas com cocos
function drawCoqueiro(scene, key, seed, h = 104) {
  return makeCanvas(scene, key, 72, h, (ctx, px) => {
    const r = rng(seed);
    const lean = (r() < 0.5 ? -1 : 1) * (2 + Math.floor(r() * 4));
    let topX = 36;
    for (let y = h - 1; y > 24; y--) {
      const t = (h - y) / (h - 24);
      const x = Math.round(36 + lean * t * t);
      topX = x;
      px(x - 2, y, C.trunkLo, 5, 1);
      px(x - 1, y, C.trunk, 3, 1);
      px(x - 1, y, C.trunkHi, 1, 1);
      if (y % 4 === 0) px(x - 2, y, C.trunkLo, 5, 1); // anéis
    }
    // cocos
    [[-3, 27], [1, 28], [-1, 30], [3, 26]].forEach(([dx, y]) => {
      px(topX + dx - 1, y - 1, '#3a5a22', 3, 3);
      px(topX + dx, y - 1, '#5f8a33', 1, 1);
    });
    // folhas: arcos que sobem e depois caem, com folíolos pendurados dos dois lados
    const fronds = [[-1, 30, 1.0], [1, 30, 1.0], [-1, 24, 0.45], [1, 24, 0.45], [-1, 32, 1.6], [1, 32, 1.6], [-1, 16, 0.1], [1, 16, 0.1]];
    for (const [dir, len, droop] of fronds) {
      for (let k = 0; k < len; k++) {
        const t = k / len;
        const xx = Math.round(topX + dir * k);
        const yy = Math.round(24 - Math.sin(t * Math.PI * 0.6) * 10 + t * t * droop * 22);
        px(xx, yy, C.leafLo, 1, 2); // talo
        if (k > 1) {
          const fl = Math.max(2, Math.round(6 * (1 - t * 0.7)));
          const col = k % 3 === 0 ? C.leafHi : C.leaf;
          // folíolos caindo para baixo e para fora
          for (let q = 1; q <= fl; q++) px(xx + Math.round(dir * q * 0.4), yy + 1 + q, q === fl ? C.leafLo : col);
          if (k % 2 === 0) for (let q = 1; q <= Math.max(1, fl - 2); q++) px(xx - Math.round(dir * q * 0.3), yy + q, C.leaf);
        }
      }
    }
    // centro da copa
    px(topX - 2, 22, C.leafLo, 5, 3);
    px(topX - 1, 22, C.leaf, 3, 1);
  });
}

// ---------------------------------------------------------------- enfeites
function makeDecor(scene) {
  // portaria do condomínio (pórtico cinza-escuro com furo redondo, guarita branca, grade e pilar laranja)
  makeCanvas(scene, 'cn_portaria', 160, 96, (ctx, px) => {
    const g = 96;
    // pórtico
    px(2, 6, C.outline, 74, 12);
    px(3, 7, '#3e4148', 72, 10);
    px(3, 7, '#52565e', 72, 1);
    px(2, 18, C.outline, 20, g - 18);
    px(3, 18, '#3e4148', 18, g - 18);
    px(4, 18, '#4a4e56', 2, g - 18);
    // furo redondo no pilar
    for (let y = -7; y <= 7; y++) for (let x = -4; x <= 4; x++) if ((x * x) / 16 + (y * y) / 49 <= 1) px(12 + x, 46 + y, '#9fc4e8');
    // guarita branca
    px(42, 26, C.outline, 34, g - 26);
    px(43, 27, C.white, 32, g - 27);
    px(43, 27, '#ffffff', 32, 1);
    px(52, 30, C.outline, 14, 10);
    px(53, 31, '#2e3a48', 12, 8);
    px(54, 32, '#5a7088', 3, 3);
    px(46, 58, C.outline, 12, 10);
    px(47, 59, '#9aa0aa', 10, 8); // painel da guarita
    px(47, 78, C.whiteLo, 26, 6);
    // segundo pórtico, mais baixo, com o pilar laranja
    px(70, 30, C.outline, 84, 8);
    px(71, 31, '#3e4148', 82, 6);
    px(138, 38, C.outline, 9, g - 38);
    px(139, 38, C.orange, 7, g - 38);
    px(139, 38, '#ff8a52', 2, g - 38);
    // grade preta de correr
    px(76, 44, '#1e1f24', 62, 2);
    px(76, g - 6, '#1e1f24', 62, 2);
    for (let x = 76; x < 138; x += 4) px(x, 44, '#1e1f24', 1, g - 48);
    // muro branco depois da portaria
    px(147, 40, C.outline, 13, g - 40);
    px(148, 41, C.white, 12, g - 41);
  }, (ctx, px) => {
    px(53, 31, LUZ, 12, 8);
    px(53, 31, LUZ_HI, 12, 1);
  });

  // poste de luz baixo (checkpoint): apagado / aceso
  const poste = (key, on) => mkBase(scene, key, 16, 52, (ctx, px) => {
    px(7, 8, '#1c1d26', 3, 44);
    px(8, 8, '#4a4c58', 1, 44);
    px(4, 48, '#1c1d26', 9, 4);
    px(3, 2, '#1c1d26', 11, 7);
    px(4, 3, on ? LUZ_HI : '#3a3c48', 9, 5);
    if (on) {
      px(5, 4, '#ffffff', 7, 2);
      px(2, 8, 'rgba(255,217,138,0.5)', 13, 2);
    }
    px(5, 0, '#1c1d26', 7, 2);
  });
  poste('cn_poste_off', false);
  poste('cn_poste_on', true);

  // carrinho vermelho (hatch), visto de lado
  makeCanvas(scene, 'cn_carro_vermelho', 46, 22, (ctx, px) => {
    px(10, 2, C.outline, 22, 9);
    px(11, 3, '#bfe6f2', 20, 7);
    px(20, 3, '#b8282e', 2, 8);
    px(11, 3, 'rgba(255,255,255,0.4)', 4, 7);
    px(2, 9, C.outline, 42, 9);
    px(3, 10, '#d6343a', 40, 7);
    px(3, 10, '#f0646a', 40, 1);
    px(3, 14, '#a82228', 40, 3);
    px(40, 11, '#fff4c8', 3, 2);
    px(3, 11, '#ff9a8a', 2, 2);
    for (const wx of [11, 34]) {
      px(wx - 5, 13, C.outline, 11, 9);
      px(wx - 4, 14, '#2a2b30', 9, 7);
      px(wx - 1, 17, '#a3a9b3', 3, 2);
    }
  });

  drawCoqueiro(scene, 'cn_coqueiro_a', 11);
  drawCoqueiro(scene, 'cn_coqueiro_b', 27, 110);
  drawCoqueiro(scene, 'cn_coqueiro_c', 53, 98);

  // passarinhos (pombos): bicando (2 quadros) e voando (2 quadros)
  const pal = { o: '#3a3540', g: '#8a8f9c', G: '#a8adb8', w: '#c9ccd4', b: '#e0a040', e: '#1a1416', n: '#6e9a8a' };
  fromRows(scene, 'cn_pombo_a', ['...gg..', '..gGeb.', 'gggnn..', 'oggggg.', '.ggggo.', '..b.b..'], pal);
  fromRows(scene, 'cn_pombo_b', ['.......', '...gg..', 'gggGeb.', 'oggnng.', '.ggggo.', '..b.b..'], pal);
  fromRows(scene, 'cn_pombo_voa_a', ['w.....w', 'ww...ww', '.wgggw.', '..ggGeb', '..ggg..', '.......'], pal);
  fromRows(scene, 'cn_pombo_voa_b', ['.......', '.......', '.ggggg.', 'wwggGeb', 'w.ggg.w', '.......'], pal);

  // cone (com faixas refletivas) e lixeira cinza
  fromRows(scene, 'cn_cone_rua', [
    '....o....', '...oOo...', '...oOo...', '..oWWWo..', '..oOOOo..', '.oOOOOOo.', '.oWWWWWo.', '.oOOOOOo.', 'ooooooooo', 'oOOOOOOOo', 'ooooooooo',
  ], { o: C.outline, O: '#ff6a2a', W: '#f4f2ee' });
  fromRows(scene, 'cn_lixeira', [
    'oooooooooo', 'oLLLLLLLLo', 'oooooooooo', '.oGGGGGGo.', '.oGgGgGgo.', '.oGgGgGgo.', '.oGgGgGgo.', '.oGgGgGgo.', '.oGgGgGgo.', '.oGGGGGGo.', '.oooooooo.', '...o..o...',
  ], { o: C.outline, L: '#5a606a', G: '#7d838d', g: '#5a606a' });
}

// ---------------------------------------------------------------- casas (fachadas atrás da rua)
const ESTILOS = ['escura', 'clara', 'bege', 'granito'];

function drawCasa(scene, key, estilo, w, h, num, seed) {
  const luzes = [];
  return makeCanvas(scene, key, w, h, (ctx, px) => {
    const r = rng(seed);
    const base = h; // embaixo fica a calçada
    if (estilo === 'escura') {
      // caixa cinza-escuro de laje reta, portão de garagem e painel de pedra com o número
      px(0, 8, C.outline, w, h - 8);
      px(1, 9, '#5b5f66', w - 2, h - 9);
      px(0, 4, C.outline, w, 6);
      px(1, 5, '#3f4248', w - 2, 4); // beiral da laje
      const gw = Math.min(44, Math.floor(w * 0.45));
      px(6, base - 44, C.outline, gw, 44);
      for (let y = base - 43; y < base; y += 3) { px(7, y, '#7a7f87', gw - 2, 2); px(7, y + 2, '#62666e', gw - 2, 1); }
      const sx = gw + 12;
      px(sx, base - 50, C.outline, 22, 50);
      px(sx + 1, base - 49, C.stone, 20, 49);
      speckle(px, sx + 1, base - 49, 20, 49, seed, [C.stoneLo, C.stoneHi], 40);
      px(sx + 4, base - 40, '#2a2630', 14, 1);
      px(sx + 4, base - 24, '#3a3e46', 6, 4); // caixa de correio
      px(sx + 26, 20, C.outline, w - sx - 30, 22);
      px(sx + 27, 21, '#2e3a48', w - sx - 32, 20);
      luzes.push([sx + 27, 21, w - sx - 32, 20]);
      px(sx + 28, 22, '#4f6478', 3, 18);
    } else if (estilo === 'clara') {
      // cinza claro com vidro grande e ripas cor de bronze, andar de cima em bloco texturizado
      px(0, 0, C.outline, w, h);
      px(1, 1, '#a88a6c', w - 2, 30);
      for (let y = 4; y < 30; y += 5) for (let x = 2 + ((y / 5) % 2) * 4; x < w - 4; x += 9) px(x, y, '#977a5e', 7, 1);
      px(1, 31, C.outline, w - 2, 1);
      px(1, 32, '#c7c8c6', w - 2, h - 33);
      px(6, 40, C.outline, w - 18, base - 46);
      px(7, 41, '#2e3a46', w - 20, base - 48);
      luzes.push([7, 41, Math.floor((w - 20) / 2), base - 48]);
      px(8, 42, '#55697c', 4, base - 50);
      for (let y = 48; y < base - 8; y += 9) px(7, y, '#9a7a52', w - 20, 2);
      px(w - 10, 32, '#9ea0a3', 6, h - 32);
    } else if (estilo === 'bege') {
      // bege com portão de ripas marrom e coqueirinho no quintal
      px(0, 14, C.outline, w, h - 14);
      px(1, 15, '#d9c9a8', w - 2, h - 15);
      px(0, 10, C.outline, w, 6);
      px(1, 11, '#8a7a62', w - 2, 4);
      const gx = Math.floor(w * 0.35);
      px(gx, base - 40, C.outline, Math.floor(w * 0.5), 40);
      for (let y = base - 39; y < base; y += 4) px(gx + 1, y, '#6a5848', Math.floor(w * 0.5) - 2, 3);
      px(6, 26, C.outline, 18, 16);
      px(7, 27, '#2e3a48', 16, 14);
      luzes.push([7, 27, 16, 14]);
      px(7, 34, '#5a6f84', 16, 1);
    } else {
      // muro de granito salpicado com portão preto
      px(0, 24, C.outline, w, h - 24);
      px(1, 25, '#a7a39a', w - 2, h - 25);
      speckle(px, 1, 25, w - 2, h - 25, seed, ['#8a867d', '#c6c2b9', '#6e6a62', '#bdb9af'], Math.floor(w * (h - 25) / 6));
      const gx = Math.floor(w * 0.4);
      px(gx, base - 46, C.outline, 26, 46);
      px(gx + 1, base - 45, '#24262b', 24, 45);
      for (let y = base - 42; y < base; y += 5) px(gx + 2, y, '#3a3d44', 22, 1);
      // casa de cima aparecendo atrás do muro
      px(6, 0, C.outline, w - 12, 25);
      px(7, 1, '#e6e2da', w - 14, 24);
      px(12, 6, '#2e3a48', 14, 12);
      luzes.push([12, 6, 14, 12]);
      px(7, 1, '#cfcac0', w - 14, 2);
    }
    void r;
  }, (ctx, px) => {
    // janelas com luz de casa acesa (umas mais fortes que outras)
    luzes.forEach(([x, y, ww, hh], i) => {
      if ((seed + i) % 5 === 0) return; // uma ou outra apagada
      px(x, y, '#c98f4a', ww, hh);
      px(x + 1, y + 1, LUZ, ww - 2, hh - 2);
      px(x + 1, y + 1, LUZ_HI, ww - 2, 1);
      px(x + 2, y + hh - 3, '#e8b860', ww - 4, 1);
      // vidro grande: ripas na frente da luz, para não ficar um bloco amarelo
      if (ww * hh > 500) for (let yy = y + 6; yy < y + hh - 2; yy += 9) px(x, yy, '#7a5a3a', ww, 2);
    });
  });
}

// ---------------------------------------------------------------- fundo
function makeBackground(scene) {
  const bands = ['#070a1f', '#0b1029', '#101634', '#161d40', '#1e244c', '#272b57', '#333262', '#40396a'];
  makeCanvas(scene, 'cn_ceu_rua', 8, 270, (ctx, px) => {
    const bh = 270 / bands.length;
    for (let y = 0; y < 270; y++) {
      const fb = y / bh, i = Math.floor(fb), frac = fb - i;
      for (let x = 0; x < 8; x++) {
        let c = bands[Math.min(i, bands.length - 1)];
        if (frac > 0.75 && i < bands.length - 1 && (x + y) % 2 === 0) c = bands[i + 1];
        px(x, y, c);
      }
    }
  });
  fromRows(scene, 'cn_nuvem_dia', [
    '........wwww..........',
    '.....wwwwwwwww........',
    '...wwwwwwwwwwwwww.....',
    '.wwwwwwwwwwwwwwwwwww..',
    'ssssssssssssssssssssss',
  ], { w: '#ffffff', s: '#dbe9f3' });
  // ao longe: telhados retos, muro branco do condomínio e coqueiros
  makeCanvas(scene, 'cn_condo_fundo', 480, 80, (ctx, px) => {
    const r = rng(19);
    let x = 0;
    while (x < 480) {
      const w = 30 + Math.floor(r() * 40);
      const h = 18 + Math.floor(r() * 22);
      const cor = ['#c9ccd6', '#b9bcc8', '#d6d3cc', '#aeb3c0'][Math.floor(r() * 4)];
      px(x, 80 - 12 - h, cor, w, h);
      px(x, 80 - 12 - h, '#8f95a4', w, 2);
      if (r() < 0.5) px(x + 4, 80 - 12 - h + 6, '#7d8698', 8, 5);
      x += w + Math.floor(r() * 10);
    }
    for (let i = 0; i < 7; i++) {
      const tx = 20 + i * 70 + Math.floor(r() * 20);
      for (let y = 68; y > 30; y--) px(tx + Math.round((68 - y) * 0.05), y, '#8e9a86', 1, 1);
      for (let k = -9; k <= 9; k++) px(tx + 2 + k, 30 + Math.round(Math.abs(k) * 0.5), '#7f9a72', 1, 2);
    }
    px(0, 68, '#e4e2dc', 480, 12);
    px(0, 68, '#f2f1ed', 480, 1);
  }, (ctx, px) => {
    const r2 = rng(5);
    for (let i = 0; i < 26; i++) px(Math.floor(r2() * 480), 38 + Math.floor(r2() * 24), r2() < 0.5 ? LUZ : '#e8b860', 2, 2);
  });
  // fios de poste cruzando o céu
  makeCanvas(scene, 'cn_fios', 240, 60, (ctx, px) => {
    for (const [y0, sag] of [[6, 10], [12, 12], [16, 9], [22, 14]]) {
      for (let x = 0; x < 240; x++) {
        const t = x / 240;
        px(x, Math.round(y0 + Math.sin(t * Math.PI) * sag), 'rgba(30,30,40,0.55)');
      }
    }
  });
}

let built = false;

export const calcada = {
  tileset: 'cn_tiles_rua',
  oneway: [T.LAJE, T.LAJE + 1, T.LAJE + 2],
  musica: 'memoria',
  decorChars: { s: 'cn_portaria', b: 'carro', a: 'coqueiro', p: 'pombos', o: 'cone', l: 'cn_lixeira' },
  objects: {
    box: 'cn_caixote',
    door: 'cn_portao_rua',
    lever: ['cn_interfone_off', 'cn_interfone_on'],
    exit: 'cn_coqueiro_b',
    exitOpen: 'cn_coqueiro_b',
    checkpoint: ['cn_poste_off', 'cn_poste_on'],
  },

  textures(scene) {
    if (built && scene.textures.exists('cn_tiles_rua') && scene.textures.exists('cn_poste_on')) return;
    makeTiles(scene);
    makeObjects(scene);
    makeDecor(scene);
    makeBackground(scene);
    built = true;
  },

  tile(ch, c, r, at) {
    if (ch === '#') {
      const solid = (cc, rr) => at(cc, rr) === '#';
      const l = !solid(c - 1, r), rr = !solid(c + 1, r);
      if (!solid(c, r - 1)) return l ? T.TOP_L : rr ? T.TOP_R : T.TOP;
      if (!solid(c, r - 2)) return l ? T.FILL_L : rr ? T.FILL_R : T.FILL;
      return l ? T.DEEP_L : rr ? T.DEEP_R : T.DEEP;
    }
    if (ch === 'M') {
      const wall = (cc, rrr) => at(cc, rrr) === 'M';
      let m = 0;
      if (!wall(c, r - 1)) m |= 1;
      if (!wall(c - 1, r)) m |= 2;
      if (!wall(c + 1, r)) m |= 4;
      return T.MURO + m;
    }
    if (ch === '=') {
      const l = at(c - 1, r) !== '=', rr = at(c + 1, r) !== '=';
      return l ? T.LAJE + 1 : rr ? T.LAJE + 2 : T.LAJE;
    }
    return -1;
  },

  decorate(level, lvl) {
    const s = level;
    const at = lvl.at;
    const groundY = (r) => (r + 1) * TILE;
    // linha do chão da rua (topo do bloquete)
    let gRow = lvl.rows - 1;
    for (let r = 0; r < lvl.rows; r++) if (at(5, r) === '#') { gRow = r; break; }
    const G = gRow * TILE;
    const W = lvl.cols * TILE;

    // calçada cinza com meio-fio branco, atrás da rua (onde ficam as casas)
    const calc = s.add.graphics().setDepth(0.32);
    calc.fillStyle(0x2a2630, 1).fillRect(0, G - 7, W, 1);
    calc.fillStyle(0x4f4e5c, 1).fillRect(0, G - 6, W, 3);
    calc.fillStyle(0x5f5e6c, 1).fillRect(0, G - 6, W, 1);
    calc.fillStyle(0x83829a, 1).fillRect(0, G - 3, W, 2);
    calc.fillStyle(0x4a4958, 1).fillRect(0, G - 1, W, 1);

    // portaria (início) — guarda onde ela fica para as casas começarem depois
    let casasDe = 0;
    for (const d of lvl.decor) {
      if (d.type !== 'cn_portaria') continue;
      const x = d.c * TILE - 8;
      s.add.image(x, G - 6, 'cn_portaria').setOrigin(0, 1).setDepth(0.31);
      s.add
        .text(x + 39, G - 6 - 96 + 12, 'FLORES DO CERRADO', { fontFamily: '"Pixelify Sans"', fontSize: '6px', color: '#ffe7b0' })
        .setOrigin(0.5)
        .setResolution(3)
        .setDepth(0.315);
      casasDe = Math.max(casasDe, x + 160);
    }

    // fileira de casas ao longo da rua
    const r = rng(7);
    let x = casasDe + 4;
    let n = 0;
    while (x < W - 40) {
      const w = 96 + Math.floor(r() * 5) * 16;
      const h = 84 + Math.floor(r() * 3) * 8;
      const estilo = ESTILOS[n % ESTILOS.length];
      const key = `cn_casa_${estilo}_${w}_${h}_${n}`;
      if (!s.textures.exists(key)) drawCasa(s, key, estilo, w, h, n, 200 + n);
      s.add.image(x, G - 7, key).setOrigin(0, 1).setDepth(0.3);
      // número da casa numa plaquinha
      const num = String(3 + n * 4).padStart(2, '0');
      const nx = x + w - 15, ny = G - 7 - 58;
      s.add.rectangle(nx, ny, 17, 11, 0x2a2630).setDepth(0.304);
      s.add.rectangle(nx, ny, 15, 9, 0xd8c99a).setDepth(0.3045);
      s.add
        .text(nx, ny, num, { fontFamily: '"Pixelify Sans"', fontSize: '10px', color: '#1e1f24' })
        .setOrigin(0.5)
        .setResolution(3)
        .setDepth(0.305);
      // muro branco baixo entre uma casa e outra
      const gap = 10 + Math.floor(r() * 3) * 6;
      const m = s.add.graphics().setDepth(0.29);
      m.fillStyle(0x2a2630, 1).fillRect(x + w, G - 7 - 30, gap, 30);
      m.fillStyle(0x6c6b80, 1).fillRect(x + w, G - 7 - 29, gap, 29);
      x += w + gap;
      n++;
    }

    // postes com fios, a cada ~14 blocos
    const postes = [];
    for (let px0 = casasDe + 40; px0 < W - 20; px0 += 224) postes.push(px0);
    const fio = s.add.graphics().setDepth(0.36);
    postes.forEach((px0, i) => {
      const g = s.add.graphics().setDepth(0.36);
      g.fillStyle(0x2a2630, 1).fillRect(px0 - 2, G - 118, 5, 115);
      g.fillStyle(0x5d5c6c, 1).fillRect(px0 - 1, G - 118, 3, 115);
      g.fillStyle(0x7a7990, 1).fillRect(px0 - 1, G - 30, 3, 27); // faixa branca da base
      g.fillStyle(0x2a2630, 1).fillRect(px0 - 1, G - 116, 18, 2); // braço da luminária
      g.fillStyle(0x5a606a, 1).fillRect(px0 + 13, G - 115, 6, 3);
      g.fillStyle(0x2a2630, 1).fillRect(px0 - 6, G - 104, 13, 2); // cruzeta
      // luz do poste: lâmpada acesa, cone de luz e poça de luz no chão
      g.fillStyle(0xfff2c4, 1).fillRect(px0 + 14, G - 112, 4, 2);
      const luz = s.add.graphics().setDepth(1.95).setBlendMode(Phaser.BlendModes.ADD);
      for (let k = 0; k < 6; k++) {
        const t = k / 6;
        luz.fillStyle(0xffc870, 0.05);
        luz.fillTriangle(px0 + 16, G - 110, px0 + 16 - 14 - t * 40, G, px0 + 16 + 14 + t * 40, G);
      }
      luz.fillStyle(0xffd98a, 0.12).fillEllipse(px0 + 16, G, 90, 10);
      if (i < postes.length - 1) {
        const x2 = postes[i + 1];
        for (const [dy, sag] of [[-103, 10], [-99, 12], [-95, 14]]) {
          for (let xx = px0; xx <= x2; xx += 1) {
            const t = (xx - px0) / (x2 - px0);
            fio.fillStyle(0x24242c, 0.7).fillRect(xx, G + dy + Math.round(Math.sin(t * Math.PI) * sag), 1, 1);
          }
        }
      }
    });

    // buracos de obra: fundo escuro de terra, em vez do céu aparecendo
    for (let c = 0; c < lvl.cols; c++) {
      if (at(c, lvl.rows - 1) === '#') continue;
      let top = -1;
      for (let rr = 0; rr < lvl.rows; rr++) if (at(c - 1, rr) === '#' || at(c + 1, rr) === '#') { top = rr; break; }
      if (top < 0) continue;
      const hx = c * TILE, hy = top * TILE;
      const g = s.add.graphics().setDepth(1.9);
      g.fillStyle(0x4a2018, 1).fillRect(hx, hy, TILE, 12);
      g.fillStyle(0x2e140f, 1).fillRect(hx, hy + 12, TILE, 40);
      g.fillStyle(0x1a0b08, 1).fillRect(hx, hy + 52, TILE, 600);
      g.fillStyle(0x6e3022, 1);
      for (let k = 0; k < 4; k++) g.fillRect(hx + ((k * 5 + c * 3) % 14), hy + 4 + k * 9, 2, 1);
    }

    // vaga-lumes piscando pela rua
    s.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: W },
      y: { min: G - 70, max: G - 8 },
      lifespan: { min: 2500, max: 4500 },
      speedX: { min: -6, max: 6 },
      speedY: { min: -5, max: 3 },
      alpha: { start: 1, end: 0 },
      tint: [0xd8ff6a, 0xfff07a],
      frequency: 140,
      quantity: 1,
    }).setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    s.griloT = 2;

    // enfeites do mapa
    s.pombos = [];
    s.copas = [];
    let coq = 0;
    for (const d of lvl.decor) {
      const dx = d.c * TILE + 8;
      const dy = groundY(d.r);
      if (d.type === 'carro') s.add.image(dx, G - 3, 'cn_carro_vermelho').setOrigin(0.5, 1).setDepth(0.4);
      else if (d.type === 'cone') s.add.image(dx, dy, 'cn_cone_rua').setOrigin(0.5, 1).setDepth(7);
      else if (d.type === 'cn_lixeira') s.add.image(dx, G - 4, 'cn_lixeira').setOrigin(0.5, 1).setDepth(0.38);
      else if (d.type === 'coqueiro') {
        // coqueiro no meio-fio, com a copa balançando de leve no vento
        const key = ['cn_coqueiro_a', 'cn_coqueiro_c', 'cn_coqueiro_b'][coq++ % 3];
        s.add.ellipse(dx, G - 3, 26, 4, 0x2a2630, 0.2).setDepth(0.33);
        const img = s.add.image(dx, G - 2, key).setOrigin(0.5, 1).setDepth(0.35);
        s.copas.push({ img, phase: d.c * 0.7 });
      } else if (d.type === 'pombos') {
        for (let k = 0; k < 0; k++) {
          const p = s.add.image(dx - 8 + k * 7, dy, 'cn_pombo_a').setOrigin(0.5, 1).setDepth(8);
          if (k === 1) p.setFlipX(true);
          s.pombos.push({ sprite: p, hx: p.x, hy: p.y, state: 'chao', t: Math.random() * 2, vx: 0, vy: 0, away: 0 });
        }
      }
    }
  },

  // poste aceso ao passar: luz no chão
  onCheckpoint(level, cp) {
    const g = level.add.graphics().setDepth(1.95).setBlendMode(Phaser.BlendModes.ADD);
    g.fillStyle(0xffd98a, 0.16).fillEllipse(cp.x + 8, cp.y + TILE, 60, 10);
    g.fillStyle(0xffc870, 0.06).fillTriangle(cp.x + 8, cp.y + TILE - 46, cp.x - 18, cp.y + TILE, cp.x + 34, cp.y + TILE);
    g.setAlpha(0);
    level.tweens.add({ targets: g, alpha: 1, duration: 400 });
  },

  update(level, dt) {
    const s = level;
    // grilos cantando de vez em quando
    s.griloT = (s.griloT || 2) - dt;
    if (s.griloT <= 0) {
      s.griloT = 1.5 + Math.random() * 3;
      Sfx.grilo();
    }
    if (s.copas) {
      s.coqT = (s.coqT || 0) + dt;
      for (const c of s.copas) c.img.rotation = Math.sin(s.coqT * 0.9 + c.phase) * 0.012;
    }
    if (!s.pombos) return;
    for (const p of s.pombos) {
      p.t += dt;
      if (p.state === 'chao') {
        p.sprite.setTexture(Math.sin(p.t * 5 + p.hx) > 0.6 ? 'cn_pombo_b' : 'cn_pombo_a');
        const near = s.players.some((pl) => Math.abs(pl.x - p.hx) < 34 && Math.abs(pl.feet - p.hy) < 40);
        if (near) {
          p.state = 'voando';
          const closest = s.players.reduce((a, pl) => (Math.abs(pl.x - p.hx) < Math.abs(a.x - p.hx) ? pl : a));
          const dir = closest.x < p.hx ? 1 : -1;
          p.vx = dir * (40 + Math.random() * 30);
          p.vy = -70 - Math.random() * 30;
          p.sprite.setFlipX(dir < 0);
        }
      } else if (p.state === 'voando') {
        p.sprite.x += p.vx * dt;
        p.sprite.y += p.vy * dt;
        p.vy += 20 * dt;
        p.sprite.setTexture(Math.floor(p.t * 12) % 2 ? 'cn_pombo_voa_a' : 'cn_pombo_voa_b');
        if (p.sprite.y < p.hy - 140) {
          p.state = 'longe';
          p.away = 6 + Math.random() * 4;
          p.sprite.setVisible(false);
        }
      } else if (p.state === 'longe') {
        p.away -= dt;
        const near = s.players.some((pl) => Math.abs(pl.x - p.hx) < 70);
        if (p.away <= 0 && !near) {
          p.state = 'chao';
          p.sprite.setPosition(p.hx, p.hy).setVisible(true).setAlpha(0);
          s.tweens.add({ targets: p.sprite, alpha: 1, duration: 400 });
        }
      }
    }
  },

  bg: {
    create(s) {
      s.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'cn_ceu_rua').setOrigin(0);
      const rnd = new Phaser.Math.RandomDataGenerator(['estrelas_condo']);
      for (let i = 0; i < 80; i++) {
        const st = s.add.image(rnd.between(0, VIEW_W), rnd.between(0, 150), 'pixel').setAlpha(rnd.realInRange(0.3, 1));
        if (rnd.frac() < 0.12) st.setScale(2).setTint(0xfff2b0);
        s.tweens.add({ targets: st, alpha: 0.15, duration: rnd.between(900, 2600), yoyo: true, repeat: -1, delay: rnd.between(0, 2000) });
      }
      s.add.circle(390, 44, 22, 0xfff6d0, 0.12);
      s.add.circle(390, 44, 13, 0xfff1c9, 1);
      s.add.circle(385, 40, 3, 0xe8dcb0, 1);
      s.add.circle(394, 49, 2, 0xe8dcb0, 1);
      s.clouds = [];
      s.layers = [
        { s: s.add.tileSprite(0, 0, VIEW_W, 60, 'cn_fios').setOrigin(0, 1), fx: 0.18, wy: 120 },
        { s: s.add.tileSprite(0, 0, VIEW_W, 80, 'cn_condo_fundo').setOrigin(0, 1), fx: 0.15, wy: 200 },
      ];
    },
    update(s, dt, view, t) {
      // posição na tela de uma altura do mundo (acompanha o zoom da câmera da fase)
      const sy = (wy) => ((wy - view.y) * VIEW_H) / view.height;
      for (const l of s.layers) {
        l.s.tilePositionX = Math.round(view.x * l.fx);
        l.s.y = Math.round(sy(l.wy));
      }
      for (const c of s.clouds) {
        let x = c.baseX - view.x * c.factor + t * c.speed;
        x = ((x % (VIEW_W + 60)) + VIEW_W + 60) % (VIEW_W + 60) - 30;
        c.x = Math.round(x);
      }
    },
  },
};
