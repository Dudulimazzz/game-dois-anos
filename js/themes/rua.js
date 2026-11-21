// Tema da fase 1: a DF-475, em frente ao condomínio Flores do Cerrado — o dia em que ela falou primeiro.
// Começa com os dois descendo do ônibus no ponto, esperam os carros passarem para atravessar a rua
// e seguem pela calçada (loja de material de construção, valeta, caminhão, caçambas) até perto da portaria.
// Céu azul com nuvens grandes, terra vermelha e capim seco do cerrado. Tudo desenhado por código.

import { TILE, VIEW_W, VIEW_H } from '../config.js';
import { makeCanvas, fromRows, rng } from '../systems/textures.js';
import { Input } from '../systems/controls.js';
import { Sfx } from '../systems/sfx.js';

const T = { TOP: 0, TOP_L: 1, TOP_R: 2, FILL: 3, DEEP: 4, PAV: 5, MURO: 6, PALETE: 14, CAMINHAO: 15, CABINE: 16, CACAMBA_A: 17, CACAMBA_B: 18 };

const C = {
  outline: '#2a2630',
  grass: '#b5a24a', grassHi: '#d2c068', grassLo: '#8e8038', grassGreen: '#7f9a46',
  earth: '#b85a35', earthLo: '#94452a', earthHi: '#d27248', earthDeep: '#6e3220',
  pav: '#a49d92', pavHi: '#bdb6aa', pavLo: '#857e74', pavJoint: '#c9c2b6',
  wall: '#d9d2c4', wallLo: '#bdb5a5', wallHi: '#ebe5d8', brick: '#b5603e', brickLo: '#94492c',
  wood: '#b07a46', woodLo: '#8a5a30', woodHi: '#cc9a62',
  red: '#c7352f', redLo: '#9a2622', redHi: '#e65a4a',
  glass: '#6f8fa8', glassHi: '#a9c4d6',
  metal: '#7d838d', metalLo: '#5a606a', metalHi: '#a3a9b3',
  blue: '#3f7fb4', blueLo: '#2c5f8a', blueHi: '#62a0d0', green: '#3f8a52', greenLo: '#2c6a3c', greenHi: '#5aa86a',
  white: '#efeeea', whiteLo: '#d4d2cc',
  orange: '#e8622c', yellow: '#f2c21b', yellowLo: '#c99a12',
};

function speckle(px, ox, oy, w, h, seed, cols, n) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) px(ox + Math.floor(r() * w), oy + Math.floor(r() * h), cols[i % cols.length]);
}

// ---------------------------------------------------------------- tiles
function makeTiles(scene) {
  makeCanvas(scene, 'df_tiles', TILE * 19, TILE, (ctx, px) => {
    // chão do acostamento: capim seco por cima da terra vermelha
    const top = (ox, l, r) => {
      px(ox, 0, C.earth, 16, 16);
      speckle(px, ox, 5, 16, 11, ox + 7, [C.earthLo, C.earthHi], 12);
      px(ox, 0, C.grass, 16, 4);
      px(ox, 0, C.grassHi, 16, 1);
      const rr = rng(ox + 3);
      for (let x = 0; x < 16; x++) px(ox + x, 3, rr() < 0.3 ? C.grassGreen : C.grassLo, 1, 1 + Math.floor(rr() * 3));
      if (l) px(ox, 0, C.outline, 1, 16);
      if (r) px(ox + 15, 0, C.outline, 1, 16);
    };
    top(T.TOP * TILE, false, false);
    top(T.TOP_L * TILE, true, false);
    top(T.TOP_R * TILE, false, true);
    px(T.FILL * TILE, 0, C.earth, 16, 16);
    speckle(px, T.FILL * TILE, 0, 16, 16, 31, [C.earthLo, C.earthHi, C.earthLo], 16);
    px(T.DEEP * TILE, 0, C.earthDeep, 16, 16);
    speckle(px, T.DEEP * TILE, 0, 16, 16, 37, ['#5a2716', C.earthLo], 10);
    // bloquete cinza (na frente do condomínio)
    let ox = T.PAV * TILE;
    px(ox, 0, C.pavJoint, 16, 8);
    for (let row = 0; row < 2; row++) {
      const y = row * 4, off = row % 2 ? 4 : 0;
      for (let k = -1; k < 3; k++) {
        const x = k * 8 + off;
        const t = [C.pav, C.pavHi, C.pavLo][(k + row + 3) % 3];
        px(ox + Math.max(0, x + 1), y + 1, t, Math.min(6, 16 - Math.max(0, x + 1)), 2);
        if (x + 2 >= 0 && x + 2 < 16) px(ox + x + 2, y, t, 2, 1);
        if (x + 4 >= 0 && x + 4 < 16) px(ox + x + 4, y + 3, t, 2, 1);
      }
    }
    px(ox, 8, C.pavLo, 16, 1);
    px(ox, 9, C.earth, 16, 7);
    speckle(px, ox, 9, 16, 7, 41, [C.earthLo, C.earthHi], 8);
    // muro rebocado: 8 variações (1 = topo livre, 2 = esquerda livre, 4 = direita livre)
    for (let m = 0; m < 8; m++) {
      ox = (T.MURO + m) * TILE;
      px(ox, 0, C.wall, 16, 16);
      speckle(px, ox, 0, 16, 16, 60 + m, [C.wallLo, C.wallHi], 14);
      px(ox, 12, C.wallLo, 16, 4); // barra suja de terra embaixo
      speckle(px, ox, 12, 16, 4, 70 + m, ['#c9a88a', '#b89878'], 6);
      if (m & 1) { px(ox, 0, C.outline, 16, 1); px(ox, 1, C.whiteLo, 16, 2); }
      if (m & 2) px(ox, 0, C.outline, 1, 16);
      if (m & 4) px(ox + 15, 0, C.outline, 1, 16);
    }
    // palete com tijolos
    ox = T.PALETE * TILE;
    px(ox, 0, C.outline, 16, 16);
    for (let y = 1; y < 12; y += 3) for (let x = 1 + ((y / 3) % 2) * 2; x < 15; x += 5) {
      px(ox + x, y, C.brick, 4, 2);
      px(ox + x, y, '#cf7a54', 4, 1);
    }
    px(ox + 1, 12, C.wood, 14, 1);
    px(ox + 1, 13, C.woodLo, 14, 2);
    for (const x of [2, 7, 12]) px(ox + x, 13, C.outline, 2, 2);
    // caminhão: carroceria de madeira pintada de vermelho
    ox = T.CAMINHAO * TILE;
    px(ox, 0, C.outline, 16, 16);
    px(ox, 1, C.redHi, 16, 1);
    px(ox, 2, C.red, 16, 9);
    for (let y = 4; y < 11; y += 3) px(ox, y, C.redLo, 16, 1);
    px(ox, 11, C.outline, 16, 1);
    px(ox, 12, '#3a3c44', 16, 3); // chassi
    px(ox, 15, C.outline, 16, 1);
    // cabine do caminhão (branca com janela)
    ox = T.CABINE * TILE;
    px(ox, 0, C.outline, 16, 16);
    px(ox + 1, 1, C.white, 14, 14);
    px(ox + 3, 2, C.glass, 10, 6);
    px(ox + 4, 3, C.glassHi, 2, 4);
    px(ox + 1, 10, C.yellow, 14, 2);
    px(ox + 1, 13, '#3a3c44', 14, 2);
    // caçambas de entulho (azul e verde)
    const cacamba = (o, cor, lo, hi) => {
      px(o, 0, C.outline, 16, 16);
      px(o + 1, 1, cor, 14, 14);
      px(o + 1, 2, hi, 14, 1);
      for (let x = 3; x < 15; x += 4) px(o + x, 4, lo, 1, 10);
      px(o + 1, 13, lo, 14, 2);
      px(o + 1, 1, '#8a7a66', 14, 1); // entulho aparecendo em cima
    };
    cacamba(T.CACAMBA_A * TILE, C.blue, C.blueLo, C.blueHi);
    cacamba(T.CACAMBA_B * TILE, C.green, C.greenLo, C.greenHi);
  });
}

