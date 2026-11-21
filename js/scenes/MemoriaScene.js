// Tela de memória: aparece quando os dois chegam juntos na saída.
// Foto real, data e texto da fase (tudo em data/memorias.json), corações coletados
// e o coração grande da fase voando para a barra de progresso (7 no total).

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, Menu, heartBar, Pager, polaroid, queuePhoto, smoothPhoto } from '../systems/ui.js';
import { Input, BINDS } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Sfx, Music } from '../systems/sfx.js';
import { Progresso } from '../systems/progresso.js';

const COL_X = 478; // coluna do texto
const COL_W = 446;

export class MemoriaScene extends Phaser.Scene {
  constructor() {
    super('Memoria');
  }

  init(data) {
    this.level = data.level;
    this.primeiraVez = !!data.primeiraVez;
    // a cena é reaproveitada pelo Phaser: zera tudo a cada vez que ela abre
    this.afterDone = false;
    this.scoreShown = false;
    this.menuShown = false;
    this.doneFor = 0;
    this.leaving = false;
    this.typing = false;
    this.lastN = undefined;
    this.scoreText = null;
  }

  preload() {
    const f = this.level.faseMem || {};
    queuePhoto(this, `foto:${f.id}`, f.foto);
  }

  create() {
    Touch.setLayout(null);
    Music.play('memoria');
    const L = this.level;
    const f = L.faseMem || {};
    this.semMemoria = !f.id; // fase de teste: sem coração na barra
    const fases = Progresso.fases(this);
    const idx = Math.max(0, fases.findIndex((x) => x.id === f.id));
    smoothPhoto(this, `foto:${f.id}`);

    // --- fundo
    this.add.tileSprite(0, 0, GAME_W / PX, GAME_H / PX, 'sky_night').setOrigin(0).setScale(PX).setInteractive();
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x2a1030, 0.35).setOrigin(0);
    const rnd = new Phaser.Math.RandomDataGenerator(['memoria']);
    for (let i = 0; i < 45; i++) {
      const s = this.add.image(rnd.between(0, GAME_W / PX) * PX, rnd.between(0, GAME_H / PX) * PX, 'pixel').setScale(PX).setAlpha(rnd.realInRange(0.15, 0.6));
      this.tweens.add({ targets: s, alpha: 0.05, duration: rnd.between(900, 2400), yoyo: true, repeat: -1, delay: rnd.between(0, 1500) });
    }
    this.add.particles(0, 0, 'heart_small', {
      x: { min: 0, max: GAME_W },
      y: GAME_H + 10,
      lifespan: 10000,
      speedY: { min: -45, max: -25 },
      speedX: { min: -8, max: 8 },
      scale: { min: PX, max: PX * 1.5 },
      alpha: { start: 0.45, end: 0 },
      frequency: 900,
    });

    // --- barra de corações (progresso)
    const feitasAntes = fases.filter((x) => Progresso.feita(x.id) && !(this.primeiraVez && x.id === f.id)).length;
    this.bar = heartBar(this, GAME_W / 2, 44, Math.max(fases.length, 1), 0, { gap: 44 });
    // mostra cheios os corações das fases já concluídas (a desta fase só depois do voo, se for nova)
    fases.forEach((x, i) => {
      if (Progresso.feita(x.id) && !(this.primeiraVez && x.id === f.id)) this.bar.slots[i].full.setVisible(true);
    });
    this.feitasAntes = feitasAntes;

    // --- foto
    const px0 = 246, py0 = 298;
    this.photo = polaroid(this, px0, py0 + 400, 360, 340, {
      texture: `foto:${f.id}`,
      caption: f.legenda || f.data || '',
      placeholder: 'TODO: foto',
      angle: -2.5,
    });
    this.tweens.add({ targets: this.photo, y: py0, duration: 700, ease: 'Back.easeOut', delay: 150 });

