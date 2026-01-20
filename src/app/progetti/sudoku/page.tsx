"use client";

import { PyodideRunner } from "@/components/games/PyodideRunner";
import { ExternalLink } from "lucide-react";

export default function SudokuPage() {
    const fileMapping = {
        "config.py": "/games/sudoku/config.py",
        "sudoku_utils.py": "/games/sudoku/sudoku_utils.py",
        "generator.py": "/games/sudoku/generator.py",
        "visualizer.py": "/games/sudoku/visualizer.py",
        "solvers/__init__.py": "/games/sudoku/solvers/__init__.py",
        "solvers/backtracking.py": "/games/sudoku/solvers/backtracking.py",
        "solvers/ac3.py": "/games/sudoku/solvers/ac3.py",
        "solvers/simulated_annealing.py": "/games/sudoku/solvers/simulated_annealing.py",
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Sudoku Solver</h1>
                <span className="text-white/40 font-mono">Python + Pygame + Pyodide</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-1 rounded-xl overflow-hidden aspect-video relative min-h-[600px]">
                        {/* We point to main.py as entry, PyodideRunner handles fileMapping pre-loading */}
                        <PyodideRunner
                            scriptPath="/games/sudoku/main.py"
                            fileMapping={fileMapping}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl space-y-4">
                        <h3 className="text-xl font-bold text-white">About</h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                            A fully functional Sudoku solver and generator running entirely in your browser using WebAssembly.
                        </p>

                        <h4 className="text-white font-medium mt-4">Algorithms</h4>
                        <ul className="text-white/60 text-sm space-y-2 list-disc list-inside">
                            <li><span className="text-primary">Backtracking</span>: Deterministic Brute-force.</li>
                            <li><span className="text-secondary">AC-3</span>: Constraint Propagation.</li>
                            <li><span className="text-accent">Simulated Annealing</span>: Probabilistic heuristic search.</li>
                        </ul>
                    </div>

                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Source Code</h3>
                        <div className="space-y-2">
                            <p className="text-xs text-white/40 mb-2">Modules available in virtual FS:</p>
                            {Object.keys(fileMapping).map(f => (
                                <div key={f} className="text-xs font-mono text-white/60 bg-white/5 p-1 rounded px-2">
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