// ---------------------------------------------------------------- objetos
function makeObjects(scene) {
  // portão de grade do pátio (repete na vertical)
  makeCanvas(scene, 'df_portao', 16, 16, (ctx, px) => {
    px(0, 0, C.outline, 16, 16);
    px(1, 0, '#3a3d44', 14, 16);
    for (let x = 2; x < 15; x += 3) px(x, 0, C.metalHi, 1, 16);
    px(1, 7, C.metal, 14, 2);
  });
  // botão do portão num postinho (apagado / aceso)
  const botao = (key, on) => fromRows(scene, key, [
    '................',
    '.....oooooo.....',
    '....oYYYYYYo....',
    '....oYggggYo....',
    '....oYgLLgYo....',
    '....oYgLLgYo....',
    '....oYggggYo....',
    '....oYYYYYYo....',
    '.....oooooo.....',
    '.......pp.......',
    '.......pp.......',
    '.......pp.......',
    '.......pp.......',
    '.......pp.......',
    '.......pp.......',
    '.....oooooo.....',
  ], { o: C.outline, Y: C.yellow, g: '#3a3e46', p: '#5a606a', L: on ? '#5ee08a' : '#e04a5a' });
  botao('df_botao_off', false);
  botao('df_botao_on', true);
  // cone com pisca (checkpoint): apagado / aceso
  const cone = (key, on) => fromRows(scene, key, [
    on ? '....YY....' : '..........',
    on ? '...YWWY...' : '..........',
    '....oo....',
    '....OO....',
    '...oOOo...',
    '...oWWo...',
    '..oOOOOo..',
    '..oWWWWo..',
    '.oOOOOOOo.',
    '.oOOOOOOo.',
    'oooooooooo',
    'oOOOOOOOOo',
    'oooooooooo',
  ], { o: C.outline, O: C.orange, W: '#f4f2ee', Y: '#ffd36e' });
  cone('df_cone_off', false);
  cone('df_cone_on', true);
  // saída: a marcação fica por conta do brilho (não tem desenho)
  makeCanvas(scene, 'df_saida', 2, 2, () => {});
}

