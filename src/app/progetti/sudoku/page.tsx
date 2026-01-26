"use client";

import { PygameRunner } from "@/components/games/PygameRunner";

const SUDOKU_FILES = [
    { path: "main.py", url: "/games/sudoku/main.py" },
    { path: "config.py", url: "/games/sudoku/config.py" },
    { path: "generator.py", url: "/games/sudoku/generator.py" },
    { path: "sudoku_utils.py", url: "/games/sudoku/sudoku_utils.py" },
    { path: "visualizer.py", url: "/games/sudoku/visualizer.py" },
    { path: "solvers/__init__.py", url: "/games/sudoku/solvers/__init__.py" },
    { path: "solvers/ac3.py", url: "/games/sudoku/solvers/ac3.py" },
    { path: "solvers/backtracking.py", url: "/games/sudoku/solvers/backtracking.py" },
    { path: "solvers/simulated_annealing.py", url: "/games/sudoku/solvers/simulated_annealing.py" },
];

export default function SudokuPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div className="flex items-baseline justify-between mb-8">
                <div>
                    <h1 className="font-heading text-4xl font-bold text-white mb-2">Sudoku Solver</h1>
                    <p className="text-white/60 text-lg">
                        Interactive Sudoku solver with multiple algorithms (Backtracking, AC-3, Simulated Annealing).
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-mono px-2 py-1 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        Python + Pygame-CE + WASM
                    </span>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                This runs a full Python environment in your browser. Initial load may take a few seconds.
            </div>

            <PygameRunner
                mainScriptPath="main.py"
                files={SUDOKU_FILES}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-2">Backtracking</h3>
                    <p className="text-white/60 text-sm">
                        A brute-force depth-first search. Guarantees a solution but can be slow on hard puzzles.
                        Visualized step-by-step.
                    </p>
                </div>
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-2">AC-3 (Constraint Propagation)</h3>
                    <p className="text-white/60 text-sm">
                        Uses arc consistency to reduce the domain of variables. Very fast for most standard Sudoku puzzles.
                    </p>
                </div>
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-white mb-2">Simulated Annealing</h3>
                    <p className="text-white/60 text-sm">
                        Probabilistic metaheuristic. Good for optimization, but technically "overkill" and less reliable for Sudoku than exact methods.
                    </p>
                </div>
            </div>
        </div>
    );
}
