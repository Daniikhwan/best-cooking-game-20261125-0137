// Warung Sizzle — the world: one shift in the warung. The chef walks the
// floor, picks ingredients from the crates, chops them on the board, fries
// them in the wok, plates them on the counter and serves them at the pass,
// while the order board fills up and the shift clock runs down.
//
// `step(dt, input)` advances the world by `dt` seconds and returns a bitmask
// of the frame's events, so the main loop can ring the right sounds.

import {
  BOARD,
  BURN_GRACE_SECONDS,
  CHOP_SECONDS,
  COOK_SECONDS,
  CHEF,
  CHEF_START,
  COMBO_CAP,
  COMBO_STEP,
  CRATES,
  FLOOR,
  INGREDIENTS,
  MAX_ORDERS,
  PATIENCE_START_SECONDS,
  RECIPES,
  RECIPE_IDS,
  SERVE_WINDOW_SECONDS,
  SHIFT_SECONDS,
  STATIONS,
  SPAWN_START_SECONDS,
  recipeForPlate,
  spawnIntervalAt,
  patienceAt,
} from './config.js';

export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_OVER = 4;
export const EVENT_CHOP_DONE = 8;
export const EVENT_COOK_DONE = 16;
export const EVENT_BURN = 32;

// The counters and crates the chef cannot walk through, as rectangles.
const SOLIDS = [
  STATIONS.board,
  STATIONS.wok,
  STATIONS.plate,
  STATIONS.pass,
  STATIONS.trash,
  ...CRATES,
];