// ---------------------------------------------------------------- enfeites
function makeDecor(scene) {
  // ponto de ônibus de concreto curvo, pintado de branco e meio rabiscado
  makeCanvas(scene, 'df_parada', 56, 40, (ctx, px) => {
    px(2, 0, C.outline, 52, 6);
    px(3, 1, C.white, 50, 4);
    px(46, 0, C.outline, 10, 40);
    px(47, 1, C.white, 8, 39);
    px(47, 1, C.whiteLo, 2, 39);
    px(4, 6, C.outline, 44, 1);
    px(8, 24, C.outline, 34, 3);
    px(9, 24, C.whiteLo, 32, 2);
    px(12, 27, C.outline, 2, 13);
    px(36, 27, C.outline, 2, 13);
    const rr = rng(3);
    for (let i = 0; i < 26; i++) px(47 + Math.floor(rr() * 7), 8 + Math.floor(rr() * 24), ['#4a4e8a', '#2a2630', '#c2335f'][i % 3]);
    px(0, 38, '#c9c2b6', 56, 2);
  });
  // árvore do cerrado: tronco torto e copa rala
  const arvore = (key, seed) => makeCanvas(scene, key, 64, 72, (ctx, px) => {
    const r = rng(seed);
    let tx = 32;
    for (let y = 71; y > 30; y--) {
      if (r() < 0.3) tx += r() < 0.5 ? -1 : 1;
      px(tx - 1, y, '#5a4636', 3, 1);
      px(tx, y, '#7a604a', 1, 1);
    }
    const pontas = [];
    [[-1, 16], [1, 18], [-1, 10], [1, 12]].forEach(([d, len], i) => {
      let x = tx, y = 40 - i * 3;
      for (let k = 0; k < len; k++) { x += d; if (k % 2) y--; px(x, y, '#5a4636', 2, 1); }
      pontas.push([x, y]);
    });
    pontas.push([tx, 22]);
    for (const [bx, by] of pontas) {
      const rad = 7 + Math.floor(r() * 4);
      for (let y = -rad; y <= rad; y++) for (let x = -rad - 3; x <= rad + 3; x++) {
        const d = Math.hypot(x / 1.3, y) / rad;
        if (d > 1 || r() < 0.25) continue;
        px(bx + x, by + y, d > 0.75 ? '#4f6a30' : r() < 0.2 ? '#8aa858' : '#6a8a40');
      }
    }
  });
  arvore('df_arvore_a', 5);
  arvore('df_arvore_b', 17);
  // empilhadeira amarela
  makeCanvas(scene, 'df_empilhadeira', 34, 30, (ctx, px) => {
    px(4, 2, C.outline, 2, 14);
    px(16, 2, C.outline, 2, 14);
    px(4, 2, C.outline, 14, 2);
    px(2, 14, C.outline, 22, 10);
    px(3, 15, C.yellow, 20, 8);
    px(3, 15, '#ffe36a', 20, 1);
    px(24, 4, C.outline, 2, 22);
    px(26, 22, C.outline, 8, 2);
    for (const wx of [7, 19]) { px(wx - 4, 21, C.outline, 9, 9); px(wx - 3, 22, '#2a2b30', 7, 7); px(wx - 1, 25, C.metalHi, 2, 2); }
  });
  // carro branco estacionado
  makeCanvas(scene, 'df_carro', 46, 22, (ctx, px) => {
    px(10, 2, C.outline, 22, 9);
    px(11, 3, '#bfe6f2', 20, 7);
    px(20, 3, C.whiteLo, 2, 8);
    px(2, 9, C.outline, 42, 9);
    px(3, 10, '#f4f4f2', 40, 7);
    px(3, 14, '#d6d6d2', 40, 3);
    px(40, 11, '#fff4c8', 3, 2);
    px(3, 11, '#ff7a6a', 2, 2);
    for (const wx of [11, 34]) { px(wx - 5, 13, C.outline, 11, 9); px(wx - 4, 14, '#2a2b30', 9, 7); px(wx - 1, 17, C.metalHi, 3, 2); }
  });
  // banco de concreto branco
  fromRows(scene, 'df_banco', [
    'oooooooooooooooooooo',
    'oWWWWWWWWWWWWWWWWWWo',
    'oLLLLLLLLLLLLLLLLLLo',
    'oooooooooooooooooooo',
    '..oWWo........oWWo..',
    '..oWWo........oWWo..',
    '..oLLo........oLLo..',
    '..oooo........oooo..',
  ], { o: C.outline, W: C.white, L: C.whiteLo });
  // ônibus (o mesmo modelo da fase do ônibus: branco com frente e faixa amarelas)
  const onibus = (key, open) => makeCanvas(scene, key, 132, 50, (ctx, px) => {
    px(2, 2, C.outline, 128, 42);
    px(3, 3, '#f4f3ee', 126, 40);
    px(3, 3, '#ffffff', 126, 1);
    px(112, 3, C.yellow, 17, 40);
    px(3, 30, C.yellow, 109, 4);
    px(3, 34, C.yellowLo, 109, 1);
    for (let x = 10; x < 70; x += 18) { px(x, 9, '#2e3a48', 14, 14); px(x + 1, 10, '#4f6478', 3, 12); }
    px(96, 9, '#2e3a48', 14, 14);
    px(114, 8, '#2e3a48', 13, 16);
    px(114, 4, '#1a1a1a', 13, 3);
    px(115, 5, '#ff9a2a', 11, 1);
    px(76, 9, C.outline, 16, 33); // porta do meio
    if (open) { px(77, 10, '#ffe8a8', 14, 32); px(77, 10, '#fff6d6', 14, 4); }
    else { px(77, 10, '#2e3a48', 14, 31); px(84, 10, C.outline, 1, 31); px(78, 24, C.yellow, 12, 1); }
    px(3, 38, '#55595f', 126, 5);
    for (const wx of [22, 104]) { px(wx - 8, 36, C.outline, 17, 14); px(wx - 6, 38, '#2a2b30', 13, 11); px(wx - 2, 42, C.metalHi, 4, 3); }
  });
  onibus('df_onibus', false);
  onibus('df_onibus_aberto', true);
  // carros que passam na DF-475
  const car = (key, body, lo) => makeCanvas(scene, key, 34, 15, (ctx, px) => {
    px(8, 0, C.outline, 16, 6);
    px(9, 1, '#bfe6f2', 14, 4);
    px(0, 5, C.outline, 34, 7);
    px(1, 6, body, 32, 5);
    px(1, 6, 'rgba(255,255,255,0.35)', 32, 1);
    px(1, 9, lo, 32, 2);
    px(31, 7, '#fff4c8', 2, 2);
    for (const wx of [7, 26]) { px(wx - 3, 10, C.outline, 7, 5); px(wx - 1, 12, C.metalHi, 3, 1); }
  });
  car('df_carro_1', '#e9e9e6', '#bdbdb8');
  car('df_carro_2', '#c7352f', '#9a2622');
  car('df_carro_3', '#8a929c', '#6a727c');
  car('df_carro_4', '#2f4f7a', '#22385a');
}

