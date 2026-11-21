// Tema da fase 4: o Bulls (hamburgueria no Gama), 17/11/2024 — o dia em que conversaram sobre a vida.
// Começa na calçada (motos, árvore, deck com grade, fachada preta), entra pela porta automática de vidro
// e segue pelo salão: parede de tijolinho com quadro de moldura vermelha, sofá preto capitonê,
// mesas de madeira com pé em "V", cadeiras pretas de assento vinho, parede de pedras com o touro vermelho,
// balcão, garçom e a parede de vidro com as árvores lá fora. No fim eles sentam, a comida chega e conversam.

import { TILE, VIEW_W, VIEW_H } from '../config.js';
import { makeCanvas, fromRows, rng } from '../systems/textures.js';
import { Sfx } from '../systems/sfx.js';

const T = { CALC: 0, CALC_FILL: 1, PISO: 2, PISO_FILL: 3, DECK: 4, MESA: 5, TABLADO: 6, TABLADO_LADO: 7, TETO: 8, VIDRO: 9 };

const C = {
  outline: '#241f26',
  conc: '#a7a39c', concHi: '#bdb9b2', concLo: '#8a867f',
  piso: '#d8cdb8', pisoHi: '#e6ddca', pisoLo: '#bfb39c',
  wood: '#a8683a', woodHi: '#c88552', woodLo: '#7d4a26', woodDark: '#5a341c',
  black: '#1e1e22', blackHi: '#3a3a40', blackLo: '#121215',
  wine: '#7a1f2b', wineHi: '#9a2d3a', wineLo: '#5a1520',
  brick: '#b88a62', brickLo: '#9a6e4a', brickHi: '#ccA27a',
  ceil: '#3c3d42', ceilLo: '#2e2f33',
  glass: '#9fc8d8', glassHi: '#d6eef5', glassLo: '#7aa8bc',
  red: '#c8252c', redHi: '#e84a4a', redLo: '#8e1a20',
  leaf: '#4f8a3a', leafHi: '#78b04f', leafLo: '#36652a',
};

function speckle(px, ox, oy, w, h, seed, cols, n) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) px(ox + Math.floor(r() * w), oy + Math.floor(r() * h), cols[i % cols.length]);
}

// ---------------------------------------------------------------- tiles
function makeTiles(scene) {
  makeCanvas(scene, 'bl_tiles', TILE * 17, TILE, (ctx, px) => {
    let ox = T.CALC * TILE;
    // calçada de concreto (lado de fora)
    px(ox, 0, C.concHi, 16, 1);
    px(ox, 1, C.conc, 16, 15);
    speckle(px, ox, 1, 16, 15, 3, [C.concLo, C.concHi], 14);
    px(ox + 15, 1, C.concLo, 1, 6);
    ox = T.CALC_FILL * TILE;
    px(ox, 0, '#6e6a64', 16, 16);
    speckle(px, ox, 0, 16, 16, 5, ['#5e5a54', '#7e7a74'], 12);
    // porcelanato bege grande (lado de dentro)
    ox = T.PISO * TILE;
    px(ox, 0, C.pisoHi, 16, 1);
    px(ox, 1, C.piso, 16, 6);
    px(ox + 15, 0, C.pisoLo, 1, 7);
    px(ox, 3, 'rgba(255,255,255,0.18)', 16, 1); // brilho do piso
    px(ox, 7, C.outline, 16, 1);
    px(ox, 8, '#4a4038', 16, 8);
    ox = T.PISO_FILL * TILE;
    px(ox, 0, '#4a4038', 16, 16);
    speckle(px, ox, 0, 16, 16, 9, ['#3e352e', '#564a40'], 10);
    // deck de madeira da área de fora
    ox = T.DECK * TILE;
    px(ox, 0, C.outline, 16, 16);
    for (let y = 1; y < 16; y += 4) { px(ox, y, C.wood, 16, 3); px(ox, y, C.woodHi, 16, 1); }
    px(ox + 7, 1, C.woodLo, 1, 15);
    // mesa comprida: tampo grosso de madeira com saia escura
    ox = T.MESA * TILE;
    px(ox, 0, C.outline, 16, 16);
    px(ox, 1, C.woodHi, 16, 1);
    px(ox, 2, C.wood, 16, 5);
    for (let x = 1; x < 16; x += 5) px(ox + x, 3, C.woodLo, 3, 1);
    px(ox, 7, C.outline, 16, 1);
    px(ox, 8, C.woodDark, 16, 7);
    px(ox, 15, C.outline, 16, 1);
    // tablado das mesas perto do vidro: piso de madeira em cima, lateral escura
    ox = T.TABLADO * TILE;
    px(ox, 0, C.outline, 16, 1);
    px(ox, 1, C.woodHi, 16, 1);
    px(ox, 2, C.wood, 16, 4);
    px(ox + 9, 2, C.woodLo, 1, 4);
    px(ox, 6, C.outline, 16, 1);
    px(ox, 7, C.woodDark, 16, 9);
    for (let y = 9; y < 16; y += 3) px(ox, y, '#4a2a16', 16, 1);
    ox = T.TABLADO_LADO * TILE;
    px(ox, 0, C.woodDark, 16, 16);
    for (let y = 1; y < 16; y += 3) px(ox, y, '#4a2a16', 16, 1);
    // teto cinza-escuro com luminária quadrada embutida
    ox = T.TETO * TILE;
    px(ox, 0, C.ceilLo, 16, 16);
    px(ox, 0, C.ceil, 16, 14);
    px(ox, 14, C.outline, 16, 2);
    px(ox + 5, 9, '#fff3c8', 6, 3);
    px(ox + 4, 9, '#cfc6a0', 1, 3);
    // parede/fachada de vidro com caixilho preto: 8 variações (1 = topo, 2 = esquerda, 4 = direita livres)
    for (let m = 0; m < 8; m++) {
      ox = (T.VIDRO + m) * TILE;
      px(ox, 0, C.black, 16, 16);
      px(ox + 2, 0, C.glass, 12, 16);
      px(ox + 3, 0, C.glassHi, 1, 16);
      px(ox + 11, 0, C.glassLo, 3, 16);
      if (m & 1) px(ox, 0, C.outline, 16, 2);
      if (m & 2) px(ox, 0, C.outline, 1, 16);
      if (m & 4) px(ox + 15, 0, C.outline, 1, 16);
    }
  });
}

