// Ember Leap: the rules. A small ember spirit runs and jumps across floating
// islands above a lava sea, collecting flame-orbs, dodging spikes and fire-bats,
// and reaching the portal. Three levels, three lives, a score from orbs plus a
// time bonus on each level clear. Platforms are one-way: jump up through them,
// land on top. The world advances in fixed 1/60 s steps and reports what happened
// as an event bitmask, so the loop can play sounds and change screens.
import {
  AIR_ACCEL,
  BEST_KEY,
  CLEAR_SCORE,
  COYOTE_TIME,
  DOUBLE_JUMP_SPEED,
  GRAVITY,
  GROUND_ACCEL,
  HURT_KNOCKBACK,
  INVINCIBLE_TIME,
  JUMP_BUFFER,
  JUMP_SPEED,
  LAVA_Y,
  LIVES,
  MAX_FALL,
  MOVE_SPEED,
  ORB_SCORE,
  PLAYER,
  VIEW,
} from './config.js';
import { LEVEL_COUNT, buildLevel, platformAt } from './levels.js';
import { createParticles } from './particles.js';

export const EVENT_NONE = 0;
export const EVENT_JUMP = 1;
export const EVENT_DOUBLE_JUMP = 2;
export const EVENT_LAND = 4;
export const EVENT_COLLECT = 8;
export const EVENT_HURT = 16;
export const EVENT_LAVA = 32;
export const EVENT_CLEAR = 64;
export const EVENT_OVER = 128;
export const EVENT_WIN = 256;

