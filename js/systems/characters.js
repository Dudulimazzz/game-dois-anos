// Sprites dos personagens (Fase 2), desenhados em pixel art por código.
//
// Cada personagem é um "boneco": cabeça e tronco são desenhos fixos (em texto, abaixo),
// e braços/pernas são traçados a partir de poses (joelho, pé, cotovelo, mão) quadro a quadro.
// Assim todas as animações ficam consistentes, e dá para ajustar um detalhe do rosto
// num lugar só.
//
// Coordenadas das poses: x para a frente (direita), y para cima a partir do chão.

export const FRAME_W = 32;
export const FRAME_H = 48;
const GROUND = 45; // linha do quadro onde fica o chão (y = 0)
const CX = 16;

// --------------------------------------------------------------- paletas
const OUTLINE = '#1b1020';

const PAL = {
  ele: {
    // pele morena (marrom médio, tom quente)
    S: '#93593f', s: '#744230', L: '#b0734f', R: '#5f3628',
    // cabelo preto cacheado
    H: '#1c1517', h: '#3b2e31', f: '#4a3027', // f = degradê (cabelo curtinho sobre a pele)
    E: '#140c0c', W: '#efe6dc', B: '#120a0a',
    M: '#2e1912', // bigode fino e cavanhaque
    m: '#4a1c18', l: '#a5543f', // boca fechada (sorriso leve)
    // camiseta preta larga
    K: '#2b2731', k: '#1f1c25', U: '#403b48',
    // jeans escuro quase preto
    J: '#272c3b', V: '#1b1f2b', I: '#363d52',
    // tênis branco com detalhe preto
    N: '#f4f2ee', n: '#cbc7c2', X: '#18161a', G: '#e2ddd6',
  },
  ela: {
    // pele clara com bochechas rosadas
    S: '#f3cdb6', s: '#e0a98f', L: '#fde3d3', R: '#d38f78', C: '#f2a0a0',
    // cabelo: castanho escuro na raiz clareando para mel nas pontas
    H: '#3b2219', h: '#5a3624', A: '#7e4f30', a: '#a8733f', Y: '#c9934f', y: '#2a170f',
    E: '#3a2216', W: '#f6eee8', B: '#3b2318',
    m: '#cf6f7c', l: '#e98f99',
    g: '#efe3b0', j: '#ff7aa2', // colar fino com pingente
    // blusa rosa clara
    P: '#f7b6cd', p: '#e091b0', Q: '#fdd5e3',
    // jeans azul claro (flare)
    J: '#9cbfe3', I: '#bcd5ef', V: '#7ea3cc',
    // sandália clara
    D: '#efe1c8', d: '#cdb894',
  },
};

// --------------------------------------------------------------- cabeças (olhando para a direita)
// '.' = vazio. Âncora: coluna 6 = centro do pescoço; última linha = queixo.
const HEADS = {
  ele: {
    // mesma construção do rosto dela (três quartos), com os traços dele
    normal: [
      '...hHhHhH...',
      '..hHhHHhHHh.',
      '.hHhHHhHHhHh',
      '.HHHHHHHHHHH',
      '.HHHSSSSSSS.',
      '.HHSSBBSSBBS',
      '.HHSSSESSSES',
      '.HRSSWESSWES',
      '.HsSSSSSSLSS',
      '..sSSSSSMMSS',
      '..HsSSSSllS.',
      '...sSSSSMMS.',
      '....sSSSSs..',
    ],
    blink: null, // gerado: olhos fechados
    happy: null, // gerado: olhos sorrindo
  },
  ela: {
    normal: [
      '...yHHHy....',
      '..yHHhHHHy..',
      '.yHHHHyHHHH.',
      '.HHHHSSSHHHH',
      'yHHHSSSSSSHH',
      'HHHSSBBSSBB.',
      'HHhSSSESSSE.',
      'HHhSSWESSWES',
      'AHhSCSSSSLSS',
      'AAhSSSSSSSCS',
      'aAAsSSSSmmS.',
      'aAAhsSSSSS..',
      '.aAA.sSS....',
    ],
    blink: null,
    happy: null,
  },
};

