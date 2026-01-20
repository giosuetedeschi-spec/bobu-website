"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
    interface Window {
        loadPyodide: any;
    }
}

interface PyodideRunnerProps {
    scriptPath: string;
    fileMapping?: Record<string, string>; // path -> url to fetch
}

export function PyodideRunner({ scriptPath, fileMapping }: PyodideRunnerProps) {
    const [output, setOutput] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pyodide, setPyodide] = useState<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    async function initPyodide() {
        try {
            const p = await window.loadPyodide();
            setPyodide(p);

            // Redirect stdout
            p.setStdout({ batched: (msg: string) => setOutput((prev) => [...prev, msg]) });

            // Load microlib or other dependencies if needed
            await p.loadPackage("micropip");

            setIsPlaying(true);
        } catch (e) {
            console.error("Pyodide init failed", e);
            setOutput((prev) => [...prev, "Failed to initialize Python environment."]);
        }
    }

    async function runGame() {
        if (!pyodide) return;

        try {
            // Load file mappings if provided
            if (fileMapping) {
                console.log("Loading file mappings...");
                for (const [fsPath, url] of Object.entries(fileMapping)) {
                    console.log(`Fetching ${url} -> ${fsPath}`);
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
                    const text = await res.text();

                    // Ensure directory exists
                    const dirs = fsPath.split('/');
                    dirs.pop(); // remove filename
                    if (dirs.length > 0) {
                        let currentDir = "";
                        for (const dir of dirs) {
                            if (dir === "." || dir === "") continue;
                            currentDir += dir;
                            if (!pyodide.FS.analyzePath(currentDir).exists) {
                                pyodide.FS.mkdir(currentDir);
                            }
                            currentDir += "/";
                        }
                    }

                    pyodide.FS.writeFile(fsPath, text);
                }
            }

            // Fetch the entry script content
            const response = await fetch(scriptPath);
            const scriptText = await response.text();

            // Run it
            await pyodide.runPythonAsync(scriptText);
        } catch (e: any) {
            console.error("Python Error", e);
            setOutput((prev) => [...prev, `Error: ${e.message}`]);
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
            <Script
                src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
                onLoad={initPyodide}
            />

            <div className="glass-panel p-4 rounded-xl min-h-[400px] flex flex-col items-center justify-center relative shadow-2xl w-full">
                {!isPlaying ? (
                    <div className="text-white/60 animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p>Loading Python Environment...</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Python Runtime Active
                            </h3>
                            <button
                                onClick={runGame}
                                className="px-6 py-2 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                Run Script
                            </button>
                        </div>
                        <div className="flex-1 bg-black/80 rounded-lg p-4 font-mono text-sm text-green-400 overflow-y-auto max-h-[400px] border border-white/10 shadow-inner custom-scrollbar">
                            <div className="font-bold mb-2 text-white/40 select-none">Output Terminal</div>
                            {output.map((line, i) => (
                                <div key={i} className="border-l-2 border-transparent hover:border-white/20 pl-2 transition-colors">
                                    <span className="opacity-50 mr-2">$</span>
                                    {line}
                                </div>
                            ))}
                            {output.length === 0 && <div className="text-white/20 italic">Ready for input...</div>}
                        </div>
                        <div className="flex justify-center">
                            <canvas ref={canvasRef} id="canvas" onContextMenu={(e) => e.preventDefault()} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
