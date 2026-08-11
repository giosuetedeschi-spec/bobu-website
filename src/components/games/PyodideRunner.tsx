"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { basePath } from "@/lib/basePath";

interface PyodideInterface {
    runPythonAsync: (code: string) => Promise<unknown>;
    setStdout: (options: { batched: (msg: string) => void }) => void;
    setStderr: (options: { batched: (msg: string) => void }) => void;
    loadPackage: (name: string) => Promise<void>;
    FS: {
        writeFile: (path: string, data: string) => void;
        mkdirTree: (path: string) => void;
    };
}

/** Mirrors harness/GAME_API.md — the Python games are batch runs, not interactive. */
interface PyodideGameApi {
    id: string;
    version: number;
    ready: boolean;
    meta: { name: string; players: string; mode: string };
    getState: () => {
        status: "idle" | "loading" | "running" | "done" | "error";
        turn: null;
        score: number;
        stdout: string;
        lines: number;
        modules: string[];
        error: string | null;
        durationMs: number | null;
    };
    reset: () => void;
    step: () => { ok: false; reason: string };
    input: (action: string) => { ok: boolean; reason?: string };
    actions: () => string[];
}

declare global {
    interface Window {
        loadPyodide: () => Promise<PyodideInterface>;
        __GAME__?: PyodideGameApi;
    }
}

const NO_MODULES: string[] = [];

type RunStatus = "idle" | "loading" | "running" | "done" | "error";

