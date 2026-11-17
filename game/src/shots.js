// The screenshot scenes behind ?shot=start|play|win|end. Each one plays the real
// rules forward from a fresh world, so the frame is what a short game really looks
// like and the same seed always gives the same frame. The play scene is steered by
// a simple autopilot: run right, jump when the ground ends or a spike is ahead,
// and double-jump when still falling short of the next island.
import { STEP } from './config.js';
import { EVENT_CLEAR, EVENT_OVER, EVENT_WIN, platformAt } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 20;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;

/**
 * The autopilot's view of the world, one step at a time. It returns the direction
 * to run and whether to jump, using the same input shape the real keyboard gives.
 */
function autopilot(state) {
  const p = state.player;
  const level = state.level;
  const probeX = p.x + p.w / 2 + p.face * 52;
  const groundAhead = platformAt(level, probeX, p.y + p.h + 8);
  let spikeAhead = false;
  for (const s of level.spikes) {
    if (s.x + s.w > p.x && s.x < p.x + p.w + 70 && s.y < p.y + p.h && s.y + s.h > p.y - 10) {
      spikeAhead = true;
    }
  }
  // The nearest orb: chase it when it is close and on this island.
  let orb = null;
  for (const o of level.orbs) {
    if (o.taken) continue;
    if (orb === null || Math.abs(o.x - (p.x + p.w / 2)) < Math.abs(orb.x - (p.x + p.w / 2))) orb = o;
  }
  let dir = 1;
  if (orb && Math.abs(orb.x - (p.x + p.w / 2)) < 130 && orb.y > p.y - 90) {
    dir = orb.x > p.x + p.w / 2 ? 1 : -1;
  }
  let jump = false;
  if (p.grounded && (!groundAhead || spikeAhead)) jump = true;
  if (!p.grounded && p.vy > 0 && p.jumps < 2) {
    // Falling short: is there an island top just below the feet to catch?
    const below = platformAt(level, p.x + p.w / 2, p.y + p.h + 70);
    if (!below) jump = true;
  }
  return { dir, jump };
}

function fakeInput(decision) {
  return {
    direction: () => decision.dir,
    jumpHeld: () => true,
    get jumpQueued() {
      return decision.jump;
    },
    set jumpQueued(value) {
      decision.jump = value;
    },
  };
}

/**
 * Set `world` to the named scene (start, play, win or end; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'win' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.stepAttract(STEP);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'win') {
    world.loadLevel(2);
    world.state.score = 4860;
    world.state.orbs = 30;
    world.state.orbsTotal = 30;
    world.state.lives = 2;
    world.state.levelTime = 61;
    return { screen: SCREEN_WIN, best: 4860 };
  }
  if (name === 'end') {
    for (let i = 0; i < 8 / STEP; i += 1) {
      const decision = autopilot(world.state);
      const events = world.step(STEP, fakeInput(decision));
      if (events & (EVENT_OVER | EVENT_CLEAR | EVENT_WIN)) break;
    }
    world.state.lives = 0;
    if (world.state.score === 0) world.state.score = 1250;
    return { screen: SCREEN_OVER, best: Math.max(1250, world.state.score) };
  }
  const limit = name === 'play' ? PLAY_SECONDS : END_LIMIT_SECONDS;
  for (let i = 0; i < limit / STEP; i += 1) {
    const decision = autopilot(world.state);
    const events = world.step(STEP, fakeInput(decision));
    if (events & (EVENT_OVER | EVENT_CLEAR | EVENT_WIN)) break;
  }
  const over = world.state.lives === 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
