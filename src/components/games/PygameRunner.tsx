"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
    interface Window {
        loadPyodide: any;
    }
}

interface FileDefinition {
    path: string; // Path in the virtual filesystem (e.g., "config.py" or "solvers/backtracking.py")
    url: string;  // URL to fetch content from (e.g., "/games/sudoku/config.py")
}

interface PygameRunnerProps {
    mainScriptPath: string; // The entry point (e.g., "main.py")
    files: FileDefinition[];
}

export function PygameRunner({ mainScriptPath, files }: PygameRunnerProps) {
    const [output, setOutput] = useState<string[]>([]);
    const [status, setStatus] = useState<"loading" | "installing" | "ready" | "running" | "error">("loading");
    const [pyodide, setPyodide] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    async function initPyodide() {
        try {
            setStatus("loading");
            const p = await window.loadPyodide();

            // Redirect stdout
            p.setStdout({ batched: (msg: string) => setOutput((prev) => [...prev, msg]) });
            p.setStderr({ batched: (msg: string) => setOutput((prev) => [...prev, `ERR: ${msg}`]) });

            setStatus("installing");
            setOutput((prev) => [...prev, "Installing dependencies (micropip, pygame-ce)..."]);

            await p.loadPackage("micropip");
            const micropip = p.pyimport("micropip");
            await micropip.install("pygame-ce");

            setPyodide(p);
            setStatus("ready");
            setOutput((prev) => [...prev, "Ready to start!"]);

        } catch (e: any) {
            console.error("Pyodide init failed", e);
            setStatus("error");
            setOutput((prev) => [...prev, `Failed to initialize: ${e.message}`]);
        }
    }

    async function loadFiles(p: any) {
        setOutput((prev) => [...prev, "Loading game files..."]);

        for (const file of files) {
            try {
                // Ensure directory exists if path has subdirectories
                const parts = file.path.split('/');
                if (parts.length > 1) {
                    const dir = parts.slice(0, -1).join('/');
                    p.FS.mkdirTree(dir);
                }

                const response = await fetch(file.url);
                if (!response.ok) throw new Error(`Failed to fetch ${file.url}`);
                const text = await response.text();

                p.FS.writeFile(file.path, text);
            } catch (e: any) {
                console.error(`Failed to load file ${file.path}`, e);
                throw e;
            }
        }
    }

    async function runGame() {
        if (!pyodide || !canvasRef.current) return;

        try {
            setStatus("running");

            // Allow pygame to find the canvas
            // Pygame-ce in pyodide usually looks for a canvas with id="canvas" or we can explicitely set it if supported
            // Typically in standard pygame-wasm mapping, it looks for specific canvas. 
            // We set the ID of our canvas to "canvas" which is the default for emscripten/pyodide environment often.

            await loadFiles(pyodide);

            // We need to fetch the main script content to run it, 
            // or if it's already in 'files' and written to FS, we can just import it or run it.
            // But usually we run the logic. 
            // Let's assume mainScriptPath is one of the files we loaded, e.g. "main.py".
            // calling runPythonAsync with "import main" might work if main.py runs on import, 
            // but typical pattern is `python main.py`.
            // We can read the file from FS and run it.

            const mainScriptContent = pyodide.FS.readFile(mainScriptPath, { encoding: "utf8" });

            // Important: We need to make sure the canvas is available for SDL
            // In many pyodide/pygame implementations, it attaches to the canvas element with ID 'canvas'

            await pyodide.runPythonAsync(mainScriptContent);

        } catch (e: any) {
            console.error("Python Runtime Error", e);
            setStatus("error");
            setOutput((prev) => [...prev, `Runtime Error: ${e.message}`]);
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
            <Script
                src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
                onLoad={initPyodide}
            />

            <div className="glass-panel p-4 rounded-xl min-h-[600px] flex flex-col items-center justify-center relative bg-black/80">
                {status === "loading" && <div className="text-white/60 animate-pulse">Initializing Python VM...</div>}
                {status === "installing" && <div className="text-white/60 animate-pulse">Installing libraries...</div>}
                {status === "ready" && (
                    <button
                        onClick={runGame}
                        className="px-8 py-3 bg-primary text-white rounded-full font-bold hover:scale-105 transition-transform"
                    >
                        Start Game
                    </button>
                )}

                {/* Canvas container */}
                <canvas
                    ref={canvasRef}
                    id="canvas"
                    className={`max-w-full shadow-2xl rounded-lg ${status === "running" ? "block" : "hidden"}`}
                    onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click
                    tabIndex={0} // Make focusable for keyboard input
                />

                {/* Console Output */}
                <div className="w-full mt-4 max-h-[150px] overflow-y-auto bg-black/90 rounded p-2 text-xs font-mono text-green-400">
                    <div className="text-white/30 sticky top-0 bg-black/90 p-1 mb-1 border-b border-white/10">System Log</div>
                    {output.map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap">{line}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}
