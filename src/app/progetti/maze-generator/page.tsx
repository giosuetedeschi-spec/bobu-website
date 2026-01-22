"use client";

import React from "react";
import { GameIframe } from "@/components/games/GameIframe";

export default function MazeGeneratorPage() {
    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            <div className="flex items-baseline justify-between">
                <h1 className="font-heading text-4xl font-bold text-white">Maze Generator</h1>
                <span className="text-white/40 font-mono">JS Native</span>
            </div>

            <div className="glass-panel p-6 rounded-xl space-y-4">
                <p className="text-white/60">
                    Explore different maze generation algorithms in a peaceful, garden-like visualization.
                    Includes export options to save your mazes.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="font-bold text-primary-300 text-sm">Recursive Backtracker</h3>
                        <p className="text-xs text-white/50">Long, winding corridors perfect for exploring.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="font-bold text-primary-300 text-sm">Prim's Algorithm</h3>
                        <p className="text-xs text-white/50">Organic, short-branching paths that grow like crystal.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <h3 className="font-bold text-primary-300 text-sm">Recursive Division</h3>
                        <p className="text-xs text-white/50">Structured, rectangular rooms created by slicing space.</p>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <GameIframe src="/projects/js-demos/maze-generator/index.html" />
            </div>
        </div>
    );
}
