// Warung Sizzle — boot and the one loop: input is read every frame, the
// world advances in fixed 1/60 s steps, and the renderer paints what is
// there. The game moves between four screens: title, play, paused and over.
//
// ?seed=N fixes the order pattern. ?shot=cover|cook|serve|rush (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.

import { BEST_KEY, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_COOK_DONE, EVENT_EXPIRE, EVENT_OVER, EVENT_SERVE } from './world.js';
import { ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
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
const input = createInput(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null, world.timeLeft());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let muted = false;

  function startShift() {
    world.reset();
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.startMusic();
    announce('Shift started. Serve the orders before their patience runs out.');
  }

  function endShift() {
    screen = SCREEN_OVER;
    audio.stopMusic();
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift over. You served ${world.state.served} dishes and banked ${world.state.coins} coins.`);
  }

  function handleEvents(events) {
    if (events & EVENT_SERVE) {
      audio.coin();
      audio.ding();
    }
    if (events & EVENT_COOK_DONE) audio.pop();
    if (events & EVENT_EXPIRE) audio.error();
    if (events & EVENT_OVER) endShift();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;

    if (input.consume(ACTION_MUTE)) {
      muted = !muted;
      audio.setMuted(muted);
    }

    if (screen === SCREEN_TITLE) {
      if (input.consume(ACTION_CONFIRM) || input.takeClick()) startShift();
      renderer.draw(world.state, screen, best, null, world.timeLeft());
      return;
    }

    if (screen === SCREEN_OVER) {
      if (input.consume(ACTION_RESTART) || input.consume(ACTION_CONFIRM)) startShift();
      renderer.draw(world.state, screen, best, null, world.timeLeft());
      return;
    }

    if (input.consume(ACTION_PAUSE)) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        audio.stopMusic();
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        audio.startMusic();
      }
    }
    if (input.consume(ACTION_RESTART) && screen !== SCREEN_TITLE) startShift();

    if (screen === SCREEN_PAUSED) {
      renderer.draw(world.state, screen, best, null, world.timeLeft());
      return;
    }

    // Play: the world advances in fixed steps, several in a slow frame.
    audio.setRush(world.isRush());
    accumulator += elapsed;
    let events = 0;
    while (accumulator >= STEP) {
      events |= world.step(STEP, input);
      accumulator -= STEP;
      if (world.state.over) break;
    }
    handleEvents(events);

    // A mouse click on a nearby station counts as pressing E there.
    const click = input.takeClick();
    if (click) {
      const target = world.nearestUsable();
      if (target) {
        const done = world.interact();
        if (!done.used) audio.error();
        else if (done.events & EVENT_SERVE) handleEvents(done.events);
      }
    }

    renderer.draw(world.state, screen, best, world.nearestUsable(), world.timeLeft());
  }

  world.reset();
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

// Debug handle for play-testing from the console or a screenshot script:
// window.__warung.state is the live world state, window.__warung.world the
// world object. It changes nothing about the game itself.
window.__warung = { state: world.state, world, seed };
