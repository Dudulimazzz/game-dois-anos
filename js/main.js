// Configuração do Phaser e registro das cenas.

import { GAME_W, GAME_H, GRAVITY } from './config.js';
import { Touch } from './systems/touch.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LevelBGScene } from './scenes/LevelBGScene.js';
import { LevelScene } from './scenes/LevelScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { FaseConcluidaScene } from './scenes/FaseConcluidaScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { HelpScene } from './scenes/HelpScene.js';

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
    scene: [BootScene, TitleScene, MenuScene, LevelBGScene, LevelScene, HUDScene, FaseConcluidaScene, PauseScene, HelpScene],
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
