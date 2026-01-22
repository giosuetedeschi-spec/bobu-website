"use client";

import React from "react";
import { GameIframe } from "@/components/games/GameIframe";

export default function MazeSolverPage() {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Maze Solver</h1>
                <span className="text-white/40 font-mono">JS Native</span>
            </div>

            <div className="glass-panel p-6 rounded-xl space-y-4">
                <p className="text-white/60">
                    Visualize pathfinding algorithms solving mazes in real-time. Compare their efficiency and behavior.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="font-bold text-secondary-300 text-sm">DFS</h3>
                        <p className="text-xs text-white/50">Depth-First Search. The persistent explorer.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="font-bold text-secondary-300 text-sm">BFS</h3>
                        <p className="text-xs text-white/50">Breadth-First Search. The expanding flood.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="font-bold text-secondary-300 text-sm">A* (A-Star)</h3>
                        <p className="text-xs text-white/50">Heuristic search. The intelligent pathfinder.</p>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <GameIframe src="/projects/js-demos/maze-solver/index.html" />
            </div>
        </div>
    );
}