// ---------------------------------------------------------------- objetos
function makeObjects(scene) {
  // porta de vidro automática (repete na vertical)
  makeCanvas(scene, 'bl_porta', 16, 16, (ctx, px) => {
    px(0, 0, C.black, 16, 16);
    px(2, 0, C.glass, 12, 16);
    px(3, 0, C.glassHi, 2, 16);
    px(10, 0, C.glassLo, 3, 16);
    px(12, 5, '#c9ccd2', 1, 6); // puxador
  });
  // cadeira preta de ripas com assento vinho (dá para empurrar: só ele)
  fromRows(scene, 'bl_cadeira', [
    'oo..............',
    'oKo.............',
    'oKo.............',
    'oKoooo..........',
    'oKKKKo..........',
    'oKoooo..........',
    'oKKKKo..........',
    'oKoooooooooooooo',
    'oKWWWWWWWWWWWWWo',
    'oKwwwwwwwwwwwwwo',
    'oooooooooooooooo',
    '.oKo........oKo.',
    '.oKo........oKo.',
    '.oKo........oKo.',
    '.oKo........oKo.',
    '.ooo........ooo.',
  ], { o: C.outline, K: C.blackHi, W: C.wineHi, w: C.wine });
  // cardápio em pé (checkpoint): em branco / com coração de giz
  const lousa = (key, on) => fromRows(scene, key, [
    '...oooooooooo...',
    '...oWWWWWWWWo...',
    '...oWGGGGGGWo...',
    '...oWG' + (on ? 'hGGh' : 'GGGG') + 'GWo...',
    '...oWG' + (on ? 'hhhh' : 'GGGG') + 'GWo...',
    '...oWG' + (on ? 'GhhG' : 'GGGG') + 'GWo...',
    '...oWGGGGGGWo...',
    '...oWGccccGWo...',
    '...oWGGGGGGWo...',
    '...oWGccGGGWo...',
    '...oWWWWWWWWo...',
    '...oooooooooo...',
    '....oW....Wo....',
    '...oW......Wo...',
    '..oW........Wo..',
    '..oo........oo..',
  ], { o: C.outline, W: C.wood, G: '#2a3a30', c: '#c9d0c8', h: '#ff8fb0' });
  lousa('bl_cardapio_off', false);
  lousa('bl_cardapio_on', true);
  makeCanvas(scene, 'bl_saida', 2, 2, () => {});
}

