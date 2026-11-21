// Tema da fase 1: dentro de um ônibus em movimento no fim de tarde.
// Paisagem passando pela janela, bancos, bagageiros, barras, passageiros ao fundo,
// motorista, rodas girando, rua correndo e lombadas de vez em quando.

import { TILE, VIEW_W, VIEW_H } from '../config.js';
import { makeCanvas, fromRows, rng } from '../systems/textures.js';
import { Sfx } from '../systems/sfx.js';

const T = {
  ROOF: 0, WALL: 1, FLOOR: 2, SKIRT: 3, SEAT: 4, SEAT_BASE: 5, RACK: 6, GLASS: 7, ROAD_TOP: 8, ROAD: 9,
};

const C = {
  outline: '#241a2b',
  cream: '#f1e4c6', creamHi: '#fbf3df', creamLo: '#d9c8a4',
  teal: '#2f8079', tealHi: '#46a196', tealLo: '#1f5c58',
  orange: '#f08a4b', orangeLo: '#c9653a',
  ceiling: '#d6cdb8', ceilingLo: '#b4aa94', lamp: '#fff4c8',
  floor: '#4a4552', floorHi: '#625c6c', floorLo: '#36323d', yellow: '#efc34a',
  seat: '#3f78b5', seatHi: '#5b97d0', seatLo: '#2c5687', seatDot: '#86b6e3',
  metal: '#9a95a6', metalHi: '#c9c4d3', metalLo: '#6a6577',
  glass: '#9fd0dd', glassHi: '#d6f0f5', glassLo: '#6fa6b8',
  road: '#4b4651', roadLo: '#3d3943', roadHi: '#5d5764', curb: '#a39c8f', curbLo: '#7d776c',
  pole: '#efc34a', poleLo: '#c89a2c',
  // estilo dos ônibus do DF: barras amarelas, piso azul, teto cinza claro, carroceria branca e amarela
  yel: '#f5c518', yelHi: '#ffe36a', yelLo: '#c99a12',
  body: '#f4f3ee', bodyHi: '#ffffff', bodyLo: '#d6d5cf',
  wallIn: '#e4e6e1', wallInLo: '#c9ccc6', wallInHi: '#f2f3ef',
  ceil: '#d8dbd8', ceilLo: '#b5b9b6', ceilHole: '#9da29f', duct: '#4a4f57',
  floorB: '#3f5f96', floorBHi: '#6283bd', floorBLo: '#2c4672',
  seatB: '#2c4a94', seatBHi: '#4a6cc0', seatBLo: '#1e3570', seatMoon: '#e8c23a',
  frame: '#2e3138', strap: '#1f2126',
};

