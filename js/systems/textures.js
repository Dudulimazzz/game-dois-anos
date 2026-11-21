// Texturas em pixel art geradas por código (Fase 1).
// Na Fase 2/3 os sprites e tiles definitivos substituem as de personagens e cenário.

import { TILE } from '../config.js';

// Gerador pseudoaleatório com semente (o mesmo desenho sempre que o jogo abre)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  const px = (x, y, c, ww = 1, hh = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, ww, hh);
  };
  draw(ctx, px);
  tex.refresh();
  return tex;
}

// Desenha a partir de linhas de texto: cada caractere é uma cor da paleta ('.' = vazio)
export function fromRows(scene, key, rows, pal) {
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

// ---------------------------------------------------------------- tiles
// Índice do tile de chão: ((máscara de vizinhos vazios) * 2 + variação)
// bits da máscara: 1 = vazio em cima, 2 = esquerda, 4 = direita, 8 = embaixo
export const TILE_PLANK = 32;

const G = {
  dirt: '#9c5d3a',
  dirt2: '#8a4f31',
  dirtDark: '#6e3b27',
  pebble: '#b97a4e',
  pebbleHi: '#d39663',
  edge: '#4a2a22',
  grassOut: '#2f6a3a',
  grass: '#78c25a',
  grassHi: '#a9e07a',
  grassMid: '#58a24a',
  grassDark: '#3f8540',
};

function drawGround(px, ox, mask, variant) {
  const r = rng(1234 + mask * 31 + variant * 977);
  const up = mask & 1, left = mask & 2, right = mask & 4, down = mask & 8;
  px(ox, 0, G.dirt, 16, 16);
  // textura de terra
  for (let i = 0; i < 14; i++) px(ox + Math.floor(r() * 16), Math.floor(r() * 16), G.dirt2);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r() * 13) + 1, y = Math.floor(r() * 12) + 3;
    px(ox + x, y, G.pebble, 2, 1);
    px(ox + x, y, G.pebbleHi);
    px(ox + x, y + 1, G.dirtDark, 2, 1);
  }
  if (left) {
    px(ox, 0, G.edge, 1, 16);
    px(ox + 1, 0, G.dirt2, 1, 16);
  }
  if (right) {
    px(ox + 15, 0, G.edge, 1, 16);
    px(ox + 14, 0, G.dirt2, 1, 16);
  }
  if (down) {
    px(ox, 15, G.edge, 16, 1);
    px(ox, 14, G.dirtDark, 16, 1);
  }
  if (up) {
    const r2 = rng(99 + variant * 13);
    for (let x = 0; x < 16; x++) {
      const depth = 3 + Math.floor(r2() * 3) + (x % 5 === 2 ? 1 : 0);
      px(ox + x, 0, G.grassOut);
      px(ox + x, 1, G.grass, 1, 2);
      px(ox + x, 3, G.grassMid, 1, depth - 2);
      px(ox + x, depth + 1, G.grassDark);
      px(ox + x, depth + 2, G.dirtDark);
    }
    for (let i = 0; i < 4; i++) px(ox + Math.floor(r2() * 16), 1, G.grassHi);
    if (left) px(ox, 1, G.grassOut, 1, 5);
    if (right) px(ox + 15, 1, G.grassOut, 1, 5);
  }
}

function makeTiles(scene) {
  makeCanvas(scene, 'tiles', TILE * 33, TILE, (ctx, px) => {
    for (let mask = 0; mask < 16; mask++) {
      for (let v = 0; v < 2; v++) {
        const ox = (mask * 2 + v) * TILE;
        drawGround(px, ox, mask, v);
        const up = mask & 1, left = mask & 2, right = mask & 4, down = mask & 8;
        if (up && left) ctx.clearRect(ox, 0, 1, 1);
        if (up && right) ctx.clearRect(ox + 15, 0, 1, 1);
        if (down && left) ctx.clearRect(ox, 15, 1, 1);
        if (down && right) ctx.clearRect(ox + 15, 15, 1, 1);
      }
    }
    // tábua (plataforma atravessável por baixo)
    const ox = TILE_PLANK * TILE;
    px(ox, 0, '#5a3420', 16, 6);
    px(ox, 1, '#e0a866', 16, 1);
    px(ox, 2, '#c98a4b', 16, 2);
    px(ox, 4, '#a86b36', 16, 1);
    for (let x = 0; x < 16; x += 2) px(ox + x, 1, '#f1c48b');
    px(ox + 7, 2, '#a86b36', 1, 2);
    px(ox + 2, 6, '#5a3420', 2, 3);
    px(ox + 12, 6, '#5a3420', 2, 3);
    px(ox + 3, 6, '#8a5530', 1, 2);
    px(ox + 13, 6, '#8a5530', 1, 2);
  });
}

