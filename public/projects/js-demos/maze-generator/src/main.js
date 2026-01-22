import { RecursiveBacktracker } from './algorithms/backtracker.js';
import { PrimsAlgorithm } from './algorithms/prims.js';
import { SimpleRecursiveDivision } from './algorithms/division.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('maze-canvas');
const ctx = canvas.getContext('2d');
const btnGenerate = document.getElementById('btn-generate');
const algoSelect = document.getElementById('algo-select');
const speedRange = document.getElementById('speed-range');

// Export Buttons
const btnPng = document.getElementById('btn-export-png');
const btnJson = document.getElementById('btn-export-json');
const btnCsv = document.getElementById('btn-export-csv');
const btnTxt = document.getElementById('btn-export-txt');

function resize() {
    const parent = canvas.parentElement;
    const size = Math.min(parent.clientWidth, parent.clientHeight) - 40;
    canvas.width = size;
    canvas.height = size;
}
window.addEventListener('resize', resize);
resize();

const COLS = 41;
const ROWS = 41;
let renderer = new Renderer(ctx, COLS, ROWS);
let lastGrid = [];

async function generate() {
    btnGenerate.disabled = true;
    renderer.reset(canvas.width, canvas.height);

    const algo = algoSelect.value;
    const speed = 51 - parseInt(speedRange.value);

    let generator;
    switch (algo) {
        case 'backtracker': generator = new RecursiveBacktracker(COLS, ROWS); break;
        case 'prims': generator = new PrimsAlgorithm(COLS, ROWS); break;
        case 'division': generator = new SimpleRecursiveDivision(COLS, ROWS); break;
        default: generator = new RecursiveBacktracker(COLS, ROWS);
    }

    for await (const state of generator.run()) {
        renderer.draw(state);
        lastGrid = state.map(row => [...row]);
        await new Promise(r => setTimeout(r, speed));
    }

    btnGenerate.disabled = false;
}

// --- Export Logic ---
function downloadFile(content, filename, type) {
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