// fachadas grandes atrás da calçada
function makeFachadas(scene) {
  // loja de material de construção: prédio de tijolo, letreiro e porta de enrolar
  makeCanvas(scene, 'df_loja', 208, 112, (ctx, px) => {
    px(0, 0, C.outline, 208, 112);
    px(1, 1, C.brick, 206, 50);
    for (let y = 3; y < 50; y += 4) for (let x = 1 + ((y / 4) % 2) * 4; x < 206; x += 9) px(x, y, C.brickLo, 7, 1);
    for (const wx of [20, 90, 160]) { px(wx, 12, C.outline, 24, 18); px(wx + 1, 13, '#2a2630', 22, 16); }
    px(1, 51, '#d8a640', 206, 60);
    speckle(px, 1, 51, 206, 60, 12, ['#c89430', '#e4b858'], 120);
    px(14, 58, C.outline, 120, 22);
    px(15, 59, '#3a4a40', 118, 20);
    px(144, 62, C.outline, 52, 49);
    px(145, 63, '#4a4e56', 50, 48);
    for (let y = 64; y < 110; y += 3) px(145, y, '#5d6168', 50, 1);
    for (let x = 18; x < 130; x += 8) px(x, 82, '#3aa858', 6, 5);
  });
  // galpão cinza com portões
  makeCanvas(scene, 'df_galpao', 224, 90, (ctx, px) => {
    px(0, 0, C.outline, 224, 90);
    px(1, 1, '#b9b7b2', 222, 89);
    speckle(px, 1, 1, 222, 88, 21, ['#a8a6a0', '#c8c6c0'], 160);
    px(1, 1, '#9a9893', 222, 4);
    for (const gx of [120, 168]) { px(gx, 34, C.outline, 40, 56); for (let y = 35; y < 90; y += 3) { px(gx + 1, y, '#8a8c92', 38, 2); px(gx + 1, y + 2, '#6e7076', 38, 1); } }
    px(20, 40, C.outline, 70, 30);
    px(21, 41, '#7a7c82', 68, 28);
  });
  // muro branco com propaganda pintada
  makeCanvas(scene, 'df_muro_pintado', 256, 44, (ctx, px) => {
    px(0, 0, C.outline, 256, 44);
    px(1, 1, C.white, 254, 43);
    speckle(px, 1, 1, 254, 43, 33, [C.whiteLo, '#e4e2dc'], 120);
    px(1, 38, '#c9b8a6', 254, 6);
    px(8, 8, C.red, 70, 3);
  });
  // portaria vista de fora: letreiro do residencial, guarita, pilar com furo e grade
  makeCanvas(scene, 'df_portaria', 150, 100, (ctx, px) => {
    const g = 100;
    px(54, 6, C.outline, 70, 24);
    px(55, 7, '#5a4a40', 68, 22);
    px(55, 7, '#6e5c50', 68, 1);
    px(60, 30, C.outline, 34, g - 30);
    px(61, 31, '#e8dcc4', 32, g - 31);
    px(66, 36, C.outline, 20, 12);
    px(67, 37, '#2e3a48', 18, 10);
    px(110, 30, C.outline, 18, g - 30);
    px(111, 31, '#4a3e38', 16, g - 31);
    for (let y = -9; y <= 9; y++) for (let x = -5; x <= 5; x++) if ((x * x) / 25 + (y * y) / 81 <= 1) px(119 + x, 62 + y, '#cfe0ee');
    px(20, 44, '#1e1f24', 40, 2);
    px(20, g - 4, '#1e1f24', 40, 2);
    for (let x = 20; x < 60; x += 4) px(x, 44, '#1e1f24', 1, g - 48);
    px(12, 40, C.outline, 9, g - 40);
    px(13, 41, '#c8bfb2', 7, g - 41);
    px(128, 54, C.outline, 22, g - 54);
    px(129, 55, '#2a2b30', 21, g - 55);
  });
}

