// Seleção de fase: um caminho com as 7 fases (e a carta no fim).
// As fases vão sendo desbloqueadas conforme os dois concluem a anterior.
// Os personagens andam pelo caminho até a fase escolhida.

import { GAME_W, GAME_H, PX, UI } from '../config.js';
import { txt, panel, nightScenery, heartBar, fadeTo, confirmBox } from '../systems/ui.js';
import { InputReader, BINDS } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Sfx, Music } from '../systems/sfx.js';
import { Progresso } from '../systems/progresso.js';
import { ORIGIN_X, ORIGIN_Y } from '../systems/characters.js';

export class SelecaoScene extends Phaser.Scene {
  constructor() {
    super('Selecao');
  }

  init(data) {
    this.mode = data && data.mode === 'um' ? 'um' : 'dois';
    this.aviso = data && data.aviso;
    this.leaving = false;
    this.confirm = null;
    this.toastText = null;
  }

  create() {
    Touch.setLayout(null);
    Music.play('titulo');
    this.cameras.main.fadeIn(350, 18, 12, 26);
    this.scenery = nightScenery(this, { heartFreq: 1600 });
    this.leaving = false;

    const fases = Progresso.fases(this);
    this.fases = fases;

    // --- topo: barra de memórias
    const feitas = Progresso.quantasFeitas(this);
    this.bar = heartBar(this, GAME_W / 2, 40, fases.length, 0, { gap: 44 });
    fases.forEach((f, i) => this.bar.slots[i].full.setVisible(Progresso.feita(f.id)));
    txt(this, GAME_W / 2, 76, feitas === fases.length ? 'Todas as memórias!' : `${feitas} de ${fases.length} memórias`, 20, UI.textDim, { shadow: false });

    const voltar = txt(this, 28, 40, '< Menu', 20, UI.gold, { ox: 0 }).setInteractive({ useHandCursor: true });
    voltar.on('pointerdown', () => this.back());
    const reset = txt(this, GAME_W - 28, 40, 'Recomeçar', 20, UI.textDim, { ox: 1 }).setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => this.askReset());
    [voltar, reset].forEach((t) => {
      t.on('pointerover', () => t.setScale(1.08));
      t.on('pointerout', () => t.setScale(1));
    });

    // --- nós do caminho (fases + carta final)
    this.nodes = fases.map((f, i) => ({
      kind: 'fase',
      fase: f,
      idx: i,
      open: Progresso.desbloqueada(this, i),
      done: Progresso.feita(f.id),
      ready: Progresso.pronta(this, f.id),
    }));
    this.nodes.push({ kind: 'carta', idx: fases.length, open: Progresso.finalLiberado(this), done: Progresso.finalVisto(), ready: true });
    const n = this.nodes.length;
    const x0 = 92, x1 = GAME_W - 92;
    this.nodes.forEach((nd, i) => {
      nd.x = Math.round(x0 + ((x1 - x0) * i) / (n - 1));
      nd.y = Math.round(250 + Math.sin(i * 1.15 + 0.4) * 48);
    });
    this.drawRoad();
    this.nodes.forEach((nd, i) => this.drawNode(nd, i));

    // --- personagens
    const startIdx = this.pickStart();
    this.sel = startIdx;
    const nd = this.nodes[startIdx];
    this.ele = this.add.sprite(nd.x - 10, nd.y - 22, 'ele-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(PX).setDepth(10).play('ele-idle');
    this.ela = this.add.sprite(nd.x + 12, nd.y - 22, 'ela-sheet').setOrigin(ORIGIN_X, ORIGIN_Y).setScale(PX).setDepth(10).setFlipX(true).play('ela-idle');
    this.ela.anims.setProgress(0.4);

    // --- painel de informações
    const pw = 720, ph = 128;
    this.px0 = (GAME_W - pw) / 2;
    this.py0 = GAME_H - ph - 14;
    panel(this, this.px0, this.py0, pw, ph, { alpha: 0.94 });
    this.infoTop = txt(this, this.px0 + 28, this.py0 + 26, '', 20, UI.textDim, { ox: 0, shadow: false });
    this.infoName = txt(this, this.px0 + 28, this.py0 + 62, '', 40, UI.accent, { ox: 0 });
    this.infoLine = txt(this, this.px0 + 28, this.py0 + 102, '', 20, UI.text, { ox: 0 });
    this.playBtn = txt(this, this.px0 + pw - 30, this.py0 + 102, '', 20, UI.gold, { ox: 1 }).setInteractive({ useHandCursor: true });
    this.playBtn.on('pointerdown', () => this.play());
    this.playHeart = this.add.image(0, 0, 'heart').setScale(PX);

    this.reader = new InputReader();
    this.refreshInfo();

    if (this.aviso) this.toast(this.aviso);
  }