function approach(value, target, step) {
  if (value < target) return Math.min(value + step, target);
  if (value > target) return Math.max(value - step, target);
  return value;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createWorld(random) {
  const particles = createParticles();
  const state = {
    levelIndex: 0,
    score: 0,
    lives: LIVES,
    orbs: 0,
    orbsTotal: 0,
    levelTime: 0,
    totalTime: 0,
    time: 0,
    streak: 0,
    clearBonus: 0,
    level: null,
    camera: { x: 0 },
    player: null,
    particles,
  };
  let jumpBuffer = 0;
  let moteTimer = 0;

  function placePlayer() {
    const s = state.level.spawn;
    state.player = {
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      w: PLAYER.width,
      h: PLAYER.height,
      grounded: false,
      groundPlatform: null,
      coyote: 0,
      jumps: 0,
      invincible: 0,
      face: 1,
      squashT: 0,
      squashSign: 0,
    };
    state.camera.x = Math.max(0, Math.min(state.player.x + state.player.w / 2 - VIEW.width * 0.42, state.level.width - VIEW.width));
  }

  function loadLevel(index) {
    state.levelIndex = index;
    state.level = buildLevel(index);
    state.orbsTotal = state.level.orbs.length;
    state.levelTime = 0;
    state.streak = 0;
    particles.clear();
    jumpBuffer = 0;
    placePlayer();
  }

  function reset() {
    state.score = 0;
    state.lives = LIVES;
    state.orbs = 0;
    state.totalTime = 0;
    state.clearBonus = 0;
    loadLevel(0);
  }

  function updateMovers(dt) {
    for (const p of state.level.platforms) {
      if (!p.move) continue;
      p.t += dt;
      const range = p.move.to - p.move.from;
      const cycle = 2 * range;
      const phase = (p.t * p.move.speed) % cycle;
      const offset = phase < range ? phase : cycle - phase;
      const next = p.move.from + offset;
      p.dx = next - p.x;
      p.x = next;
    }
  }

  function updateBats() {
    for (const b of state.level.bats) {
      b.x = b.baseX + Math.sin(state.time * b.speed + b.phase) * b.range;
      b.y = b.baseY + Math.sin(state.time * 2.3 + b.phase) * 16;
    }
  }

  function updateCamera(dt, snap = false) {
    const p = state.player;
    const target = Math.max(0, Math.min(p.x + p.w / 2 - VIEW.width * 0.42, state.level.width - VIEW.width));
    if (snap) state.camera.x = target;
    else state.camera.x += (target - state.camera.x) * Math.min(1, dt * 5);
  }

  function spawnMotes(dt) {
    moteTimer -= dt;
    if (moteTimer > 0) return;
    moteTimer = 0.18;
    const cam = state.camera.x;
    particles.mote(cam + random() * VIEW.width, LAVA_Y - 10 - random() * 260);
  }

  function hurt(sourceX) {
    const p = state.player;
    if (p.invincible > 0) return EVENT_NONE;
    state.lives -= 1;
    state.streak = 0;
    p.invincible = INVINCIBLE_TIME;
    p.vy = -HURT_KNOCKBACK;
    p.vx = p.x + p.w / 2 < sourceX ? -260 : 260;
    p.grounded = false;
    p.groundPlatform = null;
    particles.burst(p.x + p.w / 2, p.y + p.h / 2, '#ff5a3c', 16, 200);
    if (state.lives <= 0) return EVENT_HURT | EVENT_OVER;
    return EVENT_HURT;
  }

  function lavaDeath() {
    const p = state.player;
    particles.burst(p.x + p.w / 2, LAVA_Y - 6, '#ff7a1a', 22, 240);
    state.lives -= 1;
    state.streak = 0;
    if (state.lives <= 0) return EVENT_LAVA | EVENT_OVER;
    placePlayer();
    state.player.invincible = INVINCIBLE_TIME;
    return EVENT_LAVA;
  }

  /** One fixed step of live play. `input` answers direction(), jumpHeld() and jumpQueued. */
  function step(dt, input) {
    const p = state.player;
    const level = state.level;
    let events = EVENT_NONE;
    state.time += dt;
    state.levelTime += dt;
    state.totalTime += dt;
    if (p.invincible > 0) p.invincible -= dt;
    if (p.squashT > 0) p.squashT -= dt;

    updateMovers(dt);
    updateBats();
    spawnMotes(dt);

    // Ride a moving platform the player stands on.
    if (p.grounded && p.groundPlatform && p.groundPlatform.move) {
      p.x += p.groundPlatform.dx;
    }

    // Horizontal run: accelerate toward the held direction.
    const dir = input.direction();
    if (dir !== 0) p.face = dir;
    const rate = p.grounded ? GROUND_ACCEL : AIR_ACCEL;
    p.vx = approach(p.vx, dir * MOVE_SPEED, rate * dt);
    p.x += p.vx * dt;
    p.x = Math.max(0, Math.min(p.x, level.width - p.w));

    // Jump: buffered, with coyote time and one double jump in the air.
    if (input.jumpQueued) {
      jumpBuffer = JUMP_BUFFER;
      input.jumpQueued = false;
    } else if (jumpBuffer > 0) {
      jumpBuffer -= dt;
    }
    if (jumpBuffer > 0) {
      if (p.grounded || p.coyote > 0) {
        p.vy = -JUMP_SPEED;
        p.jumps = 1;
        p.grounded = false;
        p.groundPlatform = null;
        p.coyote = 0;
        jumpBuffer = 0;
        p.squashT = 0.15;
        p.squashSign = -1;
        particles.puff(p.x + p.w / 2, p.y + p.h, 5);
        events |= EVENT_JUMP;
      } else if (p.jumps < 2) {
        p.vy = -DOUBLE_JUMP_SPEED;
        p.jumps = 2;
        jumpBuffer = 0;
        p.squashT = 0.15;
        p.squashSign = -1;
        particles.burst(p.x + p.w / 2, p.y + p.h, '#ffb347', 8, 120);
        events |= EVENT_DOUBLE_JUMP;
      }
    }

    // Gravity, with a shorter hop when the jump key is released early.
    const gravity = GRAVITY * (p.vy < 0 && !input.jumpHeld() ? 1.9 : 1);
    p.vy = Math.min(p.vy + gravity * dt, MAX_FALL);

    // Vertical move and one-way landing.
    const prevBottom = p.y + p.h;
    const wasGrounded = p.grounded;
    p.y += p.vy * dt;
    p.grounded = false;
    p.groundPlatform = null;
    if (p.vy >= 0) {
      for (const plat of level.platforms) {
        if (p.x < plat.x + plat.w && p.x + p.w > plat.x && prevBottom <= plat.y + 1 && p.y + p.h >= plat.y) {
          const fallSpeed = p.vy;
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;
          p.groundPlatform = plat;
          p.jumps = 0;
          p.coyote = COYOTE_TIME;
          if (!wasGrounded && fallSpeed > 320) {
            p.squashT = 0.15;
            p.squashSign = 1;
            particles.puff(p.x + p.w / 2, p.y + p.h, 6);
            events |= EVENT_LAND;
          }
          break;
        }
      }
    }
    if (!p.grounded && p.coyote > 0) p.coyote -= dt;

    // Spikes hurt (a clearly inset box, so a jump that clears the visible tip forgives).
    if (p.invincible <= 0) {
      for (const s of level.spikes) {
        const box = { x: s.x + 6, y: s.y + 10, w: s.w - 12, h: s.h - 12 };
        if (overlap(p, box)) {
          events |= hurt(s.x + s.w / 2);
          break;
        }
      }
    }
    // Fire-bats hurt.
    if (p.invincible <= 0) {
      for (const b of level.bats) {
        if (overlap(p, { x: b.x - 17, y: b.y - 12, w: 34, h: 24 })) {
          events |= hurt(b.x);
          break;
        }
      }
    }
    // Flame-orbs: collect, and the chime climbs with the streak.
    for (const o of level.orbs) {
      if (o.taken) continue;
      const dx = p.x + p.w / 2 - o.x;
      const dy = p.y + p.h / 2 - o.y;
      if (dx * dx + dy * dy < 36 * 36) {
        o.taken = true;
        state.orbs += 1;
        state.streak += 1;
        state.score += ORB_SCORE;
        particles.burst(o.x, o.y, '#ffd23f', 12, 150);
        events |= EVENT_COLLECT;
      }
    }
    // The portal ends the level.
    if (overlap(p, level.portal)) {
      const bonus = CLEAR_SCORE + Math.max(0, Math.round((level.par - state.levelTime) * 10));
      state.clearBonus = bonus;
      state.score += bonus;
      particles.burst(p.x + p.w / 2, p.y + p.h / 2, '#2de1c2', 26, 220);
      if (state.levelIndex >= LEVEL_COUNT - 1) events |= EVENT_WIN;
      else events |= EVENT_CLEAR;
      return events;
    }
    // The lava sea.
    if (p.y + p.h >= LAVA_Y) {
      events |= lavaDeath();
      if (events & EVENT_OVER) return events;
    }

    updateCamera(dt);
    particles.update(dt);
    return events;
  }

  /** Attract mode behind the title screen: the world breathes, nothing can die. */
  function stepAttract(dt) {
    state.time += dt;
    updateMovers(dt);
    updateBats();
    spawnMotes(dt);
    const span = Math.max(0, state.level.width - VIEW.width);
    state.camera.x = ((Math.sin(state.time * 0.06) + 1) / 2) * span;
    particles.update(dt);
  }

  // Load level 0 at creation so the title screen's attract mode and the first
  // draw have a level to render; reset() reloads it when a run starts.
  loadLevel(0);

  return {
    state,
    reset,
    loadLevel,
    step,
    stepAttract,
    readBest() {
      try {
        return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
      } catch {
        return 0;
      }
    },
    saveBest(value) {
      try {
        window.localStorage.setItem(BEST_KEY, String(value));
      } catch {
        // Storage can be off (private windows): the best then lasts this visit only.
      }
    },
  };
}

// Re-exported for the screenshot autopilot.
export { platformAt };