function makeBackground(scene) {
  const bands = ['#2f6ccf', '#3b78d6', '#4a85dc', '#5c93e2', '#70a2e7', '#86b2eb', '#9fc2ef', '#b8d2f2'];
  makeCanvas(scene, 'df_ceu', 8, 270, (ctx, px) => {
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
  // nuvens grandes e fofas, com a base acinzentada
  const nuvem = (key, w, h, seed) => makeCanvas(scene, key, w, h, (ctx, px) => {
    const r = rng(seed);
    const blobs = [];
    for (let i = 0; i < 9; i++) blobs.push([10 + r() * (w - 20), h * 0.35 + r() * h * 0.35, 8 + r() * h * 0.38]);
    const dentro = (x, y) => y >= 0 && y < h - 4 && x >= 0 && x < w && blobs.some(([bx, by, br]) => Math.hypot(x - bx, (y - by) * 1.2) < br);
    for (let y = 0; y < h - 4; y++) for (let x = 0; x < w; x++) {
      if (!dentro(x, y)) continue;
      // borda só no contorno de fora da nuvem
      const borda = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
      const base = y > h * 0.62;
      px(x, y, base ? (borda ? '#c3cfdc' : '#d9e2ec') : borda ? '#e8eef5' : '#ffffff');
    }
  });
  nuvem('df_nuvem_a', 120, 46, 3);
  nuvem('df_nuvem_b', 90, 38, 8);
  nuvem('df_nuvem_c', 150, 52, 14);
  // horizonte: árvores e construções baixas ao longe
  makeCanvas(scene, 'df_horizonte', 480, 40, (ctx, px) => {
    const r = rng(9);
    px(0, 32, '#9a8a62', 480, 8);
    for (let x = 0; x < 480; x += 3) {
      if (r() < 0.35) { const h = 3 + Math.floor(r() * 7); px(x, 32 - h, r() < 0.5 ? '#5f7a46' : '#6f8a52', 3 + Math.floor(r() * 4), h); }
    }
    for (let i = 0; i < 10; i++) px(Math.floor(r() * 470), 26, '#e8e6e0', 10 + Math.floor(r() * 12), 6);
  });
}

let built = false;

// --- abertura: o ônibus chega no ponto, os dois descem e ele vai embora
function intro(L) {
  const busStop = L.lvl.decor.find((d) => d.type === 'parada');
  const G = L.groundRowY;
  const stopX = busStop ? busStop.c * TILE + 70 : 140;
  const doorX = stopX + 18; // porta no meio do ônibus
  const bus = L.add.image(-160, G - 9, 'df_onibus').setOrigin(0.5, 1).setDepth(0.95);
  L.players.forEach((p) => {
    p.frozen = true;
    p.sprite.setAlpha(0);
  });
  const spot = (p) => doorX + (p.id === 'ela' ? 10 : -6);
  const timers = [];
  let done = false;
  let offKey = () => {};
  const onPtr = () => finish();
  const finish = () => {
    if (done) return;
    done = true;
    offKey();
    L.input.off('pointerdown', onPtr);
    L.time.removeEvent(timers);
    L.tweens.killTweensOf(bus);
    L.players.forEach((p) => {
      if (!p.introPlaced) {
        p.body.reset(spot(p), G - p.def.h / 2);
        p.body.setVelocity(0, 0);
      }
      p.sprite.setAlpha(1);
      p.frozen = false;
      p.checkpoint = { x: p.body.center.x, y: G };
    });
    bus.setTexture('df_onibus');
    L.tweens.add({ targets: bus, x: bus.x + 700, duration: 2200, ease: 'Cubic.easeIn', onComplete: () => bus.destroy() });
    L.time.delayedCall(400, () => {
      L.say('intro_ele');
      L.time.delayedCall(2600, () => L.say('intro_ela'));
    });
  };
  L.tweens.add({ targets: bus, x: stopX, duration: 2300, ease: 'Cubic.easeOut' });
  Sfx.whoosh();
  timers.push(L.time.delayedCall(2300, () => {
    Sfx.thud();
    bus.setTexture('df_onibus_aberto');
  }));
  const desce = (p, t) => timers.push(L.time.delayedCall(t, () => {
    p.body.reset(spot(p), G - p.def.h / 2);
    p.body.setVelocity(0, 0);
    p.introPlaced = true;
    p.sprite.setPosition(p.body.center.x, G).setAlpha(1);
    p.squash = { x: 0.8, y: 1.2 };
    L.fx.dust(p.body.center.x, G, 4);
    Sfx.jump(p.id);
  }));
  desce(L.ela, 2700);
  desce(L.ele, 3050);
  timers.push(L.time.delayedCall(3500, () => finish()));
  // qualquer tecla ou toque pula a abertura
  L.time.delayedCall(300, () => {
    if (done) return;
    offKey = Input.onAnyKey(() => finish());
    L.input.once('pointerdown', onPtr);
  });
  L.events.once('shutdown', () => offKey());
}

export const rua = {
  tileset: 'df_tiles',
  oneway: [],
  musica: 'rua',
  decorChars: {
    s: 'parada', a: 'arvore', k: 'empilhadeira', j: 'loja', n: 'galpao', w: 'muro', c: 'carro', b: 'banco', o: 'cone', g: 'portaria',
    X: 'travessia', Y: 'chegada',
  },
  objects: {
    door: 'df_portao',
    lever: ['df_botao_off', 'df_botao_on'],
    exit: 'df_saida',
    exitOpen: 'df_saida',
    checkpoint: ['df_cone_off', 'df_cone_on'],
  },

  textures(scene) {
    if (built && scene.textures.exists('df_tiles') && scene.textures.exists('df_onibus_aberto')) return;
    makeTiles(scene);
    makeObjects(scene);
    makeDecor(scene);
    makeFachadas(scene);
    makeBackground(scene);
    built = true;
  },

  tile(ch, c, r, at) {
    const ground = (x) => x === '#' || x === '%';
    if (ch === '#') {
      const l = !ground(at(c - 1, r)), rr = !ground(at(c + 1, r));
      if (!ground(at(c, r - 1))) return l ? T.TOP_L : rr ? T.TOP_R : T.TOP;
      return ground(at(c, r - 2)) ? T.DEEP : T.FILL;
    }
    if (ch === '%') return ground(at(c, r - 1)) ? T.FILL : T.PAV;
    if (ch === 'M') {
      const wall = (cc, rr) => at(cc, rr) === 'M';
      let m = 0;
      if (!wall(c, r - 1)) m |= 1;
      if (!wall(c - 1, r)) m |= 2;
      if (!wall(c + 1, r)) m |= 4;
      return T.MURO + m;
    }
    if (ch === 'T') return T.PALETE;
    if (ch === 'Q') return T.CAMINHAO;
    if (ch === 'U') return T.CABINE;
    if (ch === 'D') {
      let s = c;
      while (at(s - 1, r) === 'D') s--;
      return Math.floor(s / 4) % 2 ? T.CACAMBA_B : T.CACAMBA_A;
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
    const W = lvl.cols * TILE;
    const find = (type) => lvl.decor.filter((d) => d.type === type);
    const travessia = find('travessia');
    const chegada = find('chegada');
    const ladoA = (travessia.length ? Math.max(...travessia.map((d) => d.c)) + 3 : 0) * TILE;
    s.ladoA = ladoA;

    // lado do ponto: a DF-475 passando atrás, com as construções do outro lado
    const rr = rng(4);
    const fundo = s.add.graphics().setDepth(0.5);
    for (let x = 8; x < ladoA - 30; x += 60 + Math.floor(rr() * 40)) {
      const h = 22 + Math.floor(rr() * 18), w = 40 + Math.floor(rr() * 30);
      fundo.fillStyle(0x2a2630, 1).fillRect(x, G - 37 - h, w, h);
      fundo.fillStyle(rr() < 0.5 ? 0xd2c8b8 : 0xb8b4ae, 1).fillRect(x + 1, G - 36 - h, w - 2, h - 1);
      fundo.fillStyle(0x9a8a7a, 1).fillRect(x + 1, G - 36 - h, w - 2, 2);
      fundo.fillStyle(0x4a4e56, 1).fillRect(x + 6, G - 37 - 14, 12, 14);
    }
    const rua = s.add.graphics().setDepth(0.6);
    rua.fillStyle(0x2a2630, 1).fillRect(0, G - 37, ladoA, 1);
    rua.fillStyle(0xa8a092, 1).fillRect(0, G - 36, ladoA, 3); // meio-fio do outro lado
    rua.fillStyle(0x5f5d63, 1).fillRect(0, G - 33, ladoA, 25); // asfalto
    for (let x = 0; x < ladoA; x += 20) rua.fillStyle(0xe8c84a, 1).fillRect(x, G - 21, 10, 1); // faixa do meio
    for (let i = 0; i < ladoA / 3; i++) rua.fillStyle(rr() < 0.5 ? 0x4c4a50 : 0x77757b, 1).fillRect(Math.floor(rr() * ladoA), G - 33 + Math.floor(rr() * 25), 1, 1);
    rua.fillStyle(0xbdb5a5, 1).fillRect(0, G - 8, ladoA, 3); // meio-fio de cá
    rua.fillStyle(0x2a2630, 1).fillRect(0, G - 5, ladoA, 1);
    rua.fillStyle(0xa48a50, 1).fillRect(0, G - 4, ladoA, 4); // capim do acostamento

    // postes altos de iluminação, curvos como os da DF-475
    for (let px0 = 60; px0 < W - 40; px0 += 260) {
      const g = s.add.graphics().setDepth(0.7);
      g.fillStyle(0x2a2630, 1).fillRect(px0 - 1, G - 130, 4, 126);
      g.fillStyle(0xd9d6cf, 1).fillRect(px0, G - 130, 2, 126);
      g.fillStyle(0x2a2630, 1).fillRect(px0, G - 132, 14, 3);
      g.fillStyle(0xd9d6cf, 1).fillRect(px0 + 1, G - 131, 12, 1);
      g.fillStyle(0x5a606a, 1).fillRect(px0 + 12, G - 131, 6, 3);
    }

    // fachadas do outro lado da rua
    const txt = (x, y, str, size, color, res = 3) => s.add.text(x, y, str, { fontFamily: '"Pixelify Sans"', fontSize: `${size}px`, color }).setOrigin(0.5).setResolution(res).setDepth(0.41);
    find('loja').forEach((d) => {
      s.add.image(d.c * TILE, G - 4, 'df_loja').setOrigin(0, 1).setDepth(0.4);
      txt(d.c * TILE + 74, G - 4 - 112 + 69, 'MATERIAIS P/ CONSTRUÇÃO', 7, '#f2e6c0');
    });
    find('galpao').forEach((d) => s.add.image(d.c * TILE, G - 4, 'df_galpao').setOrigin(0, 1).setDepth(0.4));
    find('muro').forEach((d) => {
      s.add.image(d.c * TILE, G - 4, 'df_muro_pintado').setOrigin(0, 1).setDepth(0.4);
      txt(d.c * TILE + 70, G - 4 - 44 + 22, 'TUDO PARA SUA OBRA', 10, '#2c5aa0');
      txt(d.c * TILE + 190, G - 4 - 44 + 22, 'FORTE · BARATO', 8, '#c7352f');
    });
    find('portaria').forEach((d) => {
      s.add.image(d.c * TILE, G - 4, 'df_portaria').setOrigin(0, 1).setDepth(0.4);
      txt(d.c * TILE + 89, G - 4 - 100 + 11, 'RESIDENCIAL', 4, '#e8dcc4', 4);
      txt(d.c * TILE + 89, G - 4 - 100 + 20, 'FLORES DO CERRADO', 6, '#ffffff');
    });
    const cal = s.add.graphics().setDepth(0.35);
    cal.fillStyle(0xbdb5a5, 1).fillRect(ladoA, G - 6, W - ladoA, 2);
    cal.fillStyle(0xa48a50, 1).fillRect(ladoA, G - 4, W - ladoA, 4);

    // rodas do caminhão (só enfeite: dá para passar por baixo, entre elas)
    for (let c = 0; c < lvl.cols; c++) for (let r = 0; r < lvl.rows; r++) {
      if (at(c, r) !== 'Q' || at(c - 1, r) === 'Q') continue;
      let c1 = c;
      while (at(c1 + 1, r) === 'Q' || at(c1 + 1, r) === 'U') c1++;
      for (const wc of [c + 0.6, c1 + 0.4]) {
        const g = s.add.graphics().setDepth(1.4);
        const wx = wc * TILE, wy = (r + 1) * TILE + 7;
        g.fillStyle(0x2a2630, 1).fillCircle(wx, wy, 7);
        g.fillStyle(0x3a3b42, 1).fillCircle(wx, wy, 5);
        g.fillStyle(0xa3a9b3, 1).fillCircle(wx, wy, 2);
      }
    }

    // valeta: fundo de terra escura em vez do céu aparecendo
    for (let c = 0; c < lvl.cols; c++) {
      const b = at(c, lvl.rows - 1);
      if (b === '#' || b === '%' || b === 'M') continue;
      const g = s.add.graphics().setDepth(1.9);
      g.fillStyle(0x7a3420, 1).fillRect(c * TILE, G, TILE, 10);
      g.fillStyle(0x4a2018, 1).fillRect(c * TILE, G + 10, TILE, 30);
      g.fillStyle(0x1a0b08, 1).fillRect(c * TILE, G + 40, TILE, 600);
    }

    // enfeites do mapa
    for (const d of lvl.decor) {
      const x = d.c * TILE + 8;
      if (d.type === 'parada') s.add.image(d.c * TILE - 4, G - 2, 'df_parada').setOrigin(0, 1).setDepth(0.8);
      else if (d.type === 'arvore') s.add.image(x, G - 2, d.c % 2 ? 'df_arvore_a' : 'df_arvore_b').setOrigin(0.5, 1).setDepth(d.c * TILE < ladoA ? 0.55 : 0.45);
      else if (d.type === 'empilhadeira') s.add.image(x, G - 2, 'df_empilhadeira').setOrigin(0.5, 1).setDepth(0.45);
      else if (d.type === 'carro') s.add.image(x, G - 2, 'df_carro').setOrigin(0.5, 1).setDepth(0.45);
      else if (d.type === 'banco') s.add.image(x, G - 3, 'df_banco').setOrigin(0.5, 1).setDepth(0.45);
      else if (d.type === 'cone') s.add.image(x, G, 'df_cone_off').setOrigin(0.5, 1).setDepth(7);
    }

    // travessia: marcas no asfalto e aviso
    s.travessia = null;
    if (travessia.length) {
      const c0 = Math.min(...travessia.map((d) => d.c)), c1 = Math.max(...travessia.map((d) => d.c));
      s.travessia = { x0: c0 * TILE, x1: (c1 + 1) * TILE };
      const cx = ((c0 + c1 + 1) * TILE) / 2;
      s.travessiaLabel = s.add
        .text(cx, G - 50, '', { fontFamily: '"Pixelify Sans"', fontSize: '10px', color: '#fff4e6' })
        .setOrigin(0.5, 1).setResolution(2).setDepth(16).setShadow(1, 1, '#2a1d33', 0, false, true);
      s.travessiaSeta = s.add.image(cx, G - 40, 'marker').setDepth(16).setTint(0xffd36e);
    }
    s.chegada = chegada.length ? { x: chegada[0].c * TILE + 8 } : null;
    s.crossed = false;
    s.crossing = false;
    s.cars = [];
    s.carT = 1;
  },

  start(level) {
    intro(level);
  },

  update(level, dt) {
    const s = level;
    // carros passando na DF-475 (atrás de quem ainda está do lado do ponto)
    s.carT -= dt;
    if (s.carT <= 0 && !s.crossed && s.cameras.main.worldView.x < s.ladoA) {
      s.carT = 2.2 + Math.random() * 2.5;
      spawnCar(s);
    }
    for (let i = s.cars.length - 1; i >= 0; i--) {
      const c = s.cars[i];
      c.x += c.v * dt;
      c.img.x = Math.round(c.x);
      if (c.x < -60 || c.x > s.ladoA + 60) {
        c.img.destroy();
        s.cars.splice(i, 1);
      }
    }
    if (!s.travessia) return;
    if (s.crossed) {
      s.travessiaLabel.setVisible(false);
      s.travessiaSeta.setVisible(false);
      return;
    }
    if (s.crossing) return;
    const t = s.travessia;
    const inZone = (p) => !p.frozen && p.x >= t.x0 && p.x <= t.x1 && p.onGround;
    const n = s.players.filter(inZone).length;
    s.travessiaSeta.y = s.groundRowY - 40 + Math.round(Math.sin(s.time.now / 160) * 1.5);
    s.travessiaLabel.setText(n === 1 ? 'Atravessar juntos 1/2' : 'Atravessar a rua');
    if (n === 2) cross(s);
  },

  bg: {
    create(s) {
      s.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'df_ceu').setOrigin(0);
      s.add.circle(60, 36, 26, 0xfff8d8, 0.3);
      s.add.circle(60, 36, 14, 0xfffdf0, 1);
      s.clouds = [];
      const rnd = new Phaser.Math.RandomDataGenerator(['nuvens_df']);
      const keys = ['df_nuvem_a', 'df_nuvem_b', 'df_nuvem_c'];
      for (let i = 0; i < 7; i++) {
        const c = s.add.image(rnd.between(-40, VIEW_W + 40), rnd.between(10, 110), keys[i % 3]);
        c.speed = rnd.realInRange(2, 5);
        c.factor = rnd.realInRange(0.04, 0.1);
        c.baseX = c.x;
        s.clouds.push(c);
      }
      s.layers = [{ s: s.add.tileSprite(0, 0, VIEW_W, 40, 'df_horizonte').setOrigin(0, 1), fx: 0.1, wy: 172 }];
    },
    update(s, dt, view, t) {
      const sy = (wy) => ((wy - view.y) * VIEW_H) / view.height;
      for (const l of s.layers) {
        l.s.tilePositionX = Math.round(view.x * l.fx);
        l.s.y = Math.round(sy(l.wy));
      }
      for (const c of s.clouds) {
        let x = c.baseX - view.x * c.factor + t * c.speed;
        x = ((x % (VIEW_W + 160)) + VIEW_W + 160) % (VIEW_W + 160) - 80;
        c.x = Math.round(x);
      }
    },
  },
};

function spawnCar(s, dirForce) {
  const dir = dirForce || (Math.random() < 0.5 ? 1 : -1);
  const key = `df_carro_${1 + Math.floor(Math.random() * 4)}`;
  const G = s.groundRowY;
  const x = dir > 0 ? -40 : s.ladoA + 40;
  const img = s.add.image(x, G - (dir > 0 ? 10 : 22), key).setOrigin(0.5, 1).setDepth(dir > 0 ? 0.66 : 0.64).setFlipX(dir < 0);
  s.cars.push({ img, x, v: dir * (150 + Math.random() * 60) });
}

// os dois esperam os carros passarem e atravessam a rua juntos
function cross(s) {
  s.crossing = true;
  s.players.forEach((p) => {
    p.frozen = true;
    p.body.setVelocity(0, 0);
  });
  s.travessiaLabel.setText('');
  s.travessiaSeta.setVisible(false);
  s.say('atravessar');
  // olham para os dois lados enquanto passam dois carros
  const olhar = (dir) => s.players.forEach((p) => p.sprite.setFlipX(dir < 0));
  olhar(-1);
  s.time.delayedCall(200, () => spawnCar(s, 1));
  s.time.delayedCall(1300, () => olhar(1));
  s.time.delayedCall(1500, () => spawnCar(s, -1));
  s.time.delayedCall(2700, () => olhar(-1));
  s.time.delayedCall(3300, () => {
    // atravessam "para dentro" da tela: sobem um pouco e ficam menores
    s.players.forEach((p, i) => {
      p.sprite.setFlipX(false);
      s.tweens.add({ targets: p.sprite, y: p.sprite.y - 24, scaleX: 0.75, scaleY: 0.75, duration: 1000, delay: i * 120, ease: 'Sine.easeInOut' });
    });
    Sfx.step();
    s.time.delayedCall(900, () => s.cameras.main.fadeOut(350, 18, 12, 26));
    s.time.delayedCall(1300, () => {
      const x0 = s.chegada ? s.chegada.x : s.ladoA + 48;
      const G = s.groundRowY;
      s.players.forEach((p) => {
        p.body.reset(x0 + (p.id === 'ela' ? 14 : 0), G - p.def.h / 2);
        p.body.setVelocity(0, 0);
        p.sprite.setScale(1).setAlpha(1);
        p.sprite.setPosition(p.body.center.x, G);
        p.checkpoint = { x: p.body.center.x, y: G };
        p.facing = 1;
        p.frozen = false;
      });
      s.cars.forEach((c) => c.img.destroy());
      s.cars = [];
      s.crossed = true;
      s.crossing = false;
      const cam = s.coopCam;
      const t = cam.target(s.active);
      cam.x = t.x;
      cam.y = t.y;
      cam.apply();
      s.cameras.main.fadeIn(400, 18, 12, 26);
    });
  });
}
