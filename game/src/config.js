// Warung Sizzle — configuration: canvas, kitchen layout, ingredients, recipes.
// One job: every number and name the rest of the game reads, in one place.

export const STEP = 1 / 60;
export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 120;
export const RUSH_SECONDS = 30;
export const MAX_ORDERS = 3;
export const BEST_KEY = 'warung-sizzle-best';

// The chef's walk speed in pixels per second, and how close counts as "at" a station.
export const CHEF = { speed: 265, radius: 22, interactRange: 96 };

// Processing times, in seconds. Chopping channels while the chef stays at the board;
// the wok cooks on its own once an item is in, then burns if it is left too long.
export const CHOP_SECONDS = 0.9;
export const COOK_SECONDS = 3.0;
export const BURN_GRACE_SECONDS = 4.0;

// Money: each dish pays its base price plus a tip for serving with patience left.
export const SERVE_WINDOW_SECONDS = 10;
export const COMBO_STEP = 0.25;
export const COMBO_CAP = 2.0;

// Orders spawn faster and lose patience quicker as the shift goes on.
export const SPAWN_START_SECONDS = 14;
export const SPAWN_END_SECONDS = 7;
export const PATIENCE_START_SECONDS = 48;
export const PATIENCE_END_SECONDS = 32;

// ---------------------------------------------------------------------------
// Ingredients. Each one knows whether it can be chopped or cooked, its colours
// for the canvas art, and the short label the crates and tickets show.
// ---------------------------------------------------------------------------

export const INGREDIENTS = {
  rice: { name: 'Rice', chop: false, cook: true, label: 'Rice', base: '#f5efe0', accent: '#d9cba6' },
  noodle: { name: 'Noodle', chop: false, cook: true, label: 'Noodle', base: '#f2c94c', accent: '#d9a521' },
  chicken: { name: 'Chicken', chop: true, cook: true, label: 'Chicken', base: '#f2a18c', accent: '#d96a4f' },
  egg: { name: 'Egg', chop: false, cook: true, label: 'Egg', base: '#fdf6d8', accent: '#f2b705' },
  chili: { name: 'Chili', chop: true, cook: false, label: 'Chili', base: '#e74c3c', accent: '#a93226' },
  veg: { name: 'Greens', chop: true, cook: false, label: 'Greens', base: '#58b368', accent: '#2e7d32' },
};

export const INGREDIENT_KINDS = ['rice', 'noodle', 'chicken', 'egg', 'chili', 'veg'];

// ---------------------------------------------------------------------------
// Recipes. `needs` lists the processed ingredients a plate must hold, in any
// order, before it becomes the dish. Prices set the base pay for a serve.
// ---------------------------------------------------------------------------

export const RECIPES = {
  nasiGoreng: {
    name: 'Nasi Goreng',
    short: 'Nasi Goreng',
    price: 120,
    needs: [
      { kind: 'rice', state: 'cooked' },
      { kind: 'egg', state: 'cooked' },
      { kind: 'chili', state: 'chopped' },
    ],
  },
  mieAyam: {
    name: 'Mie Ayam',
    short: 'Mie Ayam',
    price: 100,
    needs: [
      { kind: 'noodle', state: 'cooked' },
      { kind: 'chicken', state: 'chopped' },
    ],
  },
  sateAyam: {
    name: 'Sate Ayam',
    short: 'Sate Ayam',
    price: 110,
    needs: [
      { kind: 'chicken', state: 'cooked' },
      { kind: 'chili', state: 'chopped' },
    ],
  },
  gadoGado: {
    name: 'Gado-Gado',
    short: 'Gado-Gado',
    price: 90,
    needs: [
      { kind: 'veg', state: 'chopped' },
      { kind: 'egg', state: 'cooked' },
    ],
  },
};

export const RECIPE_IDS = ['nasiGoreng', 'mieAyam', 'sateAyam', 'gadoGado'];

// ---------------------------------------------------------------------------
// Kitchen layout. The top strip is the order board; the counters sit in a row
// under it; the crates line the left wall; the pass and the bin are on the
// right and the middle. All coordinates are in the 1280x720 view space.
// ---------------------------------------------------------------------------

export const BOARD = { x: 0, y: 0, width: 1280, height: 116 };

export const STATIONS = {
  board: { name: 'board', label: 'Chopping Board', x: 420, y: 236, width: 190, height: 92, approach: { x: 530, y: 380 } },
  wok: { name: 'wok', label: 'Wok Station', x: 690, y: 236, width: 190, height: 92, approach: { x: 785, y: 380 } },
  plate: { name: 'plate', label: 'Plating Counter', x: 990, y: 236, width: 210, height: 92, approach: { x: 1095, y: 380 } },
  pass: { name: 'pass', label: 'Serving Pass', x: 990, y: 470, width: 210, height: 92, approach: { x: 1095, y: 610 } },
  trash: { name: 'trash', label: 'Bin', x: 420, y: 520, width: 74, height: 74, approach: { x: 457, y: 640 } },
};

// Ingredient crates down the left wall, in the order the board lists them.
export const CRATES = INGREDIENT_KINDS.map((kind, index) => ({
  kind,
  x: 18,
  y: 140 + index * 88,
  width: 132,
  height: 76,
  approach: { x: 215, y: 140 + index * 88 + 38 },
}));

// The floor the chef walks on: everything below the order board, inside the walls.
export const FLOOR = { x: 8, y: 124, width: 1264, height: 588 };
export const CHEF_START = { x: 640, y: 600 };

// Screens the game moves between.
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

// ---------------------------------------------------------------------------
// Helpers the world and the renderer share.
// ---------------------------------------------------------------------------

// Warm warung palette: teal walls, wood counters, terracotta tile.
export const PALETTE = {
  wall: '#1d6f6a',
  wallDark: '#155653',
  floor: '#e8d9b8',
  floorTile: '#dfcda4',
  counter: '#8a5a2b',
  counterTop: '#b07a3f',
  counterEdge: '#6b4423',
  board: '#f7ead0',
  steel: '#c8ccd4',
  steelDark: '#9aa0ab',
  paper: '#fff8e7',
  ink: '#2b2118',
  red: '#e74c3c',
  gold: '#f2b705',
};

/** True when the plate's items are exactly the recipe's needs, in any order. */
export function plateMatchesRecipe(items, recipe) {
  if (items.length !== recipe.needs.length) return false;
  const left = recipe.needs.map((need) => `${need.kind}:${need.state}`);
  for (const item of items) {
    const key = `${item.kind}:${item.state}`;
    const at = left.indexOf(key);
    if (at === -1) return false;
    left.splice(at, 1);
  }
  return left.length === 0;
}

/** The recipe a plate full of `items` completes, or null when it matches none. */
export function recipeForPlate(items) {
  for (const id of RECIPE_IDS) {
    if (plateMatchesRecipe(items, RECIPES[id])) return id;
  }
  return null;
}

/** Spawn interval and patience at `elapsed` seconds into the shift: pressure grows. */
export function spawnIntervalAt(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return SPAWN_START_SECONDS + (SPAWN_END_SECONDS - SPAWN_START_SECONDS) * t;
}

export function patienceAt(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return PATIENCE_START_SECONDS + (PATIENCE_END_SECONDS - PATIENCE_START_SECONDS) * t;
}
