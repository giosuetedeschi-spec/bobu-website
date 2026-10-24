import { RecursiveBacktracker } from './algorithms/backtracker.js';
import { PrimsAlgorithm } from './algorithms/prims.js';
import { SimpleRecursiveDivision } from './algorithms/division.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('maze-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const btnGenerate = document.getElementById('btn-generate') as HTMLButtonElement;
const algoSelect = document.getElementById('algo-select') as HTMLSelectElement;
const speedRange = document.getElementById('speed-range') as HTMLInputElement;

// Export Buttons
const btnPng = document.getElementById('btn-export-png') as HTMLButtonElement;
const btnJson = document.getElementById('btn-export-json') as HTMLButtonElement;
const btnCsv = document.getElementById('btn-export-csv') as HTMLButtonElement;
const btnTxt = document.getElementById('btn-export-txt') as HTMLButtonElement;

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
    if (lastGrid.length) renderer.draw(lastGrid);
}

const COLS = 41;
const ROWS = 41;
const renderer = new Renderer(ctx, COLS, ROWS);
let lastGrid: number[][] = [];

async function generate() {
    btnGenerate.disabled = true;
    lastGrid = [];
    renderer.reset(canvas.width, canvas.height);

    const algo = algoSelect.value;
    const delay = Math.round((50 - Number(speedRange.value)) * 0.6);

    let generator: RecursiveBacktracker | PrimsAlgorithm | SimpleRecursiveDivision;
    switch (algo) {
        case 'backtracker': generator = new RecursiveBacktracker(COLS, ROWS); break;
        case 'prims': generator = new PrimsAlgorithm(COLS, ROWS); break;
        case 'division': generator = new SimpleRecursiveDivision(COLS, ROWS); break;
        default: generator = new RecursiveBacktracker(COLS, ROWS);
    }

    let step = 0;
    let lastPaint = 0;
    try {
      for (const state of generator.run()) {
        step++;
        const now = performance.now();
        if (step % 12 !== 0 && step !== 1) continue;
        if (now - lastPaint < delay && step !== 1) continue;
        lastGrid = state.map(row => [...row]);
        renderer.draw(lastGrid);
        lastPaint = now;
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      }
      lastGrid = generator.grid.map(row => [...row]);
      renderer.draw(lastGrid);
    } finally {
      btnGenerate.disabled = false;
    }
}

// --- Export Logic ---
function downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

btnJson.addEventListener('click', () => {
    if (!lastGrid.length) return alert('Generate a maze first!');
    downloadFile(JSON.stringify(lastGrid), 'maze.json', 'application/json');
});

btnCsv.addEventListener('click', () => {
    if (!lastGrid.length) return alert('Generate a maze first!');
    const csv = lastGrid.map(row => row.join(',')).join('\n');
    downloadFile(csv, 'maze.csv', 'text/csv');
});

btnTxt.addEventListener('click', () => {
    if (!lastGrid.length) return alert('Generate a maze first!');
    const txt = lastGrid.map(row => row.map(c => c === 0 ? '##' : '  ').join('')).join('\n');
    downloadFile(txt, 'maze.txt', 'text/plain');
});

btnPng.addEventListener('click', () => {
    if (!lastGrid.length) return alert('Generate a maze first!');
    const link = document.createElement('a');
    link.download = 'maze.png';
    link.href = canvas.toDataURL();
    link.click();
});

btnGenerate.addEventListener('click', generate);
renderer.reset(canvas.width, canvas.height);
new ResizeObserver(resize).observe(canvas.parentElement!);
window.addEventListener('resize', resize);
resize();

// Show a ready-to-explore example immediately; Generate still animates the selected algorithm.
const preview = new RecursiveBacktracker(COLS, ROWS);
let previewGrid: number[][] = [];
for (const state of preview.run()) previewGrid = state;
lastGrid = previewGrid.map(row => [...row]);
renderer.draw(lastGrid);
