// Keyboard and mouse input: WASD or arrows to walk, E or Space to use the
// station in front of the chef, P to pause, R to restart, M to mute. The
// mouse clicks a nearby station to use it, and the title screen to start.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';
export const ACTION_INTERACT = 'interact';

const MOVE_KEYS = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function createInput(canvas) {
  const held = { up: false, down: false, left: false, right: false };
  const pressed = new Set();
  let click = null;
  let interactHeld = false;

  function onKeyDown(event) {
    const move = MOVE_KEYS[event.code];
    if (move) {
      held[move] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyE' || event.code === 'Space') {
      if (!event.repeat) pressed.add(ACTION_INTERACT);
      interactHeld = true;
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (event.code === 'Enter') pressed.add(ACTION_CONFIRM);
    if (event.code === 'KeyP' || event.code === 'Escape') pressed.add(ACTION_PAUSE);
    if (event.code === 'KeyR') pressed.add(ACTION_RESTART);
    if (event.code === 'KeyM') pressed.add(ACTION_MUTE);
  }

  function onKeyUp(event) {
    const move = MOVE_KEYS[event.code];
    if (move) held[move] = false;
    if (event.code === 'KeyE' || event.code === 'Space') interactHeld = false;
  }

  function onMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    click = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  function onBlur() {
    held.up = held.down = held.left = held.right = false;
    interactHeld = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('blur', onBlur);

  return {
    /** The walk direction this frame, as a unit-ish {x, y}. */
    moveVector() {
      const x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const y = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    /** True while E or Space is held (for the chopping channel). */
    interactHeld() {
      return interactHeld;
    },
    /** True once for each fresh press of an action key, then cleared. */
    consume(action) {
      if (!pressed.has(action)) return false;
      pressed.delete(action);
      return true;
    },
    /** The last mouse click in view space, once, then cleared. */
    takeClick() {
      const at = click;
      click = null;
      return at;
    },
  };
}

// Detach the listeners (used by tests and by the screenshot harness teardown).
export function detachInput() {
  // Listeners are bound to the window for the page's lifetime; nothing to undo
  // in normal play. Kept as a named hook so a future teardown has one place.
}