// ---------------------------------------------------------------- objetos
function makeObjects(scene) {
  // Caixa de madeira com um coraçãozinho
  fromRows(scene, 'box', [
    'oooooooooooooooo',
    'ohhhhhhhhhhhhhho',
    'ohwwwwwwwwwwwwdo',
    'ohwdwwwwwwwwdwdo',
    'ohwwdwwwwwwdwwdo',
    'ohwwwdwwwwdwwwdo',
    'ohwwwwdppdwwwwdo',
    'ohwwwwpPPpwwwwdo',
    'ohwwwwpPPpwwwwdo',
    'ohwwwwwppwwwwwdo',
    'ohwwwdwwwwdwwwdo',
    'ohwwdwwwwwwdwwdo',
    'ohwdwwwwwwwwdwdo',
    'ohwwwwwwwwwwwwdo',
    'oddddddddddddddo',
    'oooooooooooooooo',
  ], { o: '#4b2a1a', h: '#e8b273', w: '#c98a4b', d: '#9a6232', p: '#e0567a', P: '#ff9bb5' });

  const btnBase = { o: '#2e2236', b: '#5b4a66', B: '#7d6a8a', c: '#ff5f87', C: '#ffa3bb', s: '#b8344f' };
  fromRows(scene, 'button_up', [
    '................', '................', '................', '................',
    '................', '................', '................', '................',
    '................', '................',
    '....oooooooo....',
    '...oCCCCCCCCo...',
    '...occcccccco...',
    '..osssssssssso..',
    '.obBBBBBBBBBBbo.',
    '.oooooooooooooo.',
  ], btnBase);
  fromRows(scene, 'button_down', [
    '................', '................', '................', '................',
    '................', '................', '................', '................',
    '................', '................', '................', '................',
    '....oooooooo....',
    '..oCccccccccCo..',
    '.obBBBBBBBBBBbo.',
    '.oooooooooooooo.',
  ], btnBase);

  const lev = { o: '#2e2236', b: '#6d5a7a', B: '#8f7c9c', s: '#c9b6a0', r: '#ff5f6d', R: '#ffa0a8', g: '#6ee08a', G: '#b5f5c4' };
  fromRows(scene, 'lever_off', [
    '................', '................',
    '..oo............', '.orRo...........', '.orro...........', '..oos...........',
    '....s...........', '.....s..........', '......s.........', '.......s........',
    '........s.......', '....oooooooo....', '...obBBBBBBbo...', '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..', '..oooooooooooo..',
  ], lev);
  fromRows(scene, 'lever_on', [
    '................', '................',
    '............oo..', '...........oGgo.', '...........oggo.', '...........soo..',
    '...........s....', '..........s.....', '.........s......', '........s.......',
    '.......s........', '....oooooooo....', '...obBBBBBBbo...', '..obbbbbbbbbbo..',
    '..obbbbbbbbbbo..', '..oooooooooooo..',
  ], lev);

  // Porta (um tile que se repete na vertical)
  fromRows(scene, 'door', [
    'o..............o'.replace(/\./g, 'm'),
    'omHHHHHHHHHHHHmo',
    'omhhhhhhhhhhhhmo',
    'omhhhhhhhhhhhhmo',
    'omhhhhhhhhhhhhmo',
    'omddddddddddddmo',
    'ommmmmmmmmmmmmmo',
    'omppppppppppppmo',
    'omPPPPPPPPPPPPmo',
    'ommmmmmmmmmmmmmo',
    'omHHHHHHHHHHHHmo',
    'omhhhhhhhhhhhhmo',
    'omhhhhrhhhhhhhmo',
    'omhhhhhhhhhhhhmo',
    'omddddddddddddmo',
    'ommmmmmmmmmmmmmo',
  ], { o: '#2a1d33', m: '#5d4a6e', H: '#b9a6c9', h: '#8f7aa3', d: '#6f5a83', p: '#e0567a', P: '#ff9bb5', r: '#cfc0db' });

  fromRows(scene, 'spikes', [
    '................', '................', '................', '................',
    '................', '................', '................',
    '..w....w....w...',
    '..W....W....W...',
    '.wWs..wWs..wWs..',
    '.wWs..wWs..wWs..',
    'wWWssWWWssWWWss.',
    'wWWssWWWssWWWss.',
    'oooooooooooooooo',
    'bbbbbbbbbbbbbbbb',
    'oooooooooooooooo',
  ], { w: '#ffffff', W: '#d9d2e0', s: '#9a8fa8', o: '#3a2a44', b: '#6a5a78' });

  // Checkpoint: poste com bandeirinha de coração
  const cp = (key, on) =>
    fromRows(scene, key, [
      '................',
      '....oo..........',
      '....oyoooooo....',
      '....oyhhffhho...',
      '....oyhffffho...',
      '....oyhhffhho...',
      '....oyhhhhho....',
      '....oyoooooo....',
      ...Array(21).fill('....oyo.........'),
      '...ooyoo........',
      '..oyyyyyo.......',
      '..ooooooo.......',
    ], on
      ? { o: '#3a2a44', y: '#ffd36e', h: '#ff7eb6', f: '#ffffff' }
      : { o: '#3a2a44', y: '#9a8fa8', h: '#6a5a78', f: '#8a7f98' });
  cp('checkpoint_off', false);
  cp('checkpoint_on', true);

  // Saída: arco com luz quente e coração no topo
  makeCanvas(scene, 'exit', 32, 48, (ctx, px) => {
    const o = '#3a2238', f = '#e0567a', F = '#ff9bb5', l = '#ffe8a8', L = '#fff6d6';
    // luz interna com degradê em faixas
    px(4, 12, '#ffcf7a', 24, 36);
    px(6, 14, l, 20, 34);
    px(9, 18, L, 14, 30);
    // arco
    px(2, 10, o, 2, 38);
    px(28, 10, o, 2, 38);
    px(3, 10, f, 1, 38);
    px(28, 10, f, 1, 38);
    px(4, 6, o, 24, 2);
    px(4, 8, f, 24, 2);
    px(5, 8, F, 22, 1);
    px(2, 8, o, 2, 2);
    px(28, 8, o, 2, 2);
    // coração
    const heart = ['.oo.oo.', 'oFFoFFo', 'oFfffFo', 'offfffo', '.offfo.', '..ofo..', '...o...'];
    heart.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        if (c === 'o') px(12 + x, y, o);
        if (c === 'F') px(12 + x, y, F);
        if (c === 'f') px(12 + x, y, f);
      }
    });
  });

  fromRows(scene, 'heart', [
    '.oo.oo.', 'ohhohho', 'ohWhhho', 'ohhhhho', '.ohhho.', '..oho..', '...o...',
  ], { o: '#5a1630', h: '#ff5f87', W: '#ffffff' });
  fromRows(scene, 'heart_big', [
    '..ooo...ooo..',
    '.ohhho.ohhho.',
    'ohWWhhohhhhHo',
    'ohWhhhhhhhhHo',
    'ohhhhhhhhhhHo',
    'ohhhhhhhhhhHo',
    '.ohhhhhhhhHo.',
    '..ohhhhhhHo..',
    '...ohhhhHo...',
    '....ohhHo....',
    '.....oHo.....',
    '......o......',
  ], { o: '#5a1630', h: '#ff5f87', H: '#d13c66', W: '#ffffff' });
  fromRows(scene, 'heart_small', ['.h.h.', 'hhhhh', 'hhhhh', '.hhh.', '..h..'], { h: '#ff8fb0' });
  fromRows(scene, 'heart_empty', [
    '.oo.oo.', 'o..o..o', 'o.....o', 'o.....o', '.o...o.', '..o.o..', '...o...',
  ], { o: '#8a7f98' });
  fromRows(scene, 'dust', ['.d.', 'ddd', '.d.'], { d: '#ffffff' });
  fromRows(scene, 'sparkle', ['..s..', '..s..', 'ssSss', '..s..', '..s..'], { s: '#fff2b0', S: '#ffffff' });
  fromRows(scene, 'pixel', ['w'], { w: '#ffffff' });

  // Marcador de "quem está ativo"
  fromRows(scene, 'marker', ['ooooooo', 'owwwwwo', '.owwwo.', '..owo..', '...o...'], { o: '#2a1d33', w: '#ffffff' });

  // Setas para teclas desenhadas
  const arrow = { o: '#2a1d33' };
  fromRows(scene, 'glyph_up', ['..o..', '.ooo.', 'ooooo', '..o..', '..o..'], arrow);
  fromRows(scene, 'glyph_down', ['..o..', '..o..', 'ooooo', '.ooo.', '..o..'], arrow);
  fromRows(scene, 'glyph_left', ['..o..', '.oo..', 'ooooo', '.oo..', '..o..'], arrow);
  fromRows(scene, 'glyph_right', ['..o..', '..oo.', 'ooooo', '..oo.', '..o..'], arrow);

  fromRows(scene, 'icon_pause', [
    '.ooooooooo.', 'owwwwwwwwwo', 'owwoowoowwo', 'owwoowoowwo', 'owwoowoowwo',
    'owwoowoowwo', 'owwoowoowwo', 'owwwwwwwwwo', '.ooooooooo.',
  ], { o: '#2a1d33', w: '#fff4e6' });
}