// Variações de rosto geradas a partir do rosto normal
function variant(rows, swaps) {
  return rows.map((row, r) => {
    let out = row.split('');
    for (const [rr, c, ch] of swaps) if (rr === r) out[c] = ch;
    return out.join('');
  });
}
HEADS.ele.blink = variant(HEADS.ele.normal, [[6, 6, 'S'], [6, 10, 'S'], [7, 5, 'E'], [7, 6, 'E'], [7, 9, 'E'], [7, 10, 'E']]);
HEADS.ele.happy = variant(HEADS.ele.normal, [[6, 6, 'S'], [6, 10, 'S'], [6, 5, 'E'], [6, 9, 'E'], [7, 5, 'S'], [7, 6, 'E'], [7, 9, 'S'], [7, 10, 'E'], [10, 7, 'l'], [10, 10, 'l']]);
HEADS.ela.blink = variant(HEADS.ela.normal, [[6, 6, 'S'], [6, 10, 'S'], [7, 5, 'E'], [7, 6, 'E'], [7, 9, 'E'], [7, 10, 'E']]);
HEADS.ela.happy = variant(HEADS.ela.normal, [[6, 6, 'S'], [6, 10, 'S'], [6, 5, 'E'], [6, 9, 'E'], [7, 5, 'S'], [7, 6, 'E'], [7, 9, 'S'], [7, 10, 'E'], [10, 7, 'm'], [10, 8, 'm'], [10, 9, 'm'], [11, 8, 'm']]);

// Cabelo dela que cai pelas costas (desenhado atrás do corpo). Âncora igual à cabeça,
// a primeira linha fica logo abaixo do queixo.
const ELA_BACK_HAIR = [
  'AAAh........',
  'aAAAA.......',
  'aAAAAa......',
  'YaAAAa......',
  'YaaAaY......',
  'YYaaaY......',
  '.YYaYY......',
  '..Y.Y.......',
];

// --------------------------------------------------------------- troncos
// Âncora: coluna 5 = centro; última linha fica na altura do quadril.
const TORSOS = {
  ele: [
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKU..',
    '..kKKKKKK..',
    '..kkkkkkk..',
  ],
  ela: [
    '..pSgSSgp..',
    '.pPPSjSPPQ.',
    '.pPPPPPPPQ.',
    '..pPPPPPQ..',
    '..pPPPPPP..',
    '..pPPPPPP..',
    '..ppppppp..',
  ],
};

// --------------------------------------------------------------- calçados (âncora: coluna 2 = tornozelo)
const SHOES = {
  ele: {
    flat: ['.NNNX..', 'NNXXNNN', 'GGGGGGn'],
    toe: ['.NNX...', '.NXNN..', '..GNNn.', '...Gn..'],
  },
  ela: {
    flat: ['.SdS..', 'DDDDDd'],
    toe: ['.SdS.', '..DDd', '...d.'],
  },
};

// Medidas de cada um
const BODY = {
  ele: { hip: 13, shoulder: 22, neck: 23, chin: 24, ankle: 3, legW: 3, armW: 2, sleeve: 0.5, sleeveW: 2, shoulderF: 2, shoulderB: -2, hipF: 1, hipB: -2 },
  ela: { hip: 11, shoulder: 17, neck: 18, chin: 19, ankle: 2, legW: 3, armW: 2, sleeve: 0.25, sleeveW: 3, shoulderF: 3, shoulderB: -3, hipF: 1, hipB: -2, flare: true },
};

// --------------------------------------------------------------- poses
// leg: [joelhoX, joelhoY, peX, peY, sapato]; arm: [cotoveloDX, cotoveloDY, maoDX, maoDY] relativos ao ombro
const P = (o) => Object.assign({ by: 0, lean: 0, hx: 0, hy: 0, face: 'normal', hair: 0 }, o);

