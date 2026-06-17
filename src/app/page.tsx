"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────
interface WindowState {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  content: "game" | "terminal" | "files" | "about" | "cv" | "browser";
  payload?: string; // game path, folder path, etc.\n  color?: string;
  status?: string;
}

interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  action: "open";
  contentType: WindowState["content"];
  payload?: string;
  folder?: string;
  color?: string;
  status?: string;
}

// ─── App Registry ────────────────────────────────────────────
const APPS: DesktopIcon[] = [
  { id: "terminal", label: "Terminal", icon: "terminal", action: "open", contentType: "terminal" },
  { id: "files", label: "Files", icon: "folder", action: "open", contentType: "files", payload: "/" },
  { id: "cv", label: "CV", icon: "file-text", action: "open", contentType: "cv" },
  { id: "about", label: "About Bobu", icon: "user", action: "open", contentType: "about" },
];

const GAME_FOLDERS: { name: string; icon: string; games: DesktopIcon[] }[] = [
  {
    name: "Board Games",
    icon: "gamepad",
    games: [
      { id: "abalone", label: "Abalone", icon: "circle-dot", action: "open", contentType: "game", payload: "/games/abalone/index.html", folder: "Board" },
      { id: "azul", label: "Azul", icon: "grid-3x3", action: "open", contentType: "game", payload: "/games/azul/index.html", folder: "Board" },
      { id: "kalaha", label: "Kalaha", icon: "circle-dot", action: "open", contentType: "game", payload: "/games/kalaha/index.html", folder: "Board" },
    ],
  },
  {
    name: "Puzzle",
    icon: "puzzle",
    games: [
      { id: "mastermind", label: "Mastermind", icon: "hash", action: "open", contentType: "game", payload: "/games/mastermind/index.html", folder: "Puzzle" },
      { id: "sudoku", label: "Sudoku", icon: "grid-3x3", action: "open", contentType: "game", payload: "/games/sudoku/index.html", folder: "Puzzle" },
      { id: "bitwise", label: "Bitwise Ops", icon: "binary", action: "open", contentType: "game", payload: "/projects/js-demos/bitwise-ops/index.html", folder: "Puzzle" },
    ],
  },
  {
    name: "Arcade",
    icon: "gamepad-2",
    games: [
      { id: "snake", label: "Snake", icon: "move", action: "open", contentType: "game", payload: "/games/snake/index.html", folder: "Arcade" },
      { id: "pong", label: "Pong", icon: "rectangle-horizontal", action: "open", contentType: "game", payload: "/games/pong/index.html", folder: "Arcade" },
      { id: "flip7", label: "Flip 7", icon: "layers", action: "open", contentType: "game", payload: "/projects/js-demos/flip-7/index.html", folder: "Arcade" },
    ],
  },
  {
    name: "Visual",
    icon: "sparkles",
    games: [
      { id: "maze-gen", label: "Maze Generator", icon: "grid-3x3", action: "open", contentType: "game", payload: "/projects/js-demos/maze-generator/index.html", folder: "Visual" },
      { id: "maze-sol", label: "Maze Solver", icon: "navigation", action: "open", contentType: "game", payload: "/projects/js-demos/maze-solver/index.html", folder: "Visual" },
    ],
  },
];

// Flatten all games for the start menu
const ALL_GAMES = GAME_FOLDERS.flatMap(f => f.games);

// ─── Icon Components (inline SVG) ────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  terminal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  folder: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  "file-text": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  gamepad: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>,
  "gamepad-2": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>,
  puzzle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61a2.404 2.404 0 0 1 1.705-.707c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z"/></svg>,
  sparkles: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>,
  "circle-dot": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>,
  "grid-3x3": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  hash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>,
  binary: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h2v2H8z"/><path d="M14 14h2v2h-2z"/><path d="M8 14h2v2H8z"/><path d="M14 8h2v2h-2z"/></svg>,
  move: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 15 22 12 19 9"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  "rectangle-horizontal": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>,
  layers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  navigation: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  maximize: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  minimize: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  "chevron-right": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  "hard-drive": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  globe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

