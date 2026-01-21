"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
    interface Window {
        loadPyodide: any;
    }
}

export function PyodideRunner({ scriptPath }: { scriptPath: string }) {
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

    // Auto-start when pyodide is ready
    useEffect(() => {
        if (isPlaying && pyodide) {
            runGame();
        }
    }, [isPlaying, pyodide]);

    async function runGame() {
        if (!pyodide) return;

        try {
            // Fetch the script content
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

            <div className="glass-panel p-4 rounded-xl min-h-[400px] flex flex-col items-center justify-center relative">
                {!isPlaying ? (
                    <div className="text-white/60 animate-pulse">Loading Python Environment...</div>
                ) : (
                    <div className="w-full h-full flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-white font-bold">Python Console / Canvas</h3>
                            <button onClick={runGame} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600">
                                Run Script
                            </button>
                        </div>
                        <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-sm text-green-400 overflow-y-auto max-h-[300px]">
                            {output.map((line, i) => <div key={i}>{line}</div>)}
                            {output.length === 0 && <div className="text-white/20">Ready to run...</div>}
                        </div>
                        <canvas ref={canvasRef} id="canvas" className="hidden" />
                        {/* Note: Kalaha might be CLI based or need specific GUI bindings we haven't implemented yet. 
                  If it uses Print, it will show in console. */}
                    </div>
                )}
            </div>
        </div>
    );
}