function makeTiles(scene) {
  makeCanvas(scene, 'tiles_onibus', TILE * 10, TILE, (ctx, px) => {
    let ox;
    // teto: branco por fora com faixa amarela, forro cinza com furinhos de ventilação por dentro
    ox = T.ROOF * TILE;
    px(ox, 0, C.outline, 16, 1);
    px(ox, 1, C.bodyHi, 16, 1);
    px(ox, 2, C.body, 16, 3);
    px(ox, 5, C.yel, 16, 2);
    px(ox, 7, C.yelLo, 16, 1);
    px(ox, 8, C.outline, 16, 1);
    px(ox, 9, C.ceilLo, 16, 1);
    px(ox, 10, C.ceil, 16, 6);
    for (let x = 1; x < 16; x += 3) px(ox + x, 11, C.ceilHole);
    for (let x = 2; x < 16; x += 3) px(ox + x, 13, C.ceilHole);
    px(ox, 15, C.ceilLo, 16, 1);
    // parede da frente/traseira (painel cinza claro)
    ox = T.WALL * TILE;
    px(ox, 0, C.outline, 16, 16);
    px(ox + 2, 0, C.wallIn, 12, 16);
    px(ox + 2, 0, C.wallInHi, 2, 16);
    px(ox + 11, 0, C.wallInLo, 3, 16);
    // piso azul salpicado com faixa amarela; por baixo, a carroceria branca
    ox = T.FLOOR * TILE;
    px(ox, 0, C.yel, 16, 1);
    px(ox, 1, C.floorB, 16, 3);
    const rf = rng(12);
    for (let i = 0; i < 9; i++) px(ox + Math.floor(rf() * 16), 1 + Math.floor(rf() * 3), i % 2 ? C.floorBHi : C.floorBLo);
    px(ox, 4, C.floorBLo, 16, 1);
    px(ox, 5, C.outline, 16, 1);
    px(ox, 6, C.body, 16, 7);
    px(ox, 6, C.bodyHi, 16, 1);
    px(ox, 12, C.bodyLo, 16, 1);
    px(ox, 13, C.body, 16, 3);
    // saia da carroceria: branca com a faixa amarela e o para-choque cinza
    ox = T.SKIRT * TILE;
    px(ox, 0, C.body, 16, 3);
    px(ox, 3, C.yel, 16, 4);
    px(ox, 3, C.yelHi, 16, 1);
    px(ox, 7, C.yelLo, 16, 1);
    px(ox, 8, '#55595f', 16, 3);
    px(ox, 8, '#6d7178', 16, 1);
    px(ox, 11, C.outline, 16, 2);
    ctx.clearRect(ox, 13, 16, 3);
    // assento de banco visto de lado (a frente do ônibus fica à direita):
    // almofada estofada azul com borda da frente arredondada e um pé de metal no meio
    ox = T.SEAT * TILE;
    px(ox + 1, 0, C.outline, 14, 1);
    px(ox, 1, C.outline, 1, 5);
    px(ox + 1, 1, C.seatB, 14, 4);
    px(ox + 1, 1, C.seatBHi, 13, 1);
    px(ox + 15, 1, C.outline, 1, 4);
    px(ox + 14, 2, C.seatBLo, 1, 3);
    [[3, 3], [7, 2], [11, 3]].forEach(([x, y]) => px(ox + x, y, C.seatMoon));
    px(ox + 1, 5, C.seatBLo, 14, 1);
    px(ox + 1, 6, C.outline, 14, 1);
    px(ox + 2, 7, '#5d6168', 12, 2); // concha de plástico embaixo do assento
    px(ox + 2, 7, '#7a7e86', 12, 1);
    px(ox + 7, 9, C.outline, 3, 6); // pé
    px(ox + 8, 9, C.metal, 1, 6);
    px(ox + 5, 15, C.outline, 7, 1);
    // base elevada (o "degrau" dos bancos em cima da roda): borda amarela, piso azul e painel cinza
    ox = T.SEAT_BASE * TILE;
    px(ox, 0, C.outline, 16, 16);
    px(ox, 0, C.yel, 16, 2);
    px(ox, 2, C.floorB, 16, 2);
    px(ox + 1, 4, '#5d6168', 14, 11);
    px(ox + 1, 4, '#7a7e86', 14, 1);
    for (let x = 3; x < 14; x += 4) px(ox + x, 6, '#4a4e55', 1, 8);
    // corrimão amarelo do teto (dá para subir por baixo), com alça preta pendurada
    ox = T.RACK * TILE;
    px(ox, 0, C.outline, 16, 5);
    px(ox, 1, C.yelHi, 16, 1);
    px(ox, 2, C.yel, 16, 2);
    px(ox, 4, C.yelLo, 16, 0);
    px(ox + 6, 5, C.strap, 1, 5);
    px(ox + 9, 5, C.strap, 1, 5);
    px(ox + 5, 9, C.strap, 6, 2);
    px(ox + 6, 9, '#3a3d44', 4, 1);
    // divisória: moldura amarela com vidro
    ox = T.GLASS * TILE;
    px(ox + 2, 0, C.outline, 12, 16);
    px(ox + 3, 0, C.yel, 10, 16);
    px(ox + 3, 0, C.yelHi, 1, 16);
    px(ox + 5, 0, C.glass, 6, 16);
    px(ox + 6, 0, C.glassHi, 1, 16);
    px(ox + 9, 0, C.glassLo, 2, 16);
    // rua: meio-fio em cima, asfalto embaixo
    ox = T.ROAD_TOP * TILE;
    px(ox, 0, C.road, 16, 16);
    px(ox, 0, C.roadHi, 16, 1);
    const r = rng(77);
    for (let i = 0; i < 10; i++) px(ox + Math.floor(r() * 16), 2 + Math.floor(r() * 14), C.roadLo);
    ox = T.ROAD * TILE;
    px(ox, 0, C.road, 16, 16);
    for (let i = 0; i < 12; i++) px(ox + Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? C.roadLo : C.roadHi);
  });
}

