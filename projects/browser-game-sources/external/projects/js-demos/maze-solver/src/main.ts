import { RecursiveBacktracker } from './algorithms/generator.js';
import { DFS } from './algorithms/dfs.js';
import { BFS } from './algorithms/bfs.js';
import { AStar } from './algorithms/astar.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const btnSolve = document.getElementById('btn-solve') as HTMLButtonElement;
const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
const btnNewMaze = document.getElementById('btn-new-maze') as HTMLButtonElement;
const algoSelect = document.getElementById('algo-select') as HTMLSelectElement;

let visibleGrid: number[][] = [];
let visibleCurrent: { x: number; y: number } | null = null;

function resize() {
    const parent = canvas.parentElement;
    if (!parent) throw new Error('Maze canvas must be inside a sized parent element.');
    const width = Math.max(1, Math.round(Math.min(parent.clientWidth, parent.clientHeight)));
    const height = width;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    renderer.reset(width, height);
    if (visibleGrid.length) renderer.draw(visibleGrid, visibleCurrent);
}

const COLS = 31;
const ROWS = 31;
let grid: number[][] = [];
const renderer = new Renderer(ctx, COLS, ROWS);

function generateNewMaze() {
    renderer.reset(canvas.width, canvas.height);
    const generator = new RecursiveBacktracker(COLS, ROWS);
    grid = generator.generate();
    visibleGrid = grid;
    visibleCurrent = null;
    renderer.draw(visibleGrid);
}

async function solve() {
    btnSolve.disabled = true;
    renderer.draw(grid);

    const start = { x: 1, y: 1 };
    const end = { x: COLS - 2, y: ROWS - 2 };

    const algo = algoSelect.value;
    let solver: DFS | BFS | AStar;

    switch (algo) {
        case 'dfs': solver = new DFS(grid, COLS, ROWS); break;
        case 'bfs': solver = new BFS(grid, COLS, ROWS); break;
        case 'astar': solver = new AStar(grid, COLS, ROWS); break;
        default: solver = new DFS(grid, COLS, ROWS);
    }

    let lastPaint = 0;
    try {
      for await (const state of solver.run(start, end)) {
        visibleGrid = state.grid.map(row => [...row]);
        visibleCurrent = state.current;
        const now = performance.now();
        if (now - lastPaint >= 20) {
          renderer.draw(visibleGrid, visibleCurrent);
          lastPaint = now;
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        }
      }
      renderer.draw(visibleGrid, visibleCurrent);
    } finally {
      btnSolve.disabled = false;
    }
}

btnNewMaze.addEventListener('click', generateNewMaze);
btnSolve.addEventListener('click', solve);
btnClear.addEventListener('click', () => {
    visibleGrid = grid.map(row => [...row]);
    visibleCurrent = null;
    renderer.draw(visibleGrid);
});

new ResizeObserver(resize).observe(canvas.parentElement!);
window.addEventListener('resize', resize);
resize();
generateNewMaze();
