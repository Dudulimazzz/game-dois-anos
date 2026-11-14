// Partículas reutilizáveis: poeira, coraçõezinhos e brilhos.

export function createFx(scene, depth = 20) {
  const dust = scene.add.particles(0, 0, 'dust', {
    emitting: false,
    lifespan: { min: 250, max: 450 },
    speedX: { min: -30, max: 30 },
    speedY: { min: -25, max: -5 },
    scale: { start: 1, end: 0.3 },
    alpha: { start: 0.75, end: 0 },
    tint: 0xf3e3d3,
  }).setDepth(depth);

  const hearts = scene.add.particles(0, 0, 'heart_small', {
    emitting: false,
    lifespan: { min: 600, max: 1000 },
    speedX: { min: -40, max: 40 },
    speedY: { min: -70, max: -30 },
    gravityY: 40,
    scale: { start: 1, end: 0.5 },
    alpha: { start: 1, end: 0 },
  }).setDepth(depth);

  const sparkle = scene.add.particles(0, 0, 'sparkle', {
    emitting: false,
    lifespan: { min: 300, max: 600 },
    speed: { min: 20, max: 60 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
  }).setDepth(depth);

  const rise = scene.add.particles(0, 0, 'pixel', {
    emitting: false,
    lifespan: 1400,
    speedY: { min: -18, max: -10 },
    speedX: { min: -3, max: 3 },
    alpha: { start: 0.9, end: 0 },
    tint: [0xfff2b0, 0xffd36e, 0xffffff],
  }).setDepth(depth - 18);

  return {
    dust: (x, y, n = 4) => dust.explode(n, x, y - 1),
    hearts: (x, y, n = 5) => hearts.explode(n, x, y),
    sparkle: (x, y, n = 6) => sparkle.explode(n, x, y),
    rise: (x, y) => rise.explode(1, x, y),
  };
}