function makeObjects(scene) {
  // Mochila pesada
  fromRows(scene, 'mochila', [
    '.....oooooo.....',
    '....oHHHHHHo....',
    '...oHo....oHo...',
    '..oooooooooooo..',
    '.oPPPPPPPPPPPPo.',
    '.oPpppppppppPPo.',
    '.oPpPPPPPPPPpPo.',
    '.oPpPYYYYYYPpPo.',
    '.oPpPYyyyyYPpPo.',
    '.oPpPPPPPPPPpPo.',
    '.oPpPPPPPPPPpPo.',
    '.oPpppppppppPPo.',
    '.oPPPPPPPPPPPPo.',
    '.oddddddddddddo.',
    '..oddddddddddo..',
    '...oooooooooo...',
  ], { o: C.outline, H: '#5a4a6a', P: '#c4486a', p: '#a3355a', Y: '#ffd36e', y: '#e8a93a', d: '#7d2a48' });

  // Porta de vidro com barra amarela (repete na vertical)
  fromRows(scene, 'porta_vidro', [
    'oMMMMMMMMMMMMMMo',
    'oMgggggggggggGMo',
    'oMgWgggggggggGMo',
    'oMgggggggggggGMo',
    'oMgggggggggggGMo',
    'oMYYYYYYYYYYYYMo',
    'oMyyyyyyyyyyyyMo',
    'oMgggggggggggGMo',
    'oMggWggggggggGMo',
    'oMgggggggggggGMo',
    'oMgggggggggggGMo',
    'oMgggggggggggGMo',
    'oMgggggggggggGMo',
    'oMgggggggggggGMo',
    'oMgggggggggggGMo',
    'oMMMMMMMMMMMMMMo',
  ], { o: C.outline, M: C.frame, g: C.glass, G: C.glassLo, W: C.glassHi, Y: C.yel, y: C.yelLo });

  // Botão de parada (no poste)
  const stop = (key, on) => fromRows(scene, key, [
    '......yy........',
    '......yy........',
    '....oooooo......',
    '...orrrrrro.....',
    '...orRWWRro.....',
    '...orWWWWro.....',
    '...orRWWRro.....',
    '...orrrrrro.....',
    '....oooooo......',
    '......yy........',
    '......yy........',
    '......yy........',
    '......yy........',
    '......yy........',
    '.....oyyo.......',
    '....oooooo......',
  ], on
    ? { o: C.outline, y: C.pole, r: '#5ee08a', R: '#a9f5c3', W: '#ffffff' }
    : { o: C.outline, y: C.pole, r: '#e04a5a', R: '#ff8a94', W: '#ffe3e6' });
  stop('parada_off', false);
  stop('parada_on', true);

  // Porta do meio (saída): duas folhas de vidro
  const door = (key, open) => makeCanvas(scene, key, 32, 48, (ctx, px) => {
    px(0, 0, C.outline, 32, 48);
    px(1, 1, C.frame, 30, 47);
    if (!open) {
      for (const x of [2, 16]) {
        px(x, 2, C.frame, 14, 45);
        px(x + 2, 4, C.glass, 10, 40);
        px(x + 3, 4, C.glassHi, 1, 40);
        px(x + 9, 4, C.glassLo, 2, 40);
        px(x + 2, 22, C.yel, 10, 2); // corrimão amarelo atravessado
        px(x + 2, 22, C.yelHi, 10, 1);
      }
      px(15, 2, C.outline, 2, 45);
    } else {
      px(2, 2, '#ffe8a8', 28, 45);
      px(5, 6, '#fff6d6', 22, 41);
      px(1, 2, C.frame, 3, 45);
      px(28, 2, C.frame, 3, 45);
    }
    // corrimãos verticais dos lados e degrau com faixa amarela
    px(0, 4, C.yel, 1, 40);
    px(31, 4, C.yel, 1, 40);
    px(0, 46, C.yel, 32, 2);
  });
  door('porta_meio', false);
  door('porta_meio_aberta', true);

  // Rodas (2 quadros para parecer que giram)
  const wheel = (key, a) => makeCanvas(scene, key, 22, 22, (ctx, px) => {
    const cx = 11, cy = 11;
    for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
      const d = Math.hypot(x - cx + 0.5, y - cy + 0.5);
      if (d < 11) px(x, y, d > 9.5 ? C.outline : d > 6 ? '#2b2730' : d > 5 ? C.metalLo : C.metal);
    }
    const spokes = a ? [[0, -1], [0, 1], [-1, 0], [1, 0]] : [[-1, -1], [1, 1], [-1, 1], [1, -1]];
    for (const [dx, dy] of spokes) for (let k = 1; k <= 4; k++) px(cx + dx * k, cy + dy * k, C.metalHi);
    px(cx - 1, cy - 1, C.outline, 2, 2);
  });
  wheel('roda_a', 0);
  wheel('roda_b', 1);

  // Passageiro sentado ao fundo (cabeça e ombros acima do encosto)
  const skins = ['#f1c9a8', '#c98e66', '#8a5a40', '#e6b48f', '#6e4532'];
  const hairs = ['#2a1a14', '#5a3a22', '#1a1416', '#b07a45', '#3a2a2a', '#8a8a8a'];
  const shirts = ['#d8574f', '#5aa36b', '#e8b44a', '#6b6bd0', '#c45a9a', '#4a8ab0'];
  for (let i = 0; i < 6; i++) {
    const r = rng(500 + i);
    const skin = skins[Math.floor(r() * skins.length)];
    const hair = hairs[i % hairs.length];
    const shirt = shirts[(i * 2 + 1) % shirts.length];
    const longHair = i % 3 === 1;
    const rows = [
      '...hhhh...',
      '..hhhhhh..',
      '..hssssh..',
      longHair ? '.hhsesesh.' : '..sseses..',
      longHair ? '.hhssssh..' : '..ssssss..',
      longHair ? '.hh.ss.h..' : '....ss....',
      '..cccccc..',
      '.cccccccc.',
      '.cccccccc.',
      '.cccccccc.',
    ];
    fromRows(scene, `passageiro_${i}`, rows, { h: hair, s: skin, e: '#2a1a14', c: shirt });
  }
  // Motorista de boné, de costas para nós, segurando o volante
  fromRows(scene, 'motorista', [
    '..bbbbb.......',
    '.bbbbbbbbb....',
    '..sssss.......',
    '..ssses.......',
    '..sssss.......',
    '..cccccc......',
    '.cccccccss.oo.',
    '.ccccccc..o..o',
    '.cccccc...o..o',
    '.jjjjjjjj..oo.',
    '.jjjjjjjjj....',
    '.ssss...jj....',
  ], { b: '#2f5c8a', s: '#b57a52', e: '#2a1a14', c: '#e8e2d2', j: '#3a3f55', o: '#2a2730' });

  // Placa "PARADA SOLICITADA" (o texto é desenhado por cima)
  makeCanvas(scene, 'placa_parada', 64, 12, (ctx, px) => {
    px(0, 0, C.outline, 64, 12);
    px(1, 1, '#1a1216', 62, 10);
  });

  // Ícone de ônibus da tela de transição
  makeCanvas(scene, 'onibus_icone', 48, 24, (ctx, px) => {
    px(1, 2, C.outline, 46, 18);
    px(2, 3, C.body, 44, 16);
    px(2, 3, C.bodyHi, 44, 1);
    px(38, 3, C.yel, 8, 16); // frente amarela
    for (let x = 5; x < 36; x += 8) px(x, 6, '#2e3a48', 6, 6);
    px(40, 6, '#2e3a48', 5, 7);
    px(40, 4, '#1a1a1a', 5, 2);
    px(41, 4, '#ff9a2a', 3, 1); // letreiro de LED
    px(2, 14, C.yel, 36, 2); // faixa amarela
    px(2, 17, '#55595f', 44, 2);
    for (const x of [10, 36]) {
      px(x - 4, 17, C.outline, 9, 7);
      px(x - 3, 18, '#2b2730', 7, 5);
      px(x - 1, 20, C.metal, 3, 1);
    }
  });

  // validador de cartão (no postinho)
  fromRows(scene, 'validador', [
    '.oooooooo.',
    'oKKKKKKKKo',
    'oKssssssKo',
    'oKsSSSSsKo',
    'oKssssssKo',
    'oKKKKKKKKo',
    'oKKgggKKKo',
    'oKKgGgKKKo',
    'oKKgggKKKo',
    '.oooooooo.',
  ], { o: C.outline, K: '#2a2c31', s: '#3d6a7a', S: '#7fd0e0', g: '#4a4e56', G: '#9aa0aa' });

  // lixeira pendurada "orgânico / seco"
  fromRows(scene, 'lixeira_onibus', [
    'oooooooooo',
    'oKKKKKKKKo',
    'oKwKKKKwKo',
    'oKKKKKKKKo',
    'oKKKKKKKKo',
    'oKKKwwKKKo',
    'oKKKwwKKKo',
    '.oKKKKKKo.',
    '..oooooo..',
  ], { o: C.outline, K: '#3a3e45', w: '#c9ccd2' });
}

