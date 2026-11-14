// Cena de fase: monta o mapa a partir do texto, cria personagens e mecanismos,
// e roda a lógica a cada passo da física.

import { TILE, PERSONAGENS } from '../config.js';
import { parseLevel } from '../systems/levelLoader.js';
import { TILE_PLANK } from '../systems/textures.js';
import { createFx } from '../systems/fx.js';
import { CoopCamera, MAX_SPAN } from '../systems/camera.js';
import { InputReader, PlayerInput, BINDS, EMPTY_INPUT } from '../systems/controls.js';
import { Touch } from '../systems/touch.js';
import { Save } from '../systems/save.js';
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
    const lvl = parseLevel(this.cache.json.get(`fase:${this.faseKey}`));
    this.lvl = lvl;
    this.worldW = lvl.cols * TILE;
    this.worldH = lvl.rows * TILE;
    this.done = false;
    this.heartsGot = 0;
    this.heartsTotal = lvl.hearts.length;
    this.nomes = this.registry.get('nomes');

    this.scene.launch('LevelBG', { level: this });
    this.scene.sendToBack('LevelBG');

    this.fx = createFx(this);

    // --- mapa
    // Repete a última linha do mapa para baixo: quando a câmera afasta o zoom,
    // aparece chão (ou buraco sem fundo) em vez do céu embaixo da fase.
    const PAD = 14;
    const data = lvl.tiles.map((r) => r.slice());
    for (let i = 0; i < PAD; i++) data.push(lvl.tiles[lvl.rows - 1].slice());
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    this.layer = map.createLayer(0, tileset, 0, 0).setDepth(2);
    this.layer.setCollisionByExclusion([-1, TILE_PLANK]);
    this.layer.forEachTile((t) => {
      if (t.index === TILE_PLANK) t.setCollision(false, false, true, false);
    });

    // --- objetos
    this.doors = lvl.doors.map((d) => new Door(this, d.c, d.r, d.height, this.fx));
    this.buttons = lvl.buttons.map((b) => new PressureButton(this, b.c, b.r, this.fx));
    this.levers = lvl.levers.map((l) => new Lever(this, l.c, l.r, this.fx));
    this.boxes = lvl.boxes.map((b) => new Box(this, b.c, b.r));
    this.spikes = lvl.spikes.map((s) => new Spikes(this, s.c, s.r));
    this.checkpoints = lvl.checkpoints.map((k) => new Checkpoint(this, k.c, k.r, this.fx));
    this.hearts = lvl.hearts.map((h) => new Heart(this, h.c, h.r, this.fx));
    this.exit = lvl.exitCells.length ? new Exit(this, lvl.exitCells, this.fx) : null;
    this.wireMechanisms(lvl.links);

    // --- personagens
    const s1 = lvl.starts.ele, s2 = lvl.starts.ela;
    this.ele = new Player(this, PERSONAGENS.ele, this.nomes.ele, s1.c * TILE + 8, (s1.r + 1) * TILE, this.fx);
    this.ela = new Player(this, PERSONAGENS.ela, this.nomes.ela, s2.c * TILE + 8, (s2.r + 1) * TILE, this.fx);
    this.players = [this.ele, this.ela];
    this.active = this.ele;

    // --- colisões
    const zones = this.players.map((p) => p.zone);
    const boxSprites = this.boxes.map((b) => b.sprite);
    const doorSprites = this.doors.map((d) => d.sprite);
    this.physics.add.collider(zones, this.layer);
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
      Touch.setLayout(null);
    });

    this.scene.launch('HUD', { level: this });
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

  // Lógica por passo de física
  step(delta) {
    const dt = delta > 1 ? delta / 1000 : delta;
    if (this.done) {
      this.players.forEach((p) => p.step(dt, EMPTY_INPUT));
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

    // Interagir com alavancas
    this.players.forEach((p, k) => {
      if (!inputs[k].interactPressed) return;
      const lever = this.levers.find((l) => l.near(p.body));
      if (lever) lever.toggle();
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

    // Saída: os dois juntos
    if (this.exit) {
      const n = this.players.filter((p) => !p.frozen && this.exit.inside(p.body)).length;
      this.exitCount = n;
      if (n === 2) this.complete();
    }

    this.players.forEach((p) => p.endStep());
  }

  switchActive() {
    this.active = this.active === this.ele ? this.ela : this.ele;
    this.fx.sparkle(this.active.x, this.active.feet - this.active.def.h - 4, 5);
    this.active.squash = { x: 1.2, y: 0.85 };
  }

  complete() {
    if (this.done) return;
    this.done = true;
    this.players.forEach((p) => p.celebrate());
    this.fx.hearts(this.exit.cx, this.exit.bottom - 30, 14);
    this.time.delayedCall(400, () => this.fx.hearts(this.exit.cx - 10, this.exit.bottom - 40, 10));
    this.time.delayedCall(800, () => this.fx.hearts(this.exit.cx + 10, this.exit.bottom - 40, 10));
    this.time.delayedCall(2200, () => {
      this.scene.pause();
      this.scene.launch('FaseConcluida', { level: this });
    });
  }

  openPause() {
    if (this.done || !this.scene.isActive()) return;
    this.scene.pause();
    this.scene.pause('HUD');
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

  restart() {
    ['HUD', 'LevelBG', 'Pause', 'Help', 'FaseConcluida'].forEach((k) => this.scene.stop(k));
    this.scene.restart({ fase: this.faseKey, mode: this.mode, skipHelp: true });
  }

  toMenu() {
    ['HUD', 'LevelBG', 'Pause', 'Help', 'FaseConcluida'].forEach((k) => this.scene.stop(k));
    this.scene.start('Menu');
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    if (this.reader.pressed(BINDS.pause)) {
      this.openPause();
      return;
    }

    this.players.forEach((p) => p.render(dt, time));
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
