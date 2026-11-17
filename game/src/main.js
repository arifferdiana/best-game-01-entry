// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play, paused,
// level clear, game over and victory.
//
// ?seed=N fixes the world. ?shot=start|play|win|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_CLEAR,
  EVENT_COLLECT,
  EVENT_DOUBLE_JUMP,
  EVENT_HURT,
  EVENT_JUMP,
  EVENT_LAND,
  EVENT_LAVA,
  EVENT_OVER,
  EVENT_WIN,
  createWorld,
} from './world.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import {
  SCREEN_CLEAR,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  createRenderer,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = world.readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startRun() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startPad();
    audio.click();
    announce(`Playing. ${LIVES} lives. ${world.state.level.name}.`);
  }

  function nextLevel() {
    world.loadLevel(world.state.levelIndex + 1);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.portal();
    announce(`Level ${world.state.levelIndex + 1}: ${world.state.level.name}.`);
  }

  function endRun(win) {
    screen = win ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      world.saveBest(best);
    }
    if (win) audio.win();
    announce(win ? `Victory! Final score ${world.state.score}.` : `Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function playEventSounds(events) {
    if (events & EVENT_JUMP) audio.jump();
    if (events & EVENT_DOUBLE_JUMP) audio.doubleJump();
    if (events & EVENT_LAND) audio.land();
    if (events & EVENT_COLLECT) audio.collect(world.state.streak);
    if (events & EVENT_HURT) audio.hurt();
    if (events & EVENT_LAVA) audio.hurt();
    if (events & EVENT_CLEAR) audio.portal();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && screen !== SCREEN_TITLE) {
      startRun();
      return;
    }
    if (actions & ACTION_CONFIRM && screen === SCREEN_TITLE) startRun();
    else if (actions & ACTION_CONFIRM && screen === SCREEN_OVER) startRun();
    else if (actions & ACTION_CONFIRM && screen === SCREEN_WIN) startRun();
    else if (actions & ACTION_CONFIRM && screen === SCREEN_CLEAR) nextLevel();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.stepAttract(STEP);
      return;
    }
    const events = world.step(STEP, input);
    playEventSounds(events);
    if (events & EVENT_WIN) endRun(true);
    else if (events & EVENT_OVER) endRun(false);
    else if (events & EVENT_CLEAR) {
      screen = SCREEN_CLEAR;
      announce(`Level clear! Bonus ${world.state.clearBonus}. Score ${world.state.score}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting bats fly unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Leap. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
