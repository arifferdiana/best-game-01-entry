// Ember Leap: every number the rest of the game tunes against.
// The view is a fixed 960x540 logical canvas, scaled to the window.
export const VIEW = { width: 960, height: 540 };
export const LAVA_Y = 500;
export const STEP = 1 / 60;

export const GRAVITY = 2200;
export const MOVE_SPEED = 270;
export const GROUND_ACCEL = 3200;
export const AIR_ACCEL = 2200;
export const JUMP_SPEED = 760;
export const DOUBLE_JUMP_SPEED = 700;
export const MAX_FALL = 920;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;
export const HURT_KNOCKBACK = 520;
export const INVINCIBLE_TIME = 1.6;

export const PLAYER = { width: 28, height: 36 };
export const LIVES = 3;
export const ORB_SCORE = 100;
export const CLEAR_SCORE = 500;
export const BEST_KEY = 'ember-leap-best';

// Warm ember palette: a deep purple night, glowing orange lava, gold orbs,
// and a cool teal portal so the goal reads at a glance.
export const PALETTE = {
  skyTop: '#150a2e',
  skyMid: '#2d1b4e',
  skyBottom: '#57294e',
  star: '#ffe9c9',
  moon: '#ffd9a0',
  mountainFar: '#241640',
  mountainNear: '#1c0f33',
  lava: '#ff3d00',
  lavaBright: '#ffb347',
  lavaDeep: '#a31300',
  rock: '#3a2340',
  rockDark: '#241428',
  rockTop: '#6b3d2e',
  rockEdge: '#ffb347',
  spike: '#2a1a2e',
  spikeTip: '#ff6a00',
  orb: '#ffd23f',
  orbCore: '#fff3b0',
  bat: '#1d1030',
  batWing: '#3d2352',
  portal: '#2de1c2',
  portalCore: '#d8fff4',
  playerBody: '#ff7a1a',
  playerCore: '#ffd23f',
  hudText: '#fff3d6',
  hudDim: '#c9a8e8',
};