export function createWorld(random) {
  const state = {
    random,
    elapsed: 0,
    spawnTimer: 6,
    nextOrderId: 1,
    chef: { x: CHEF_START.x, y: CHEF_START.y, dir: 'down', carrying: null, chopping: false },
    orders: [],
    board: { chopping: null, progress: 0 },
    wok: { item: null, cookTime: 0, burnTime: 0 },
    plate: { items: [], dish: null },
    coins: 0,
    score: 0,
    served: 0,
    missed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    over: false,
    particles: [],
    floats: [],
    shake: 0,
  };

  function reset() {
    state.elapsed = 0;
    state.spawnTimer = 6;
    state.nextOrderId = 1;
    state.chef.x = CHEF_START.x;
    state.chef.y = CHEF_START.y;
    state.chef.dir = 'down';
    state.chef.carrying = null;
    state.chef.chopping = false;
    state.orders = [];
    state.board = { chopping: null, progress: 0 };
    state.wok = { item: null, cookTime: 0, burnTime: 0 };
    state.plate = { items: [], dish: null };
    state.coins = 0;
    state.score = 0;
    state.served = 0;
    state.missed = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.bestCombo = 0;
    state.over = false;
    state.particles = [];
    state.floats = [];
    state.shake = 0;
    spawnOrder();
    spawnOrder();
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const active = new Set(state.orders.map((o) => o.recipeId));
    const fresh = RECIPE_IDS.filter((id) => !active.has(id));
    const recipeId = state.random.pick(fresh.length > 0 ? fresh : RECIPE_IDS);
    const patience = patienceAt(state.elapsed);
    state.orders.push({ id: state.nextOrderId, recipeId, patience, maxPatience: patience });
    state.nextOrderId += 1;
  }

  function addFloat(x, y, text, color) {
    state.floats.push({ x, y, text, color, life: 1.2, max: 1.2 });
  }

  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i += 1) {
      const a = state.random.range(0, Math.PI * 2);
      const v = state.random.range(speed * 0.4, speed);
      state.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        life: state.random.range(0.35, 0.8),
        max: 0.8,
        size: state.random.range(2, 5),
        color,
      });
    }
  }

  function steam(x, y) {
    state.particles.push({
      x: x + state.random.range(-14, 14),
      y,
      vx: state.random.range(-6, 6),
      vy: -46,
      life: state.random.range(0.5, 0.9),
      max: 0.9,
      size: state.random.range(5, 9),
      color: 'rgba(255,255,255,0.55)',
      steam: true,
    });
  }

  // -- movement ---------------------------------------------------------------

  function hitsSolid(x, y) {
    if (x < FLOOR.x + CHEF.radius || x > FLOOR.x + FLOOR.width - CHEF.radius) return true;
    if (y < FLOOR.y + CHEF.radius || y > FLOOR.y + FLOOR.height - CHEF.radius) return true;
    for (const s of SOLIDS) {
      if (
        x + CHEF.radius > s.x && x - CHEF.radius < s.x + s.width &&
        y + CHEF.radius > s.y && y - CHEF.radius < s.y + s.height
      ) return true;
    }
    return false;
  }

  function moveChef(dt, move) {
    const chef = state.chef;
    if (chef.chopping) return;
    const stepX = move.x * CHEF.speed * dt;
    const stepY = move.y * CHEF.speed * dt;
    if (stepX !== 0 && !hitsSolid(chef.x + stepX, chef.y)) chef.x += stepX;
    if (stepY !== 0 && !hitsSolid(chef.x, chef.y + stepY)) chef.y += stepY;
    if (move.x > 0.3) chef.dir = 'right';
    else if (move.x < -0.3) chef.dir = 'left';
    else if (move.y > 0.3) chef.dir = 'down';
    else if (move.y < -0.3) chef.dir = 'up';
  }

  // Distance from a point to a rectangle, for "nearest station" checks.
  function distToRect(x, y, r) {
    const dx = Math.max(r.x - x, 0, x - (r.x + r.width));
    const dy = Math.max(r.y - y, 0, y - (r.y + r.height));
    return Math.hypot(dx, dy);
  }

  function nearestUsable() {
    const chef = state.chef;
    let best = null;
    let bestDist = CHEF.interactRange;
    for (const crate of CRATES) {
      const d = distToRect(chef.x, chef.y, crate);
      if (d < bestDist) { bestDist = d; best = { type: 'crate', ...crate }; }
    }
    for (const key of Object.keys(STATIONS)) {
      const s = STATIONS[key];
      const d = distToRect(chef.x, chef.y, s);
      if (d < bestDist) { bestDist = d; best = { type: 'station', ...s }; }
    }
    return best;
  }

  // -- interaction ------------------------------------------------------------

  // Use the station or crate nearest the chef. Returns an event bitmask and
  // whether the press did anything at all (for the error buzz).
  function interact() {
    const chef = state.chef;
    const target = nearestUsable();
    if (!target) return { events: 0, used: false };

    if (target.type === 'crate') {
      if (chef.carrying) return { events: 0, used: false };
      chef.carrying = { kind: target.kind, state: 'raw' };
      return { events: 0, used: true };
    }

    if (target.name === 'trash') {
      if (!chef.carrying) return { events: 0, used: false };
      chef.carrying = null;
      return { events: 0, used: true };
    }

    if (target.name === 'board') {
      const held = chef.carrying;
      if (!held || held.dish || held.state !== 'raw' || !INGREDIENTS[held.kind].chop) {
        return { events: 0, used: false };
      }
      state.board.chopping = held.kind;
      state.board.progress = 0;
      chef.chopping = true;
      return { events: 0, used: true };
    }

    if (target.name === 'wok') {
      const wok = state.wok;
      if (wok.item && wok.item.state === 'cooked') {
        if (chef.carrying) return { events: 0, used: false };
        chef.carrying = { kind: wok.item.kind, state: 'cooked' };
        state.wok = { item: null, cookTime: 0, burnTime: 0 };
        return { events: 0, used: true };
      }
      if (wok.item && wok.item.burnt) {
        state.wok = { item: null, cookTime: 0, burnTime: 0 };
        burst(target.x + target.width / 2, target.y + 30, '#5b5b5b', 8, 60);
        return { events: 0, used: true };
      }
      const held = chef.carrying;
      if (!wok.item && held && !held.dish && held.state === 'raw' && INGREDIENTS[held.kind].cook) {
        state.wok.item = { kind: held.kind, state: 'raw', burnt: false };
        state.wok.cookTime = 0;
        state.wok.burnTime = 0;
        chef.carrying = null;
        return { events: 0, used: true };
      }
      return { events: 0, used: false };
    }

    if (target.name === 'plate') {
      const plate = state.plate;
      const held = chef.carrying;
      if (held && held.dish) return { events: 0, used: false };
      if (held && !plate.dish && plate.items.length < 3) {
        plate.items.push({ kind: held.kind, state: held.state });
        chef.carrying = null;
        const dish = recipeForPlate(plate.items);
        if (dish) {
          plate.dish = dish;
          plate.items = [];
          burst(target.x + target.width / 2, target.y + 20, '#f2b705', 14, 90);
        }
        return { events: 0, used: true };
      }
      if (!held && plate.dish) {
        chef.carrying = { dish: plate.dish };
        plate.dish = null;
        return { events: 0, used: true };
      }
      if (!held && plate.items.length > 0) {
        // Take back an item no active order needs first; else the last one.
        const activeRecipes = new Set(state.orders.map((o) => o.recipeId));
        let idx = plate.items.length - 1;
        const useless = plate.items.findIndex((it) => ![...activeRecipes].some((rid) =>
          RECIPES[rid].needs.some((n) => n.kind === it.kind && n.state === it.state),
        ));
        if (useless !== -1) idx = useless;
        chef.carrying = plate.items.splice(idx, 1)[0];
        return { events: 0, used: true };
      }
      return { events: 0, used: false };
    }

    if (target.name === 'pass') {
      const held = chef.carrying;
      if (!held || !held.dish) return { events: 0, used: false };
      const at = state.orders.findIndex((o) => o.recipeId === held.dish);
      if (at === -1) return { events: 0, used: false };
      const order = state.orders[at];
      state.orders.splice(at, 1);
      const recipe = RECIPES[held.dish];
      const tip = Math.round(40 * (order.patience / order.maxPatience));
      if (state.comboTimer > 0) state.combo += 1;
      else state.combo = 1;
      state.comboTimer = SERVE_WINDOW_SECONDS;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const mult = Math.min(COMBO_CAP, 1 + COMBO_STEP * (state.combo - 1));
      const pay = Math.round((recipe.price + tip) * mult);
      state.coins += pay;
      state.score += pay;
      state.served += 1;
      chef.carrying = null;
      const px = target.x + target.width / 2;
      addFloat(px, target.y - 14, `+${pay}`, '#f2b705');
      burst(px, target.y + 30, '#58b368', 16, 110);
      state.shake = 0.12;
      return { events: EVENT_SERVE, used: true };
    }

    return { events: 0, used: false };
  }

  // -- per-frame advance ------------------------------------------------------

  function step(dt, input) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += dt;
    const timeLeft = SHIFT_SECONDS - state.elapsed;
    if (timeLeft <= 0) {
      state.over = true;
      return EVENT_OVER;
    }

    // Combo window ticks down; the combo dies with it.
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.shake > 0) state.shake -= dt;

    // Orders spawn on a quickening schedule, up to three at a time.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer = spawnIntervalAt(state.elapsed);
    }
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.missed += 1;
        state.combo = 0;
        state.comboTimer = 0;
        events |= EVENT_EXPIRE;
      }
    }

    // Chopping channels while the chef holds E at the board.
    const chef = state.chef;
    if (state.board.chopping) {
      const near = distToRect(chef.x, chef.y, STATIONS.board) < CHEF.interactRange;
      if (near && input.interactHeld()) {
        state.board.progress += dt / CHOP_SECONDS;
        if (Math.random() < dt * 14) {
          burst(STATIONS.board.x + 95, STATIONS.board.y + 46, '#f7ead0', 2, 70);
        }
        if (state.board.progress >= 1) {
          const kind = state.board.chopping;
          state.board.chopping = null;
          state.board.progress = 0;
          chef.chopping = false;
          if (chef.carrying && chef.carrying.kind === kind) chef.carrying.state = 'chopped';
          events |= EVENT_CHOP_DONE;
        }
      } else {
        state.board.chopping = null;
        state.board.progress = 0;
        chef.chopping = false;
      }
    }

    // The wok cooks on its own, then burns.
    const wok = state.wok;
    if (wok.item && !wok.item.burnt) {
      if (wok.item.state === 'raw') {
        wok.cookTime += dt;
        if (Math.random() < dt * 22) steam(STATIONS.wok.x + 95, STATIONS.wok.y + 34);
        if (wok.cookTime >= COOK_SECONDS) {
          wok.item.state = 'cooked';
          wok.burnTime = 0;
          events |= EVENT_COOK_DONE;
        }
      } else {
        wok.burnTime += dt;
        if (Math.random() < dt * 10) steam(STATIONS.wok.x + 95, STATIONS.wok.y + 34);
        if (wok.burnTime >= BURN_GRACE_SECONDS) {
          wok.item.burnt = true;
          events |= EVENT_BURN;
        }
      }
    }

    // Movement and interaction.
    moveChef(dt, input.moveVector());
    if (input.consume('interact')) {
      const done = interact();
      events |= done.events;
      if (!done.used) state.lastError = 0.18;
    }
    if (state.lastError > 0) state.lastError -= dt;

    // Particles and floating texts age out.
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.steam ? -12 * dt : 190 * dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floats.length - 1; i >= 0; i -= 1) {
      const f = state.floats[i];
      f.life -= dt;
      f.y -= 34 * dt;
      if (f.life <= 0) state.floats.splice(i, 1);
    }

    return events;
  }

  return {
    state,
    reset,
    step,
    interact,
    nearestUsable,
    spawnOrder,
    timeLeft() {
      return Math.max(0, SHIFT_SECONDS - state.elapsed);
    },
    isRush() {
      return state.elapsed > SHIFT_SECONDS - 30;
    },
  };
}