// ---------------------------------------------------------------- comida, mesa e garçom
function makeComida(scene) {
  // jogo americano preto (de couro)
  makeCanvas(scene, 'bl_jogo', 16, 3, (ctx, px) => { px(0, 0, '#1a1a1e', 16, 3); px(0, 0, '#3a3a40', 16, 1); });
  // prato: parmegiana com molho vermelho e queijo, arroz e batata frita
  const prato = (key, fase) => makeCanvas(scene, key, 18, 8, (ctx, px) => {
    px(0, 5, '#c9c2b2', 18, 2);
    px(1, 4, '#f2eee4', 16, 2);
    px(2, 7, '#a8a294', 14, 1);
    if (fase === 2) { px(4, 3, '#d8cfa8', 3, 1); return; } // só farelo
    const k = fase === 1 ? 0.5 : 1;
    px(2, 1, '#ffffff', Math.round(6 * k), 3); // arroz
    px(9, 2, '#c8402a', Math.round(6 * k), 2); // parmegiana
    px(9, 1, '#f0d070', Math.round(5 * k), 1); // queijo
    px(10, 1, '#5aa04a', 1, 1);
    if (fase === 0) for (const x of [3, 5, 14, 15]) px(x, 0, '#f5c84a', 1, 3); // batatinhas
  });
  prato('bl_parmi_0', 0);
  prato('bl_parmi_1', 1);
  prato('bl_parmi_2', 2);
  // salada no prato fundo escuro: folhas, ovo, tomate e frango grelhado
  const salada = (key, fase) => makeCanvas(scene, key, 18, 8, (ctx, px) => {
    px(0, 5, '#1e1e22', 18, 2);
    px(1, 4, '#2e2e34', 16, 2);
    if (fase === 2) { px(6, 3, '#5aa04a', 2, 1); return; }
    const k = fase === 1 ? 0.5 : 1;
    px(2, 2, '#6ab04a', Math.round(12 * k), 2);
    px(3, 1, '#8ac860', Math.round(8 * k), 1);
    if (fase === 0) { px(5, 1, '#fff4c0', 2, 1); px(6, 1, '#f5c84a', 1, 1); px(10, 1, '#d8402a', 1, 1); px(12, 0, '#c8905a', 4, 2); }
  });
  salada('bl_salada_0', 0);
  salada('bl_salada_1', 1);
  salada('bl_salada_2', 2);
  // suco vermelho no pote de vidro, com canudo
  const suco = (key, cheio) => makeCanvas(scene, key, 6, 11, (ctx, px) => {
    px(4, 0, '#e8e2d2', 1, 4); // canudo
    px(0, 3, '#c9dde4', 6, 1);
    px(0, 4, '#c9dde4', 1, 7);
    px(5, 4, '#c9dde4', 1, 7);
    px(0, 10, '#c9dde4', 6, 1);
    px(1, cheio ? 5 : 8, '#e24a4a', 4, cheio ? 5 : 2);
    px(1, cheio ? 5 : 8, '#ff7a6a', 1, cheio ? 5 : 2);
  });
  suco('bl_suco_cheio', true);
  suco('bl_suco_vazio', false);
  // mesa de madeira com pé em "V" (a mesa deles, perto do vidro)
  makeCanvas(scene, 'bl_mesa', 48, 24, (ctx, px) => {
    px(0, 0, C.outline, 48, 5);
    px(1, 1, C.woodHi, 46, 1);
    px(1, 2, C.wood, 46, 2);
    for (let y = 5; y < 24; y++) {
      const t = (y - 5) / 18;
      const off = Math.round(t * 10);
      px(20 - off, y, C.woodLo, 3, 1);
      px(25 + off, y, C.woodLo, 3, 1);
      px(21 - off, y, C.wood, 1, 1);
    }
    px(9, 23, C.outline, 6, 1);
    px(33, 23, C.outline, 6, 1);
  });
  // cadeira vista de lado (para eles sentarem)
  const cadeira = (key, flip) => makeCanvas(scene, key, 14, 26, (ctx, px) => {
    const X = (x) => (flip ? 13 - x : x);
    for (let y = 0; y < 26; y++) px(X(1), y, C.black, 1, 1);
    px(X(2), 0, C.black, 1, 14);
    for (let y = 2; y < 12; y += 3) for (let x = 1; x < 4; x++) px(X(x), y, C.blackHi, 1, 1);
    for (let x = 1; x < 13; x++) { px(X(x), 14, C.black, 1, 1); px(X(x), 13, C.wine, 1, 1); px(X(x), 12, C.wineHi, 1, 1); }
    for (let y = 15; y < 26; y++) px(X(11), y, C.black, 1, 1);
  });
  cadeira('bl_cadeira_e', false);
  cadeira('bl_cadeira_d', true);
  // garçom de camiseta preta e avental, andando (2 quadros) e com a bandeja
  const pal = { o: C.outline, s: '#b07a52', h: '#2a1a14', K: '#1e1e22', k: '#3a3a40', a: '#6a4a30', p: '#2a2a30', w: '#f2eee4', t: '#9aa0aa' };
  const alto = (rows) => {
    // estica o tronco e as pernas para o garçom ficar com altura de adulto
    const out = [];
    rows.forEach((r, i) => {
      out.push(r);
      if ((i >= 9 && i <= 15) || (i >= 17 && i <= 19)) out.push(r);
    });
    return out;
  };
  const garcom = (key, passo, bandeja) => fromRows(scene, key, alto([
    bandeja ? '.....ttttttt' : '............',
    bandeja ? '......ww.ww.' : '............',
    '..hhhh......',
    '.hhhhhh.....',
    '.hsssss.....',
    '..sssss.....',
    '..sssss.....',
    '...sss......',
    '.KKKKKK' + (bandeja ? 'Ks..' : '....'),
    'KKKKKKKK' + (bandeja ? 's...' : '....'),
    'KKkKKKKK....',
    'sKKKKKKK....',
    'sKaaaaaK....',
    '.Kaaaaa.....',
    '..aaaaa.....',
    '..aaaaa.....',
    '..aaaaa.....',
    passo ? '..pp.pp.....' : '..pp..pp....',
    passo ? '..pp.pp.....' : '.pp....pp...',
    passo ? '..pp.pp.....' : '.pp....pp...',
    passo ? '.ooo.ooo....' : 'ooo....ooo..',
  ]), pal);
  garcom('bl_garcom_a', 0, false);
  garcom('bl_garcom_b', 1, false);
  garcom('bl_garcom_bandeja', 0, true);
}

