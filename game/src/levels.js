// The three levels of Ember Leap, as plain data: floating ember-islands above a
// lava sea. Platforms are one-way (jump up through them, land on top). A platform
// with `move` slides back and forth along one axis. Spikes sit on a platform top,
// orbs float in the air, bats patrol, and the portal ends the level.
// Gaps stay at 50-70 px and rises at most 80 px, so every jump is a single jump;
// the difficulty comes from spikes, bats and moving platforms, not from leaps
// the physics cannot make (jump height ~131 px, flat jump reach ~187 px).

const LEVELS = [
  {
    name: 'First Sparks',
    width: 2600,
    par: 45,
    spawn: { x: 60, y: 344 },
    platforms: [
      { x: 0, y: 380, w: 320, h: 60 },
      { x: 380, y: 340, w: 180, h: 60 },
      { x: 620, y: 380, w: 200, h: 60 },
      { x: 880, y: 320, w: 160, h: 60 },
      { x: 1100, y: 380, w: 220, h: 60 },
      { x: 1380, y: 320, w: 180, h: 60 },
      { x: 1620, y: 380, w: 200, h: 60 },
      { x: 1880, y: 330, w: 180, h: 60 },
      { x: 2120, y: 380, w: 260, h: 60 },
    ],
    spikes: [{ x: 1180, y: 356, w: 60, h: 24 }],
    orbs: [
      { x: 470, y: 300 }, { x: 720, y: 340 }, { x: 960, y: 280 }, { x: 1210, y: 330 },
      { x: 1470, y: 280 }, { x: 1720, y: 340 }, { x: 1970, y: 290 }, { x: 2250, y: 340 },
    ],
    bats: [{ x: 1700, y: 300, range: 60, speed: 1.6, phase: 0 }],
    portal: { x: 2320, y: 308 },
  },
  {
    name: 'Bat Hollow',
    width: 3200,
    par: 60,
    spawn: { x: 60, y: 364 },
    platforms: [
      { x: 0, y: 400, w: 280, h: 60 },
      { x: 340, y: 340, w: 160, h: 60 },
      { x: 560, y: 400, w: 180, h: 60 },
      { x: 800, y: 330, w: 150, h: 60 },
      { x: 1000, y: 360, w: 120, h: 40, move: { axis: 'x', from: 1000, to: 1180, speed: 60 } },
      { x: 1300, y: 340, w: 200, h: 60 },
      { x: 1560, y: 300, w: 160, h: 60 },
      { x: 1780, y: 380, w: 180, h: 60 },
      { x: 2020, y: 320, w: 150, h: 60 },
      { x: 2230, y: 390, w: 180, h: 60 },
      { x: 2470, y: 330, w: 170, h: 60 },
      { x: 2700, y: 380, w: 300, h: 60 },
    ],
    spikes: [
      { x: 1360, y: 316, w: 60, h: 24 },
      { x: 2290, y: 366, w: 60, h: 24 },
    ],
    orbs: [
      { x: 420, y: 300 }, { x: 650, y: 360 }, { x: 875, y: 290 }, { x: 1120, y: 320 },
      { x: 1400, y: 300 }, { x: 1640, y: 260 }, { x: 1870, y: 340 }, { x: 2095, y: 280 },
      { x: 2320, y: 350 }, { x: 2555, y: 290 },
    ],
    bats: [
      { x: 1860, y: 300, range: 70, speed: 1.8, phase: 0.5 },
      { x: 2540, y: 260, range: 60, speed: 2.0, phase: 2.0 },
    ],
    portal: { x: 2920, y: 308 },
  },
  {
    name: 'The Long Burn',
    width: 3800,
    par: 75,
    spawn: { x: 60, y: 364 },
    platforms: [
      { x: 0, y: 400, w: 260, h: 60 },
      { x: 330, y: 330, w: 150, h: 60 },
      { x: 550, y: 400, w: 160, h: 60 },
      { x: 780, y: 320, w: 140, h: 60 },
      { x: 980, y: 400, w: 180, h: 60 },
      { x: 1220, y: 350, w: 110, h: 40, move: { axis: 'x', from: 1220, to: 1400, speed: 80 } },
      { x: 1560, y: 330, w: 170, h: 60 },
      { x: 1790, y: 400, w: 160, h: 60 },
      { x: 2010, y: 320, w: 150, h: 60 },
      { x: 2220, y: 360, w: 120, h: 40, move: { axis: 'x', from: 2220, to: 2400, speed: 70 } },
      { x: 2580, y: 340, w: 180, h: 60 },
      { x: 2820, y: 400, w: 170, h: 60 },
      { x: 3050, y: 330, w: 160, h: 60 },
      { x: 3270, y: 390, w: 300, h: 60 },
    ],
    spikes: [
      { x: 1040, y: 376, w: 60, h: 24 },
      { x: 1840, y: 376, w: 60, h: 24 },
      { x: 2640, y: 316, w: 60, h: 24 },
    ],
    orbs: [
      { x: 405, y: 290 }, { x: 630, y: 360 }, { x: 850, y: 280 }, { x: 1070, y: 360 },
      { x: 1300, y: 310 }, { x: 1645, y: 290 }, { x: 1870, y: 360 }, { x: 2085, y: 280 },
      { x: 2310, y: 320 }, { x: 2670, y: 300 }, { x: 2905, y: 360 }, { x: 3130, y: 290 },
    ],
    bats: [
      { x: 1640, y: 260, range: 70, speed: 2.0, phase: 1.0 },
      { x: 2900, y: 320, range: 80, speed: 2.2, phase: 0 },
      { x: 3350, y: 300, range: 60, speed: 1.8, phase: 2.5 },
    ],
    portal: { x: 3500, y: 318 },
  },
];

export const LEVEL_COUNT = LEVELS.length;

/** A fresh, mutable copy of a level's entities for one play-through. */
export function buildLevel(index) {
  const def = LEVELS[index];
  return {
    name: def.name,
    width: def.width,
    par: def.par,
    spawn: { x: def.spawn.x, y: def.spawn.y },
    platforms: def.platforms.map((p) => ({
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h,
      move: p.move ? { ...p.move } : null,
      baseX: p.x,
      baseY: p.y,
      dx: 0,
      dy: 0,
      t: 0,
    })),
    spikes: def.spikes.map((s) => ({ ...s })),
    orbs: def.orbs.map((o) => ({ x: o.x, y: o.y, taken: false, bob: 0 })),
    bats: def.bats.map((b) => ({ ...b, baseX: b.x, baseY: b.y, x: b.x, y: b.y })),
    portal: { x: def.portal.x, y: def.portal.y, w: 48, h: 72 },
  };
}

/** The platform (if any) whose top contains the point (x, y). */
export function platformAt(level, x, y) {
  for (const p of level.platforms) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p;
  }
  return null;
}