function walkCycle(len) {
  // 8 quadros: contato, baixo, passagem, alto (e o mesmo com a outra perna)
  const L = len; // comprimento da passada
  const legsA = [
    [[2, 7, L, 0, 'flat'], [-2, 7, -L, 0, 'toe']],
    [[2, 6, L - 1, 0, 'flat'], [-2, 8, -L + 1, 2, 'toe']],
    [[1, 6, 0, 0, 'flat'], [2, 8, 0, 3, 'toe']],
    [[-1, 7, -L + 2, 0, 'flat'], [3, 8, L - 1, 2, 'flat']],
  ];
  const frames = [];
  const bob = [0, -1, 0, 1];
  const arms = [
    [[-1, -4, -3, -8], [1, -4, 3, -8]],
    [[-1, -4, -2, -8], [1, -4, 2, -8]],
    [[0, -5, 0, -9], [0, -5, 0, -9]],
    [[1, -4, 2, -8], [-1, -4, -2, -8]],
  ];
  for (let half = 0; half < 2; half++) {
    for (let i = 0; i < 4; i++) {
      const [f, b] = legsA[i];
      const legs = half === 0 ? [b, f] : [f, b]; // [trás, frente]
      const [aB, aF] = half === 0 ? arms[i] : [arms[i][1], arms[i][0]];
      frames.push(P({ by: bob[i], legs, arms: [aB, aF], hair: bob[i] >= 0 ? -1 : 0 }));
    }
  }
  return frames;
}

const STAND_LEGS = [[-1, 7, -2, 0, 'flat'], [1, 7, 2, 0, 'flat']];
const ARMS_DOWN = [[-1, -5, -1, -9], [0, -5, 1, -9]];

function makeAnims(id) {
  const blinkAt = 8;
  const idle = [];
  const breathe = [0, 0, 0, 1, 1, 1, 1, 0, 0, 0];
  for (let i = 0; i < 10; i++) {
    idle.push(P({ by: breathe[i], legs: STAND_LEGS, arms: ARMS_DOWN, face: i === blinkAt ? 'blink' : 'normal' }));
  }
  const walk = walkCycle(id === 'ele' ? 4 : 3);
  const jump = [
    P({ by: 1, legs: [[-3, 6, -4, 2, 'toe'], [3, 8, 2, 4, 'toe']], arms: [[-2, -3, -4, -1], [2, -3, 4, 0]], hy: 0 }),
  ];
  const fall = [
    P({ by: 0, legs: [[-2, 6, -3, 0, 'toe'], [2, 6, 3, 1, 'toe']], arms: [[-3, -2, -5, 2], [3, -2, 5, 2]], hair: 1 }),
    P({ by: 0, legs: [[-2, 6, -3, 0, 'toe'], [2, 6, 4, 1, 'toe']], arms: [[-3, -1, -5, 3], [3, -1, 5, 3]], hair: 1 }),
  ];
  const push = [];
  const pushLegs = [
    [[-2, 6, -5, 0, 'toe'], [3, 7, 3, 0, 'flat']],
    [[-2, 6, -4, 1, 'toe'], [3, 7, 3, 0, 'flat']],
    [[-1, 7, -3, 0, 'flat'], [2, 7, 2, 0, 'flat']],
    [[-2, 7, -4, 0, 'toe'], [3, 7, 4, 0, 'flat']],
  ];
  for (let i = 0; i < 4; i++) {
    push.push(P({ lean: 2, hx: 1, by: i % 2 === 0 ? 0 : -1, legs: pushLegs[i], arms: [[3, -2, 7, -2], [4, -2, 8, -3]] }));
  }
  // braços para cima, em V, acima da cabeça
  const U = id === 'ele' ? 14 : 12;
  const upA = [[-4, Math.round(U / 2), -6, U], [5, Math.round(U / 2), 7, U]];
  const upB = [[-4, Math.round(U / 2) - 1, -6, U - 2], [5, Math.round(U / 2) - 1, 7, U - 2]];
  const celebrate = [
    P({ by: 0, legs: STAND_LEGS, arms: upA, face: 'happy' }),
    P({ by: 1, legs: [[-1, 7, -2, 1, 'toe'], [1, 7, 2, 1, 'toe']], arms: upA, face: 'happy', hair: 1 }),
    P({ by: 1, legs: [[-1, 7, -2, 2, 'toe'], [1, 7, 2, 2, 'toe']], arms: upB, face: 'happy', hair: 1 }),
    P({ by: 0, legs: STAND_LEGS, arms: upB, face: 'happy' }),
  ];
  return {
    idle: { frames: idle, rate: 6, repeat: -1 },
    walk: { frames: walk, rate: 12, repeat: -1 },
    jump: { frames: jump, rate: 1, repeat: 0 },
    fall: { frames: fall, rate: 8, repeat: -1 },
    push: { frames: push, rate: 6, repeat: -1 },
    celebrate: { frames: celebrate, rate: 7, repeat: -1 },
  };
}

