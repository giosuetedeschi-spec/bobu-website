"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

declare global {
    interface Window {
        loadPyodide: any;
    }
}

export function PyodideRunner({ scriptPath }: { scriptPath: string }) {
    const [output, setOutput] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pyodide, setPyodide] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const runGame = useCallback(async () => {
        if (!pyodide) return;
        setOutput([]);

        try {
            const response = await fetch(scriptPath);
            if (!response.ok) {
                setOutput((prev) => [...prev, `Error: Could not load script (${response.status})`]);
                return;
            }
            const scriptText = await response.text();
            await pyodide.runPythonAsync(scriptText);
        } catch (e: any) {
            console.error("Python Error", e);
            setOutput((prev) => [...prev, `Error: ${e.message}`]);
        }
    }, [pyodide, scriptPath]);

    const initPyodide = useCallback(async () => {
        try {
            const p = await window.loadPyodide();
            setPyodide(p);
            p.setStdout({ batched: (msg: string) => setOutput((prev) => [...prev, msg]) });
            await p.loadPackage("micropip");
            setIsPlaying(true);
        } catch (e) {
            console.error("Pyodide init failed", e);
            setOutput((prev) => [...prev, "Failed to initialize Python environment."]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isPlaying && pyodide) {
            runGame();
        }
    }, [isPlaying, pyodide, runGame]);

    return (
        <Box sx={{ width: "100%", maxWidth: 800, mx: "auto" }}>
            <Script
                src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
                onLoad={initPyodide}
            />

            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    borderRadius: 3,
                    minHeight: 400,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {isLoading && !pyodide ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 2 }}>
                        <CircularProgress />
                        <Typography color="text.secondary">Loading Python environment...</Typography>
                    </Box>
                ) : pyodide ? (
                    <>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Python Console
                            </Typography>
                            <Button onClick={runGame} variant="contained" size="small">
                                Run Again
                            </Button>
                        </Box>
                        <Box
                            sx={{
                                flex: 1,
                                bgcolor: "#1a1a2e",
                                borderRadius: 2,
                                p: 2,
                                fontFamily: "monospace",
                                fontSize: "0.85rem",
                                color: "#4ade80",
                                overflowY: "auto",
                                maxHeight: 300,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            {output.map((line, i) => (
                                <div key={i}>{line}</div>
                            ))}
                            {output.length === 0 && (
                                <Typography sx={{ color: "#ffffff33" }}>Ready to run...</Typography>
                            )}
                        </Box>
                        <canvas ref={canvasRef} id="canvas" style={{ display: "none" }} />
                    </>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                        <Typography color="error">Failed to load Python environment.</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
}
