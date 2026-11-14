// Constantes globais do jogo.
// O mundo é desenhado em "pixels de mundo" (tiles 16x16, visão de 480x270).
// O canvas tem o dobro da resolução (960x540): o mundo é ampliado 2x pela câmera
// e os textos da interface ficam nítidos em resolução cheia.

export const TILE = 16;
export const VIEW_W = 480;
export const VIEW_H = 270;
export const PX = 2; // pixels de canvas por pixel de mundo
export const GAME_W = VIEW_W * PX;
export const GAME_H = VIEW_H * PX;

export const GRAVITY = 900;

export const FONT = '"Pixelify Sans", monospace';

// Sensação do pulo e do movimento (valores em pixels de mundo / segundo)
export const FEEL = {
  coyote: 0.1, // tempo (s) em que ainda dá para pular depois de sair da beirada
  buffer: 0.13, // tempo (s) que um pulo apertado "antes da hora" fica guardado
  accelGround: 1100,
  decelGround: 1600,
  accelAir: 750,
  decelAir: 500,
  jumpCut: 0.45, // soltar o pulo cedo corta a subida (pulo de altura variável)
  fallMult: 1.35, // cai um pouco mais rápido do que sobe
  apexMult: 0.55, // gravidade menor no topo do pulo (segurando o botão)
  apexBand: 45,
  maxFall: 420,
  pushSpeed: 42,
};

// Atributos de cada personagem.
// Ele é mais alto (34px: não passa em vãos de 2 tiles) e pula mais alto.
// Ela é mais baixa (27px: passa em vãos de 2 tiles).
export const PERSONAGENS = {
  ele: { id: 'ele', w: 12, h: 34, speed: 100, jump: 320, canPush: true, cor: 0x5b8cff, corCss: '#5b8cff' },
  ela: { id: 'ela', w: 10, h: 27, speed: 92, jump: 265, canPush: false, cor: 0xff7eb6, corCss: '#ff7eb6' },
};

export const UI = {
  bg: 0x1b1326,
  panel: 0x2a1d3a,
  panelEdge: 0x5a3f73,
  text: '#fff4e6',
  textDim: '#c9b6d9',
  accent: '#ffb3c7',
  accentHex: 0xffb3c7,
  gold: '#ffd36e',
};
