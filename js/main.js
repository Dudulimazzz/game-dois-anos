// Configuração do Phaser e registro das cenas.

import { GAME_W, GAME_H, GRAVITY } from './config.js';
import { Touch } from './systems/touch.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelBGScene } from './scenes/LevelBGScene.js';
import { LevelScene } from './scenes/LevelScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { MemoriaScene } from './scenes/MemoriaScene.js';
import { SelecaoScene } from './scenes/SelecaoScene.js';
import { FinalScene } from './scenes/FinalScene.js';
import { CreditosScene } from './scenes/CreditosScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { HelpScene } from './scenes/HelpScene.js';
import { GaleriaScene } from './scenes/GaleriaScene.js';
import { TransicaoScene } from './scenes/TransicaoScene.js';

const debug = new URLSearchParams(window.location.search).has('debug');

// Escala inteira sempre que possível (pixels nítidos).
// Se a escala inteira desperdiçar muito da tela (ex.: celular), usa a escala que preencher melhor.
function fitZoom() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const z = Math.min(w / GAME_W, h / GAME_H);
  if (z >= 1) {
    const zi = Math.floor(z);
    if (zi / z >= 0.8) return zi;
  }
  return z;
}

// --- Proteção contra erros ---------------------------------------------------
// O Phaser roda o quadro e só depois agenda o próximo: um erro no meio congelaria o jogo inteiro.
// Aqui o erro é registrado, aparece numa caixinha discreta no canto da tela (para mandar print)
// e o jogo continua rodando.
const erros = [];
function mostrarErro(err) {
  const msg = (err && (err.stack || err.message)) || String(err);
  const primeira = msg.split('\n').slice(0, 3).join('\n');
  if (erros.includes(primeira)) return;
  erros.push(primeira);
  console.error('[Nossa Jornada] erro:', err);
  try {
    let box = document.getElementById('erro-jogo');
    if (!box) {
      box = document.createElement('pre');
      box.id = 'erro-jogo';
      box.title = 'Clique para fechar';
      box.addEventListener('click', () => box.remove());
      document.body.appendChild(box);
    }
    box.textContent = `Ops, aconteceu um erro (o jogo continua). Mande um print disto:\n\n${erros.join('\n\n')}`;
  } catch (e) {
    /* sem caixinha */
  }
}
window.addEventListener('error', (e) => mostrarErro(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => mostrarErro(e.reason));
try {
  const TS = Phaser.Core.TimeStep.prototype;
  const passo = TS.step;
  TS.step = function protegido(t) {
    try {
      passo.call(this, t);
    } catch (err) {
      mostrarErro(err);
    }
  };
} catch (e) {
  /* versão do Phaser sem TimeStep: segue sem a proteção */
}

async function start() {
  // Espera a fonte pixel carregar antes de criar os textos
  try {
    await Promise.race([
      document.fonts.load('20px "Pixelify Sans"', 'ãçéô'),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch (e) {
    /* segue com a fonte reserva */
  }

  Touch.init();
  const fill = document.getElementById('load-fill');
  if (fill) fill.style.width = '40%';

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#120c1a',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.NONE, zoom: fitZoom() },
    input: { activePointers: 4, keyboard: false },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: GRAVITY }, debug, fps: 60, fixedStep: true, tileBias: 12 },
    },
    scene: [BootScene, TitleScene, MenuScene, LevelBGScene, LevelScene, HUDScene, MemoriaScene, PauseScene, HelpScene, GaleriaScene, TransicaoScene, SelecaoScene, FinalScene, CreditosScene],
  });

  // Quando a tela é menor que o jogo, suaviza a redução (evita letras "comidas")
  const refit = () => {
    const z = fitZoom();
    game.scale.setZoom(z);
    if (game.canvas) game.canvas.classList.toggle('reduzido', z * (window.devicePixelRatio || 1) < 1);
  };
  game.events.once('ready', refit);
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', () => setTimeout(refit, 200));
  window.__game = game; // útil para depurar no console
}

start();