// ---------------------------------------------------------------- cenário
function makeCenario(scene) {
  // lado de fora: fachada preta do Bulls com a frente de vidro e o deck com mesas e grade
  makeCanvas(scene, 'bl_fachada', 176, 112, (ctx, px) => {
    px(0, 0, C.outline, 176, 34);
    px(1, 1, C.black, 174, 32);
    for (let x = 2; x < 175; x += 4) px(x, 2, '#2a2a30', 2, 30); // chapa ondulada
    px(0, 34, C.outline, 176, 78);
    px(1, 35, '#4a3a30', 174, 77); // interior escuro visto pelo vidro
    for (let x = 8; x < 170; x += 22) { px(x, 35, C.black, 2, 77); }
    for (let i = 0; i < 6; i++) px(12 + i * 26, 70, '#ffd98a', 6, 3); // luzes lá dentro
    px(1, 35, 'rgba(200,230,240,0.25)', 174, 77);
    // mesas do deck
    for (const tx of [20, 70, 120]) {
      px(tx, 92, C.wood, 24, 3);
      px(tx + 10, 95, C.woodLo, 3, 17);
    }
  });
  // vizinho de fachada vermelha
  makeCanvas(scene, 'bl_vizinho', 128, 104, (ctx, px) => {
    px(0, 0, C.outline, 128, 36);
    px(1, 1, C.red, 126, 34);
    for (let x = 2; x < 127; x += 4) px(x, 2, C.redLo, 1, 32);
    px(0, 36, C.outline, 128, 68);
    px(1, 37, '#3a2a2a', 126, 67);
    for (const x of [10, 50, 90]) { px(x, 36, C.red, 4, 68); px(x, 36, C.redHi, 1, 68); }
  });
  // árvore grande (oiti) em frente
  makeCanvas(scene, 'bl_arvore', 96, 120, (ctx, px) => {
    const r = rng(12);
    for (let y = 119; y > 40; y--) { const x = 46 + Math.round(Math.sin(y / 18) * 2); px(x, y, '#4a3a2c', 5, 1); px(x + 1, y, '#6a5440', 2, 1); }
    const blobs = [[48, 34, 30], [24, 46, 18], [72, 46, 20], [36, 20, 16], [62, 20, 18]];
    for (const [bx, by, br] of blobs) for (let y = -br; y <= br; y++) for (let x = -br; x <= br; x++) {
      const d = Math.hypot(x, y * 1.15) / br;
      if (d > 1 || r() < 0.08) continue;
      px(bx + x, by + y, d > 0.82 ? C.leafLo : r() < 0.18 ? C.leafHi : C.leaf);
    }
  });
  // motos estacionadas
  const moto = (key, cor, corLo) => makeCanvas(scene, key, 32, 20, (ctx, px) => {
    for (const wx of [6, 25]) { px(wx - 5, 10, C.outline, 11, 10); px(wx - 4, 11, '#2a2b30', 9, 8); px(wx - 1, 14, '#a3a9b3', 3, 2); }
    px(8, 8, C.outline, 16, 5);
    px(9, 9, cor, 14, 3);
    px(9, 9, '#ffffff', 3, 1);
    px(12, 5, C.outline, 9, 4);
    px(13, 6, corLo, 7, 2); // banco
    px(24, 2, C.outline, 2, 8); // guidão
    px(23, 1, C.outline, 5, 2);
  });
  moto('bl_moto_a', '#2a4a9a', '#1e1e22');
  moto('bl_moto_b', '#c8252c', '#1e1e22');
  // carro prata
  makeCanvas(scene, 'bl_carro', 46, 22, (ctx, px) => {
    px(10, 2, C.outline, 22, 9);
    px(11, 3, '#bfe6f2', 20, 7);
    px(2, 9, C.outline, 42, 9);
    px(3, 10, '#c8ccd2', 40, 7);
    px(3, 14, '#a8acb2', 40, 3);
    for (const wx of [11, 34]) { px(wx - 5, 13, C.outline, 11, 9); px(wx - 4, 14, '#2a2b30', 9, 7); px(wx - 1, 17, '#a3a9b3', 3, 2); }
  });

  // --- lado de dentro (paredes do fundo, do teto ao piso: 160 de altura)
  // parede de tijolinho com o quadro colorido de moldura vermelha
  makeCanvas(scene, 'bl_tijolo', 288, 160, (ctx, px) => {
    px(0, 0, C.brick, 288, 160);
    for (let y = 0; y < 160; y += 5) {
      px(0, y, C.brickLo, 288, 1);
      for (let x = (y / 5) % 2 ? 0 : 6; x < 288; x += 12) px(x, y, C.brickLo, 1, 5);
    }
    speckle(px, 0, 0, 288, 160, 4, [C.brickHi, '#a87a52'], 600);
    // quadro
    const qx = 120, qy = 28;
    px(qx - 4, qy - 4, C.redLo, 56, 64);
    px(qx - 3, qy - 3, C.red, 54, 62);
    px(qx, qy, '#f2e6d0', 48, 56);
    const r = rng(77);
    const cores = ['#e84a4a', '#4a8ad8', '#f5c84a', '#5ab06a', '#e88ac0', '#2a2a30', '#f28a3a'];
    for (let i = 0; i < 70; i++) px(qx + Math.floor(r() * 44), qy + Math.floor(r() * 52), cores[i % cores.length], 2 + Math.floor(r() * 5), 2 + Math.floor(r() * 5));
    for (let y = 10; y < 44; y++) for (let x = 14; x < 34; x++) if (Math.hypot(x - 24, (y - 26) * 0.7) < 11) px(qx + x, qy + y, (x + y) % 3 ? '#d8a07a' : '#c88a62'); // rosto estilizado
    px(qx + 19, qy + 22, '#2a2a30', 3, 2);
    px(qx + 27, qy + 22, '#2a2a30', 3, 2);
    px(qx + 21, qy + 32, '#c8402a', 7, 2);
    px(0, 154, '#5a4030', 288, 6); // rodapé
  });
  // sofá preto capitonê (encosto alto) com base de madeira
  makeCanvas(scene, 'bl_sofa', 96, 44, (ctx, px) => {
    px(0, 0, C.outline, 96, 34);
    px(1, 1, C.black, 94, 32);
    for (let y = 4; y < 30; y += 7) for (let x = 4 + ((y / 7) % 2) * 5; x < 92; x += 10) { px(x, y, C.blackLo, 2, 2); px(x - 1, y - 1, C.blackHi, 1, 1); }
    px(0, 34, C.outline, 96, 10);
    px(1, 35, C.wood, 94, 8);
    px(1, 35, C.woodHi, 94, 1);
  });
  // mesa com duas cadeiras ao fundo (só enfeite)
  makeCanvas(scene, 'bl_mesa_fundo', 56, 30, (ctx, px) => {
    px(10, 8, C.outline, 36, 3);
    px(11, 8, C.wood, 34, 2);
    for (let y = 11; y < 30; y++) { const o = Math.round(((y - 11) / 18) * 6); px(26 - o, y, C.woodLo, 2, 1); px(28 + o, y, C.woodLo, 2, 1); }
    for (const [cx, f] of [[4, 1], [52, -1]]) {
      for (let y = 0; y < 30; y++) px(cx, y, C.black, 2, 1);
      for (let x = 0; x < 8; x++) { px(cx + f * x, 16, C.wine, 1, 2); px(cx + f * x, 18, C.black, 1, 1); }
      px(cx + f * 7, 18, C.black, 1, 12);
    }
  });
  // parede de pedras na grade (gabião) com a escultura de touro vermelho
  makeCanvas(scene, 'bl_gabiao', 160, 160, (ctx, px) => {
    px(0, 0, '#3a3a3e', 160, 160);
    const r = rng(31);
    for (let i = 0; i < 520; i++) {
      const x = Math.floor(r() * 158), y = Math.floor(r() * 150), w = 4 + Math.floor(r() * 7), h = 3 + Math.floor(r() * 4);
      px(x, y, ['#8a7a68', '#a8977f', '#6e6252', '#b8a890'][i % 4], w, h);
      px(x, y, 'rgba(255,255,255,0.12)', w, 1);
    }
    for (let x = 0; x < 160; x += 20) px(x, 0, '#1e1e22', 1, 160);
    for (let y = 0; y < 160; y += 20) px(0, y, '#1e1e22', 160, 1);
    // touro geométrico vermelho (de chapa recortada)
    const bx = 56, by = 36;
    px(bx + 6, by + 10, C.red, 40, 16); // corpo
    for (let y = 0; y < 16; y += 3) px(bx + 6, by + 10 + y, C.redLo, 40, 1);
    px(bx + 44, by + 4, C.red, 14, 14); // cabeça
    px(bx + 46, by - 2, C.redHi, 2, 7); // chifres
    px(bx + 54, by - 2, C.redHi, 2, 7);
    px(bx + 44, by - 3, C.redHi, 3, 2);
    px(bx + 54, by - 3, C.redHi, 3, 2);
    for (const lx of [10, 18, 34, 42]) px(bx + lx, by + 26, C.red, 3, 14); // pernas
    px(bx + 2, by + 12, C.redLo, 5, 2); // rabo
    px(0, 154, '#2a2a2e', 160, 6);
  });
  // balcão com caixa registradora e a janela da cozinha
  makeCanvas(scene, 'bl_balcao', 224, 160, (ctx, px) => {
    px(0, 0, '#5a5048', 224, 160);
    speckle(px, 0, 0, 224, 160, 8, ['#4e4640', '#665c54'], 300);
    px(40, 30, C.outline, 110, 44);
    px(41, 31, '#e8dcc0', 108, 42); // janela da cozinha, com luz
    px(41, 31, '#fff2d0', 108, 6);
    for (let x = 50; x < 140; x += 18) px(x, 50, '#c9c2b2', 12, 4); // pratos esperando
    px(30, 104, C.outline, 150, 56);
    px(31, 105, C.black, 148, 54);
    px(31, 105, C.wood, 148, 5);
    for (let x = 36; x < 176; x += 12) px(x, 112, C.blackHi, 1, 46);
    px(150, 92, C.outline, 20, 13);
    px(151, 93, '#3a3a40', 18, 11); // caixa registradora
    px(153, 95, '#7fd0e0', 10, 4);
    px(0, 154, '#2a2622', 224, 6);
  });
  // parede de vidro com caixilhos pretos e as árvores lá fora
  makeCanvas(scene, 'bl_vidro', 320, 160, (ctx, px) => {
    for (let y = 0; y < 160; y++) {
      const t = y / 160;
      px(0, y, t < 0.55 ? (t < 0.3 ? '#8ec4ee' : '#b0d6f2') : '#9ab870', 320, 1);
    }
    const r = rng(41);
    for (let i = 0; i < 9; i++) {
      const tx = 20 + i * 36 + Math.floor(r() * 10);
      for (let y = 150; y > 70; y--) px(tx, y, '#5a4636', 3, 1);
      for (let y = -20; y < 20; y++) for (let x = -22; x < 22; x++) {
        if (Math.hypot(x, y * 1.3) > 22 || r() < 0.1) continue;
        px(tx + x, 62 + y, r() < 0.2 ? C.leafHi : C.leaf);
      }
    }
    px(0, 96, 'rgba(200,210,215,0.55)', 320, 10); // faixa jateada no vidro
    for (let x = 0; x < 320; x += 64) px(x, 0, C.black, 4, 160); // caixilhos
    px(0, 0, C.black, 320, 4);
    px(0, 0, 'rgba(255,255,255,0.12)', 320, 160);
    px(0, 154, '#2a2622', 320, 6);
  });
}