// --------------------------------------------------------------- desenho
class Pixels {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.c = new Array(w * h).fill(null);
  }
  set(x, y, color) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !color) return;
    this.c[y * this.w + x] = color;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.c[y * this.w + x];
  }
}

function stamp(px, rows, pal, left, top, flip = false) {
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      px.set(flip ? left + (row.length - 1 - c) : left + c, top + r, pal[ch]);
    }
  });
}

// Traço grosso entre dois pontos (em coordenadas do quadro)
function limb(px, ax, ay, bx, by, w, color) {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2 + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    for (let dx = 0; dx < w; dx++) for (let dy = 0; dy < w; dy++) px.set(Math.round(x - (w - 1) / 2) + dx, Math.round(y - (w - 1) / 2) + dy, color);
  }
}

// Coordenadas de pose -> quadro
const FX = (x) => CX + x;
const FY = (y) => GROUND - y;

function drawLeg(px, id, pal, body, hipX, hipY, leg, back) {
  const [kx, ky, fx, fy, shoe] = leg;
  const dark = back;
  const base = dark ? pal.V : pal.J;
  const hi = dark ? base : pal.I;
  const ax = FX(hipX), ay = FY(hipY);
  const kxx = FX(kx), kyy = FY(ky);
  const fxx = FX(fx), fyy = FY(fy + body.ankle);
  limb(px, ax, ay, kxx, kyy, body.legW, base);
  limb(px, kxx, kyy, fxx, fyy, body.legW, base);
  // brilho na frente da perna
  if (!dark) {
    limb(px, ax + 1, ay, kxx + 1, kyy, 1, hi);
  }
  if (body.flare) {
    // boca larga: alarga a barra da calça
    px.set(fxx - 2, fyy, base);
    px.set(fxx + 2, fyy, base);
    px.set(fxx - 2, fyy - 1, base);
    px.set(fxx + 2, fyy - 1, base);
    px.set(fxx + 2, fyy + 1, base);
    px.set(fxx - 2, fyy + 1, base);
  }
  const s = SHOES[id][shoe];
  const shoeTop = FY(fy + body.ankle) + 1;
  stamp(px, s, dark ? Object.assign({}, pal, { N: pal.n || pal.D, D: pal.d || pal.D }) : pal, fxx - 2, shoeTop);
}

function drawArm(px, pal, body, sx, sy, arm, back, skinOnly) {
  const [ex, ey, hx, hy] = arm;
  const ax = FX(sx), ay = FY(sy);
  const exx = FX(sx + ex), eyy = FY(sy + ey);
  const hxx = FX(sx + hx), hyy = FY(sy + hy);
  const skin = back ? pal.s : pal.S;
  const shirt = back ? (pal.k || pal.p) : (pal.K || pal.P);
  // antebraço e mão
  limb(px, exx, eyy, hxx, hyy, body.armW, skin);
  limb(px, ax, ay, exx, eyy, body.armW, skin);
  // manga
  const mx = ax + (exx - ax) * body.sleeve;
  const my = ay + (eyy - ay) * body.sleeve;
  if (!skinOnly) limb(px, ax, ay, mx, my, body.sleeveW, shirt);
  px.set(hxx, hyy, back ? pal.s : pal.L);
}

