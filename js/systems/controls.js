// Sistema de controles.
// Teclado e botões de toque alimentam o mesmo estado ("códigos" de tecla).
// Cada cena cria um InputReader, que detecta "acabou de apertar" sem perder
// toques rápidos, mesmo quando a física roda num ritmo diferente da tela.

const held = new Set();
const counts = new Map();

const BLOQUEAR_PADRAO = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab',
]);

let anyKeyListeners = [];

export const Input = {
  press(code) {
    if (!held.has(code)) {
      held.add(code);
      counts.set(code, (counts.get(code) || 0) + 1);
    }
  },
  release(code) {
    held.delete(code);
  },
  isHeld(code) {
    return held.has(code);
  },
  count(code) {
    return counts.get(code) || 0;
  },
  clear() {
    held.clear();
  },
  onAnyKey(fn) {
    anyKeyListeners.push(fn);
    return () => {
      anyKeyListeners = anyKeyListeners.filter((f) => f !== fn);
    };
  },
};

window.addEventListener('keydown', (e) => {
  if (BLOQUEAR_PADRAO.has(e.code)) e.preventDefault();
  if (e.repeat) return;
  Input.press(e.code);
  anyKeyListeners.slice().forEach((fn) => fn(e.code));
});
window.addEventListener('keyup', (e) => {
  Input.release(e.code);
});
window.addEventListener('blur', () => Input.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) Input.clear();
});

export class InputReader {
  constructor() {
    this.seen = new Map();
  }

  // Verdadeiro uma única vez por aperto de qualquer um dos códigos.
  pressed(codes) {
    let hit = false;
    for (const c of codes) {
      const n = Input.count(c);
      const s = this.seen.has(c) ? this.seen.get(c) : n;
      if (!this.seen.has(c)) this.seen.set(c, n);
      if (n > s) {
        hit = true;
        this.seen.set(c, n);
      }
    }
    return hit;
  }

  held(codes) {
    for (const c of codes) if (Input.isHeld(c)) return true;
    return false;
  }

  // Marca tudo como "já visto" (ex.: ao abrir um menu, ignora apertos antigos)
  sync(codes) {
    for (const c of codes) this.seen.set(c, Input.count(c));
  }
}

// Mapeamento de teclas.
// T0_* / T1_* são os botões de toque (T0 = Ele ou personagem ativo, T1 = Ela no modo 2 jogadores).
export const BINDS = {
  dois: [
    { left: ['KeyA', 'T0_left'], right: ['KeyD', 'T0_right'], jump: ['KeyW', 'T0_jump'], interact: ['KeyS', 'T0_interact'] },
    { left: ['ArrowLeft', 'T1_left'], right: ['ArrowRight', 'T1_right'], jump: ['ArrowUp', 'T1_jump'], interact: ['ArrowDown', 'T1_interact'] },
  ],
  um: {
    left: ['KeyA', 'ArrowLeft', 'T0_left'],
    right: ['KeyD', 'ArrowRight', 'T0_right'],
    jump: ['KeyW', 'ArrowUp', 'Space', 'T0_jump'],
    interact: ['KeyS', 'ArrowDown', 'KeyE', 'T0_interact'],
    switch: ['Tab', 'KeyQ', 'T_switch'],
  },
  pause: ['Escape', 'KeyP', 'T_pause'],
  menuUp: ['ArrowUp', 'KeyW'],
  menuDown: ['ArrowDown', 'KeyS'],
  menuOk: ['Enter', 'Space', 'NumpadEnter'],
  menuBack: ['Escape', 'Backspace'],
};

export const EMPTY_INPUT = Object.freeze({
  left: false, right: false, jumpHeld: false, jumpPressed: false, interactPressed: false,
});

// Lê o estado de um personagem a cada passo da física.
export class PlayerInput {
  constructor(reader, binds) {
    this.reader = reader;
    this.binds = binds;
    this.enabled = true;
  }
  read() {
    const b = this.binds;
    const r = this.reader;
    if (!this.enabled) return EMPTY_INPUT;
    return {
      left: r.held(b.left),
      right: r.held(b.right),
      jumpHeld: r.held(b.jump),
      jumpPressed: r.pressed(b.jump),
      interactPressed: r.pressed(b.interact),
    };
  }
}

export function isTouchDevice() {
  try {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  } catch (e) {
    return 'ontouchstart' in window;
  }
}
