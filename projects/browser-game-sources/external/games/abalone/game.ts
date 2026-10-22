const EMPTY = 0, BLACK = 1, WHITE = 2;
const DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
function genBoard(r = 4) {
  const cells = new Set;
  for (let q = -r;q <= r; q++)
    for (let r2 = Math.max(-r, -q - r);r2 <= Math.min(r, -q + r); r2++)
      cells.add(q + "," + r2);
  return cells;
}
const BOARD_CELLS = genBoard(4);
const CELL_LIST = [...BOARD_CELLS].map((s) => s.split(",").map(Number));
function buildCenterTable(r = 4) {
  const t = {};
  for (let q = -r;q <= r; q++)
    for (let r2 = Math.max(-r, -q - r);r2 <= Math.min(r, -q + r); r2++) {
      const s = -q - r2, d = Math.max(Math.abs(q), Math.abs(r2), Math.abs(s));
      t[q + "," + r2] = d <= 1 ? 3 : d <= 2 ? 2 : d <= 3 ? 1 : 0;
    }
  return t;
}
const CENTER_T = buildCenterTable(4);
const BORDER_CELLS = new Set(CELL_LIST.filter((c) => CENTER_T[c[0] + "," + c[1]] === 0).map((c) => c[0] + "," + c[1]));
const POS_BLACK = [[0, -4], [1, -4], [2, -4], [3, -4], [4, -4], [-1, -3], [0, -3], [1, -3], [2, -3], [3, -3], [-1, -2], [0, -2], [1, -2], [2, -2]];
const POS_WHITE = [[-4, 2], [-3, 2], [-2, 2], [1, 2], [2, 2], [-4, 3], [-3, 3], [-2, 3], [-1, 3], [-4, 4], [-3, 4], [-2, 4], [-1, 4], [0, 4]];
let state = {};
let blackOut = 0, whiteOut = 0;
let currentPlayer = BLACK;
let selected = [];
let validMoves = [];
let hoverCell = null;
let cellSize = 28;
let centerX = 400, centerY = 320;
function byId(id) {
  const element = document.getElementById(id);
  if (!element)
    throw new Error(`Missing required game element: #${id}`);
  return element;
}
const canvas = byId("game");
const ctx = canvas.getContext("2d");
function toPixel(q, r) {
  const x = cellSize * (3 / 2 * q);
  const y = cellSize * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return [centerX + x, centerY + y];
}
function toAxial(px, py) {
  const x = (px - centerX) / cellSize;
  const y = (py - centerY) / cellSize;
  const q = 2 / 3 * x;
  const r = -1 / 3 * x + Math.sqrt(3) / 3 * y;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(-q - r);
  const dq = Math.abs(q - rq), dr = Math.abs(r - rr), ds = Math.abs(-q - r - rs);
  if (dq > dr && dq > ds)
    rq = -rr - rs;
  else if (dr > ds)
    rr = -rq - rs;
  return [rq, rr];
}
function initGame() {
  state = {};
  for (const c of CELL_LIST)
    state[c[0] + "," + c[1]] = EMPTY;
  for (const c of POS_BLACK)
    state[c[0] + "," + c[1]] = BLACK;
  for (const c of POS_WHITE)
    state[c[0] + "," + c[1]] = WHITE;
  blackOut = 0;
  whiteOut = 0;
  currentPlayer = BLACK;
  selected = [];
  validMoves = genAllMoves(BLACK);
  resize();
  render();
  updateUI();
}
function resize() {
  const w = Math.max(1, Math.min(800, window.innerWidth - 40)), h = Math.max(180, Math.min(640, window.innerHeight - 160));
  canvas.width = w;
  canvas.height = h;
  centerX = w / 2;
  centerY = h / 2;
  cellSize = Math.min(w, h) / 22;
}
function genAllMoves(color) {
  const moves = [];
  const myCells = CELL_LIST.filter((c) => state[c[0] + "," + c[1]] === color);
  const opp = color === BLACK ? WHITE : BLACK;
  for (const c of myCells) {
    for (const d of DIRS) {
      const dest = [c[0] + d[0], c[1] + d[1]];
      if (state[dest[0] + "," + dest[1]] === EMPTY) {
        moves.push({ sel: [c], dest, type: "move", dir: d });
      }
    }
  }
  for (let i = 0;i < myCells.length; i++) {
    for (let j = i + 1;j < myCells.length; j++) {
      const a = myCells[i], b = myCells[j];
      const dq = b[0] - a[0], dr = b[1] - a[1];
      if (Math.abs(dq) + Math.abs(dr) + Math.abs(-dq - dr) === 2 && (dq === 0 || dr === 0 || dq === -dr)) {
        for (const d of DIRS) {
          const destA = [a[0] + d[0], a[1] + d[1]], destB = [b[0] + d[0], b[1] + d[1]];
          if (state[destA[0] + "," + destA[1]] === EMPTY && state[destB[0] + "," + destB[1]] === EMPTY) {
            moves.push({ sel: [a, b], dest: destB, type: "parallel", dir: d });
          }
        }
        const dir = [dq, dr];
        const front = [b[0] + dir[0], b[1] + dir[1]];
        const back = [a[0] - dir[0], a[1] - dir[1]];
        if (state[front[0] + "," + front[1]] === EMPTY)
          moves.push({ sel: [a, b], dest: front, type: "inline", dir });
        if (state[back[0] + "," + back[1]] === EMPTY)
          moves.push({ sel: [a, b], dest: back, type: "inline", dir: [-dir[0], -dir[1]] });
        if (state[front[0] + "," + front[1]] === opp) {
          const beyond = [front[0] + dir[0], front[1] + dir[1]];
          if (state[beyond[0] + "," + beyond[1]] === EMPTY || !BOARD_CELLS.has(beyond[0] + "," + beyond[1]))
            moves.push({ sel: [a, b], dest: front, type: "push", dir, pushCount: 1 });
        }
        if (state[back[0] + "," + back[1]] === opp) {
          const bdir = [-dir[0], -dir[1]];
          const beyondB = [back[0] + bdir[0], back[1] + bdir[1]];
          if (state[beyondB[0] + "," + beyondB[1]] === EMPTY || !BOARD_CELLS.has(beyondB[0] + "," + beyondB[1]))
            moves.push({ sel: [a, b], dest: back, type: "push", dir: bdir, pushCount: 1 });
        }
      }
    }
  }
  for (let i = 0;i < myCells.length; i++) {
    for (let j = i + 1;j < myCells.length; j++) {
      for (let k = j + 1;k < myCells.length; k++) {
        const a = myCells[i], b = myCells[j], c = myCells[k];
        const d1 = [b[0] - a[0], b[1] - a[1]], d2 = [c[0] - b[0], c[1] - b[1]];
        if (d1[0] === d2[0] && d1[1] === d2[1]) {
          const dir = d1;
          for (const d of DIRS) {
            const da = [a[0] + d[0], a[1] + d[1]], db = [b[0] + d[0], b[1] + d[1]], dc = [c[0] + d[0], c[1] + d[1]];
            if (state[da[0] + "," + da[1]] === EMPTY && state[db[0] + "," + db[1]] === EMPTY && state[dc[0] + "," + dc[1]] === EMPTY)
              moves.push({ sel: [a, b, c], dest: dc, type: "parallel", dir: d });
          }
          const front = [c[0] + dir[0], c[1] + dir[1]], back = [a[0] - dir[0], a[1] - dir[1]];
          if (state[front[0] + "," + front[1]] === EMPTY)
            moves.push({ sel: [a, b, c], dest: front, type: "inline", dir });
          if (state[back[0] + "," + back[1]] === EMPTY)
            moves.push({ sel: [a, b, c], dest: back, type: "inline", dir: [-dir[0], -dir[1]] });
          const pushDirections = [[front, dir], [back, [-dir[0], -dir[1]]]];
          for (const [head, pdir] of pushDirections) {
            if (state[head[0] + "," + head[1]] === opp) {
              const beyond = [head[0] + pdir[0], head[1] + pdir[1]];
              if (state[beyond[0] + "," + beyond[1]] === EMPTY || !BOARD_CELLS.has(beyond[0] + "," + beyond[1]))
                moves.push({ sel: [a, b, c], dest: head, type: "push", dir: pdir, pushCount: 1 });
              else if (state[beyond[0] + "," + beyond[1]] === opp) {
                const b2 = [beyond[0] + pdir[0], beyond[1] + pdir[1]];
                if (state[b2[0] + "," + b2[1]] === EMPTY || !BOARD_CELLS.has(b2[0] + "," + b2[1]))
                  moves.push({ sel: [a, b, c], dest: head, type: "push", dir: pdir, pushCount: 2 });
              }
            }
          }
        }
      }
    }
  }
  return moves;
}
function applyMove(move) {
  const color = currentPlayer;
  const opp = color === BLACK ? WHITE : BLACK;
  const { sel, dest, dir } = move;
  if (move.type === "move") {
    state[sel[0][0] + "," + sel[0][1]] = EMPTY;
    state[dest[0] + "," + dest[1]] = color;
  } else if (move.type === "parallel") {
    for (const s of sel) {
      state[s[0] + "," + s[1]] = EMPTY;
    }
    for (const s of sel) {
      state[s[0] + dir[0] + "," + (s[1] + dir[1])] = color;
    }
  } else if (move.type === "inline") {
    const sorted = [...sel].sort((a, b) => a[0] * dir[0] + a[1] * dir[1] - (b[0] * dir[0] + b[1] * dir[1]));
    state[sorted[0][0] + "," + sorted[0][1]] = EMPTY;
    state[dest[0] + "," + dest[1]] = color;
  } else if (move.type === "push") {
    const sorted = [...sel].sort((a, b) => a[0] * dir[0] + a[1] * dir[1] - (b[0] * dir[0] + b[1] * dir[1]));
    let cur = dest;
    while (state[cur[0] + "," + cur[1]] === opp)
      cur = [cur[0] + dir[0], cur[1] + dir[1]];
    if (!BOARD_CELLS.has(cur[0] + "," + cur[1])) {
      if (color === BLACK)
        whiteOut++;
      else
        blackOut++;
    } else {
      state[cur[0] + "," + cur[1]] = opp;
    }
    state[sorted[0][0] + "," + sorted[0][1]] = EMPTY;
    state[dest[0] + "," + dest[1]] = color;
  }
}
function sameCells(a, b) {
  if (a.length !== b.length)
    return false;
  const key = (l) => l.map((c) => c[0] + "," + c[1]).sort().join("|");
  return key(a) === key(b);
}
function checkWin() {
  if (blackOut >= 6)
    return WHITE;
  if (whiteOut >= 6)
    return BLACK;
  return null;
}
function evaluateBoard(color) {
  const opp = color === BLACK ? WHITE : BLACK;
  let my = 0, oppCount = 0, myCenter = 0, oppCenter = 0, myBorder = 0, oppBorder = 0;
  for (const c of CELL_LIST) {
    const v = state[c[0] + "," + c[1]];
    if (v === color) {
      my++;
      myCenter += CENTER_T[c[0] + "," + c[1]];
      if (BORDER_CELLS.has(c[0] + "," + c[1]))
        myBorder++;
    }
    if (v === opp) {
      oppCount++;
      oppCenter += CENTER_T[c[0] + "," + c[1]];
      if (BORDER_CELLS.has(c[0] + "," + c[1]))
        oppBorder++;
    }
  }
  const material = my - oppCount;
  const center = myCenter - oppCenter;
  const border = myBorder - oppBorder;
  const ejectBonus = (color === BLACK ? whiteOut - blackOut : blackOut - whiteOut) * 200;
  return 100 * material + 8 * center - 15 * border + ejectBonus;
}
function aiMove() {
  const moves = genAllMoves(currentPlayer);
  if (!moves.length)
    return null;
  let best = null, bestScore = -1 / 0;
  for (const m of moves) {
    const saved = { ...state }, bo = blackOut, wo = whiteOut;
    applyMove(m);
    const score = evaluateBoard(currentPlayer) + (m.type === "push" ? 150 : 0) + Math.random() * 4;
    state = saved;
    blackOut = bo;
    whiteOut = wo;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#12161e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const c of CELL_LIST) {
    const [px, py] = toPixel(c[0], c[1]);
    const v = state[c[0] + "," + c[1]];
    const isHover = hoverCell && hoverCell[0] === c[0] && hoverCell[1] === c[1];
    const isSelected = selected.some((s) => s[0] === c[0] && s[1] === c[1]);
    ctx.beginPath();
    for (let i = 0;i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      const cx2 = px + cellSize * 0.9 * Math.cos(angle);
      const cy2 = py + cellSize * 0.9 * Math.sin(angle);
      if (i === 0)
        ctx.moveTo(cx2, cy2);
      else
        ctx.lineTo(cx2, cy2);
    }
    ctx.closePath();
    if (isSelected) {
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
    } else if (isHover) {
      ctx.fillStyle = "#334155";
      ctx.fill();
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fill();
    }
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.stroke();
    if (v !== EMPTY) {
      ctx.beginPath();
      ctx.arc(px, py, cellSize * 0.7, 0, Math.PI * 2);
      if (v === BLACK) {
        const g = ctx.createRadialGradient(px - cellSize * 0.2, py - cellSize * 0.2, 0, px, py, cellSize * 0.7);
        g.addColorStop(0, "#555");
        g.addColorStop(1, "#111");
        ctx.fillStyle = g;
      } else {
        const g = ctx.createRadialGradient(px - cellSize * 0.2, py - cellSize * 0.2, 0, px, py, cellSize * 0.7);
        g.addColorStop(0, "#fff");
        g.addColorStop(1, "#ccc");
        ctx.fillStyle = g;
      }
      ctx.fill();
      ctx.strokeStyle = v === BLACK ? "#666" : "#aaa";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  if (selected.length > 0) {
    for (const m of validMoves) {
      if (sameCells(m.sel, selected)) {
        const [px, py] = toPixel(m.dest[0], m.dest[1]);
        ctx.beginPath();
        ctx.arc(px, py, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = m.type === "push" ? "rgba(239,68,68,0.6)" : "rgba(34,197,94,0.5)";
        ctx.fill();
      }
    }
  }
}
function updateUI() {
  const blackCount = CELL_LIST.filter((c) => state[c[0] + "," + c[1]] === BLACK).length;
  const whiteCount = CELL_LIST.filter((c) => state[c[0] + "," + c[1]] === WHITE).length;
  byId("black-count").textContent = String(blackCount);
  byId("white-count").textContent = String(whiteCount);
  byId("black-out").textContent = String(blackOut);
  byId("white-out").textContent = String(whiteOut);
  const ind = byId("turn-indicator");
  if (currentPlayer === BLACK) {
    ind.textContent = "BLACK (You)";
    ind.className = "turn-black";
    byId("status").textContent = selected.length > 0 ? `Selected ${selected.length} marble(s) - click destination` : "Your turn - click a marble to select";
  } else {
    ind.textContent = "WHITE (AI)";
    ind.className = "turn-white";
    byId("status").textContent = "AI is thinking...";
  }
}
function showMessage(msg) {
  const el = byId("message");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2000);
}
canvas.addEventListener("click", (e) => {
  if (currentPlayer !== BLACK)
    return;
  const rect = canvas.getBoundingClientRect();
  const [q, r] = toAxial(e.clientX - rect.left, e.clientY - rect.top);
  const key = q + "," + r;
  if (!BOARD_CELLS.has(key))
    return;
  const v = state[key];
  if (v === BLACK) {
    const idx = selected.findIndex((s) => s[0] === q && s[1] === r);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else if (selected.length < 3) {
      if (selected.length === 0) {
        selected.push([q, r]);
      } else if (selected.length === 1) {
        const dq = q - selected[0][0], dr = r - selected[0][1];
        if (DIRS.some((d) => d[0] === dq && d[1] === dr))
          selected.push([q, r]);
        else {
          selected = [[q, r]];
        }
      } else {
        const d1 = [selected[1][0] - selected[0][0], selected[1][1] - selected[0][1]];
        const d2 = [q - selected[1][0], r - selected[1][1]];
        if (d1[0] === d2[0] && d1[1] === d2[1])
          selected.push([q, r]);
        else {
          selected = [[q, r]];
        }
      }
    }
    render();
    updateUI();
    return;
  }
  if (selected.length > 0 && (v === EMPTY || v === WHITE)) {
    const move = validMoves.find((m) => sameCells(m.sel, selected) && m.dest[0] === q && m.dest[1] === r);
    if (move) {
      applyMove(move);
      selected = [];
      const winner = checkWin();
      if (winner !== null) {
        showMessage(winner === BLACK ? "You Win! \uD83C\uDF89" : "AI Wins! \uD83E\uDD16");
        render();
        setTimeout(() => {
          if (confirm("Play again?"))
            initGame();
        }, 500);
        return;
      }
      currentPlayer = WHITE;
      render();
      updateUI();
      setTimeout(() => {
        const aiM = aiMove();
        if (aiM) {
          applyMove(aiM);
        }
        const w2 = checkWin();
        if (w2 !== null) {
          showMessage(w2 === BLACK ? "You Win! \uD83C\uDF89" : "AI Wins! \uD83E\uDD16");
          render();
          setTimeout(() => {
            if (confirm("Play again?"))
              initGame();
          }, 500);
          return;
        }
        currentPlayer = BLACK;
        validMoves = genAllMoves(BLACK);
        render();
        updateUI();
      }, 600);
    }
  }
});
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  hoverCell = toAxial(e.clientX - rect.left, e.clientY - rect.top);
  render();
});
canvas.addEventListener("mouseleave", () => {
  hoverCell = null;
  render();
});
window.addEventListener("resize", () => {
  resize();
  render();
});
initGame();
