// The screenshot scenes behind ?shot=cover|cook|serve|rush. Each one plays
// the real rules forward from a fresh world, steered by a small autopilot
// that works the first order on the board like a player would: fetch the
// ingredients, chop and fry them, plate the dish and serve it. The frame is
// therefore what a short game really looks like, and the same seed always
// stages the same frame.
//
// The autopilot speaks the same input interface the keyboard does
// (moveVector, interactHeld, consume, takeClick), so the world cannot tell
// a staged run from a played one.

import { CHEF, INGREDIENTS, RECIPES, STATIONS, CRATES, SCREEN_PLAY } from './config.js';
import { EVENT_SERVE } from './world.js';

const STEP = 1 / 60;
const CORRIDOR_Y = 600;

// -- routing ------------------------------------------------------------------
//
// The kitchen's counters block straight lines: the pass sits directly under
// the plating counter, and the bin crowds the corridor. So the autopilot
// walks a small graph of safe nodes (each edge is a straight segment the
// chef's circle can travel) and finds its route with a breadth-first search.
// Nodes are the corridor lanes, the upper lane, and every station approach.

const NODES = {
  corridorL: { x: 250, y: 600 },
  upperL: { x: 250, y: 380 },
  upperC: { x: 640, y: 380 },
  corridorC: { x: 640, y: 600 },
  upperR: { x: 940, y: 380 },
  corridorR: { x: 940, y: 600 },
  farR: { x: 1240, y: 620 },
  board: { x: 530, y: 380 },
  wok: { x: 785, y: 380 },
  plate: { x: 1095, y: 380 },
  pass: { x: 1095, y: 610 },
  trash: { x: 457, y: 640 },
  crateRice: { x: 215, y: 178 },
  crateNoodle: { x: 215, y: 266 },
  crateChicken: { x: 215, y: 354 },
  crateEgg: { x: 215, y: 442 },
  crateChili: { x: 215, y: 530 },
  crateVeg: { x: 215, y: 618 },
};

const EDGES = {
  corridorL: ['upperL', 'crateRice', 'crateNoodle', 'crateChicken', 'crateEgg', 'crateChili', 'crateVeg'],
  upperL: ['corridorL', 'upperC', 'board'],
  upperC: ['upperL', 'upperR', 'board', 'wok', 'corridorC'],
  corridorC: ['upperC', 'corridorR', 'trash'],
  upperR: ['upperC', 'plate', 'corridorR'],
  corridorR: ['corridorC', 'upperR', 'farR', 'pass'],
  farR: ['corridorR', 'pass'],
  board: ['upperL', 'upperC'],
  wok: ['upperC'],
  plate: ['upperR'],
  pass: ['corridorR', 'farR'],
  trash: ['corridorC'],
  crateRice: ['corridorL'],
  crateNoodle: ['corridorL'],
  crateChicken: ['corridorL'],
  crateEgg: ['corridorL'],
  crateChili: ['corridorL'],
  crateVeg: ['corridorL'],
};