function makeBackground(scene) {
  // céu de fim de tarde
  const bands = ['#7a4e86', '#a05a86', '#c96a7e', '#e78272', '#f49e6c', '#f8bb76', '#fbd38a'];
  makeCanvas(scene, 'ceu_onibus', 8, 270, (ctx, px) => {
    const bh = 270 / bands.length;
    for (let y = 0; y < 270; y++) {
      const fb = y / bh, i = Math.floor(fb), frac = fb - i;
      for (let x = 0; x < 8; x++) {
        let c = bands[Math.min(i, bands.length - 1)];
        if (frac > 0.72 && i < bands.length - 1 && (x + y) % 2 === 0) c = bands[i + 1];
        if (frac > 0.9 && i < bands.length - 1) c = bands[i + 1];
        px(x, y, c);
      }
    }
  });
  // prédios baixos ao longe
  makeCanvas(scene, 'predios', 480, 90, (ctx, px) => {
    const r = rng(9);
    let x = 0;
    while (x < 480) {
      const w = 18 + Math.floor(r() * 30);
      const h = 25 + Math.floor(r() * 55);
      const col = r() < 0.5 ? '#c58290' : '#b47488';
      px(x, 90 - h, col, w, h);
      px(x, 90 - h, '#d898a0', w, 1);
      for (let wy = 90 - h + 4; wy < 86; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < 0.55) px(wx, wy, r() < 0.3 ? '#ffe2a0' : '#9a6078', 2, 3);
      x += w + Math.floor(r() * 6);
    }
  });
  // árvores do cerrado (troncos tortos, copas redondas)
  makeCanvas(scene, 'arvores_cerrado', 480, 80, (ctx, px) => {
    const r = rng(31);
    px(0, 74, '#6d7a3e', 480, 6);
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 52 + Math.floor(r() * 16);
      let tx = x;
      for (let y = 74; y > 40; y--) {
        if (r() < 0.25) tx += r() < 0.5 ? -1 : 1;
        px(tx, y, '#5a3e2c', 3, 1);
      }
      const cw = 22 + Math.floor(r() * 12);
      for (let y = 0; y < 22; y++) for (let xx = -cw / 2; xx < cw / 2; xx++) {
        const d = (xx * xx) / ((cw / 2) * (cw / 2)) + ((y - 11) * (y - 11)) / 121;
        if (d < 1) px(tx + xx, 22 + y, d > 0.75 ? '#55663a' : r() < 0.12 ? '#9aab5a' : '#7b8c48');
      }
    }
  });
  // postes e grade passando rápido
  makeCanvas(scene, 'postes', 240, 120, (ctx, px) => {
    px(0, 108, '#8a7f8f', 240, 2);
    for (let x = 0; x < 240; x += 6) px(x, 96, '#7d7384', 1, 12);
    px(0, 96, '#7d7384', 240, 1);
    px(60, 4, '#5f5868', 3, 116);
    px(52, 4, '#5f5868', 14, 3);
    px(50, 7, '#ffe8a8', 6, 2);
  });
}

