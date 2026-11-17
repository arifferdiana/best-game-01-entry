// Keyboard and pointer input. Arrow keys / WASD move, Space (or Up / W) jumps,
// Enter / Space confirms on menus, P pauses, R restarts, M mutes. A pointer tap
// on the canvas confirms on menus and jumps while playing.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const MOVE_LEFT = ['ArrowLeft', 'KeyA'];
const MOVE_RIGHT = ['ArrowRight', 'KeyD'];
const JUMP = ['Space', 'ArrowUp', 'KeyW'];
const CONFIRM = ['Space', 'Enter', 'ArrowUp', 'KeyW'];
const PAUSE = ['KeyP', 'Escape'];
const RESTART = ['KeyR'];
const MUTE = ['KeyM'];

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  // Set on a fresh jump press; the world reads and clears it (jump buffering).
  let jumpQueued = false;

  function press(code) {
    if (JUMP.includes(code) && !keys.has(code)) jumpQueued = true;
    if (CONFIRM.includes(code)) actions |= ACTION_CONFIRM;
    if (PAUSE.includes(code)) actions |= ACTION_PAUSE;
    if (RESTART.includes(code)) actions |= ACTION_RESTART;
    if (MUTE.includes(code)) actions |= ACTION_MUTE;
  }

  window.addEventListener('keydown', (event) => {
    if ([...MOVE_LEFT, ...MOVE_RIGHT, ...JUMP].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    keys.add(event.code);
    press(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    actions |= ACTION_CONFIRM;
    jumpQueued = true;
  });

  return {
    /** -1, 0 or 1 from the held move keys. */
    direction() {
      const left = MOVE_LEFT.some((c) => keys.has(c));
      const right = MOVE_RIGHT.some((c) => keys.has(c));
      if (left && !right) return -1;
      if (right && !left) return 1;
      return 0;
    },
    jumpHeld() {
      return JUMP.some((c) => keys.has(c));
    },
    get jumpQueued() {
      return jumpQueued;
    },
    set jumpQueued(value) {
      jumpQueued = value;
    },
    /** The actions pressed since the last call, as a bitmask. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
