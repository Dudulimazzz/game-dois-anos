// Cena de fase: monta o mapa a partir do texto, cria personagens e mecanismos,
// e roda a lógica a cada passo da física.

import { TILE, PERSONAGENS } from '../config.js';
import { parseLevel } from '../systems/levelLoader.js';
import { getTheme } from '../themes/index.js';
import { Dialog } from '../systems/dialog.js';
import { Sfx, Music } from '../systems/sfx.js';
import { createFx } from '../systems/fx.js';
import { CoopCamera, MAX_SPAN } from '../systems/camera.js';
import { InputReader, PlayerInput, BINDS, EMPTY_INPUT } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Save } from '../systems/save.js';
import { Progresso } from '../systems/progresso.js';
import { Player } from '../objects/Player.js';
import { Box } from '../objects/Box.js';
import { PressureButton, Lever, Door } from '../objects/Mechanisms.js';
import { Heart, Checkpoint, Spikes, Exit } from '../objects/Pickups.js';

export class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  init(data) {
    this.mode = data.mode === 'um' ? 'um' : 'dois';
    this.faseKey = data.fase || 'teste';
    this.skipHelp = !!data.skipHelp;
  }

  preload() {
    const key = `fase:${this.faseKey}`;
    if (!this.cache.json.exists(key)) this.load.json(key, `data/fases/${this.faseKey}.json`);
  }

  create() {
    const raw = this.cache.json.get(`fase:${this.faseKey}`);
    const theme = getTheme(raw.tema);
    this.theme = theme;
    if (theme.textures) theme.textures(this);
    const lvl = parseLevel(raw, theme);
    this.lvl = lvl;
    this.worldW = lvl.cols * TILE;
    this.worldH = lvl.rows * TILE;
    this.done = false;
    this.heartsGot = 0;
    this.heartsTotal = lvl.hearts.length;
    this.nomes = this.registry.get('nomes');

    this.scene.launch('LevelBG', { level: this, theme });
    this.scene.sendToBack('LevelBG');

    this.fx = createFx(this);

    // --- mapa
    // Repete a última linha do mapa para baixo: quando a câmera afasta o zoom,
    // aparece chão (ou buraco sem fundo) em vez do céu embaixo da fase.
    const PAD = 14;
    const data = lvl.tiles.map((r) => r.slice());
    for (let i = 0; i < PAD; i++) data.push(lvl.tiles[lvl.rows - 1].slice());
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage(theme.tileset, theme.tileset, TILE, TILE, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0).setDepth(2);
    const oneway = theme.oneway || [];
    this.layer.setCollisionByExclusion([-1, ...oneway]);
    this.layer.forEachTile((t) => {
      if (oneway.includes(t.index)) t.setCollision(false, false, true, false);
    });
    if (theme.decorate) theme.decorate(this, lvl);
    const ok = theme.objects || {};

    // --- objetos
    this.doors = lvl.doors.map((d) => new Door(this, d.c, d.r, d.height, this.fx, ok.door));
    this.buttons = lvl.buttons.map((b) => new PressureButton(this, b.c, b.r, this.fx));
    this.levers = lvl.levers.map((l) => new Lever(this, l.c, l.r, this.fx, ok.lever));
    this.boxes = lvl.boxes.map((b, i) => {
      const box = new Box(this, b.c, b.r, ok.box);
      const lim = (lvl.data.caixas || [])[i];
      if (lim && lim.min !== undefined) box.minX = lim.min * TILE;
      if (lim && lim.max !== undefined) box.maxX = (lim.max + 1) * TILE;
      return box;
    });
    this.spikes = lvl.spikes.map((s) => new Spikes(this, s.c, s.r));
    this.checkpoints = lvl.checkpoints.map((k) => new Checkpoint(this, k.c, k.r, this.fx, ok.checkpoint));
    this.hearts = lvl.hearts.map((h) => new Heart(this, h.c, h.r, this.fx));
    this.exit = lvl.exitCells.length ? new Exit(this, lvl.exitCells, this.fx, ok) : null;
    this.wireMechanisms(lvl.links);

    // --- personagens
    const s1 = lvl.starts.ele, s2 = lvl.starts.ela;
    this.ele = new Player(this, PERSONAGENS.ele, this.nomes.ele, s1.c * TILE + 8, (s1.r + 1) * TILE, this.fx);
    this.ela = new Player(this, PERSONAGENS.ela, this.nomes.ela, s2.c * TILE + 8, (s2.r + 1) * TILE, this.fx);
    this.players = [this.ele, this.ela];
    this.active = this.ele;

    // --- diálogos (textos em data/memorias.json)
    const mem = this.registry.get('memorias') || {};
    const faseMem = (mem.fases || []).find((f) => f.id === lvl.memoria) || {};
    this.faseMem = faseMem;
    this.dialogos = faseMem.dialogos || {};
    this.dialog = new Dialog(this, { ele: this.ele, ela: this.ela });
    this.triggers = lvl.triggers.map((t) => ({ ...t, fired: false }));
    this.eventsFired = new Set();

    // --- colisões
    const zones = this.players.map((p) => p.zone);
    const boxSprites = this.boxes.map((b) => b.sprite);
    const doorSprites = this.doors.map((d) => d.sprite);
    // plataformas "só por cima" podem ser atravessadas quando alguém não cabe em cima delas
    this.oneway = oneway;
    // Plataforma "só por cima" de verdade: segura só quem estava acima dela no passo anterior
    // (sem isso, a física "puxava" para cima quem chegasse a até 12 px abaixo da plataforma).
    this.physics.add.collider(zones, this.layer, null, (z, t) => {
      if (!oneway.includes(t.index)) return true;
      if (z.player.dropThrough > 0) return false;
      return z.body.prev.y + z.body.height <= t.pixelY + 2;
    });
    this.physics.add.collider(boxSprites, this.layer);
    this.physics.add.collider(zones, doorSprites);
    this.physics.add.collider(boxSprites, doorSprites);
    this.physics.add.collider(boxSprites, boxSprites);
    this.physics.add.collider(zones, boxSprites, (z, bx) => this.onPlayerBox(z.player, bx.box));
    // Um pode subir na cabeça do outro (mas eles atravessam de lado)
    this.physics.add.overlap(zones[0], zones[1], null, (a, b) => this.stackPlayers(a.player, b.player));

    // --- controles
    this.reader = new InputReader();
    if (this.mode === 'dois') {
      this.inputs = [new PlayerInput(this.reader, BINDS.dois[0]), new PlayerInput(this.reader, BINDS.dois[1])];
    } else {
      this.soloInput = new PlayerInput(this.reader, BINDS.um);
    }
    Touch.setNames(this.nomes.ele, this.nomes.ela);
    Touch.setLayout(this.mode);

    // --- câmera
    this.coopCam = new CoopCamera(this, this.players, this.worldW, this.worldH + PAD * TILE, this.mode, this.worldH);
    this.marker = this.add.image(0, 0, 'marker').setDepth(16).setVisible(this.mode === 'um');
    this.nameTags = this.players.map((p) =>
      this.add
        .text(0, 0, p.nome, { fontFamily: '"Pixelify Sans"', fontSize: '10px', color: p.def.corCss })
        .setOrigin(0.5, 1)
        .setResolution(2)
        .setDepth(16)
        .setShadow(1, 1, '#1b1326', 0, false, true),
    );
    this.tagAlpha = 1;
    this.time.delayedCall(2500, () => this.tweens.add({ targets: this, tagAlpha: 0, duration: 800 }));

    this.physics.world.on('worldstep', this.step, this);
    this.events.once('shutdown', () => {
      if (this.physics.world) this.physics.world.off('worldstep', this.step, this);
      this.dialog.destroy();
      Touch.setLayout(null);
    });

    this.scene.launch('HUD', { level: this });
    Music.play(theme.musica || 'onibus');
    // cena de abertura do tema (ex.: o ônibus chegando no ponto)
    if (theme.start) theme.start(this);
    this.cameras.main.fadeIn(400, 18, 12, 26);

    // Mostra os controles na primeira vez de cada modo
    const chave = `ajudaVista_${this.mode}`;
    if (!this.skipHelp && !Save.get(chave, false)) {
      Save.set(chave, true);
      this.time.delayedCall(450, () => this.openHelp());
    }
  }

  // Ligações: B1, L1, P1... contados da esquerda para a direita
  wireMechanisms(links) {
    const sources = {};
    this.buttons.forEach((b, i) => (sources[`B${i + 1}`] = b));
    this.levers.forEach((l, i) => (sources[`L${i + 1}`] = l));
    if (links && links.length) {
      for (const l of links) {
        const door = this.doors[parseInt(String(l.para).replace(/\D/g, ''), 10) - 1];
        const src = sources[String(l.de).toUpperCase()];
        if (door && src) door.sources.push(src);
        else console.warn('Ligação inválida na fase:', l);
      }
    } else {
      const all = [...this.buttons, ...this.levers];
      this.doors.forEach((d) => (d.sources = all));
    }
  }

  onPlayerBox(p, box) {
    const pb = p.body, bb = box.body;
    if (pb.touching.down && bb.touching.up) p.standingOn = bb;
  }

  // Colisão "só por cima" entre os personagens
  stackPlayers(a, b) {
    for (const [up, low] of [[a, b], [b, a]]) {
      const ub = up.body, lb = low.body;
      if (!ub.enable || !lb.enable) continue;
      const prevBottom = ub.prev.y + ub.height;
      if (ub.velocity.y >= lb.velocity.y - 1 && prevBottom <= lb.prev.y + 4) {
        ub.position.y = lb.position.y - ub.height;
        ub.velocity.y = lb.velocity.y > 0 ? lb.velocity.y : 0;
        ub.blocked.down = true;
        ub.updateCenter();
        up.standingOn = lb;
        return false;
      }
    }
    return false;
  }

  // Impede alguém de "se espremer" por um vão mais baixo que ele (a física separa pelo
  // menor eixo e deixaria a cabeça atravessar o teto de um vão de 2 blocos):
  // se o corpo ficou dentro de uma parede sólida, desfaz o movimento horizontal.
  keepOutOfWalls(p) {
    const b = p.body;
    if (!b.enable || p.frozen) return;
    const insideAt = (x, y) =>
      this.layer
        .getTilesWithinWorldXY(x + 1, y + 1, b.width - 2, b.height - 2)
        .some((t) => t.index >= 0 && t.collideLeft && t.collideRight && t.collideDown);
    if (!insideAt(b.x, b.y)) return;
    const wasInside = insideAt(b.prev.x, b.prev.y);
    // 1) tentou entrar de lado num vão mais baixo que ele: desfaz o passo
    if (!wasInside && b.x !== b.prev.x) {
      b.x = b.prev.x;
      b.velocity.x = 0;
      b.updateCenter();
      if (!insideAt(b.x, b.y)) return;
    }
    // 2) já está num lugar sem espaço para a cabeça.
    //    Em cima de corrimão/toldo: atravessa para baixo e cai.
    //    Em qualquer outro lugar: não trava; ele pode andar normalmente para sair dali.
    const under = this.layer.getTileAtWorldXY(b.center.x, b.bottom + 1);
    if (under && this.oneway.includes(under.index)) {
      p.dropThrough = 0.3;
      b.y += 3;
      b.velocity.y = Math.max(b.velocity.y, 60);
      b.updateCenter();
    }
  }

  // Lógica por passo de física
  step(delta) {
    const dt = delta > 1 ? delta / 1000 : delta;
    if (this.done) {
      this.players.forEach((p) => p.step(dt, EMPTY_INPUT));
      // cena final: caminham até ficar lado a lado, um de frente para o outro
      this.players.forEach((p) => {
        if (p.finalX === undefined || !p.onGround) return;
        const dx = p.finalX - p.x;
        p.body.velocity.x = Math.abs(dx) > 0.6 ? Phaser.Math.Clamp(dx * 5, -45, 45) : 0;
        if (Math.abs(dx) <= 0.6) p.facing = p.finalFacing;
      });
      this.players.forEach((p) => p.endStep());
      return;
    }

    // Entrada
    let inputs;
    if (this.mode === 'dois') {
      inputs = [this.inputs[0].read(), this.inputs[1].read()];
    } else {
      if (this.reader.pressed(BINDS.um.switch)) this.switchActive();
      const i = this.soloInput.read();
      inputs = this.active === this.ele ? [i, EMPTY_INPUT] : [EMPTY_INPUT, i];
    }

    // Coleira no modo 2 jogadores: não deixa se afastarem além do que a câmera mostra
    const opts = [{}, {}];
    if (this.mode === 'dois') {
      const dx = this.ele.x - this.ela.x;
      if (Math.abs(dx) > MAX_SPAN) {
        const left = dx < 0 ? 0 : 1;
        opts[left].blockLeft = true;
        opts[1 - left].blockRight = true;
      }
    }
    this.players.forEach((p, k) => p.step(dt, inputs[k], opts[k]));
    this.players.forEach((p) => {
      if (p.dropThrough > 0) p.dropThrough -= dt;
      this.keepOutOfWalls(p);
    });

    // Interagir com alavancas
    this.players.forEach((p, k) => {
      if (!inputs[k].interactPressed) return;
      const lever = this.levers.find((l) => l.near(p.body));
      if (lever) {
        lever.toggle();
        if (this.theme.onLever) this.theme.onLever(this, lever);
      }
    });

    this.boxes.forEach((b) => b.step(dt, this.worldH, this.fx));

    const bodies = [...this.players.map((p) => p.body), ...this.boxes.map((b) => b.body)];
    this.buttons.forEach((b) => b.update(bodies));
    this.doors.forEach((d) => d.update(dt, bodies));
    this.checkpoints.forEach((c) => c.update(this.players));

    // Perigos: espinhos e queda
    for (const p of this.players) {
      if (p.frozen) continue;
      if (p.body.top > this.worldH + 8 || this.spikes.some((s) => s.hits(p.body))) p.respawn();
    }

    const pBodies = this.players.map((p) => p.body);
    const time = this.time.now;
    this.hearts.forEach((h) => {
      if (h.update(pBodies, time)) this.heartsGot++;
    });

    this.checkTriggers();

    // Saída: os dois juntos
    if (this.exit) {
      const n = this.players.filter((p) => !p.frozen && this.exit.inside(p.body)).length;
      this.exitCount = n;
      if (n === 2) this.complete();
    }

    this.players.forEach((p) => p.endStep());
  }

  say(key) {
    const lines = this.dialogos[key];
    if (lines) this.dialog.play(lines);
  }

  // Diálogos disparados por lugar (gatilhos no mapa) e por eventos (botão, porta...)
  checkTriggers() {
    for (const t of this.triggers) {
      if (t.fired) continue;
      const who = t.quem === 'ela' ? [this.ela] : t.quem === 'ele' ? [this.ele] : this.players;
      const hit = who.some((p) => !p.frozen && p.x >= t.c * TILE && p.x < (t.c + 1) * TILE && Math.abs(p.feet - (t.r + 1) * TILE) < 48);
      if (hit) {
        t.fired = true;
        this.say(t.dialogo);
      }
    }
    const ev = this.lvl.data.eventos;
    if (!ev) return;
    const check = (name, on) => {
      if (on && ev[name] && !this.eventsFired.has(name)) {
        this.eventsFired.add(name);
        this.say(ev[name]);
      }
    };
    this.buttons.forEach((b, i) => check(`B${i + 1}`, b.active));
    this.levers.forEach((l, i) => check(`L${i + 1}`, l.active));
    this.doors.forEach((d, i) => check(`P${i + 1}`, d.open >= 1));
  }

  switchActive() {
    this.active = this.active === this.ele ? this.ela : this.ele;
    this.fx.sparkle(this.active.x, this.active.feet - this.active.def.h - 4, 5);
    Sfx.switchChar(this.active.id);
    this.active.squash = { x: 1.2, y: 0.85 };
  }

  complete() {
    if (this.done) return;
    this.done = true;
    // salva já, antes da tela de memória (se fecharem o navegador, o progresso fica)
    this.primeiraVez = this.lvl.memoria ? Progresso.concluir(this.lvl.memoria, this.heartsGot, this.heartsTotal) : false;
    const fin = this.lvl.data.final;
    // final especial feito pelo tema (ex.: sentar à mesa e comer no Bulls)
    if (fin && fin.cena && this.theme.finale) {
      if (this.exit && this.exit.open) this.exit.open();
      this.dialog.destroy();
      this.players.forEach((p) => {
        p.frozen = true;
        p.body.setVelocity(0, 0);
      });
      this.theme.finale(this, fin, () => this.openMemoria());
      return;
    }
    if (fin && fin.comemorar === false) {
      // final em cena: os dois lado a lado, um olhando para o outro
      this.exit.open();
      Sfx.ding();
      const [a, b] = this.ele.x <= this.ela.x ? [this.ele, this.ela] : [this.ela, this.ele];
      const mid = (a.x + b.x) / 2;
      a.finalX = Math.min(a.x, mid - 9);
      b.finalX = Math.max(b.x, mid + 9);
      a.finalFacing = 1;
      b.finalFacing = -1;
      a.facing = 1;
      b.facing = -1;
      this.dialog.destroy();
      this.time.delayedCall(500, () => {
        this.dialog.play(this.dialogos[fin.dialogo] || [], () => {
          if (fin.beijo) {
            this.kiss(a, b, mid);
            return;
          }
          this.fx.hearts(this.exit.cx, this.exit.bottom - 40, 6);
          this.time.delayedCall(900, () => {
            this.openMemoria();
          });
        });
      });
      return;
    }
    if (this.exit.open) this.exit.open();
    Sfx.fanfare();
    this.players.forEach((p) => p.celebrate());
    this.fx.hearts(this.exit.cx, this.exit.bottom - 30, 14);
    this.time.delayedCall(400, () => this.fx.hearts(this.exit.cx - 10, this.exit.bottom - 40, 10));
    this.time.delayedCall(800, () => this.fx.hearts(this.exit.cx + 10, this.exit.bottom - 40, 10));
    this.time.delayedCall(2200, () => this.openMemoria());
  }

  // O beijo: os dois chegam pertinho, um coração grande aparece entre eles e sobem coraçõezinhos
  kiss(a, b, mid) {
    a.finalX = mid - 5;
    b.finalX = mid + 5;
    this.time.delayedCall(900, () => {
      a.squash = { x: 1.08, y: 0.94 };
      b.squash = { x: 1.08, y: 0.94 };
      Sfx.heart();
      const top = Math.min(a.feet - a.def.h, b.feet - b.def.h) - 6;
      const big = this.add.image(mid, top, 'heart_big').setScale(0.05).setDepth(30);
      this.tweens.add({ targets: big, scale: 1.6, duration: 500, ease: 'Back.easeOut' });
      this.tweens.add({ targets: big, y: top - 26, alpha: 0, duration: 1400, delay: 1100, ease: 'Sine.easeIn' });
      for (let k = 0; k < 6; k++) {
        this.time.delayedCall(250 + k * 260, () => this.fx.hearts(mid + Phaser.Math.Between(-10, 10), top + 6, 4));
      }
      this.time.delayedCall(700, () => Sfx.ding());
      this.time.delayedCall(3000, () => this.openMemoria());
    });
  }

  openMemoria() {
    this.scene.pause();
    this.scene.pause('HUD');
    this.scene.launch('Memoria', { level: this, primeiraVez: this.primeiraVez });
  }

  openPause() {
    if (this.done || !this.scene.isActive()) return;
    this.scene.pause();
    this.scene.pause('HUD');
    Sfx.pause();
    Music.duck(true);
    this.scene.launch('Pause', { level: this });
  }

  openHelp() {
    if (this.done || !this.scene.isActive()) return;
    this.scene.pause();
    this.scene.pause('HUD');
    this.scene.launch('Help', { mode: this.mode, returnTo: 'Level' });
  }

  // Ignora apertos feitos enquanto um menu estava aberto
  syncInputs() {
    const all = [...BINDS.pause, ...Object.values(BINDS.um).flat(), ...BINDS.dois.flatMap((b) => Object.values(b).flat())];
    this.reader.sync(all);
  }

  stopOverlays() {
    ['HUD', 'LevelBG', 'Pause', 'Help', 'Memoria'].forEach((k) => this.scene.stop(k));
  }

  restart() {
    this.stopOverlays();
    this.scene.restart({ fase: this.faseKey, mode: this.mode, skipHelp: true });
  }

  toMenu() {
    this.goTo('Menu');
  }

  // Sai da fase para outra cena (seleção, transição, final...)
  goTo(key, data) {
    this.stopOverlays();
    this.scene.start(key, data);
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.reader.pressed(BINDS.pause)) {
      this.openPause();
      return;
    }

    this.players.forEach((p) => p.render(dt, time));
    if (this.theme.update) this.theme.update(this, dt);
    this.dialog.update(dt);
    this.coopCam.update(dt, this.active);
    if (this.exit) this.exit.update(dt, time, this.exitCount || 0);

    // Indicadores
    if (this.mode === 'um') {
      const a = this.active;
      this.marker.setTint(a.def.cor);
      this.marker.setPosition(Math.round(a.x), Math.round(a.feet - a.def.h - 7 + Math.sin(time / 160) * 1.5));
      this.players.forEach((p) => {
        if (!p.frozen) p.sprite.setAlpha(p === a ? 1 : 0.85);
      });
    }
    this.nameTags.forEach((t, i) => {
      const p = this.players[i];
      t.setPosition(Math.round(p.x), Math.round(p.feet - p.def.h - (this.mode === 'um' && p === this.active ? 13 : 4)));
      t.setAlpha(this.tagAlpha);
    });
    // Mostrar dica de alavanca quando alguém está perto
    this.levers.forEach((l) => l.showHint(this.players.some((p) => l.near(p.body)), time));
  }
}
