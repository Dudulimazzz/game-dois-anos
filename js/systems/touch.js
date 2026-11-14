// Controles de toque (celular): botões em HTML por cima do jogo.
// Cada dedo é rastreado separadamente, então dá para andar e pular ao mesmo tempo,
// e deslizar o dedo de um botão para outro funciona.

import { Input, isTouchDevice } from './controls.js';
import { PERSONAGENS } from '../config.js';

// Ícones em pixel art (SVG, grade 8x8)
function svg(rects) {
  const r = rects.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');
  return `<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}
const ICONS = {
  left: svg([[2, 3, 1, 2], [3, 2, 1, 4], [4, 1, 1, 6], [5, 0, 1, 8]]),
  right: svg([[5, 3, 1, 2], [4, 2, 1, 4], [3, 1, 1, 6], [2, 0, 1, 8]]),
  jump: svg([[3, 2, 2, 1], [2, 3, 4, 1], [1, 4, 6, 1], [0, 5, 8, 1]]),
  interact: svg([[3, 0, 2, 5], [3, 6, 2, 2]]),
  switch: svg([[1, 1, 1, 3], [0, 2, 3, 1], [1, 1, 5, 1], [6, 4, 1, 3], [5, 5, 3, 1], [2, 6, 5, 1]]),
};
const LABELS = { left: 'esquerda', right: 'direita', jump: 'pular', interact: 'interagir', switch: 'trocar' };

let root = null;
let layout = null;
let active = new Set(); // códigos pressionados pelo toque
let touchSeen = false;
let nomes = { ele: 'Ele', ela: 'Ela' };

function btn(code, icon, extra = '') {
  return `<button class="tbtn ${extra}" data-code="${code}" aria-label="${LABELS[icon]}">${ICONS[icon]}</button>`;
}

function render() {
  if (!root) return;
  const show = layout && (touchSeen || isTouchDevice());
  root.hidden = !show;
  root.className = layout ? `layout-${layout}` : '';
  if (!show) return;
  if (layout === 'um') {
    root.innerHTML = `
      <div class="tgroup tleft">${btn('T0_left', 'left')}${btn('T0_right', 'right')}</div>
      <div class="tgroup tright">
        ${btn('T_switch', 'switch', 'small')}
        ${btn('T0_interact', 'interact', 'small')}
        ${btn('T0_jump', 'jump', 'big')}
      </div>`;
  } else if (layout === 'dois') {
    root.innerHTML = `
      <div class="tside tside-ele" style="--cor:${PERSONAGENS.ele.corCss}">
        <span class="tname">${nomes.ele}</span>
        <div class="trow">${btn('T0_jump', 'jump')}${btn('T0_interact', 'interact', 'small')}</div>
        <div class="trow">${btn('T0_left', 'left')}${btn('T0_right', 'right')}</div>
      </div>
      <div class="tside tside-ela" style="--cor:${PERSONAGENS.ela.corCss}">
        <span class="tname">${nomes.ela}</span>
        <div class="trow">${btn('T1_interact', 'interact', 'small')}${btn('T1_jump', 'jump')}</div>
        <div class="trow">${btn('T1_left', 'left')}${btn('T1_right', 'right')}</div>
      </div>`;
  }
}

function update(e) {
  const now = new Set();
  for (const t of e.touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const b = el && el.closest ? el.closest('[data-code]') : null;
    if (b && root.contains(b)) now.add(b.dataset.code);
  }
  for (const c of active) if (!now.has(c)) Input.release(c);
  for (const c of now) if (!active.has(c)) Input.press(c);
  active = now;
  root.querySelectorAll('.tbtn').forEach((b) => b.classList.toggle('on', active.has(b.dataset.code)));
}

function releaseAll() {
  for (const c of active) Input.release(c);
  active = new Set();
  if (root) root.querySelectorAll('.tbtn.on').forEach((b) => b.classList.remove('on'));
}

export const Touch = {
  init() {
    root = document.getElementById('touch');
    const handler = (e) => {
      if (e.cancelable) e.preventDefault();
      update(e);
    };
    root.addEventListener('touchstart', handler, { passive: false });
    root.addEventListener('touchmove', handler, { passive: false });
    root.addEventListener('touchend', handler, { passive: false });
    root.addEventListener('touchcancel', handler, { passive: false });
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener(
      'touchstart',
      () => {
        if (!touchSeen) {
          touchSeen = true;
          render();
        }
      },
      { passive: true },
    );
    window.addEventListener('blur', releaseAll);
  },
  setLayout(l) {
    if (l === layout) return;
    releaseAll();
    layout = l;
    render();
  },
  setNames(ele, ela) {
    nomes = { ele, ela };
    render();
  },
  get isTouch() {
    return touchSeen || isTouchDevice();
  },
};
