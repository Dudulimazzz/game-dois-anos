// Músicas do jogo (composições originais, chiptune).
// Cada música tem um andamento (bpm), "div" (passos por tempo: 2 = colcheias) e vozes.
// Cada voz é uma linha de passos: nota (ex.: C5, F#4, Bb3), acorde (C4+E4+G4),
// '-' segura a nota anterior, '.' é pausa. Bateria: k = bumbo, s = caixa, h = chimbal.
// As linhas de baixo e arpejo são geradas a partir da lista de acordes de cada compasso.

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const nome = (m) => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

// "Em" -> [raiz, terça, quinta] em MIDI, perto da oitava pedida
function triade(ch, oct) {
  const m = /^([A-G])([#b]?)(m?)$/.exec(ch);
  let r = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (oct + 1) * 12;
  return [r, r + (m[3] ? 3 : 4), r + 7];
}

// Padrões por compasso (8 colcheias)
const BAIXO = {
  calmo: ([r, , q]) => [nome(r), '-', '-', '-', nome(q), '-', '-', '-'],
  pulando: ([r, , q]) => [nome(r), '.', nome(r + 12), '.', nome(q), '.', nome(r + 12), '.'],
  longo: ([r]) => [nome(r), '-', '-', '-', '-', '-', '-', '-'],
};
const ARPEJO = {
  sobe: ([r, t, q]) => [r, t, q, t, r + 12, t, q, t].map(nome),
  quebrado: ([r, t, q]) => [r, q, t + 12, q, r + 12, q, t + 12, q].map(nome),
  batida: ([r, t, q]) => ['.', `${nome(r)}+${nome(t)}+${nome(q)}`, '.', `${nome(r)}+${nome(t)}+${nome(q)}`, '.', `${nome(r)}+${nome(t)}+${nome(q)}`, '.', `${nome(r)}+${nome(t)}+${nome(q)}`],
};

const gerar = (acordes, padrao, oct) => acordes.map((c) => padrao(triade(c, oct)).join(' ')).join(' ');
const repetir = (s, n) => Array(n).fill(s).join(' ');

// ---------------------------------------------------------------- título / menus
// Calma e quentinha, em Fá maior.
const TITULO_ACORDES = ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C', 'Bb', 'C', 'Am', 'Dm', 'Bb', 'C', 'F', 'F'];
const TITULO_MELODIA = `
  A4 - C5 - F5 - E5 D5   C5 - - - A4 - - -   D5 - C5 - Bb4 - A4 -   G4 - - - - - . .
  A4 - C5 - F5 - G5 A5   G5 - F5 - D5 - - -   F5 - E5 - D5 - C5 -   E5 - - - G5 - - -
  F5 - D5 - Bb4 - D5 -   E5 - C5 - G4 - C5 -   E5 - - - C5 - A4 -   D5 - - - F5 - - -
  D5 - F5 - Bb5 - A5 G5   G5 - - - E5 - C5 -   F5 - - - - - - -   . . . . . . . .`;

// ---------------------------------------------------------------- ônibus
// Animada, saltitante, em Sol maior.
const ONIBUS_ACORDES = ['G', 'Em', 'C', 'D', 'G', 'Bm', 'C', 'D', 'G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'G'];
const ONIBUS_MELODIA = `
  B4 . D5 . G5 - F#5 E5   D5 - B4 - G4 - . .   E5 . E5 . G5 - E5 C5   D5 - - - A4 - - -
  B4 . D5 . G5 - A5 B5   A5 - F#5 - D5 - . .   E5 - G5 - E5 - C5 -   D5 - E5 - F#5 - A5 -
  G5 - - - D5 . B4 .   E5 - G5 - B5 - G5 -   A5 - G5 - E5 - C5 -   D5 - - - . . D5 E5
  B4 . D5 . G5 - F#5 E5   D5 - B4 - G4 - B4 -   C5 - E5 - D5 - C5 -   B4 - A4 - G4 - - -`;
const ONIBUS_BATERIA = repetir('k h s h k k s h', 15) + ' k h s h k s s s';

// ---------------------------------------------------------------- memória / carta
// Lenta e carinhosa, em Dó maior.
const MEMORIA_ACORDES = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'];
const MEMORIA_MELODIA = `
  E5 - - - G5 - - -   D5 - - - B4 - - -   C5 - - - E5 - D5 C5   A4 - - - - - - -
  E5 - - - G5 - C6 -   B5 - - - G5 - - -   A5 - G5 - F5 - D5 -   C5 - - - - - - -`;

// ---------------------------------------------------------------- rua (manhã de sol)
// Leve e confiante, em Ré maior: ele decidido a falar com ela hoje.
const RUA_ACORDES = ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'Bm', 'F#m', 'G', 'D', 'Em', 'G', 'A', 'D'];
const RUA_MELODIA = `
  F#5 - A5 - D6 - A5 -   E5 - - - C#5 - E5 -   D5 - F#5 - B5 - A5 F#5   G5 - - - D5 - - -
  F#5 - A5 - D6 - E6 -   C#6 - A5 - E5 - - -   B5 - A5 - G5 - E5 -   A5 - - - . . . .
  B5 - A5 - F#5 - D5 -   C#5 - E5 - A5 - - -   G5 - F#5 - E5 - D5 -   F#5 - - - A5 - - -
  G5 - B5 - E6 - D6 -   B5 - - - G5 - - -   A5 - G5 - F#5 - E5 -   D5 - - - - - . .`;
const RUA_BATERIA = repetir('k h . h s h . h', 16);

export const MUSICAS = {
  rua: {
    bpm: 112,
    voices: [
      { notas: RUA_MELODIA, onda: 'square', vol: 0.055, filtro: 2400, sustain: 0.6, vibrato: true },
      { notas: gerar(RUA_ACORDES, ARPEJO.sobe, 4), onda: 'triangle', vol: 0.07, sustain: 0.35, curto: 0.16 },
      { notas: gerar(RUA_ACORDES, BAIXO.pulando, 2), onda: 'triangle', vol: 0.17, curto: 0.2 },
      { notas: RUA_BATERIA, vol: 0.035 },
    ],
  },
  titulo: {
    bpm: 84,
    voices: [
      { notas: TITULO_MELODIA, onda: 'triangle', vol: 0.2, sustain: 0.7, vibrato: true, release: 0.08 },
      { notas: gerar(TITULO_ACORDES, ARPEJO.sobe, 4), onda: 'square', vol: 0.03, filtro: 1500, sustain: 0.3, curto: 0.2 },
      { notas: gerar(TITULO_ACORDES, BAIXO.calmo, 2), onda: 'triangle', vol: 0.17, sustain: 0.8 },
    ],
  },
  onibus: {
    bpm: 128,
    voices: [
      { notas: ONIBUS_MELODIA, onda: 'square', vol: 0.06, filtro: 2600, sustain: 0.55, vibrato: true },
      { notas: gerar(ONIBUS_ACORDES, ARPEJO.batida, 4), onda: 'square', vol: 0.035, filtro: 1800, curto: 0.09 },
      { notas: gerar(ONIBUS_ACORDES, BAIXO.pulando, 2), onda: 'triangle', vol: 0.18, curto: 0.18 },
      { notas: ONIBUS_BATERIA, vol: 0.05 },
    ],
  },
  memoria: {
    bpm: 68,
    voices: [
      { notas: MEMORIA_MELODIA, onda: 'sine', vol: 0.16, sustain: 0.75, vibrato: true, release: 0.12 },
      { notas: gerar(MEMORIA_ACORDES, ARPEJO.quebrado, 4), onda: 'triangle', vol: 0.07, sustain: 0.4, curto: 0.4 },
      { notas: gerar(MEMORIA_ACORDES, BAIXO.longo, 2), onda: 'triangle', vol: 0.12, sustain: 0.7 },
    ],
  },
};