function drawFrame(px, ox, oy, id, pose) {
  const pal = PAL[id];
  const body = BODY[id];
  const local = new Pixels(FRAME_W, FRAME_H);
  const by = pose.by;
  const lean = pose.lean;
  const [legB, legF] = pose.legs;
  const [armB, armF] = pose.arms;
  const hipY = body.hip + by;
  const head = HEADS[id][pose.face] || HEADS[id].normal;
  const headTop = FY(body.chin + by + pose.hy) - (head.length - 1);
  const headLeft = FX(lean + pose.hx) - 6;

  // 1) cabelo de trás (ela)
  if (id === 'ela') {
    stamp(local, ELA_BACK_HAIR, pal, headLeft + pose.hair, headTop + head.length);
  }
  // 2) braço e perna de trás
  drawArm(local, pal, body, body.shoulderB + lean, body.shoulder + by, armB, true);
  drawLeg(local, id, pal, body, body.hipB, hipY, legB, true);
  // 3) perna da frente
  drawLeg(local, id, pal, body, body.hipF, hipY, legF, false);
  // 4) tronco e pescoço
  const torso = TORSOS[id];
  stamp(local, torso, pal, FX(lean) - 5, FY(hipY) - (torso.length - 1));
  local.set(FX(lean), FY(body.neck + by), pal.s);
  local.set(FX(lean + 1), FY(body.neck + by), pal.S);
  local.set(FX(lean - 1), FY(body.neck + by), pal.s);
  // 5) cabeça e braço da frente (braço levantado fica atrás da cabeça, para não cobrir o rosto)
  const armUp = armF[3] > 6;
  if (armUp) drawArm(local, pal, body, body.shoulderF + lean - 1, body.shoulder + by, armF, false);
  stamp(local, head, pal, headLeft, headTop);
  if (!armUp) drawArm(local, pal, body, body.shoulderF + lean - 1, body.shoulder + by, armF, false);

  // 7) contorno escuro em volta da silhueta
  const out = new Pixels(FRAME_W, FRAME_H);
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const c = local.get(x, y);
      if (c) out.set(x, y, c);
      else if (local.get(x - 1, y) || local.get(x + 1, y) || local.get(x, y - 1) || local.get(x, y + 1)) out.set(x, y, OUTLINE);
    }
  }
  for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) {
    const c = out.get(x, y);
    if (c) px.set(ox + x, oy + y, c);
  }
}

// Cria a folha de sprites e as animações de um personagem.
// Chaves das animações: "<id>-idle", "<id>-walk", "<id>-jump", "<id>-fall", "<id>-push", "<id>-celebrate".
export function buildCharacter(scene, id) {
  const anims = makeAnims(id);
  const list = [];
  for (const [name, a] of Object.entries(anims)) a.frames.forEach((pose, i) => list.push({ name, i, pose }));
  const cols = 10;
  const rows = Math.ceil(list.length / cols);
  const W = cols * FRAME_W, H = rows * FRAME_H;
  const px = new Pixels(W, H);
  list.forEach((f, k) => drawFrame(px, (k % cols) * FRAME_W, Math.floor(k / cols) * FRAME_H, id, f.pose));

  const key = `${id}-sheet`;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = px.get(x, y);
    if (c) {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  tex.refresh();
  list.forEach((f, k) => tex.add(`${f.name}-${f.i}`, 0, (k % cols) * FRAME_W, Math.floor(k / cols) * FRAME_H, FRAME_W, FRAME_H));

  for (const [name, a] of Object.entries(anims)) {
    const animKey = `${id}-${name}`;
    if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
    scene.anims.create({
      key: animKey,
      frames: a.frames.map((_, i) => ({ key, frame: `${name}-${i}` })),
      frameRate: a.rate,
      repeat: a.repeat,
    });
  }
  return key;
}

// Origem do sprite: os pés ficam no chão
export const ORIGIN_X = (CX + 0.5) / FRAME_W;
export const ORIGIN_Y = (GROUND + 1) / FRAME_H;
export const ANIM_NAMES = ['idle', 'walk', 'jump', 'fall', 'push', 'celebrate'];