    // --- textos
    let y = 92;
    txt(this, COL_X, y, this.semMemoria ? 'Fase de teste' : `Fase ${idx + 1} de ${fases.length}`, 20, UI.textDim, { ox: 0, oy: 0, shadow: false });
    y += 32;
    const nome = txt(this, COL_X, y, f.nome || L.lvl.nome, 40, UI.accent, { ox: 0, oy: 0, align: 'left', wrap: COL_W, lineSpacing: 0 });
    y += nome.height + 8;
    if (f.data) {
      txt(this, COL_X, y, f.data, 20, UI.gold, { ox: 0, oy: 0 });
      y += 34;
    }
    // separador com coraçãozinho
    const g = this.add.graphics();
    g.fillStyle(0x6e5a84, 1);
    g.fillRect(COL_X, y + 6, 190, PX);
    g.fillRect(COL_X + 226, y + 6, 190, PX);
    this.add.image(COL_X + 208, y + 7, 'heart').setScale(PX);
    y += 28;

    const corpo = txt(this, COL_X, y, '', 20, UI.text, { ox: 0, oy: 0, align: 'left', wrap: COL_W, lineSpacing: 8 });
    const maxLines = Math.max(2, Math.floor((410 - y) / 32));
    // setinha piscando quando há mais texto
    this.more = this.add.image(COL_X + COL_W - 8, 412, 'marker').setScale(PX).setVisible(false);
    this.tweens.add({ targets: this.more, y: 418, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.typing = false;
    this.pager = new Pager(this, corpo, f.texto || (this.semMemoria ? 'Fase concluída! (Esta fase não tem memória: é só para testes.)' : ''), maxLines, {
      speed: 42,
      onDone: () => this.afterText(),
      onWait: (on) => this.more.setVisible(on),
    });
    this.time.delayedCall(800, () => (this.typing = true));

    // --- corações coletados
    this.scoreRow = this.add.container(COL_X, 432).setAlpha(0);
    if (L.heartsTotal > 0) {
      this.scoreRow.add(this.add.image(12, 0, 'heart').setScale(PX * 1.5));
      this.scoreText = txt(this, 36, 0, '', 20, UI.text, { ox: 0 });
      this.scoreRow.add(this.scoreText);
      const best = Progresso.resultado(f.id);
      if (best && best.coracoes > L.heartsGot) {
        this.scoreRow.add(txt(this, 300, 0, `recorde: ${best.coracoes}`, 20, UI.textDim, { ox: 0, shadow: false }));
      }
    }

    // --- opções (aparecem no fim)
    const proxima = Progresso.proxima(this, f.id);
    const primeiro = this.semMemoria
      ? { label: 'Continuar', action: () => this.sair(() => L.goTo('Selecao', { mode: L.mode })) }
      : { label: proxima ? 'Continuar' : 'Abrir a carta', action: () => this.continuar(proxima) };
    this.menu = new Menu(
      this,
      [
        primeiro,
        { label: 'Jogar de novo', action: () => this.sair(() => L.restart()) },
        { label: 'Fases', action: () => this.sair(() => L.goTo('Selecao', { mode: L.mode })) },
      ],
      { y: 498, x: GAME_W / 2, gap: 260, size: 20, horizontal: true, intro: false },
    );
    this.menu.enabled = false;
    this.menuParts = this.menu.entries.flatMap((e) => [e.label, e.heartL, e.heartR]);
    this.menuParts.forEach((o) => o.setAlpha(0));

    // Apertar algo durante a escrita mostra o texto inteiro
    this.offKey = Input.onAnyKey(() => this.skip());
    this.input.on('pointerdown', () => this.skip());
    this.events.once('shutdown', () => this.offKey());

    this.cameras.main.fadeIn(450, 18, 12, 26);
  }

  skip() {
    if (this.typing && !this.pager.finished) this.pager.advance();
    // texto já completo e as opções ainda não apareceram: mostra agora
    else if (this.pager.finished && !this.menuShown) this.showScore(true);
  }

  afterText() {
    if (this.afterDone) return;
    this.afterDone = true;
    try {
      this.heartFlight();
    } catch (err) {
      console.error('[Memória] erro na animação do coração, mostrando as opções mesmo assim:', err);
      this.showScore(true);
    }
  }

  heartFlight() {
    if (this.semMemoria) {
      this.showScore();
      return;
    }
    const L = this.level;
    const f = L.faseMem || {};
    const idx = Math.max(0, Progresso.fases(this).findIndex((x) => x.id === f.id));
    const slot = this.bar.slots[idx];

    // Coração grande sai da foto e voa até a barra
    const start = { x: this.photo.x, y: this.photo.y - 20 };
    const big = this.add.image(start.x, start.y, 'heart_big').setScale(0.05).setDepth(50);
    this.tweens.chain({
      targets: big,
      tweens: [
        { scale: PX * 4, duration: 420, ease: 'Back.easeOut', delay: 250, onStart: () => Sfx.heart() },
        { scale: PX * 3.4, duration: 160, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' },
        {
          x: slot ? slot.x : GAME_W / 2,
          y: slot ? slot.y : 44,
          scale: PX,
          duration: 650,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            big.destroy();
            if (slot) {
              if (slot.full.visible) this.bar.pulse(idx);
              else this.bar.fill(idx);
              this.burst(slot.x, slot.y);
            }
            Sfx.ding();
            this.showScore();
          },
        },
      ],
    });
  }

  burst(x, y) {
    const p = this.add.particles(x, y, 'sparkle', {
      emitting: false,
      lifespan: 600,
      speed: { min: 60, max: 160 },
      scale: { start: PX, end: 0 },
    }).setDepth(51);
    p.explode(14);
    const h = this.add.particles(x, y, 'heart_small', {
      emitting: false,
      lifespan: 900,
      speed: { min: 40, max: 110 },
      gravityY: 120,
      scale: { start: PX, end: PX * 0.5 },
      alpha: { start: 1, end: 0 },
    }).setDepth(51);
    h.explode(8);
    this.time.delayedCall(1200, () => {
      p.destroy();
      h.destroy();
    });
  }

  showScore(agora = false) {
    if (this.scoreShown) {
      if (agora) this.showMenu();
      return;
    }
    this.scoreShown = true;
    const L = this.level;
    this.tweens.add({ targets: this.scoreRow, alpha: 1, duration: 300 });
    if (this.scoreText) {
      const c = { n: 0 };
      const total = L.heartsTotal;
      const fim = L.heartsGot;
      const frase = (n) => (fim === total && n === total ? `${n} de ${total} corações. Todos!` : `${n} de ${total} corações`);
      this.scoreText.setText(frase(0));
      if (fim > 0) {
        this.tweens.add({
          targets: c,
          n: fim,
          duration: Math.min(1200, 120 * fim),
          onUpdate: () => {
            const n = Math.round(c.n);
            if (n !== this.lastN) {
              this.lastN = n;
              this.scoreText.setText(frase(n));
              Sfx.blip(700 + n * 30);
            }
          },
          onComplete: () => this.scoreText.setText(frase(fim)),
        });
      }
    }
    if (agora) this.showMenu();
    else this.time.delayedCall(700, () => this.showMenu());
  }

  showMenu() {
    if (this.menuShown) return;
    this.menuShown = true;
    this.tweens.add({ targets: this.menuParts, alpha: 1, duration: 300 });
    this.menu.select(0);
    this.menu.reader.sync([...BINDS.menuOk, ...BINDS.menuLeft, ...BINDS.menuRight]);
    this.menu.enabled = true;
  }

  continuar(proxima) {
    const L = this.level;
    if (!proxima) {
      this.sair(() => L.goTo('Final', { mode: L.mode }));
    } else if (Progresso.pronta(this, proxima.id)) {
      this.sair(() => L.goTo('Transicao', { fase: proxima.id, mode: L.mode }));
    } else {
      this.sair(() => L.goTo('Selecao', { mode: L.mode, aviso: `"${proxima.nome}" ainda está em construção.` }));
    }
  }

  sair(fn) {
    if (this.leaving) return;
    this.leaving = true;
    this.menu.enabled = false;
    this.cameras.main.fadeOut(350, 18, 12, 26);
    this.cameras.main.once('camerafadeoutcomplete', fn);
  }

  update(time, delta) {
    if (this.typing) this.pager.update(Math.min(delta, 50) / 1000);
    // rede de segurança: as opções sempre aparecem, mesmo se alguma animação falhar
    if (this.pager.finished) {
      if (!this.afterDone) this.afterText();
      this.doneFor = (this.doneFor || 0) + delta;
      if (this.doneFor > 4500 && !this.menuShown) {
        console.warn('[Memória] as opções demoraram para aparecer; mostrando agora.');
        this.showScore(true);
      }
    }
    this.menu.update(time);
  }
}