// ─── Terminal Component ──────────────────────────────────────
function TerminalWindow({ window: win, onClose }: { window: WindowState; onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([
    "BobuOS Terminal v1.0",
    'Type "help" for available commands.',
    "",
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const cwdRef = useRef("/home/bobu");

  const processCommand = (cmd: string) => {
    const cwd = cwdRef.current;
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase() || "";
    const args = parts.slice(1);

    let output: string[] = [];

    switch (command) {
      case "":
        break;
      case "help":
        output = [
          "Available commands:",
          "  help          - Show this help",
          "  ls            - List files",
          "  cd <dir>      - Change directory",
          "  pwd           - Print working directory",
          "  open <app>    - Open an application",
          "  clear         - Clear terminal",
          "  neofetch      - System info",
          "  whoami        - Current user",
          "  date          - Current date/time",
          "  echo <text>   - Print text",
          "  games         - List all games",
          "",
          "Apps: terminal, files, cv, about, abalone, azul, mastermind,",
          "      kalaha, sudoku, snake, pong, flip7, maze-gen, maze-sol, bitwise",
        ];
        break;
      case "clear":
        setLines([]);
        return;
      case "pwd":
        output = [cwd];
        break;
      case "whoami":
        output = ["bobu"];
        break;
      case "date":
        output = [new Date().toString()];
        break;
      case "echo":
        output = [args.join(" ")];
        break;
      case "neofetch":
        output = [
          "        ╭──────────╮",
          "        │  BOBUOS  │",
          "        │  ◉    ◉  │",
          "        │    ──    │",
          "        │  ╰────╯  │",
          "        ╰──────────╯",
          "",
          `  OS:        BobuOS 1.0`,
          `  Host:      Bobu Website`,
          `  Kernel:    Next.js 16`,
          `  Shell:     bobu-sh`,
          `  Resolution: ${window.innerWidth}×${window.innerHeight}`,
          `  Theme:     Material UI`,
          `  CPU:       ${navigator.hardwareConcurrency || "?"} cores`,
          `  Memory:    ${Math.round((navigator as any).deviceMemory || 0)} GB`,
          `  Games:     ${ALL_GAMES.length} installed`,
        ];
        break;
      case "ls":
        if (cwd === "/home/bobu" || cwd === "/") {
          output = ["games/  documents/  terminal/  about/"];
        } else if (cwd === "/home/bobu/games" || cwd.includes("games")) {
          output = [ALL_GAMES.map(g => `${g.label.toLowerCase().replace(/\s+/g, "-")}/`).join("  ")];
        } else if (cwd.includes("documents")) {
          output = ["cv.txt  readme.md"];
        } else {
          output = ["(empty)"];
        }
        break;
      case "cd":
        if (!args[0] || args[0] === "~") {
          cwdRef.current = "/home/bobu";
        } else if (args[0] === "..") {
          const parts2 = cwd.split("/").filter(Boolean);
          parts2.pop();
          cwdRef.current = "/" + parts2.join("/") || "/";
        } else if (args[0].startsWith("/")) {
          cwdRef.current = args[0];
        } else {
          cwdRef.current = cwd === "/" ? `/${args[0]}` : `${cwd}/${args[0]}`;
        }
        break;
      case "games":
        output = ["Installed games:", ...ALL_GAMES.map(g => `  • ${g.label} [${g.folder}]`)];
        break;
      case "open":
        if (!args[0]) {
          output = ["Usage: open <app>", "Example: open abalone"];
        } else {
          output = [`Opening ${args[0]}...`];
          // Signal parent to open app
          setTimeout(() => {
            const game = ALL_GAMES.find(g => g.label.toLowerCase().includes(args[0].toLowerCase()));
            if (game && (window as any).__openApp) {
              (window as any).__openApp(game);
            }
          }, 300);
        }
        break;
      default:
        output = [`bobu-sh: ${command}: command not found`, 'Type "help" for available commands.'];
    }

    setLines(prev => [
      ...prev,
      `bobu@bobuos:${cwd}$ ${cmd}`,
      ...output,
      "",
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (input.trim()) {
        setHistory(prev => [...prev, input]);
        setHistIdx(-1);
        processCommand(input);
      } else {
        setLines(prev => [...prev, `bobu@bobuos:${cwdRef.current}$ `, ""]);
      }
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx >= 0) {
        const newIdx = histIdx + 1;
        if (newIdx >= history.length) {
          setHistIdx(-1);
          setInput("");
        } else {
          setHistIdx(newIdx);
          setInput(history[newIdx]);
        }
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0f", fontFamily: "'Courier New', monospace", fontSize: 13, overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ color: line.startsWith("bobu@") ? "#4ade80" : line.startsWith("  •") ? "#60a5fa" : "#c0c0c0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {line}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: "#4ade80", marginRight: 8 }}>bobu@bobuos:{cwdRef.current}$</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e0e0e0", fontFamily: "inherit", fontSize: "inherit", caretColor: "#4ade80" }}
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── File Explorer ────────────────────────────────────────────
function FileExplorer({ window: win, onOpenApp }: { window: WindowState; onOpenApp: (app: DesktopIcon) => void }) {
  const [currentPath, setCurrentPath] = useState(win.payload || "/");

  const renderPath = (path: string) => {
    if (path === "/" || path === "/home/bobu") {
      return (
        <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderBottom: "1px solid #1e293b", overflowX: "auto" }}>
          {APPS.map(app => (
            <button key={app.id} onClick={() => onOpenApp(app)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: "#94a3b8", minWidth: 64 }}>
              <span style={{ color: "#60a5fa" }}>{ICONS[app.icon]}</span>
              <span style={{ fontSize: 10 }}>{app.label}</span>
            </button>
          ))}
          <div style={{ width: 1, background: "#1e293b", margin: "0 4px" }} />
          {GAME_FOLDERS.map(folder => (
            <button key={folder.name} onClick={() => setCurrentPath(folder.name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: "#94a3b8", minWidth: 64 }}>
              <span style={{ color: "#fbbf24" }}>{ICONS[folder.icon]}</span>
              <span style={{ fontSize: 10 }}>{folder.name}</span>
            </button>
          ))}
        </div>
      );
    }

    const folder = GAME_FOLDERS.find(f => f.name === currentPath);
    if (folder) {
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid #1e293b" }}>
            <button onClick={() => setCurrentPath("/")} style={{ background: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13 }}>← Back</button>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>{folder.name}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, padding: 12 }}>
            {folder.games.map(game => (
              <button key={game.id} onClick={() => onOpenApp(game)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, cursor: "pointer", color: "#e0e0e0", transition: "all 0.15s" }}>
                <span style={{ color: game.color }}>{ICONS[game.icon]}</span>
                <span style={{ fontSize: 11, textAlign: "center" }}>{game.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return <div style={{ padding: 16, color: "#64748b" }}>Folder not found</div>;
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0f172a", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
        {ICONS["hard-drive"]}
        <span style={{ fontSize: 12, color: "#94a3b8" }}>bobu@bobuos: ~{currentPath}</span>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {renderPath(currentPath)}
      </div>
    </div>
  );
}

// ─── About Window ────────────────────────────────────────────
function AboutWindow() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f172a,#1e1b4b)", padding: 32, gap: 16, textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, color: "#fff" }}>B</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0" }}>BobuOS</h2>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Developer & Creative Coder</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <a href="https://github.com/giosuetedeschi-spec" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, textDecoration: "none" }}>GitHub</a>
        <a href="https://it.linkedin.com/in/giosu%C3%A8-tedeschi-b287b9225" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, textDecoration: "none" }}>LinkedIn</a>
        <a href="https://x.com/Pizzibarbaro" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 13, textDecoration: "none" }}>Twitter</a>
      </div>
      <div style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.04)", borderRadius: 12, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
          <span style={{ color: "#64748b" }}>OS</span><span style={{ color: "#e2e8f0" }}>BobuOS 1.0</span>
          <span style={{ color: "#64748b" }}>Games</span><span style={{ color: "#e2e8f0" }}>{ALL_GAMES.length} installed</span>
          <span style={{ color: "#64748b" }}>Stack</span><span style={{ color: "#e2e8f0" }}>Next.js + React</span>
          <span style={{ color: "#64748b" }}>Theme</span><span style={{ color: "#e2e8f0" }}>Material UI</span>
        </div>
      </div>
    </div>
  );
}

