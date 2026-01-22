import { RecursiveBacktracker } from './algorithms/generator.js';
import { DFS } from './algorithms/dfs.js';
import { BFS } from './algorithms/bfs.js';
import { AStar } from './algorithms/astar.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const btnSolve = document.getElementById('btn-solve');
const btnClear = document.getElementById('btn-clear');
const btnNewMaze = document.getElementById('btn-new-maze');
const algoSelect = document.getElementById('algo-select');

function resize() {
    const parent = canvas.parentElement;
    const size = Math.min(parent.clientWidth, parent.clientHeight) - 40;
    canvas.width = size;
    canvas.height = size;
}
window.addEventListener('resize', resize);
resize();

const COLS = 31;
const ROWS = 31;
let grid = [];
let renderer = new Renderer(ctx, COLS, ROWS);

function generateNewMaze() {
    renderer.reset(canvas.width, canvas.height);
    const generator = new RecursiveBacktracker(COLS, ROWS);
    grid = generator.generate();
    renderer.draw(grid);
}

async function solve() {
    btnSolve.disabled = true;
    renderer.draw(grid);

    const start = { x: 1, y: 1 };
    const end = { x: COLS - 2, y: ROWS - 2 };

    const algo = algoSelect.value;
    let solver;

    switch (algo) {
        case 'dfs': solver = new DFS(grid, COLS, ROWS); break;
        case 'bfs': solver = new BFS(grid, COLS, ROWS); break;
        case 'astar': solver = new AStar(grid, COLS, ROWS); break;
        default: solver = new DFS(grid, COLS, ROWS);
    }

    for await (const state of solver.run(start, end)) {
        renderer.draw(state.grid, state.current, state.path);
        await new Promise(r => setTimeout(r, 10));
    }

    btnSolve.disabled = false;
}

btnNewMaze.addEventListener('click', generateNewMaze);
btnSolve.addEventListener('click', solve);
btnClear.addEventListener('click', () => renderer.draw(grid));

generateNewMaze();