function makeBackground(scene) {
  const bands = ['#7aaee6', '#88b8ea', '#98c2ee', '#a8ccf0', '#b8d6f2', '#c8e0f4'];
  makeCanvas(scene, 'bl_ceu', 8, 270, (ctx, px) => {
    const bh = 270 / bands.length;
    for (let y = 0; y < 270; y++) for (let x = 0; x < 8; x++) px(x, y, bands[Math.min(Math.floor(y / bh), bands.length - 1)]);
  });
  makeCanvas(scene, 'bl_horizonte', 480, 90, (ctx, px) => {
    const r = rng(5);
    let x = 0;
    while (x < 480) {
      const w = 30 + Math.floor(r() * 40), h = 30 + Math.floor(r() * 40);
      px(x, 90 - h, r() < 0.5 ? '#d8d4cc' : '#c8c4bc', w, h);
      px(x, 90 - h, '#b0aca4', w, 2);
      x += w + Math.floor(r() * 8);
    }
    for (let i = 0; i < 10; i++) { const tx = Math.floor(r() * 470); for (let y = -12; y < 12; y++) for (let xx = -14; xx < 14; xx++) if (Math.hypot(xx, y * 1.2) < 14 && r() > 0.1) px(tx + xx, 60 + y, '#6a9a52'); }
  });
}

