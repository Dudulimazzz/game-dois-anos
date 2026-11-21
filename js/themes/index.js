// Registro dos temas de fase. Cada arquivo em data/fases/ escolhe o seu com "tema".

import { teste } from './teste.js';
import { onibus } from './onibus.js';
import { rua } from './rua.js';
import { calcada } from './condominio.js';
import { bulls } from './bulls.js';

const THEMES = { teste, onibus, rua, calcada, bulls };

export function getTheme(name) {
  return THEMES[name] || teste;
}
