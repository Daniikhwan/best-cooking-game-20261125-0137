// Warung Sizzle — the renderer: every pixel of the kitchen, drawn on one
// canvas with plain shapes. No images, no fonts from the network: the art
// is vector, the labels are system fonts, the food is drawn to look edible.

import {
  BOARD,
  CHEF,
  CRATES,
  FLOOR,
  INGREDIENTS,
  PALETTE,
  RECIPES,
  SHIFT_SECONDS,
  STATIONS,
  VIEW,
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
} from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// -- food ---------------------------------------------------------------------

// Draw one ingredient at (x, y) with radius `r`, in its current `state`:
// raw is whole, chopped is cut pieces, cooked is browned, burnt is charred.
export function drawIngredient(ctx, kind, state, x, y, r) {
  const ing = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.3);
    ctx.lineTo(r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.5, -r * 0.4);
    ctx.lineTo(-r * 0.3, r * 0.5);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (state === 'chopped') {
    ctx.fillStyle = ing.base;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-r * 0.45 + i * r * 0.45, (i % 2 === 0 ? -r * 0.25 : r * 0.3), r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ing.accent;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'rice': {
      ctx.fillStyle = '#e8e0cc';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.28, r * 0.95, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffdf4';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.15, r * 0.42, 0, Math.PI * 2);
      ctx.arc(r * 0.25, -r * 0.25, r * 0.38, 0, Math.PI * 2);
      ctx.arc(r * 0.05, -r * 0.45, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'noodle': {
      ctx.strokeStyle = ing.base;
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.4 + i * r * 0.4);
        ctx.quadraticCurveTo(0, -r * 0.7 + i * r * 0.4, r * 0.7, -r * 0.4 + i * r * 0.4);
        ctx.stroke();
      }
      break;
    }
    case 'chicken': {
      ctx.fillStyle = ing.base;
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, r * 0.05, r * 0.72, r * 0.58, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fdf6d8';
      ctx.lineWidth = r * 0.22;
      ctx.beginPath();
      ctx.moveTo(r * 0.45, -r * 0.35);
      ctx.lineTo(r * 0.85, -r * 0.75);
      ctx.stroke();
      ctx.fillStyle = '#fdf6d8';
      ctx.beginPath();
      ctx.arc(r * 0.9, -r * 0.8, r * 0.2, 0, Math.PI * 2);
      ctx.arc(r * 0.72, -r * 0.95, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'egg': {
      if (state === 'cooked') {
        ctx.fillStyle = '#fffdf4';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.95, r * 0.7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ing.accent;
        ctx.beginPath();
        ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe98a';
        ctx.beginPath();
        ctx.arc(r * 0.02, -r * 0.12, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#fdf6d8';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.7, r * 0.88, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath();
        ctx.ellipse(-r * 0.15, -r * 0.3, r * 0.35, r * 0.2, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'chili': {
      ctx.strokeStyle = ing.base;
      ctx.lineWidth = r * 0.42;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.1, r * 0.75, r * 0.75, -r * 0.35);
      ctx.stroke();
      ctx.strokeStyle = '#2e7d32';
      ctx.lineWidth = r * 0.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.5);
      ctx.lineTo(-r * 0.95, -r * 0.8);
      ctx.stroke();
      break;
    }
    case 'veg': {
      ctx.fillStyle = ing.base;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.ellipse(-r * 0.5 + i * r * 0.5, (i - 1) * r * 0.22, r * 0.42, r * 0.6, (i - 1) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = ing.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
  if (state === 'cooked') {
    ctx.fillStyle = 'rgba(160, 90, 20, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A small dish icon: the plate with its recipe's ingredients on it.
export function drawDishIcon(ctx, recipeId, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8ccd4';
  ctx.lineWidth = 2;
  ctx.stroke();
  const recipe = RECIPES[recipeId];
  recipe.needs.forEach((need, i) => {
    const a = (i / recipe.needs.length) * Math.PI * 2 - Math.PI / 2;
    drawIngredient(ctx, need.kind, need.state, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.3, r * 0.34);
  });
  ctx.restore();
}

// -- kitchen ------------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, BOARD.height, VIEW.width, VIEW.height - BOARD.height);
  ctx.fillStyle = PALETTE.floorTile;
  const tile = 64;
  for (let y = BOARD.height; y < VIEW.height; y += tile) {
    for (let x = (Math.floor(y / tile) % 2) * tile / 2; x < VIEW.width; x += tile) {
      ctx.fillRect(x, y, tile - 2, 2);
    }
  }
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, BOARD.height - 8, VIEW.width, 8);
}

function drawCounter(ctx, s, highlight) {
  ctx.fillStyle = PALETTE.counter;
  roundRect(ctx, s.x - 4, s.y - 4, s.width + 8, s.height + 8, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, s.x, s.y, s.width, s.height, 8);
  ctx.fill();
  if (highlight) {
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    roundRect(ctx, s.x - 8, s.y - 8, s.width + 16, s.height + 16, 12);
    ctx.stroke();
  }
}

function drawCrates(ctx, highlightKind) {
  for (const crate of CRATES) {
    const ing = INGREDIENTS[crate.kind];
    ctx.fillStyle = '#7a4a22';
    roundRect(ctx, crate.x, crate.y, crate.width, crate.height, 8);
    ctx.fill();
    ctx.fillStyle = '#a06a35';
    roundRect(ctx, crate.x + 4, crate.y + 4, crate.width - 8, crate.height - 8, 6);
    ctx.fill();
    drawIngredient(ctx, crate.kind, 'raw', crate.x + 30, crate.y + crate.height / 2, 20);
    text(ctx, ing.label, crate.x + 62, crate.y + crate.height / 2 - 2, 17, '#fff8e7');
    if (highlightKind === crate.kind) {
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 4;
      roundRect(ctx, crate.x - 4, crate.y - 4, crate.width + 8, crate.height + 8, 10);
      ctx.stroke();
    }
  }
}

function drawBoard(ctx, s, state, highlight) {
  drawCounter(ctx, s, highlight);
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, s.x + 22, s.y + 16, s.width - 44, s.height - 32, 6);
  ctx.fill();
  ctx.strokeStyle = '#d9cba6';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Knife resting on the board.
  ctx.save();
  ctx.translate(s.x + s.width - 42, s.y + 22);
  ctx.rotate(0.5);
  ctx.fillStyle = PALETTE.steel;
  ctx.fillRect(0, 0, 34, 9);
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(34, 1, 16, 7);
  ctx.restore();
  if (state.board.chopping) {
    drawIngredient(ctx, state.board.chopping, 'chopped', s.x + 70, s.y + s.height / 2 + 4, 20);
    const p = state.board.progress;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(s.x + 22, s.y + s.height - 14, s.width - 44, 7);
    ctx.fillStyle = '#58b368';
    ctx.fillRect(s.x + 22, s.y + s.height - 14, (s.width - 44) * p, 7);
    text(ctx, 'CHOPPING…', s.x + s.width / 2, s.y - 14, 13, '#6b4423');
  } else {
    text(ctx, 'CHOP', s.x + s.width / 2, s.y - 14, 13, '#6b4423');
  }
}

function drawWok(ctx, s, state, highlight) {
  drawCounter(ctx, s, highlight);
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2 + 6;
  // Burner flame under the wok.
  ctx.fillStyle = '#ff8c42';
  ctx.beginPath();
  ctx.ellipse(cx, s.y + s.height - 12, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.ellipse(cx, s.y + s.height - 12, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // The wok itself.
  ctx.fillStyle = '#3a3f47';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#565d68';
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 56, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  const item = state.wok.item;
  if (item) {
    drawIngredient(ctx, item.kind, item.burnt ? 'burnt' : item.state, cx, cy - 6, 22);
    const total = 3.0;
    const done = item.state === 'cooked';
    const frac = done ? 1 - state.wok.burnTime / 4.0 : state.wok.cookTime / total;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = item.burnt ? '#e74c3c' : done ? '#e74c3c' : '#f2b705';
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, frac)));
    ctx.stroke();
    if (item.burnt) text(ctx, 'BURNT!', cx, s.y - 14, 14, '#c0392b');
    else if (done) text(ctx, 'READY!', cx, s.y - 14, 14, '#2e7d32');
    else text(ctx, 'COOKING…', cx, s.y - 14, 13, '#6b4423');
  } else {
    text(ctx, 'WOK', cx, s.y - 14, 13, '#6b4423');
  }
}

function drawPlateCounter(ctx, s, state, highlight) {
  drawCounter(ctx, s, highlight);
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2 + 4;
  if (state.plate.dish) {
    drawDishIcon(ctx, state.plate.dish, cx, cy, 52);
    text(ctx, RECIPES[state.plate.dish].name.toUpperCase() + ' — READY', cx, s.y - 14, 14, '#2e7d32');
  } else if (state.plate.items.length > 0) {
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 56, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8ccd4';
    ctx.lineWidth = 2;
    ctx.stroke();
    state.plate.items.forEach((item, i) => {
      const a = (i / state.plate.items.length) * Math.PI * 2 - Math.PI / 2;
      drawIngredient(ctx, item.kind, item.state, cx + Math.cos(a) * 24, cy + Math.sin(a) * 16, 15);
    });
    text(ctx, 'PLATING…', cx, s.y - 14, 13, '#6b4423');
  } else {
    ctx.strokeStyle = 'rgba(255,248,231,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 56, 38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'PLATE', cx, s.y - 14, 13, '#6b4423');
  }
}

function drawPass(ctx, s, state, highlight) {
  drawCounter(ctx, s, highlight);
  const cx = s.x + s.width / 2;
  const cy = s.y + s.height / 2 + 4;
  ctx.fillStyle = '#2b2118';
  roundRect(ctx, s.x + 14, s.y + 10, s.width - 28, 26, 4);
  ctx.fill();
  text(ctx, '— SERVE —', cx, s.y + 24, 14, '#ffd54f');
  // The service bell.
  ctx.fillStyle = '#f2b705';
  ctx.beginPath();
  ctx.arc(cx, cy + 12, 20, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 24, cy + 10, 48, 5);
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(cx + 22, cy + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'PASS', cx, s.y - 14, 13, '#6b4423');
}

function drawTrash(ctx, s, highlight) {
  ctx.fillStyle = '#565d68';
  roundRect(ctx, s.x, s.y, s.width, s.height, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3f47';
  roundRect(ctx, s.x + 6, s.y + 6, s.width - 12, s.height - 12, 6);
  ctx.fill();
  text(ctx, 'BIN', s.x + s.width / 2, s.y + s.height / 2, 14, '#fff8e7');
  if (highlight) {
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    roundRect(ctx, s.x - 4, s.y - 4, s.width + 8, s.height + 8, 10);
    ctx.stroke();
  }
}

// -- chef -----------------------------------------------------------------------

function drawChef(ctx, chef, state) {
  const { x, y } = chef;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(0, 2, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  ctx.beginPath();
  ctx.ellipse(0, 8, 13, 12, 0, 0, Math.PI);
  ctx.fill();
  // Head and hat.
  ctx.fillStyle = '#f2c49b';
  ctx.beginPath();
  ctx.arc(0, -16, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -26, 8, 0, Math.PI * 2);
  ctx.arc(0, -30, 9, 0, Math.PI * 2);
  ctx.arc(8, -26, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -28, 26, 6);
  // Eyes look where the chef faces.
  const look = chef.dir === 'left' ? -4 : chef.dir === 'right' ? 4 : 0;
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(-5 + look, -16, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + look, -16, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Chopping arms.
  if (chef.chopping) {
    ctx.strokeStyle = '#f2c49b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const bob = Math.sin(state.elapsed * 22) * 4;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-20, -14 + bob);
    ctx.moveTo(12, 0);
    ctx.lineTo(20, -14 - bob);
    ctx.stroke();
  }
  // Carried item floats above the hat.
  const carried = chef.carrying;
  if (carried) {
    if (carried.dish) drawDishIcon(ctx, carried.dish, 0, -56, 26);
    else drawIngredient(ctx, carried.kind, carried.state, 0, -56, 18);
  }
  ctx.restore();
}

// -- order board and HUD --------------------------------------------------------

function drawOrderBoard(ctx, state, timeLeft) {
  ctx.fillStyle = PALETTE.wallDark;
  ctx.fillRect(0, 0, VIEW.width, BOARD.height);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW.width, 10);
  text(ctx, 'WARUNG SIZZLE', 104, 32, 24, '#ffd54f', '900', 'left');
  text(ctx, 'dapur kilat · serve fast, serve hot', 104, 58, 12, '#cfe8e4', '400', 'left');

  // Order tickets.
  const ticketW = 210;
  const ticketH = 92;
  const startX = 360;
  for (let i = 0; i < 3; i += 1) {
    const x = startX + i * (ticketW + 12);
    const y = 12;
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, x, y, ticketW, ticketH, 8);
    ctx.fill();
    const order = state.orders[i];
    if (!order) {
      ctx.fillStyle = '#b8a888';
      ctx.font = 'italic 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('— no order —', x + ticketW / 2, y + ticketH / 2);
      continue;
    }
    const recipe = RECIPES[order.recipeId];
    const urgent = order.patience < 12;
    text(ctx, recipe.name.toUpperCase(), x + ticketW / 2, y + 16, 15, urgent ? '#c0392b' : '#2b2118');
    recipe.needs.forEach((need, j) => {
      drawIngredient(ctx, need.kind, need.state, x + 34 + j * 52, y + 46, 15);
    });
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e5dcc4';
    ctx.fillRect(x + 12, y + ticketH - 16, ticketW - 24, 8);
    ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f2b705' : '#e74c3c';
    ctx.fillRect(x + 12, y + ticketH - 16, (ticketW - 24) * frac, 8);
    text(ctx, `${Math.ceil(order.patience)}s`, x + ticketW - 26, y + ticketH - 26, 12, urgent ? '#c0392b' : '#6b5b45');
  }

  // Shift timer, coins, combo on the right.
  const rightX = 1030;
  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft % 60);
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  text(ctx, timeLeft <= 30 ? '⏰ ' + timeStr : timeStr, rightX + 110, 30, 30, timeLeft <= 30 ? '#ff8a7a' : '#fff8e7', '900');
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(rightX, 52, 220, 8);
  ctx.fillStyle = timeLeft <= 30 ? '#e74c3c' : '#58b368';
  ctx.fillRect(rightX, 52, 220 * (timeLeft / SHIFT_SECONDS), 8);
  text(ctx, `🪙 ${state.coins}`, rightX + 30, 84, 20, '#ffd54f', '900', 'left');
  text(ctx, `served ${state.served}`, rightX + 150, 84, 15, '#cfe8e4', '400', 'left');
  if (state.combo > 1) {
    text(ctx, `COMBO x${(1 + 0.25 * (state.combo - 1)).toFixed(2)}`, rightX + 110, 104, 15, '#ffd54f');
  }
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.steam ? (1.6 - p.life / p.max) : 1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 22, f.color, '900');
  }
  ctx.globalAlpha = 1;
}

function drawHint(ctx, state, nearest) {
  const label = nearest
    ? nearest.type === 'crate'
      ? `E — take ${INGREDIENTS[nearest.kind].name}`
      : `E — ${nearest.label}`
    : 'WASD / arrows — walk · E — use · P — pause';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, 340, 676, 600, 30, 15);
  ctx.fill();
  text(ctx, label, 640, 691, 15, '#fff8e7', '600');
}

// -- screens --------------------------------------------------------------------

function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(21, 86, 83, 0.92)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, '🍳', 640, 130, 90, '#fff8e7');
  text(ctx, 'WARUNG SIZZLE', 640, 230, 64, '#ffd54f', '900');
  text(ctx, 'Run the busiest street-food warung in town.', 640, 290, 22, '#fff8e7', '400');
  text(ctx, 'Chop it. Fry it. Plate it. Serve it — before the customer walks.', 640, 322, 18, '#cfe8e4', '400');
  const lines = [
    'WASD / arrows — walk the kitchen',
    'E or Space — pick up · chop · cook · plate · serve',
    'Click a station — use it, if you are close enough',
    'Serve fast for tips · chain serves for a combo · mind the burn',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 380 + i * 30, 17, '#fff8e7', '400'));
  text(ctx, '▶  Press ENTER or click to start the shift', 640, 540, 22, '#ffd54f', '900');
  if (best > 0) text(ctx, `Best shift so far: 🪙 ${best}`, 640, 580, 17, '#cfe8e4', '400');
  text(ctx, '120 seconds a shift · 4 dishes · the rush never waits', 640, 620, 15, '#8fb8b2', '400');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'PAUSED', 640, 330, 48, '#fff8e7', '900');
  text(ctx, 'P or Esc to keep cooking · R to restart the shift', 640, 390, 18, '#cfe8e4', '400');
}

function drawOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(21, 86, 83, 0.94)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SHIFT OVER', 640, 190, 56, '#ffd54f', '900');
  text(ctx, `You served ${state.served} dishes and banked 🪙 ${state.coins}`, 640, 260, 24, '#fff8e7', '400');
  text(ctx, `Missed orders: ${state.missed} · Best combo: x${state.bestCombo}`, 640, 300, 20, '#cfe8e4', '400');
  if (state.coins >= best && state.coins > 0) text(ctx, '★ New best shift! ★', 640, 350, 24, '#ffd54f', '900');
  else if (best > 0) text(ctx, `Best shift: 🪙 ${best}`, 640, 350, 20, '#cfe8e4', '400');
  text(ctx, 'Press R or ENTER to cook another shift', 640, 440, 20, '#fff8e7', '900');
}

// -- the renderer ---------------------------------------------------------------

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  return {
    draw(state, screen, best, nearest, timeLeft) {
      ctx.save();
      if (state.shake > 0) {
        ctx.translate((Math.random() - 0.5) * 6 * state.shake * 10, (Math.random() - 0.5) * 6 * state.shake * 10);
      }
      drawFloor(ctx);
      drawCrates(ctx, nearest && nearest.type === 'crate' ? nearest.kind : null);
      const hl = (name) => nearest && nearest.type === 'station' && nearest.name === name;
      drawBoard(ctx, STATIONS.board, state, hl('board'));
      drawWok(ctx, STATIONS.wok, state, hl('wok'));
      drawPlateCounter(ctx, STATIONS.plate, state, hl('plate'));
      drawPass(ctx, STATIONS.pass, state, hl('pass'));
      drawTrash(ctx, STATIONS.trash, hl('trash'));
      drawChef(ctx, state.chef, state);
      drawParticles(ctx, state);
      drawOrderBoard(ctx, state, timeLeft);
      if (screen === SCREEN_PLAY) drawHint(ctx, state, nearest);
      if (state.lastError > 0) {
        text(ctx, '✖ that does not work here', 640, 150, 18, '#ff8a7a', '900');
      }
      if (state.elapsed > SHIFT_SECONDS - 30 && screen === SCREEN_PLAY) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.08)';
        ctx.fillRect(0, 0, VIEW.width, VIEW.height);
        text(ctx, '⚠ RUSH HOUR ⚠', 640, 176, 20, '#ff8a7a', '900');
      }
      ctx.restore();
      if (screen === SCREEN_TITLE) drawTitle(ctx, best);
      if (screen === SCREEN_PAUSED) drawPaused(ctx);
      if (screen === SCREEN_OVER) drawOver(ctx, state, best);
    },
  };
}