export function PyodideRunner({
    scriptPath,
    moduleFiles = NO_MODULES,
    gameId,
    title = "Python Console",
}: {
    scriptPath: string;
    moduleFiles?: string[];
    gameId?: string;
    title?: string;
}) {
    const [output, setOutput] = useState<string[]>([]);
    const [status, setStatus] = useState<RunStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const [durationMs, setDurationMs] = useState<number | null>(null);
    const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
    const consoleRef = useRef<HTMLDivElement>(null);
    const autoRunRef = useRef(false);

    const runGame = useCallback(async () => {
        if (!pyodide) return;
        setOutput([]);
        setError(null);
        setDurationMs(null);
        setStatus("running");
        const started = performance.now();

        try {
            // Sibling modules must exist in Pyodide's FS before main script imports them.
            const baseDir = scriptPath.slice(0, scriptPath.lastIndexOf("/"));
            for (const rel of moduleFiles) {
                const res = await fetch(`${basePath}${baseDir}/${rel}`);
                if (!res.ok) {
                    setError(`Could not load module ${rel} (HTTP ${res.status})`);
                    setStatus("error");
                    return;
                }
                const text = await res.text();
                if (rel.includes("/")) {
                    pyodide.FS.mkdirTree(rel.slice(0, rel.lastIndexOf("/")));
                }
                pyodide.FS.writeFile(rel, text);
            }
            const response = await fetch(`${basePath}${scriptPath}`);
            if (!response.ok) {
                setError(`Could not load script (HTTP ${response.status})`);
                setStatus("error");
                return;
            }
            await pyodide.runPythonAsync(await response.text());
            setDurationMs(Math.round(performance.now() - started));
            setStatus("done");
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            setError(message);
            setOutput((prev) => [...prev, message]);
            setDurationMs(Math.round(performance.now() - started));
            setStatus("error");
        }
    }, [pyodide, scriptPath, moduleFiles]);

    const initPyodide = useCallback(async () => {
        try {
            const p = await window.loadPyodide();
            p.setStdout({ batched: (msg: string) => setOutput((prev) => [...prev, msg]) });
            p.setStderr({ batched: (msg: string) => setOutput((prev) => [...prev, msg]) });
            await p.loadPackage("micropip");
            setPyodide(p);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setStatus("error");
        }
    }, []);

    // Kick off the first run as soon as the interpreter is up.
    useEffect(() => {
        if (pyodide && !autoRunRef.current) {
            autoRunRef.current = true;
            runGame();
        }
    }, [pyodide, runGame]);

    // Keep the console pinned to the newest line.
    useEffect(() => {
        const el = consoleRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [output]);

    // Expose the harness contract (harness/GAME_API.md).
    useEffect(() => {
        if (!gameId) return;
        const api: PyodideGameApi = {
            id: gameId,
            version: 1,
            ready: true,
            meta: { name: title, players: "demo", mode: "batch" },
            getState: () => ({
                status,
                turn: null,
                score: output.length,
                stdout: output.join("\n"),
                lines: output.length,
                modules: moduleFiles,
                error,
                durationMs,
            }),
            reset: () => { void runGame(); },
            step: () => ({ ok: false, reason: "pyodide-batch" }),
            input: (action: string) => {
                if (action === "run" || action === "restart") { void runGame(); return { ok: true }; }
                return { ok: false, reason: `unknown action '${action}'` };
            },
            actions: () => ["run", "restart"],
        };
        window.__GAME__ = api;
        return () => { if (window.__GAME__?.id === gameId) window.__GAME__ = undefined; };
    }, [gameId, title, status, output, moduleFiles, error, durationMs, runGame]);

    const statusChip = {
        idle: { label: "Idle", color: "default" as const },
        loading: { label: "Booting Python…", color: "info" as const },
        running: { label: "Running", color: "warning" as const },
        done: { label: durationMs != null ? `Finished in ${durationMs} ms` : "Finished", color: "success" as const },
        error: { label: "Error", color: "error" as const },
    }[status];

    return (
        <Box sx={{ width: "100%", mx: "auto" }} data-testid="pyodide-runner" data-status={status}>
            <Script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js" onLoad={initPyodide} />

            <Paper
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "#0d1117",
                    borderColor: "#30363d",
                }}
            >
                {/* Terminal chrome */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.25,
                        bgcolor: "#161b22",
                        borderBottom: "1px solid #30363d",
                    }}
                >
                    <Box sx={{ display: "flex", gap: 0.75 }}>
                        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                            <Box key={c} sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: c }} />
                        ))}
                    </Box>
                    <Typography sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.8rem", color: "#8b949e", flex: 1 }}>
                        {title.toLowerCase().replace(/\s+/g, "-")} — python 3.11 (pyodide)
                    </Typography>
                    <Chip size="small" label={statusChip.label} color={statusChip.color} variant="outlined" sx={{ fontSize: "0.7rem", height: 22 }} />
                    <Button
                        onClick={runGame}
                        disabled={!pyodide || status === "running"}
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        sx={{ textTransform: "none", minWidth: 0 }}
                        data-testid="pyodide-run"
                    >
                        Run
                    </Button>
                </Box>

                {(status === "loading" || status === "running") && <LinearProgress sx={{ height: 2 }} />}

                {/* Output */}
                <Box
                    ref={consoleRef}
                    data-testid="pyodide-output"
                    sx={{
                        flex: 1,
                        p: 2,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                        fontSize: "0.8rem",
                        lineHeight: 1.55,
                        color: "#c9d1d9",
                        overflowY: "auto",
                        height: { xs: 360, md: 520 },
                        whiteSpace: "pre",
                        overflowX: "auto",
                    }}
                >
                    {status === "loading" && output.length === 0 && (
                        <Box sx={{ color: "#8b949e" }}>
                            <div>$ loading pyodide runtime…</div>
                            <div style={{ opacity: 0.6 }}>this downloads a ~10 MB WebAssembly Python on first visit</div>
                        </Box>
                    )}
                    {output.map((line, i) => (
                        <div key={i} style={error && i === output.length - 1 ? { color: "#ff7b72" } : undefined}>
                            {line}
                        </div>
                    ))}
                    {status === "done" && (
                        <Box sx={{ color: "#3fb950", mt: 1 }}>{`$ process exited cleanly (${output.length} lines)`}</Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
