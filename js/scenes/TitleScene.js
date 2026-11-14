// Tela de título: "Pressione qualquer tecla / toque para começar".

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, nightScenery, fadeTo } from '../systems/ui.js';
import { Input } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    Touch.setLayout(null);
    this.cameras.main.fadeIn(500, 18, 12, 26);
    const mem = this.registry.get('memorias') || {};
    const jogo = mem.jogo || {};
    const nomes = this.registry.get('nomes');

    this.scenery = nightScenery(this);

    // Os dois na colina, lado a lado
    const groundY = GAME_H - 64;
    this.ele = this.add.image(GAME_W / 2 - 18, groundY, 'ele_ph').setOrigin(0.5, 1).setScale(PX);
    this.ela = this.add.image(GAME_W / 2 + 18, groundY, 'ela_ph').setOrigin(0.5, 1).setScale(PX).setFlipX(true);
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        const h = this.add.image(GAME_W / 2, groundY - 80, 'heart').setScale(PX);
        this.tweens.add({ targets: h, y: h.y - 50, alpha: 0, duration: 1600, ease: 'Sine.easeOut', onComplete: () => h.destroy() });
      },
    });

    // Título com sombra em camadas
    const titulo = jogo.titulo || 'Nossa Jornada';
    const ty = 150;
    txt(this, GAME_W / 2, ty + 8, titulo, 80, '#5a1630', { shadow: false });
    this.title = txt(this, GAME_W / 2, ty, titulo, 80, '#ffd3df', { shadowColor: '#a8335a' });
    this.tweens.add({ targets: this.title, y: ty - 6, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    txt(this, GAME_W / 2, ty + 70, jogo.subtitulo || `${nomes.ele} & ${nomes.ela}`, 20, UI.gold);

    this.prompt = txt(this, GAME_W / 2, GAME_H - 150, 'Pressione qualquer tecla ou toque para começar', 20, UI.text);
    this.tweens.add({ targets: this.prompt, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    this.started = false;
    const go = () => this.start();
    this.offKey = Input.onAnyKey(go);
    this.input.once('pointerdown', go);
    this.events.once('shutdown', () => this.offKey());
  }

  start() {
    if (this.started) return;
    this.started = true;
    // No celular, tenta tela cheia e paisagem (se o navegador deixar)
    if (Touch.isTouch) {
      try {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) {
          const p = req.call(el);
          if (p && p.then) {
            p.then(() => {
              try {
                screen.orientation.lock('landscape').catch(() => {});
              } catch (e) {
                /* ok */
              }
            }).catch(() => {});
          }
        }
      } catch (e) {
        /* sem tela cheia */
      }
    }
    this.tweens.add({ targets: this.prompt, scale: 1.15, duration: 120, yoyo: true });
    fadeTo(this, 'Menu');
  }

  update(time, delta) {
    this.scenery.update(delta / 1000);
  }
}