// ---------------------------------------------------------------- fundo
function makeBackground(scene) {
  // Céu de fim de tarde em faixas com pontilhado (dither)
  const bands = ['#2b1d4a', '#3f2758', '#5b3166', '#7d3c6e', '#a3496f', '#c85c6c', '#e47a68', '#f4a06a', '#f8c27c'];
  makeCanvas(scene, 'sky_sunset', 8, 270, (ctx, px) => {
    const bh = 270 / bands.length;
    for (let y = 0; y < 270; y++) {
      const fb = y / bh;
      const i = Math.floor(fb);
      const frac = fb - i;
      for (let x = 0; x < 8; x++) {
        let c = bands[Math.min(i, bands.length - 1)];
        // borda pontilhada entre faixas
        if (frac > 0.75 && i < bands.length - 1 && (x + y) % 2 === 0) c = bands[i + 1];
        if (frac > 0.9 && i < bands.length - 1 && (x + y) % 2 === 1) c = bands[i + 1];
        px(x, y, c);
      }
    }
  });

  const hills = (key, h, color, top, seed, amp, treeColor) =>
    makeCanvas(scene, key, 480, h, (ctx, px) => {
      const r = rng(seed);
      const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
      for (let x = 0; x < 480; x++) {
        const t = (x / 480) * Math.PI * 2;
        const y = Math.round(top + amp * (0.5 * Math.sin(t * 2 + ph[0]) + 0.3 * Math.sin(t * 5 + ph[1]) + 0.2 * Math.sin(t * 9 + ph[2])));
        px(x, y, color, 1, h - y);
      }
      if (treeColor) {
        for (let i = 0; i < 18; i++) {
          const x = Math.floor(r() * 470) + 5;
          const t = (x / 480) * Math.PI * 2;
          const base = Math.round(top + amp * (0.5 * Math.sin(t * 2 + ph[0]) + 0.3 * Math.sin(t * 5 + ph[1]) + 0.2 * Math.sin(t * 9 + ph[2])));
          const th = 6 + Math.floor(r() * 6);
          for (let k = 0; k < th; k++) {
            const w = Math.max(1, Math.floor((k / th) * 5));
            px(x - Math.floor(w / 2), base - th + k + 1, treeColor, w, 1);
          }
        }
      }
    });
  hills('hills_far', 120, '#8a4d78', 50, 7, 28, null);
  hills('hills_mid', 110, '#5f3a66', 55, 21, 22, '#4c2e57');
  hills('hills_near', 90, '#3b2647', 45, 42, 16, '#2e1d39');

  fromRows(scene, 'cloud', [
    '.......wwww.........',
    '.....wwwwwwww.......',
    '..wwwwwwwwwwwwww....',
    '.wwwwwwwwwwwwwwwwww.',
    'pppppppppppppppppppp',
  ], { w: '#ffd8c4', p: '#e8a0a8' });

  // Céu noturno para a tela de título
  const night = ['#0e0a1f', '#141030', '#1c1540', '#261b4e', '#33215a', '#432864', '#56306c'];
  makeCanvas(scene, 'sky_night', 8, 270, (ctx, px) => {
    const bh = 270 / night.length;
    for (let y = 0; y < 270; y++) {
      const fb = y / bh, i = Math.floor(fb), frac = fb - i;
      for (let x = 0; x < 8; x++) {
        let c = night[Math.min(i, night.length - 1)];
        if (frac > 0.7 && i < night.length - 1 && (x + y) % 2 === 0) c = night[i + 1];
        px(x, y, c);
      }
    }
  });
  fromRows(scene, 'moon', [
    '....mmmm....', '..mmmmmmmm..', '.mmmmmmmmmmm', '.mmmmMmmmmmm', 'mmmmMMmmmmmm', 'mmmmmmmmmMmm',
    'mmmmmmmmmmmm', 'mmMmmmmmmmmm', '.mmmmmmmmmmm', '.mmmmmmmMmmm', '..mmmmmmmm..', '....mmmm....',
  ], { m: '#fff1c9', M: '#ead7a6' });
}

