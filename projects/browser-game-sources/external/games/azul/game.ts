const B = 1, Y = 2, R = 3, G = 4, W = 5, FP = -1;
const CN = ["", "blue", "yellow", "red", "green", "white"];
const WALL_PATTERN = [[B, Y, R, W, G], [G, B, Y, R, W], [W, G, B, Y, R], [R, W, G, B, Y], [Y, R, W, G, B]];
const FLOOR_PEN = [1, 1, 2, 2, 2, 3, 3];
const NAMES = ["You", "AI"];
let game;
function byId(id) {
  const element = document.getElementById(id);
  if (!element)
    throw new Error(`Missing required game element: #${id}`);
  return element;
}
function newPlayer() {
  return {
    pat: Array.from({ length: 5 }, (_, r) => ({ color: 0, count: 0, cap: r + 1 })),
    wall: Array.from({ length: 5 }, () => Array(5).fill(false)),
    floor: [],
    score: 0
  };
}
function init() {
  const bag = [];
  for (let c = 1;c <= 5; c++)
    for (let i = 0;i < 20; i++)
      bag.push(c);
  shuffle(bag);
  game = {
    bag,
    box: [],
    factories: Array.from({ length: 5 }, () => []),
    center: [],
    players: [newPlayer(), newPlayer()],
    cp: 0,
    starter: 0,
    round: 1,
    src: null,
    color: null,
    phase: "pick",
    over: false
  };
  setupRound();
  render();
}
function shuffle(a) {
  for (let i = a.length - 1;i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}
function drawTile() {
  if (!game.bag.length) {
    game.bag = game.box;
    game.box = [];
    shuffle(game.bag);
  }
  return game.bag.pop() ?? null;
}
function setupRound() {
  game.center = [FP];
  for (const f of game.factories) {
    f.length = 0;
    for (let i = 0;i < 4; i++) {
      const t = drawTile();
      if (t !== null)
        f.push(t);
    }
  }
  game.cp = game.starter;
  game.src = null;
  game.color = null;
  game.phase = "pick";
  if (game.cp === 1)
    setTimeout(aiTurn, 600);
}
function legalRows(p, color) {
  const rows = [];
  for (let r = 0;r < 5; r++) {
    const slot = p.pat[r];
    if (slot.count > 0 && slot.color !== color)
      continue;
    if (slot.count >= slot.cap)
      continue;
    if (p.wall[r][WALL_PATTERN[r].indexOf(color)])
      continue;
    rows.push(r);
  }
  return rows;
}
function applyMove(move) {
  const p = game.players[game.cp];
  let taken = 0;
  if (move.src === "center") {
    const rest = [];
    for (const t of game.center) {
      if (t === move.color)
        taken++;
      else if (t === FP) {
        p.floor.push(FP);
        game.starter = game.cp;
      } else
        rest.push(t);
    }
    game.center = rest;
  } else {
    const f = game.factories[parseInt(move.src.slice(1))];
    for (const t of f) {
      if (t === move.color)
        taken++;
      else
        game.center.push(t);
    }
    f.length = 0;
  }
  if (move.row >= 0) {
    const slot = p.pat[move.row];
    slot.color = move.color;
    const fit = Math.min(taken, slot.cap - slot.count);
    slot.count += fit;
    for (let i = fit;i < taken; i++)
      p.floor.push(move.color);
  } else {
    for (let i = 0;i < taken; i++)
      p.floor.push(move.color);
  }
}
function roundDone() {
  return game.factories.every((f) => !f.length) && !game.center.length;
}
function endTurn() {
  if (roundDone()) {
    game.phase = "scoring";
    render();
    msg("Round over — tiling the wall...");
    setTimeout(scoreRound, 900);
  } else {
    game.cp = 1 - game.cp;
    game.src = null;
    game.color = null;
    game.phase = "pick";
    render();
    if (game.cp === 1)
      setTimeout(aiTurn, 700);
  }
}
function scoreWallPlacement(wall, r, c) {
  let h = 1, v = 1;
  for (let j = c - 1;j >= 0 && wall[r][j]; j--)
    h++;
  for (let j = c + 1;j < 5 && wall[r][j]; j++)
    h++;
  for (let i = r - 1;i >= 0 && wall[i][c]; i--)
    v++;
  for (let i = r + 1;i < 5 && wall[i][c]; i++)
    v++;
  if (h > 1 && v > 1)
    return h + v;
  return Math.max(h, v);
}
function scoreRound() {
  for (const p of game.players) {
    for (let r = 0;r < 5; r++) {
      const slot = p.pat[r];
      if (slot.count === slot.cap && slot.count > 0) {
        const c = WALL_PATTERN[r].indexOf(slot.color);
        p.wall[r][c] = true;
        p.score += scoreWallPlacement(p.wall, r, c);
        for (let i = 0;i < slot.cap - 1; i++)
          game.box.push(slot.color);
        slot.color = 0;
        slot.count = 0;
      }
    }
    let pen = 0;
    p.floor.forEach((t, i) => {
      if (i < FLOOR_PEN.length)
        pen += FLOOR_PEN[i];
      if (t !== FP)
        game.box.push(t);
    });
    p.score = Math.max(0, p.score - pen);
    p.floor = [];
  }
  const finished = game.players.some((p) => p.wall.some((row) => row.every(Boolean)));
  if (finished) {
    for (const p of game.players) {
      for (let r = 0;r < 5; r++)
        if (p.wall[r].every(Boolean))
          p.score += 2;
      for (let c = 0;c < 5; c++)
        if (p.wall.every((row) => row[c]))
          p.score += 7;
      for (let col = 1;col <= 5; col++) {
        if (WALL_PATTERN.every((row, r) => p.wall[r][row.indexOf(col)]))
          p.score += 10;
      }
    }
    game.over = true;
    game.phase = "over";
    render();
    const [s0, s1] = game.players.map((p) => p.score);
    msg(s0 > s1 ? "\uD83C\uDF89 You win " + s0 + " – " + s1 + "!" : s1 > s0 ? "\uD83E\uDD16 AI wins " + s1 + " – " + s0 + "." : "Draw " + s0 + " – " + s0 + ".");
    return;
  }
  game.round++;
  setupRound();
  render();
}
function aiTurn() {
  if (game.over || game.cp !== 1)
    return;
  const p = game.players[1];
  const sources = [];
  game.factories.forEach((f, i) => {
    if (f.length)
      sources.push({ key: "f" + i, tiles: f });
  });
  if (game.center.some((t) => t !== FP))
    sources.push({ key: "center", tiles: game.center });
  let best = null, bestScore = -1 / 0;
  for (const s of sources) {
    const colors = new Set(s.tiles.filter((t) => t !== FP));
    for (const color of colors) {
      const n = s.tiles.filter((t) => t === color).length;
      const rows = legalRows(p, color);
      const options = rows.map((r) => ({ row: r })).concat([{ row: -1 }]);
      for (const o of options) {
        let score;
        if (o.row < 0) {
          score = -n * 3;
        } else {
          const slot = p.pat[o.row];
          const fit = Math.min(n, slot.cap - slot.count);
          const spill = n - fit;
          const completes = slot.count + fit === slot.cap;
          score = fit * 2 + (completes ? 6 + scoreWallPlacement(p.wall, o.row, WALL_PATTERN[o.row].indexOf(color)) : 0) - spill * 3;
        }
        if (s.key === "center" && game.center.includes(FP))
          score -= 1;
        score += Math.random() * 0.5;
        if (score > bestScore) {
          bestScore = score;
          best = { src: s.key, color, row: o.row };
        }
      }
    }
  }
  if (best) {
    applyMove(best);
    endTurn();
  }
}
function render() {
  renderFactories();
  renderCenter();
  renderPicker();
  renderBoards();
  renderScore();
  updateMsg();
}
function renderFactories() {
  const el = byId("factories");
  el.innerHTML = "";
  game.factories.forEach((f, i) => {
    const d = document.createElement("div");
    d.className = "factory" + (game.src === "f" + i ? " selected" : "");
    for (const t of f) {
      const tl = document.createElement("div");
      tl.className = "tile " + CN[t];
      d.appendChild(tl);
    }
    d.onclick = () => {
      if (game.cp !== 0 || game.over)
        return;
      if (f.length) {
        game.src = "f" + i;
        game.color = null;
        game.phase = "color";
        render();
      }
    };
    el.appendChild(d);
  });
}
function renderCenter() {
  const el = byId("center");
  el.innerHTML = "";
  el.className = game.src === "center" ? "selected" : "";
  for (const t of game.center) {
    const tl = document.createElement("div");
    tl.className = "tile " + (t === FP ? "first" : CN[t]);
    if (t === FP)
      tl.textContent = "1";
    el.appendChild(tl);
  }
  el.onclick = () => {
    if (game.cp !== 0 || game.over)
      return;
    if (game.center.some((t) => t !== FP)) {
      game.src = "center";
      game.color = null;
      game.phase = "color";
      render();
    }
  };
}
function renderPicker() {
  const el = byId("color-picker");
  el.innerHTML = "";
  if (!game.src || game.cp !== 0)
    return;
  const tiles = game.src === "center" ? game.center : game.factories[parseInt(game.src.slice(1))];
  const av = new Set(tiles.filter((t) => t !== FP));
  for (let c = 1;c <= 5; c++) {
    const d = document.createElement("div");
    d.className = "tile cpt " + CN[c] + (av.has(c) ? "" : " dis");
    if (av.has(c)) {
      d.onclick = () => {
        game.color = c;
        game.phase = "place";
        render();
      };
      if (game.color === c)
        d.classList.add("sel");
    }
    el.appendChild(d);
  }
}
function renderBoards() {
  for (let pi = 0;pi < 2; pi++) {
    const p = game.players[pi];
    const el = byId("board-" + pi);
    el.className = "panel player-board" + (game.cp === pi && !game.over ? "" : " inactive");
    el.innerHTML = '<div class="board-title"><span>' + NAMES[pi] + (game.cp === pi && !game.over ? " ◂" : "") + '</span><span class="pts">' + p.score + " pts</span></div>";
    const canPlace = pi === 0 && game.cp === 0 && game.phase === "place" && game.color !== null;
    const okRows = canPlace && game.color !== null ? legalRows(p, game.color) : [];
    for (let r = 0;r < 5; r++) {
      const rd = document.createElement("div");
      rd.className = "board-row";
      rd.innerHTML = '<span class="row-label">' + (r + 1) + "</span>";
      const pr = document.createElement("div");
      pr.className = "pattern-row";
      const slot = p.pat[r];
      for (let c = 0;c < slot.cap; c++) {
        const cell = document.createElement("div");
        const filled = c >= slot.cap - slot.count;
        cell.className = "pc" + (filled ? " " + CN[slot.color] : "");
        if (filled)
          cell.style.background = "";
        if (filled)
          cell.classList.add("tile");
        if (okRows.includes(r) && game.src !== null && game.color !== null) {
          cell.classList.add("placeable");
          cell.onclick = () => {
            applyMove({ src: game.src, color: game.color, row: r });
            endTurn();
          };
        }
        pr.appendChild(cell);
      }
      rd.appendChild(pr);
      const wr = document.createElement("div");
      wr.className = "wall-row";
      for (let c = 0;c < 5; c++) {
        const wc = document.createElement("div");
        wc.className = "wc tile " + CN[WALL_PATTERN[r][c]] + (p.wall[r][c] ? " scored" : "");
        wr.appendChild(wc);
      }
      rd.appendChild(wr);
      el.appendChild(rd);
    }
    const fl = document.createElement("div");
    fl.className = "floor";
    for (let i = 0;i < 7; i++) {
      const fc = document.createElement("div");
      const t = p.floor[i];
      fc.className = "fc";
      if (t !== undefined) {
        fc.classList.add("filled", "tile", t === FP ? "first" : CN[t]);
        if (t === FP)
          fc.textContent = "1";
      } else {
        fc.textContent = "-" + FLOOR_PEN[i];
      }
      if (pi === 0 && game.cp === 0 && game.phase === "place" && game.src !== null && game.color !== null) {
        fc.classList.add("placeable");
        fc.onclick = () => {
          applyMove({ src: game.src, color: game.color, row: -1 });
          endTurn();
        };
      }
      fl.appendChild(fc);
    }
    el.appendChild(fl);
  }
}
function renderScore() {
  const el = byId("score-display");
  el.innerHTML = "";
  game.players.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "stat";
    d.innerHTML = "<span>" + NAMES[i] + '</span><span class="stat-val">' + p.score + "</span>";
    el.appendChild(d);
  });
  byId("round-info").textContent = "Round " + game.round;
}
function updateMsg() {
  if (game.over)
    return;
  const el = byId("message");
  if (game.cp === 1) {
    el.textContent = "AI is thinking...";
    return;
  }
  if (game.phase === "pick")
    el.innerHTML = 'Select a <span class="hl">factory</span> or the <span class="hl">center</span>';
  else if (game.phase === "color")
    el.innerHTML = 'Pick a <span class="hl">color</span> to take';
  else if (game.phase === "place")
    el.innerHTML = 'Click a highlighted <span class="hl">pattern row</span> (or the floor)';
}
function msg(m) {
  byId("message").textContent = m;
}
byId("btn-new").onclick = init;
init();