  pickStart() {
    // primeira fase desbloqueada e ainda não feita; senão, a última aberta
    let best = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const nd = this.nodes[i];
      if (!nd.open) break;
      best = i;
      if (!nd.done) return i;
    }
    return best;
  }

  drawRoad() {
    const g = this.add.graphics();
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const a = this.nodes[i], b = this.nodes[i + 1];
      const lit = a.done;
      const steps = Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 12);
      for (let k = 2; k < steps - 1; k++) {
        const t = k / steps;
        const x = Math.round((a.x + (b.x - a.x) * t) / PX) * PX;
        const y = Math.round((a.y + (b.y - a.y) * t) / PX) * PX;
        g.fillStyle(0x140d1c, 1);
        g.fillRect(x - PX * 2, y - PX, PX * 4, PX * 3);
        g.fillStyle(lit ? 0xffd36e : 0x6e5a84, 1);
        g.fillRect(x - PX, y - PX, PX * 2, PX * 2);
      }
    }
  }

  drawNode(nd, i) {
    const key = !nd.open ? 'medal_off' : nd.done ? 'medal_done' : 'medal_on';
    nd.medal = this.add.image(nd.x, nd.y, key).setScale(PX);
    if (!nd.open) {
      nd.icon = this.add.image(nd.x, nd.y, 'padlock').setScale(PX);
    } else if (nd.kind === 'carta') {
      nd.icon = this.add.image(nd.x, nd.y, 'envelope').setScale(PX);
    } else if (nd.done) {
      nd.icon = this.add.image(nd.x, nd.y, 'heart_big').setScale(PX * 1.2);
    } else {
      nd.icon = txt(this, nd.x, nd.y - 1, String(i + 1), 20, UI.text);
    }
    if (nd.open && !nd.ready) this.add.image(nd.x + 16, nd.y + 14, 'cone').setScale(PX);
    // fase aberta e não feita brilha de leve
    if (nd.open && !nd.done) {
      this.tweens.add({ targets: nd.medal, scale: PX * 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    const zone = this.add.zone(nd.x, nd.y - 20, 80, 110).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      if (this.leaving || this.confirm) return;
      if (this.sel === i) this.play();
      else this.select(i);
    });
  }

  select(i) {
    i = Phaser.Math.Clamp(i, 0, this.nodes.length - 1);
    if (i === this.sel) return;
    const from = this.nodes[this.sel];
    const to = this.nodes[i];
    this.sel = i;
    Sfx.click();
    this.refreshInfo();
    const dir = to.x > from.x ? 1 : -1;
    const dur = Math.min(700, 220 + Math.abs(to.x - from.x) * 0.9);
    [[this.ele, -10, 0], [this.ela, 12, 60]].forEach(([s, off, delay]) => {
      this.tweens.killTweensOf(s);
      s.setFlipX(dir < 0);
      s.play(`${s === this.ele ? 'ele' : 'ela'}-walk`, true);
      this.tweens.add({
        targets: s,
        x: to.x + off,
        y: to.y - 22,
        duration: dur,
        delay,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          const id = s === this.ele ? 'ele' : 'ela';
          s.play(`${id}-idle`);
          s.setFlipX(id === 'ela'); // ficam virados um para o outro
        },
      });
    });
  }

  refreshInfo() {
    const nd = this.nodes[this.sel];
    let top, name, line, play;
    if (nd.kind === 'carta') {
      top = 'Final';
      name = 'A carta';
      line = nd.open ? 'Para ler de novo quando quiser' : 'Termine todas as fases para abrir';
      play = nd.open ? 'Abrir' : '';
    } else {
      const f = nd.fase;
      top = `Fase ${nd.idx + 1}`;
      name = nd.open ? f.nome : '???';
      if (!nd.open) {
        line = 'Termine a fase anterior para desbloquear';
        play = '';
      } else if (!nd.ready) {
        line = 'Em construção';
        play = '';
      } else {
        const r = Progresso.resultado(f.id);
        const partes = [];
        if (f.data) partes.push(f.data);
        if (r && r.total > 0) partes.push(`${r.coracoes}/${r.total} corações`);
        if (!r) partes.push('Nova!');
        line = partes.join('  ·  ');
        play = r ? 'Jogar de novo' : 'Jogar';
      }
    }
    this.infoTop.setText(top);
    this.infoName.setText(name);
    // nome comprido demais para o painel: usa a fonte menor
    this.infoName.setFontSize(40);
    if (this.infoName.width > 520) this.infoName.setFontSize(20);
    this.infoLine.setText(line).setColor(nd.open && nd.ready ? UI.text : UI.textDim);
    if (this.infoLine.width > 440 && play) this.infoLine.setText(line.split('  ·  ').slice(-1)[0]);
    this.playBtn.setText(play);
    this.playHeart.setVisible(!!play);
    this.playHeart.setPosition(this.playBtn.x - this.playBtn.width - 18, this.playBtn.y);
  }

  play() {
    if (this.leaving || this.confirm) return;
    const nd = this.nodes[this.sel];
    if (!nd.open || !nd.ready) {
      Sfx.thud();
      this.tweens.add({ targets: nd.medal, x: nd.x + 4, duration: 50, yoyo: true, repeat: 2, onComplete: () => nd.medal.setX(nd.x) });
      if (nd.open && !nd.ready) this.toast('Essa fase ainda está em construção.');
      return;
    }
    this.leaving = true;
    Sfx.ding();
    this.tweens.add({ targets: this.playBtn, scale: 1.15, duration: 90, yoyo: true });
    ['ele', 'ela'].forEach((id) => this[id].play(`${id}-celebrate`));
    this.time.delayedCall(450, () => {
      if (nd.kind === 'carta') fadeTo(this, 'Final', { mode: this.mode });
      else fadeTo(this, 'Transicao', { fase: nd.fase.id, mode: this.mode });
    });
  }

  toast(msg) {
    if (this.toastText) this.toastText.destroy();
    const t = txt(this, GAME_W / 2, 128, msg, 20, UI.gold).setDepth(50).setAlpha(0);
    this.toastText = t;
    this.tweens.chain({
      targets: t,
      tweens: [
        { alpha: 1, y: 122, duration: 200 },
        { alpha: 0, duration: 400, delay: 2400 },
      ],
    });
  }

  askReset() {
    if (this.leaving || this.confirm) return;
    this.confirm = confirmBox(
      this,
      'Recomeçar do zero?\nTodas as fases voltam a ficar bloqueadas e os corações são zerados.',
      () => {
        Progresso.recomecar();
        this.confirm = null;
        this.scene.restart({ mode: this.mode, aviso: 'Progresso apagado. Uma nova jornada!' });
      },
      () => {
        this.reader.sync([...BINDS.menuBack, ...BINDS.menuOk, ...BINDS.menuLeft, ...BINDS.menuRight, ...BINDS.menuUp, ...BINDS.menuDown]);
        this.time.delayedCall(0, () => (this.confirm = null));
      },
    );
  }

  back() {
    if (this.leaving || this.confirm) return;
    this.leaving = true;
    fadeTo(this, 'Menu');
  }

  update(time, delta) {
    this.scenery.update(delta / 1000);
    if (this.confirm) {
      if (this.reader.pressed(BINDS.menuBack)) this.confirm.cancel();
      else this.confirm.update(time);
      return;
    }
    if (this.leaving) return;
    const r = this.reader;
    if (r.pressed([...BINDS.menuLeft, ...BINDS.menuUp])) this.select(this.sel - 1);
    if (r.pressed([...BINDS.menuRight, ...BINDS.menuDown])) this.select(this.sel + 1);
    if (r.pressed(BINDS.menuOk)) this.play();
    if (r.pressed(BINDS.menuBack)) this.back();
  }
}