let built = false;

export const onibus = {
  tileset: 'tiles_onibus',
  musica: 'onibus',
  oneway: [T.RACK],
  decorChars: { I: 'barra', n: 'passageiro', D: 'motorista', S: 'placa', V: 'validador', X: 'lixeira', Q: 'letreiro' },
  objects: {
    box: 'mochila',
    door: 'porta_vidro',
    lever: ['parada_off', 'parada_on'],
    exit: 'porta_meio',
    exitOpen: 'porta_meio_aberta',
  },

  textures(scene) {
    if (built && scene.textures.exists('tiles_onibus')) return;
    makeTiles(scene);
    makeObjects(scene);
    makeBackground(scene);
    built = true;
  },

  tile(ch, c, r, at) {
    switch (ch) {
      case 'R': return T.ROOF;
      case 'W': return T.WALL;
      case '#': return T.FLOOR;
      case 'k': return T.SKIRT;
      case 'g': return at(c, r - 1) === 'g' ? T.ROAD : T.ROAD_TOP;
      case 'b': return at(c, r - 1) === 'b' ? T.SEAT_BASE : T.SEAT;
      case '=': return T.RACK;
      case '|': return T.GLASS;
      default: return -1;
    }
  },

  // Decoração atrás dos personagens (parede com janelas, barras, passageiros...)
  decorate(level, lvl) {
    const s = level;
    const at = lvl.at;
    // área interna do ônibus: entre o teto (R) e o piso (#)
    let r0 = 0, r1 = 0, c0 = 0, c1 = 0;
    for (let r = 0; r < lvl.rows; r++) if (at(2, r) === 'R') r0 = r + 1;
    for (let r = lvl.rows - 1; r >= 0; r--) if (at(2, r) === '#') r1 = r - 1;
    for (let c = 0; c < lvl.cols; c++) if (at(c, r0) === 'W') { if (!c0) c0 = c + 1; else c1 = c - 1; }
    const X0 = c0 * TILE, Y0 = r0 * TILE, W = (c1 - c0 + 1) * TILE, H = (r1 - r0 + 1) * TILE;

    // parede do fundo com janelas (vazadas: a paisagem aparece através delas)
    const key = `parede_onibus_${lvl.cols}`;
    makeCanvas(s, key, W, H, (ctx, px) => {
      px(0, 0, C.wallIn, W, H);
      px(0, 0, C.ceilLo, W, 3);
      // caixas pretas do teto (ar-condicionado / luminárias) nas laterais
      for (let x = 20; x + 30 < W; x += 128) {
        px(x, 0, C.duct, 30, 4);
        px(x + 2, 4, '#363a41', 26, 1);
      }
      const winTop = 7, winH = 42;
      for (let x = 6; x + 50 < W; x += 64) {
        px(x - 3, winTop - 3, C.outline, 56, winH + 6);
        px(x - 2, winTop - 2, C.frame, 54, winH + 4);
        ctx.clearRect(x, winTop, 50, winH);
        px(x + 24, winTop, C.frame, 2, winH); // divisão da janela
        px(x, winTop + 12, C.frame, 24, 2); // basculante em cima
        // reflexo no vidro
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + 3, winTop + 2, 3, winH - 4);
        ctx.fillRect(x + 8, winTop + 2, 1, winH - 4);
        ctx.fillStyle = 'rgba(40,60,80,0.12)';
        ctx.fillRect(x, winTop, 50, winH);
        // trava vermelha de emergência em algumas janelas
        if ((x / 64) % 2 === 0) {
          px(x + 44, winTop - 4, C.outline, 6, 10);
          px(x + 45, winTop - 3, '#d8343a', 4, 8);
          px(x + 45, winTop - 3, '#ff6a6a', 4, 1);
          px(x + 46, winTop + 1, '#fff4e6', 2, 1);
        }
      }
      // painel abaixo das janelas
      px(0, 53, C.wallInLo, W, 1);
      px(0, 54, C.wallInHi, W, 2);
      px(0, 56, C.wallIn, W, H - 56);
      // fileira de bancos do outro lado do corredor (de perfil, virados para a frente)
      for (let x = 4, k = 0; x < W - 18; x += 24, k++) {
        const pref = k % 5 === 0;
        const fill = pref ? '#e3bf3c' : '#3f5d9c';
        const hi = pref ? '#f3d86a' : '#5a7bbd';
        const lo = pref ? '#b8962a' : '#2c4578';
        // encosto inclinado com alça
        px(x + 1, 58, C.outline, 4, 2);
        px(x + 2, 59, '#9aa0a8', 2, 1);
        px(x, 61, C.outline, 6, 21);
        px(x + 1, 62, fill, 4, 19);
        px(x + 1, 62, hi, 1, 19);
        px(x + 4, 62, lo, 1, 19);
        // assento
        px(x + 4, 78, C.outline, 15, 6);
        px(x + 5, 79, fill, 13, 3);
        px(x + 5, 79, hi, 13, 1);
        px(x + 5, 82, lo, 13, 1);
        if (!pref) [[8, 80], [13, 80]].forEach(([dx, dy]) => px(x + dx, dy, C.seatMoon));
        // pé até o piso
        px(x + 10, 84, '#7a7e86', 2, H - 88);
        px(x + 7, H - 5, '#5d6168', 8, 1);
      }
      px(0, 88, C.wallInLo, W, 0);
      px(0, H - 4, C.floorBLo, W, 4);
    });
    s.add.image(X0, Y0, key).setOrigin(0).setDepth(0);

    // encosto de cada banco e pé até o chão (só desenho, não mexe na colisão)
    for (let r = 0; r < lvl.rows; r++) for (let c = 0; c < lvl.cols; c++) {
      if (at(c, r) !== 'b' || at(c, r - 1) === 'b') continue;
      const x = c * TILE, y = r * TILE;
      const pref = (c * 7 + r) % 4 === 0; // alguns bancos amarelos (preferenciais)
      const fill = pref ? 0xf5c518 : 0x2c4a94;
      const hi = pref ? 0xffe36a : 0x4a6cc0;
      const lo = pref ? 0xc99a12 : 0x1e3570;
      const g = s.add.graphics().setDepth(1.5);
      // encosto levemente inclinado para trás (parte de cima um pixel mais para a esquerda)
      g.fillStyle(0x241a2b, 1).fillRect(x, y - 15, 6, 9).fillRect(x + 1, y - 7, 6, 8);
      g.fillStyle(fill, 1).fillRect(x + 1, y - 14, 4, 8).fillRect(x + 2, y - 7, 4, 7);
      g.fillStyle(hi, 1).fillRect(x + 1, y - 14, 1, 8).fillRect(x + 2, y - 7, 1, 7);
      g.fillStyle(lo, 1).fillRect(x + 4, y - 14, 1, 8).fillRect(x + 5, y - 7, 1, 7);
      if (!pref) g.fillStyle(0xe8c23a, 1).fillRect(x + 3, y - 10, 1, 1);
      // alça de segurar no alto do encosto
      g.fillStyle(0x241a2b, 1).fillRect(x, y - 18, 7, 3);
      g.fillStyle(pref ? 0xffe36a : 0x9aa0a8, 1).fillRect(x + 1, y - 17, 5, 1);
      // assento suspenso (sem base embaixo): o pé continua até o piso
      if (at(c, r + 1) !== 'b' && at(c, r + 1) !== '#') {
        let rr = r + 1;
        while (rr < lvl.rows && at(c, rr) !== '#' && at(c, rr) !== 'b') rr++;
        const top = (r + 1) * TILE, bot = rr * TILE;
        g.fillStyle(0x241a2b, 1).fillRect(x + 7, top - 1, 3, bot - top + 1);
        g.fillStyle(0x9a95a6, 1).fillRect(x + 8, top - 1, 1, bot - top + 1);
        g.fillStyle(0x241a2b, 1).fillRect(x + 5, bot - 1, 7, 1);
      }
    }

    s.busAnim = { passengers: [], wheels: [] };
    for (const d of lvl.decor) {
      if (d.type === 'barra') {
        const g = s.add.graphics().setDepth(1);
        const x = d.c * TILE + 7;
        g.fillStyle(0x241a2b, 1).fillRect(x - 1, Y0, 4, H);
        g.fillStyle(0xefc34a, 1).fillRect(x, Y0, 2, H);
        g.fillStyle(0xfff0b0, 1).fillRect(x, Y0, 1, H);
        // alça
        g.fillStyle(0x241a2b, 1).fillRect(x - 3, Y0 + 8, 8, 7);
        g.fillStyle(0xd6cdb8, 1).fillRect(x - 2, Y0 + 9, 6, 5);
        g.fillStyle(0x241a2b, 1).fillRect(x, Y0 + 11, 2, 2);
      } else if (d.type === 'passageiro') {
        const i = (d.c * 7) % 6;
        // senta no banco do fundo mais próximo
        const seatX = X0 + 4 + Math.round((d.c * TILE + 8 - X0 - 13) / 24) * 24;
        const p = s.add.image(seatX + 12, Y0 + 79, `passageiro_${i}`).setOrigin(0.5, 1).setDepth(0.5);
        p.setFlipX(false);
        p.baseY = p.y;
        p.phase = d.c;
        s.busAnim.passengers.push(p);
        // celular brilhando
        if (d.c % 3 === 0) {
          const phone = s.add.rectangle(p.x + 3, p.y - 3, 3, 2, 0xbfe8ff).setDepth(0.6);
          s.tweens.add({ targets: phone, alpha: 0.4, duration: 900, yoyo: true, repeat: -1 });
        }
      } else if (d.type === 'motorista') {
        s.add.image(d.c * TILE + 8, (d.r + 1) * TILE, 'motorista').setOrigin(0.5, 1).setDepth(1.6);
      } else if (d.type === 'validador') {
        // postinho com o validador de cartão
        const x = d.c * TILE + 8, y = (d.r + 1) * TILE;
        const g = s.add.graphics().setDepth(1.4);
        g.fillStyle(0x241a2b, 1).fillRect(x - 1, y - 30, 4, 30);
        g.fillStyle(0xf5c518, 1).fillRect(x, y - 30, 2, 30);
        s.add.image(x + 1, y - 30, 'validador').setOrigin(0.5, 1).setDepth(1.45);
        const tela = s.add.rectangle(x + 1, y - 37, 4, 1, 0xbff4ff).setDepth(1.46);
        s.tweens.add({ targets: tela, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
      } else if (d.type === 'lixeira') {
        s.add.image(d.c * TILE + 8, d.r * TILE + 4, 'lixeira_onibus').setOrigin(0.5, 0).setDepth(1.1);
      } else if (d.type === 'letreiro') {
        // letreiro de LED laranja da linha (texto em data/memorias.json → letreiro)
        const x = d.c * TILE + 8, y = Y0 + 2;
        const w = 70;
        s.add.rectangle(x, y, w + 4, 12, 0x241a2b).setOrigin(0.5, 0).setDepth(1.2);
        s.add.rectangle(x, y + 1, w + 2, 10, 0x120c08).setOrigin(0.5, 0).setDepth(1.21);
        const mem = (s.registry.get('memorias') || {}).fases || [];
        const fm = mem.find((f) => f.id === lvl.memoria) || {};
        const linha = fm.letreiro || 'TODO: LINHA E DESTINO';
        const t = s.add
          .text(x, y + 6, '', { fontFamily: '"Pixelify Sans"', fontSize: '7px', color: '#ff9a2a' })
          .setOrigin(0.5)
          .setResolution(2)
          .setDepth(1.22);
        // o texto corre letra por letra dentro do painel, como num letreiro de verdade
        const fita = `${linha.toUpperCase()}   •   `;
        let n = fita.length;
        t.setText(fita);
        while (n > 4 && t.width > w - 4) {
          n--;
          t.setText(fita.slice(0, n));
        }
        s.letreiro = { t, fita, n, i: 0, acc: 0 };
      } else if (d.type === 'placa') {
        const x = d.c * TILE + 8, y = Y0 + 2;
        s.add.image(x, y, 'placa_parada').setOrigin(0.5, 0).setDepth(1.2);
        s.placa = s.add
          .text(x, y + 6, 'PARADA SOLICITADA', { fontFamily: '"Pixelify Sans"', fontSize: '7px', color: '#5a2020' })
          .setOrigin(0.5)
          .setResolution(2)
          .setDepth(1.3);
      }
    }

    // corrimão amarelo ao longo do teto, com alças pretas penduradas
    const rail = s.add.graphics().setDepth(1.05);
    rail.fillStyle(0x241a2b, 1).fillRect(X0, Y0 + 5, W, 4);
    rail.fillStyle(0xf5c518, 1).fillRect(X0, Y0 + 6, W, 2);
    rail.fillStyle(0xffe36a, 1).fillRect(X0, Y0 + 6, W, 1);
    s.busAnim.straps = [];
    for (let x = X0 + 10; x < X0 + W - 6; x += 22) {
      if (lvl.decor.some((d) => d.type === 'barra' && Math.abs(d.c * TILE + 8 - x) < 6)) continue;
      const st = s.add.graphics().setDepth(1.06);
      st.fillStyle(0x1f2126, 1).fillRect(-1, 0, 2, 9);
      st.fillRect(-3, 9, 6, 1);
      st.fillRect(-3, 9, 1, 4);
      st.fillRect(2, 9, 1, 4);
      st.fillRect(-3, 13, 6, 1);
      st.setPosition(x, Y0 + 8);
      st.phase = x * 0.05;
      s.busAnim.straps.push(st);
    }

    // rodas e rua correndo
    const bottom = (r1 + 3) * TILE; // fim da lataria
    for (const fx of [0.14, 0.32, 0.82]) {
      const w = s.add.image(X0 + W * fx, bottom + 4, 'roda_a').setDepth(2.5);
      s.busAnim.wheels.push(w);
    }
    const roadY = (r1 + 3) * TILE;
    s.add.rectangle(X0 - TILE, roadY, W + TILE * 2, 10, 0x1d1922, 0.45).setOrigin(0).setDepth(2.3);
    const dash = s.textures.exists('faixa_rua')
      ? 'faixa_rua'
      : makeCanvas(s, 'faixa_rua', 32, 3, (ctx, px) => px(0, 0, '#f1e4c6', 14, 2)).key;
    s.road = s.add.tileSprite(0, roadY + 30, lvl.cols * TILE, 3, dash).setOrigin(0).setDepth(2.4);
    s.curb = s.add.tileSprite(0, roadY + 14, lvl.cols * TILE, 3, makeCurb(s)).setOrigin(0).setDepth(2.4);
    s.busT = 0;
    s.bumpTimer = 6;
  },

  // Lógica por quadro: ônibus andando, lombadas, passageiros balançando
  update(level, dt) {
    const s = level;
    if (!s.busAnim) return;
    s.busT += dt;
    if (s.road) {
      s.road.tilePositionX += dt * 260;
      s.curb.tilePositionX += dt * 260;
    }
    const frame = Math.floor(s.busT * 12) % 2 ? 'roda_a' : 'roda_b';
    s.busAnim.wheels.forEach((w) => w.setTexture(frame));
    s.busAnim.passengers.forEach((p) => {
      p.y = p.baseY + (Math.sin(s.busT * 3 + p.phase) > 0.92 ? -1 : 0);
    });
    // alças balançando com o movimento do ônibus
    s.busAnim.straps.forEach((st) => {
      st.rotation = Math.sin(s.busT * 2.2 + st.phase) * 0.08 + (s.strapKick || 0) * Math.sin(s.busT * 14 + st.phase);
    });
    if (s.strapKick) s.strapKick = Math.max(0, s.strapKick - dt * 0.5);
    // letreiro de LED correndo
    const L = s.letreiro;
    if (L) {
      L.acc += dt;
      if (L.acc > 0.16) {
        L.acc = 0;
        L.i = (L.i + 1) % L.fita.length;
        const dupla = L.fita + L.fita;
        L.t.setText(dupla.slice(L.i, L.i + L.n));
      }
    }

    // lombada: todo mundo dá um pulinho
    s.bumpTimer -= dt;
    if (s.bumpTimer <= 0 && !s.done) {
      s.bumpTimer = 7 + Math.random() * 4;
      Sfx.thud();
      s.time.delayedCall(140, () => Sfx.thud());
      s.cameras.main.shake(220, 0.0035);
      s.strapKick = 0.35;
      s.players.forEach((p) => {
        if (p.onGround && !p.frozen) {
          p.body.setVelocityY(-95);
          p.squash = { x: 0.9, y: 1.1 };
        }
      });
      s.boxes.forEach((b) => b.body.setVelocityY(-70));
      s.busAnim.passengers.forEach((p) => s.tweens.add({ targets: p, y: p.baseY - 2, duration: 90, yoyo: true }));
    }
  },

  // Botão de parada apertado: acende a placa e toca o "ding"
  onLever(level, lever) {
    if (!lever.active) return;
    Sfx.ding();
    if (level.placa) {
      level.placa.setColor('#ff5f6d');
      level.tweens.add({ targets: level.placa, alpha: 0.55, duration: 300, yoyo: true, repeat: 5 });
    }
  },

  bg: {
    create(s) {
      s.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'ceu_onibus').setOrigin(0);
      s.sun = s.add.circle(380, 60, 22, 0xfff0b8, 1);
      s.sunGlow = s.add.circle(380, 60, 30, 0xffe2a0, 0.25);
      s.layers = [
        { s: s.add.tileSprite(0, 0, VIEW_W, 90, 'predios').setOrigin(0, 1), speed: 8, wy: 104, fx: 0.1 },
        { s: s.add.tileSprite(0, 0, VIEW_W, 80, 'arvores_cerrado').setOrigin(0, 1), speed: 45, wy: 112, fx: 0.25 },
        { s: s.add.tileSprite(0, 0, VIEW_W, 120, 'postes').setOrigin(0, 1), speed: 150, wy: 124, fx: 0.5 },
      ];
    },
    update(s, dt, view, t) {
      for (const l of s.layers) {
        l.s.tilePositionX = Math.round(t * l.speed + view.x * l.fx);
        l.s.y = Math.round(l.wy - view.y);
      }
      s.sun.y = Math.round(60 - view.y * 0.6);
      s.sunGlow.y = s.sun.y;
    },
  },
};

function makeCurb(s) {
  if (s.textures.exists('meio_fio')) return 'meio_fio';
  makeCanvas(s, 'meio_fio', 24, 3, (ctx, px) => {
    px(0, 0, C.curb, 24, 3);
    px(0, 2, C.curbLo, 24, 1);
    px(0, 0, C.curbLo, 1, 3);
    px(12, 0, C.curbLo, 1, 3);
  });
  return 'meio_fio';
}