function nearestNode(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const name of Object.keys(NODES)) {
    const n = NODES[name];
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

function route(from, to) {
  if (from === to) return [to];
  const prev = { [from]: null };
  const queue = [from];
  while (queue.length > 0) {
    const at = queue.shift();
    for (const next of EDGES[at] || []) {
      if (!(next in prev)) {
        prev[next] = at;
        if (next === to) {
          const path = [to];
          let node = to;
          while (prev[node] !== null) {
            node = prev[node];
            path.unshift(node);
          }
          return path;
        }
        queue.push(next);
      }
    }
  }
  return [to];
}

function approachOf(target) {
  return target.approach;
}

function stationByName(name) {
  return STATIONS[name];
}

function crateOf(kind) {
  return CRATES.find((c) => c.kind === kind);
}

function nodeForStation(target) {
  if (target.name) return target.name;
  return 'crate' + target.kind[0].toUpperCase() + target.kind.slice(1);
}

// Does `item` (an ingredient in some state) satisfy one of the recipe's needs?
function needSatisfiedBy(recipe, item) {
  return recipe.needs.some((n) => n.kind === item.kind && n.state === item.state);
}

// The first need of `recipe` that the plate does not already hold.
function firstMissingNeed(recipe, plateItems) {
  for (const need of recipe.needs) {
    const held = plateItems.some((i) => i.kind === need.kind && i.state === need.state);
    if (!held) return need;
  }
  return null;
}

export class Autopilot {
  constructor(world) {
    this.world = world;
    this.queue = [];
    this.press = false;
    this.holding = false;
    this.waitLeft = 0;
    this.waitFn = null;
    this.stuckTimer = 0;
    this.lastProgress = -1;
    this.dishWait = 0;
  }

  // -- the input interface the world reads ------------------------------------

  moveVector() {
    const task = this.queue[0];
    if (!task || task.type !== 'goto') return { x: 0, y: 0 };
    const chef = this.world.state.chef;
    const dx = task.x - chef.x;
    const dy = task.y - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) return { x: 0, y: 0 };
    return { x: dx / d, y: dy / d };
  }

  interactHeld() {
    return this.holding;
  }

  consume(action) {
    if (action === 'interact' && this.press) {
      this.press = false;
      return true;
    }
    return false;
  }

  takeClick() {
    return null;
  }

  // -- planning -----------------------------------------------------------------

  // Walk to a station approach along the safe-node graph, then stand at it.
  gotoStation(target) {
    const chef = this.world.state.chef;
    const from = nearestNode(chef.x, chef.y);
    const to = nodeForStation(target);
    const path = route(from, to);
    for (const node of path) {
      const at = NODES[node];
      this.queue.push({ type: 'goto', x: at.x, y: at.y });
    }
  }

  plan() {
    const s = this.world.state;
    const chef = s.chef;
    const order = s.orders[0];
    const carrying = chef.carrying;

    // Burnt food blocks the wok: clear it first.
    if (s.wok.item && s.wok.item.burnt) {
      this.gotoStation(stationByName('wok'));
      this.queue.push({ type: 'press' });
      return;
    }
    // A finished dish goes straight to the pass — unless its order is
    // gone. Then give a fresh order a few seconds to arrive before binning.
    if (carrying && carrying.dish) {
      if (s.orders.some((o) => o.recipeId === carrying.dish)) {
        this.dishWait = 0;
        this.gotoStation(stationByName('pass'));
        this.queue.push({ type: 'press' });
        return;
      }
      if (this.dishWait < 6) {
        this.dishWait += 2;
        this.queue.push({ type: 'wait', t: 2 });
        return;
      }
      this.dishWait = 0;
      this.gotoStation(stationByName('trash'));
      this.queue.push({ type: 'press' });
      return;
    }
    if (!carrying || !carrying.dish) this.dishWait = 0;
    // A plated dish is picked up before anything else.
    if (s.plate.dish) {
      this.gotoStation(stationByName('plate'));
      this.queue.push({ type: 'press' });
      return;
    }
    if (!order) {
      this.queue.push({ type: 'wait', t: 1 });
      return;
    }
    const recipe = RECIPES[order.recipeId];

    // A plate item the current order does not need is stale (its order
    // expired mid-assembly): take it back — the world hands back the
    // useless one first — and bin it. Hands full of something useful is
    // worked first instead, so nothing good is thrown away.
    const stale = s.plate.items.some((i) => !recipe.needs.some((n) => n.kind === i.kind && n.state === i.state));
    if (stale) {
      const missingNow = firstMissingNeed(recipe, s.plate.items);
      if (carrying && !carrying.dish && missingNow && missingNow.kind === carrying.kind && missingNow.state === carrying.state && s.plate.items.length < 3) {
        this.gotoStation(stationByName('plate'));
        this.queue.push({ type: 'press' });
        return;
      }
      if (carrying && !carrying.dish && missingNow && missingNow.kind === carrying.kind && carrying.state === 'raw') {
        // Useful raw ingredient: process it first, clear the plate after.
        if (missingNow.state === 'chopped') {
          this.gotoStation(stationByName('board'));
          this.queue.push({ type: 'press' });
          this.queue.push({ type: 'holdChop' });
          return;
        }
        if (missingNow.state === 'cooked') {
          this.gotoStation(stationByName('wok'));
          this.queue.push({ type: 'press' });
          this.queue.push({ type: 'waitWok' });
          this.queue.push({ type: 'press' });
          return;
        }
      }
      if (!carrying) {
        this.gotoStation(stationByName('plate'));
        this.queue.push({ type: 'press' });
        return;
      }
      this.gotoStation(stationByName('trash'));
      this.queue.push({ type: 'press' });
      return;
    }

    const missing = firstMissingNeed(recipe, s.plate.items);
    if (!missing) {
      // The plate holds everything but no dish formed (should not happen):
      // take the last item back and start over.
      this.gotoStation(stationByName('plate'));
      this.queue.push({ type: 'press' });
      return;
    }

    // Carrying something this order cannot use? Bin it.
    if (carrying && !carrying.dish) {
      const useful = missing.kind === carrying.kind && (missing.state === carrying.state || carrying.state === 'raw');
      if (!useful) {
        this.gotoStation(stationByName('trash'));
        this.queue.push({ type: 'press' });
        return;
      }
      if (missing.state === carrying.state) {
        this.gotoStation(stationByName('plate'));
        this.queue.push({ type: 'press' });
        return;
      }
    }

    // A cooked item waiting in the wok is collected first.
    if (s.wok.item && s.wok.item.state === 'cooked' && s.wok.item.kind === missing.kind) {
      this.gotoStation(stationByName('wok'));
      this.queue.push({ type: 'press' });
      return;
    }
    // The chef already holds the raw ingredient: process it.
    if (carrying && !carrying.dish && carrying.kind === missing.kind && carrying.state === 'raw') {
      if (missing.state === 'chopped') {
        this.gotoStation(stationByName('board'));
        this.queue.push({ type: 'press' });
        this.queue.push({ type: 'holdChop' });
        return;
      }
      if (missing.state === 'cooked') {
        this.gotoStation(stationByName('wok'));
        this.queue.push({ type: 'press' });
        this.queue.push({ type: 'waitWok' });
        this.queue.push({ type: 'press' });
        return;
      }
    }
    // Otherwise fetch the raw ingredient from its crate.
    this.gotoStation(crateOf(missing.kind));
    this.queue.push({ type: 'press' });
  }

  // -- execution ------------------------------------------------------------------

  // Advance one fixed step, working the queue. Returns the frame's events.
  tick() {
    const s = this.world.state;
    if (this.queue.length === 0) this.plan();

    const task = this.queue[0];
    if (!task) return 0;

    if (task.type === 'goto') {
      const chef = s.chef;
      if (Math.hypot(task.x - chef.x, task.y - chef.y) < 10) this.queue.shift();
    } else if (task.type === 'press') {
      this.press = true;
      this.queue.shift();
    } else if (task.type === 'holdChop') {
      this.holding = true;
      if (!s.board.chopping) {
        this.holding = false;
        this.queue.shift();
      }
    } else if (task.type === 'waitWok') {
      const item = s.wok.item;
      if (!item || item.state === 'cooked' || item.burnt) this.queue.shift();
    } else if (task.type === 'wait') {
      if (task.left === undefined) task.left = task.t;
      task.left -= STEP;
      if (task.left <= 0) this.queue.shift();
    }

    // If nothing changed for a while, the plan is stuck: drop it and replan.
    const progress = s.served * 100 + s.plate.items.length * 10 + (s.chef.carrying ? 1 : 0);
    if (progress !== this.lastProgress) {
      this.lastProgress = progress;
      this.stuckTimer = 0;
    } else {
      this.stuckTimer += STEP;
      if (this.stuckTimer > 6) {
        this.queue = [];
        this.holding = false;
        this.stuckTimer = 0;
      }
    }

    return this.world.step(STEP, this);
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * cover: a busy mid-shift kitchen. cook: the wok and board in action.
 * serve: the moment just after a dish is served. rush: the last half-minute.
 */
export function stageShot(name, world) {
  world.reset();
  const pilot = new Autopilot(world);
  const run = (seconds, stopAtServe) => {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i += 1) {
      const events = pilot.tick();
      if (stopAtServe && events & EVENT_SERVE) return true;
      if (world.state.over) break;
    }
    return false;
  };

  if (name === 'cook') {
    run(16);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'serve') {
    run(120, true);
    for (let i = 0; i < 30; i += 1) pilot.tick();
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'rush') {
    run(98);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  // cover (and anything else): a busy kitchen mid-shift.
  run(34);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