// ---------------------------------------------------------------- interface (progresso, seleção, memória)
function makeUi(scene) {
  // Espaço vazio da barra de corações (mesmo tamanho do heart_big)
  fromRows(scene, 'heart_slot', [
    '..ooo...ooo..',
    '.odddo.odddo.',
    'odddddodddddo',
    'odddddddddddo',
    'odddddddddddo',
    'odddddddddddo',
    '.odddddddddo.',
    '..odddddddo..',
    '...odddddo...',
    '....odddo....',
    '.....odo.....',
    '......o......',
  ], { o: '#6e5a84', d: '#2e2140' });

  // Cadeado (fase bloqueada)
  fromRows(scene, 'padlock', [
    '..ooooo..',
    '.oLLLLLo.',
    '.oLo.oLo.',
    '.oLo.oLo.',
    'ooooooooo',
    'oGGGGGGGo',
    'oGGGoGGGo',
    'oGGGoGGGo',
    'oGGGGGGGo',
    'ohhhhhhho',
    'ooooooooo',
  ], { o: '#2a1d33', L: '#b8a6c8', G: '#ffd36e', h: '#c9963a' });

  // Cone (fase em construção)
  fromRows(scene, 'cone', [
    '....o....',
    '...oOo...',
    '...oOo...',
    '..oWWWo..',
    '..oOOOo..',
    '.oOOOOOo.',
    '.oWWWWWo.',
    'oOOOOOOOo',
    'ooooooooo',
  ], { o: '#2a1d33', O: '#ff8a3d', W: '#fff4e6' });

  // Envelope (carta final)
  fromRows(scene, 'envelope', [
    'ooooooooooooooo',
    'ooWWWWWWWWWWWoo',
    'oWoWWWWWWWWWoWo',
    'oWWoWWWWWWWoWWo',
    'oWWWohWWWhoWWWo',
    'oWWWhHhWhHhWWWo',
    'oWWWhhhhhhhWWWo',
    'oWWWWhhhhhWWWWo',
    'oWWWWWhhhWWWWWo',
    'oPPPPPPhPPPPPPo',
    'ooooooooooooooo',
  ], { o: '#5a1630', W: '#fff4e6', P: '#f1d9c6', h: '#ff5f87', H: '#ffc2d4' });

  // Medalhão de fase no mapa de seleção (círculo pixelado 24x24)
  const medal = (key, fill, edge, shine) =>
    makeCanvas(scene, key, 24, 24, (ctx, px) => {
      for (let y = 0; y < 24; y++) {
        for (let x = 0; x < 24; x++) {
          const d = Math.hypot(x - 11.5, y - 11.5);
          if (d > 11.6) continue;
          let c = d > 10.3 ? '#140d1c' : d > 8.6 ? edge : fill;
          if (d <= 8.6 && y < 8 && x > 5 && x < 14 && d > 6) c = shine;
          px(x, y, c);
        }
      }
    });
  medal('medal_on', '#3a2850', '#ffb3c7', '#4b3566');
  medal('medal_done', '#5a2440', '#ffd36e', '#6e2e50');
  medal('medal_off', '#231931', '#4a3a5c', '#2a1f3a');

  // Fita adesiva (prende a foto)
  makeCanvas(scene, 'tape', 14, 6, (ctx, px) => {
    px(0, 0, 'rgba(255,198,214,0.75)', 14, 6);
    px(0, 0, 'rgba(255,255,255,0.35)', 14, 1);
  });
}

export function generateTextures(scene) {
  makeTiles(scene);
  makeObjects(scene);
  makeBackground(scene);
  makeUi(scene);
}