let built = false;

export const bulls = {
  tileset: 'bl_tiles',
  oneway: [],
  musica: 'titulo',
  decorChars: {
    f: 'fachada', r: 'vizinho', a: 'arvore', q: 'moto', c: 'carro',
    t: 'tijolo', s: 'sofa', x: 'mesa_fundo', g: 'gabiao', k: 'balcao', w: 'garcom', v: 'vidro',
  },
  objects: {
    box: 'bl_cadeira',
    door: 'bl_porta',
    exit: 'bl_saida',
    exitOpen: 'bl_saida',
    checkpoint: ['bl_cardapio_off', 'bl_cardapio_on'],
  },

  textures(scene) {
    if (built && scene.textures.exists('bl_tiles') && scene.textures.exists('bl_garcom_bandeja')) return;
    makeTiles(scene);
    makeObjects(scene);
    makeComida(scene);
    makeCenario(scene);
    makeBackground(scene);
    built = true;
  },

  tile(ch, c, r, at) {
    if (ch === '#') return at(c, r - 1) === '#' ? T.CALC_FILL : T.CALC;
    if (ch === '%') return at(c, r - 1) === '%' ? T.PISO_FILL : T.PISO;
    if (ch === 'D') return T.DECK;
    if (ch === 'm') return T.MESA;
    if (ch === 'R') return at(c, r - 1) === 'R' ? T.TABLADO_LADO : T.TABLADO;
    if (ch === 'T') return T.TETO;
    if (ch === 'W') return T.CALC_FILL;
    if (ch === 'M') {
      const w = (cc, rr) => at(cc, rr) === 'M';
      let m = 0;
      if (!w(c, r - 1)) m |= 1;
      if (!w(c - 1, r)) m |= 2;
      if (!w(c + 1, r)) m |= 4;
      return T.VIDRO + m;
    }
    return -1;
  },

  decorate(level, lvl) {
    const s = level;
    const at = lvl.at;
    let gRow = lvl.rows - 1;
    for (let r = 0; r < lvl.rows; r++) if (at(3, r) === '#') { gRow = r; break; }
    const G = gRow * TILE;
    s.groundRowY = G;
    const find = (type) => lvl.decor.filter((d) => d.type === type);
    const txt = (x, y, str, size, color, depth = 0.42) => s.add.text(x, y, str, { fontFamily: '"Pixelify Sans"', fontSize: `${size}px`, color }).setOrigin(0.5).setResolution(3).setDepth(depth);

    // lado de fora
    find('vizinho').forEach((d) => s.add.image(d.c * TILE, G, 'bl_vizinho').setOrigin(0, 1).setDepth(0.3));
    find('fachada').forEach((d) => {
      s.add.image(d.c * TILE, G, 'bl_fachada').setOrigin(0, 1).setDepth(0.32);
      txt(d.c * TILE + 88, G - 112 + 14, 'BULLS', 14, '#f4f2ee');
      txt(d.c * TILE + 88, G - 112 + 27, 'HAMBURGUERIA', 6, '#c9c2b2');
    });
    find('arvore').forEach((d) => s.add.image(d.c * TILE + 8, G, 'bl_arvore').setOrigin(0.5, 1).setDepth(0.5));
    find('moto').forEach((d, i) => s.add.image(d.c * TILE + 8, G, i % 2 ? 'bl_moto_b' : 'bl_moto_a').setOrigin(0.5, 1).setDepth(0.45));
    find('carro').forEach((d) => s.add.image(d.c * TILE + 8, G, 'bl_carro').setOrigin(0.5, 1).setDepth(0.4));
    // grade preta do deck
    for (let c = 0; c < lvl.cols; c++) for (let r = 0; r < lvl.rows; r++) {
      if (at(c, r) !== 'D' || at(c, r - 1) === 'D') continue;
      const g = s.add.graphics().setDepth(1.5);
      const y = r * TILE;
      g.fillStyle(0x1e1e22, 1).fillRect(c * TILE, y - 14, 16, 2);
      for (let x = 0; x < 16; x += 4) g.fillRect(c * TILE + x, y - 14, 1, 14);
    }

    // lado de dentro: paredes do fundo
    find('tijolo').forEach((d) => s.add.image(d.c * TILE, G, 'bl_tijolo').setOrigin(0, 1).setDepth(0.3));
    find('gabiao').forEach((d) => s.add.image(d.c * TILE, G, 'bl_gabiao').setOrigin(0, 1).setDepth(0.3));
    find('balcao').forEach((d) => {
      s.add.image(d.c * TILE, G, 'bl_balcao').setOrigin(0, 1).setDepth(0.3);
      txt(d.c * TILE + 95, G - 160 + 22, 'BULLS', 10, '#f4f2ee', 0.31);
    });
    find('vidro').forEach((d) => s.add.image(d.c * TILE, G, 'bl_vidro').setOrigin(0, 1).setDepth(0.3));
    find('sofa').forEach((d) => s.add.image(d.c * TILE, G, 'bl_sofa').setOrigin(0, 1).setDepth(0.4));
    find('mesa_fundo').forEach((d) => {
      // em cima do tablado, a mesa fica no nível dele
      let y = G;
      for (let r = d.r + 1; r < lvl.rows; r++) if (at(d.c, r) !== '.' && at(d.c, r) !== 'x') { y = r * TILE; break; }
      s.add.image(d.c * TILE + 8, y, 'bl_mesa_fundo').setOrigin(0.5, 1).setDepth(0.45);
    });

    // pés em "V" da mesa comprida (só enfeite)
    for (let c = 0; c < lvl.cols; c++) for (let r = 0; r < lvl.rows; r++) {
      if (at(c, r) !== 'm' || at(c - 1, r) === 'm') continue;
      let c1 = c;
      while (at(c1 + 1, r) === 'm') c1++;
      const g = s.add.graphics().setDepth(1.4);
      const top = (r + 1) * TILE, h = G - top;
      for (const lx of [c * TILE + 10, (c1 + 1) * TILE - 12]) {
        for (let y = 0; y < h; y++) {
          const o = Math.round((y / h) * 5);
          g.fillStyle(0x7d4a26, 1).fillRect(lx - o, top + y, 2, 1).fillRect(lx + 2 + o, top + y, 2, 1);
        }
      }
    }

    // garçom andando no salão (ao fundo)
    s.garcons = find('garcom').map((d) => {
      const img = s.add.image(d.c * TILE + 8, G, 'bl_garcom_a').setOrigin(0.5, 1).setDepth(0.6);
      return { img, x0: d.c * TILE - 70, x1: d.c * TILE + 90, v: 22, t: 0 };
    });

    // a mesa deles, perto do vidro (na frente de quem está atrás dela)
    const ex = lvl.exitCells;
    if (ex.length) {
      const c0 = Math.min(...ex.map((e) => e.c)), c1 = Math.max(...ex.map((e) => e.c));
      const r1 = Math.max(...ex.map((e) => e.r));
      const cx = ((c0 + c1 + 1) * TILE) / 2, base = (r1 + 1) * TILE;
      s.mesaFinal = { cx, base };
      s.add.image(cx - 22, base, 'bl_cadeira_e').setOrigin(0.5, 1).setDepth(9.5);
      s.add.image(cx + 22, base, 'bl_cadeira_d').setOrigin(0.5, 1).setDepth(9.5);
      s.add.image(cx, base, 'bl_mesa').setOrigin(0.5, 1).setDepth(11);
      s.add.image(cx - 9, base - 24, 'bl_jogo').setOrigin(0.5, 0).setDepth(11.1);
      s.add.image(cx + 9, base - 24, 'bl_jogo').setOrigin(0.5, 0).setDepth(11.1);
    }
  },

  update(level, dt) {
    const s = level;
    if (!s.garcons) return;
    for (const g of s.garcons) {
      g.t += dt;
      g.img.x += g.v * dt;
      if (g.img.x > g.x1) { g.v = -Math.abs(g.v); g.img.setFlipX(true); }
      if (g.img.x < g.x0) { g.v = Math.abs(g.v); g.img.setFlipX(false); }
      g.img.setTexture(Math.floor(g.t * 4) % 2 ? 'bl_garcom_a' : 'bl_garcom_b');
    }
  },

  // final: os dois sentam à mesa, o garçom traz a comida e eles comem conversando
  finale(level, fin, done) {
    const s = level;
    const m = s.mesaFinal;
    if (!m) { done(); return; }
    const seat = { ela: m.cx - 17, ele: m.cx + 17 };
    // sentados: o corpo vai até o quadril (as pernas em pé ficam escondidas)
    // e as pernas dobradas são desenhadas no assento da cadeira
    const QUADRIL = { ele: 13, ela: 11 }; // altura do quadril no desenho do personagem
    const CALCA = { ele: 0x272c3b, ela: 0x9cbfe3 };
    const SAPATO = { ele: 0xf4f2ee, ela: 0xefe1c8 };
    const assento = m.base - 14;
    s.players.forEach((p) => {
      p.body.reset(seat[p.id], m.base - p.def.h / 2);
      p.body.setVelocity(0, 0);
      const q = QUADRIL[p.id];
      const dir = p.id === 'ela' ? 1 : -1; // ela olha para a direita, ele para a esquerda
      p.sprite.play(`${p.id}-idle`);
      p.sprite.setScale(1).setAlpha(1).setFlipX(dir < 0);
      p.sprite.setPosition(seat[p.id], assento + q);
      p.sprite.setCrop(0, 0, 32, 46 - q);
      const x = seat[p.id];
      const g = s.add.graphics().setDepth(10.1);
      const x0 = dir > 0 ? x - 2 : x - 6;
      g.fillStyle(0x1b1020, 1).fillRect(x0 - 1, assento - 4, 10, 5); // coxa (contorno)
      g.fillStyle(CALCA[p.id], 1).fillRect(x0, assento - 3, 8, 3);
      const kx = dir > 0 ? x + 5 : x - 7; // joelho, de onde a canela desce
      g.fillStyle(0x1b1020, 1).fillRect(kx - 1, assento - 1, 4, m.base - assento - 1);
      g.fillStyle(CALCA[p.id], 1).fillRect(kx, assento, 2, m.base - assento - 3);
      g.fillStyle(0x1b1020, 1).fillRect(kx - 1 - (dir < 0 ? 2 : 0), m.base - 3, 6, 3);
      g.fillStyle(SAPATO[p.id], 1).fillRect(kx - (dir < 0 ? 2 : 0), m.base - 2, 4, 2);
    });
    // câmera chega pertinho da mesa
    if (s.coopCam && s.coopCam.setFoco) s.coopCam.setFoco(m.cx, m.base - 30, 2.1);
    // garçom traz a bandeja
    const view = { right: m.cx + 140 };
    const garcom = s.add.image(view.right + 20, m.base, 'bl_garcom_bandeja').setOrigin(0.5, 1).setDepth(10.5).setFlipX(true);
    const pratos = [];
    s.tweens.add({
      targets: garcom,
      x: m.cx + 34,
      duration: 1600,
      onComplete: () => {
        Sfx.click();
        pratos.push(s.add.image(m.cx - 9, m.base - 23, 'bl_parmi_0').setOrigin(0.5, 1).setDepth(11.2));
        pratos.push(s.add.image(m.cx + 9, m.base - 23, 'bl_salada_0').setOrigin(0.5, 1).setDepth(11.2));
        pratos.push(s.add.image(m.cx, m.base - 22, 'bl_suco_cheio').setOrigin(0.5, 1).setDepth(11.3));
        pratos.forEach((p) => s.tweens.add({ targets: p, y: p.y - 3, duration: 120, yoyo: true }));
        Sfx.ding();
        garcom.setTexture('bl_garcom_a').setFlipX(false);
        s.tweens.add({ targets: garcom, x: view.right + 40, duration: 1400, delay: 300, onComplete: () => garcom.destroy() });
        s.time.delayedCall(500, conversa);
      },
    });
    // comendo: de vez em quando um dos dois dá uma garfada
    let nhacs = 0;
    const comer = s.time.addEvent({
      delay: 1300,
      loop: true,
      paused: true,
      callback: () => {
        const p = s.players[nhacs % 2];
        nhacs++;
        s.tweens.add({ targets: p.sprite, y: p.sprite.y + 1, duration: 110, yoyo: true });
        Sfx.blip(320);
        if (nhacs === 5) { pratos[0].setTexture('bl_parmi_1'); pratos[1].setTexture('bl_salada_1'); }
        if (nhacs === 9) pratos[2].setTexture('bl_suco_vazio');
        if (nhacs === 11) { pratos[0].setTexture('bl_parmi_2'); pratos[1].setTexture('bl_salada_2'); }
      },
    });
    const conversa = () => {
      comer.paused = false;
      s.dialog.play(s.dialogos[fin.dialogo] || [], () => {
        comer.remove();
        if (pratos.length === 3) { pratos[0].setTexture('bl_parmi_2'); pratos[1].setTexture('bl_salada_2'); pratos[2].setTexture('bl_suco_vazio'); }
        s.fx.hearts(m.cx, m.base - 34, 8);
        s.time.delayedCall(400, () => s.fx.hearts(m.cx - 8, m.base - 40, 6));
        s.time.delayedCall(800, () => s.fx.hearts(m.cx + 8, m.base - 40, 6));
        Sfx.heart();
        s.time.delayedCall(2000, done);
      });
    };
  },

  bg: {
    create(s) {
      s.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'bl_ceu').setOrigin(0);
      s.add.circle(400, 40, 16, 0xfffdf0, 1);
      s.add.circle(400, 40, 26, 0xfff8d8, 0.3);
      s.layers = [{ s: s.add.tileSprite(0, 0, VIEW_W, 90, 'bl_horizonte').setOrigin(0, 1), fx: 0.15, wy: 205 }];
    },
    update(s, dt, view) {
      const sy = (wy) => ((wy - view.y) * VIEW_H) / view.height;
      for (const l of s.layers) {
        l.s.tilePositionX = Math.round(view.x * l.fx);
        l.s.y = Math.round(sy(l.wy));
      }
    },
  },
};