// ─── CV Window ───────────────────────────────────────────────
function CVWindow() {
  return (
    <div style={{ height: "100%", overflow: "auto", background: "#0f172a", padding: 32, color: "#e2e8f0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Giosu&egrave; "Bobu" Tedeschi</h2>
      <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 24 }}>Full Stack Engineer & Creative Technologist</p>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <span style={{ padding: "4px 12px", background: "rgba(59,130,246,0.15)", borderRadius: 20, fontSize: 12, color: "#60a5fa" }}>Milan, IT</span>
        <span style={{ padding: "4px 12px", background: "rgba(59,130,246,0.15)", borderRadius: 20, fontSize: 12, color: "#60a5fa" }}>giosue.tedeschi@edu-its.it</span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>Experience</h3>
      <div style={{ marginBottom: 20, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <strong>Full Stack Developer</strong>
          <span style={{ color: "#64748b", fontSize: 13, fontFamily: "monospace" }}>2023 - Present</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>Building modern web applications with Next.js and Spring Boot. Leading frontend architecture decisions.</p>
      </div>
      <div style={{ marginBottom: 20, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <strong>Creative Coder</strong>
          <span style={{ color: "#64748b", fontSize: 13, fontFamily: "monospace" }}>2021 - 2023</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>Developed interactive websites, generative art pieces, and browser-based games using Three.js, React, and Rust.</p>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#a855f7", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>Education</h3>
      <div style={{ marginBottom: 20, padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <strong>ITS Piemonte</strong>
          <span style={{ color: "#64748b", fontSize: 13, fontFamily: "monospace" }}>2021 - Present</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>Higher Education in Software Engineering and Web Development.</p>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#22c55e", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #1e293b" }}>Skills</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {["TypeScript","React","Next.js","Rust","Python","Java","Spring Boot","Tailwind","PostgreSQL","Docker","Git","WASM"].map(s => (
          <span key={s} style={{ padding: "4px 12px", background: "rgba(34,197,94,0.1)", borderRadius: 6, fontSize: 12, color: "#22c55e" }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Window Component ────────────────────────────────────────
function OSWindow({
  win,
  onClose,
  onFocus,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  onOpenApp,
}: {
  win: WindowState;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  onOpenApp: (app: DesktopIcon) => void;
}) {
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; winW: number; winH: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    onFocus();
    dragRef.current = { startX: e.clientX, startY: e.clientY, winX: win.x, winY: win.y };

    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      onMove(dragRef.current.winX + dx, dragRef.current.winY + dy);
    };
    const handleUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, winW: win.w, winH: win.h };

    const handleMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dw = ev.clientX - resizeRef.current.startX;
      const dh = ev.clientY - resizeRef.current.startY;
      onResize(Math.max(win.minW, resizeRef.current.winW + dw), Math.max(win.minH, resizeRef.current.winH + dh));
    };
    const handleUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  if (win.minimized) return null;

  const style: React.CSSProperties = win.maximized
    ? { position: "absolute", left: 0, top: 0, width: "100%", height: "calc(100% - 48px)", zIndex: win.zIndex }
    : { position: "absolute", left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex };

  const renderContent = () => {
    switch (win.content) {
      case "game":
        return <iframe src={win.payload} style={{ width: "100%", height: "100%", border: "none", background: "#0a0a0a" }} title={win.title} />;
      case "terminal":
        return <TerminalWindow window={win} onClose={onClose} />;
      case "files":
        return <FileExplorer window={win} onOpenApp={onOpenApp} />;
      case "about":
        return <AboutWindow />;
      case "cv":
        return <CVWindow />;
      default:
        return <div style={{ padding: 16, color: "#94a3b8" }}>Unknown content</div>;
    }
  };

  return (
    <div
      style={{
        ...style,
        borderRadius: win.maximized ? 0 : 12,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
      }}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleDragStart}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          height: 36,
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          cursor: "grab",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "#94a3b8", marginRight: 8, display: "flex" }}>{ICONS[win.icon] || ICONS["folder"]}</span>
        <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{win.title}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Minimize">─</button>
          <button onClick={(e) => { e.stopPropagation(); onMaximize(); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Maximize">□</button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }} title="Close">✕</button>
        </div>
      </div>
      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {renderContent()}
      </div>
      {/* Resize handle */}
      {!win.maximized && (
        <div
          onMouseDown={handleResizeStart}
          style={{ position: "absolute", right: 0, bottom: 0, width: 16, height: 16, cursor: "nwse-resize", background: "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)" }}
        />
      )}
    </div>
  );
}

// ─── Start Menu ──────────────────────────────────────────────
function StartMenu({ open, onClose, onOpenApp }: { open: boolean; onClose: () => void; onOpenApp: (app: DesktopIcon) => void }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filteredGames = search
    ? ALL_GAMES.filter(g => g.label.toLowerCase().includes(search.toLowerCase()) || g.folder?.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: "fixed", bottom: 56, left: 12, width: 360, maxHeight: "calc(100vh - 80px)",
        background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)",
        borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        zIndex: 9999, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 12px" }}>
            {ICONS["search"]}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 14 }} autoFocus />
          </div>
        </div>

        {/* Quick apps */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {APPS.map(app => (
              <button key={app.id} onClick={() => { onOpenApp(app); onClose(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: "#94a3b8", minWidth: 60 }}>
                <span style={{ color: "#60a5fa" }}>{ICONS[app.icon]}</span>
                <span style={{ fontSize: 10 }}>{app.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Games list */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {filteredGames ? (
            filteredGames.map(game => (
              <button key={game.id} onClick={() => { onOpenApp(game); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", color: "#e2e8f0", textAlign: "left" }}>
                <span style={{ color: game.color }}>{ICONS[game.icon]}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{game.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{game.folder}</div>
                </div>
              </button>
            ))
          ) : (
            GAME_FOLDERS.map(folder => (
              <div key={folder.name}>
                <div style={{ padding: "8px 16px 4px", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{folder.name}</div>
                {folder.games.map(game => (
                  <button key={game.id} onClick={() => { onOpenApp(game); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", color: "#e2e8f0", textAlign: "left" }}>
                    <span style={{ color: game.color }}>{ICONS[game.icon]}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{game.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{game.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Desktop ────────────────────────────────────────────
export default function Home() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZ, setNextZ] = useState(10);
  const [startOpen, setStartOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const winIdRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const openApp = useCallback((app: DesktopIcon) => {
    if (app.contentType === "game" && app.payload) {
      // Check if already open
      const existing = windows.find(w => w.payload === app.payload);
      if (existing) {
        setWindows(prev => prev.map(w => w.id === existing.id ? { ...w, minimized: false, zIndex: nextZ } : w));
        setNextZ(z => z + 1);
        return;
      }
      const id = `win-${winIdRef.current++}`;
      const offset = (windows.length % 8) * 30;
      setWindows(prev => [...prev, {
        id, title: app.label, icon: app.icon,
        x: 60 + offset, y: 40 + offset,
        w: 860, h: 620, minW: 400, minH: 300,
        zIndex: nextZ, minimized: false, maximized: false,
        content: "game", payload: app.payload,
      }]);
    } else if (app.contentType === "terminal") {
      const id = `win-${winIdRef.current++}`;
      const offset = (windows.length % 8) * 30;
      setWindows(prev => [...prev, {
        id, title: "Terminal", icon: "terminal",
        x: 80 + offset, y: 60 + offset,
        w: 700, h: 450, minW: 400, minH: 250,
        zIndex: nextZ, minimized: false, maximized: false,
        content: "terminal",
      }]);
    } else if (app.contentType === "files") {
      const id = `win-${winIdRef.current++}`;
      const offset = (windows.length % 8) * 30;
      setWindows(prev => [...prev, {
        id, title: "Files", icon: "folder",
        x: 100 + offset, y: 50 + offset,
        w: 750, h: 500, minW: 400, minH: 300,
        zIndex: nextZ, minimized: false, maximized: false,
        content: "files", payload: app.payload || "/",
      }]);
    } else if (app.contentType === "about") {
      const id = `win-${winIdRef.current++}`;
      setWindows(prev => [...prev, {
        id, title: "About Bobu", icon: "user",
        x: 200, y: 120,
        w: 500, h: 480, minW: 350, minH: 300,
        zIndex: nextZ, minimized: false, maximized: false,
        content: "about",
      }]);
    } else if (app.contentType === "cv") {
      const id = `win-${winIdRef.current++}`;
      setWindows(prev => [...prev, {
        id, title: "CV - Bobu", icon: "file-text",
        x: 150, y: 80,
        w: 650, h: 550, minW: 400, minH: 300,
        zIndex: nextZ, minimized: false, maximized: false,
        content: "cv",
      }]);
    }
    setNextZ(z => z + 1);
    setStartOpen(false);
  }, [windows, nextZ]);

  const closeWindow = (id: string) => setWindows(prev => prev.filter(w => w.id !== id));
  const focusWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZ } : w));
    setNextZ(z => z + 1);
  };
  const minimizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w));
  const maximizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  const moveWindow = (id: string, x: number, y: number) => setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  const resizeWindow = (id: string, w: number, h: number) => setWindows(prev => prev.map(ww => ww.id === id ? { ...ww, w, h } : ww));

  // Expose openApp for terminal
  useEffect(() => {
    (window as any).__openApp = openApp;
  }, [openApp]);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "linear-gradient(135deg,#0f0f23 0%,#1a1040 50%,#0a1628 100%)", position: "relative" }}>
      {/* Desktop icons */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 1 }}>
        {APPS.map(app => (
          <button
            key={app.id}
            onDoubleClick={() => openApp(app)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: "#94a3b8", width: 80 }}
            title={app.label}
          >
            <span style={{ color: "#60a5fa", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{ICONS[app.icon]}</span>
            <span style={{ fontSize: 11, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{app.label}</span>
          </button>
        ))}
        <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.08)", margin: "4px auto" }} />
        {GAME_FOLDERS.map(folder => (
          <button
            key={folder.name}
            onDoubleClick={() => openApp({ id: folder.name, label: folder.name, icon: folder.icon, action: "open", contentType: "files", payload: folder.name })}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: "#94a3b8", width: 80 }}
            title={folder.name}
          >
            <span style={{ color: "#fbbf24", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{ICONS[folder.icon]}</span>
            <span style={{ fontSize: 11, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{folder.name}</span>
          </button>
        ))}
      </div>

      {/* Windows */}
      {windows.map(win => (
        <OSWindow
          key={win.id}
          win={win}
          onClose={() => closeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onMove={(x, y) => moveWindow(win.id, x, y)}
          onResize={(w, h) => resizeWindow(win.id, w, h)}
          onOpenApp={openApp}
        />
      ))}

      {/* Taskbar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
        background: "rgba(15,23,42,0.9)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", padding: "0 8px", gap: 4, zIndex: 10000,
      }}>
        {/* Start button */}
        <button
          onClick={() => setStartOpen(!startOpen)}
          style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: startOpen ? "rgba(59,130,246,0.2)" : "transparent", color: "#60a5fa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}
        >
          B
        </button>

        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {/* Running apps */}
        {windows.map(win => (
          <button
            key={win.id}
            onClick={() => {
              if (win.minimized) {
                setWindows(prev => prev.map(w => w.id === win.id ? { ...w, minimized: false, zIndex: nextZ } : w));
                setNextZ(z => z + 1);
              } else {
                focusWindow(win.id);
              }
            }}
            style={{
              height: 36, padding: "0 12px", borderRadius: 8, border: "none",
              background: win.minimized ? "transparent" : "rgba(59,130,246,0.15)",
              color: win.minimized ? "#64748b" : "#60a5fa",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 500,
              borderBottom: !win.minimized ? "2px solid #3b82f6" : "2px solid transparent",
            }}
          >
            <span style={{ display: "flex" }}>{ICONS[win.icon] || ICONS["folder"]}</span>
            <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{win.title}</span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* System tray */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px", color: "#64748b", fontSize: 12 }}>
          <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span>{time.toLocaleDateString([], { day: "2-digit", month: "short" })}</span>
        </div>
      </div>

      {/* Start Menu */}
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} onOpenApp={openApp} />
    </div>
  );
}
