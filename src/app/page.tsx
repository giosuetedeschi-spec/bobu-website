"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { basePath } from "@/lib/basePath";
import styles from "./page.module.css";

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
  payload?: string; // game path, folder path, etc.
  color?: string;
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

declare global {
  interface Window {
    __openApp?: (app: DesktopIcon) => void;
  }
  interface Navigator {
    deviceMemory?: number;
  }
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
      { id: "abalone", label: "Abalone", icon: "circle-dot", action: "open", contentType: "game", payload: "/games/abalone/index.html", folder: "Board", status: "Playable" },
      { id: "azul", label: "Azul", icon: "grid-3x3", action: "open", contentType: "game", payload: "/games/azul/index.html", folder: "Board", status: "Playable" },
      { id: "kalaha", label: "Kalaha", icon: "circle-dot", action: "open", contentType: "game", payload: "/games/kalaha/index.html", folder: "Board", status: "Playable" },
    ],
  },
  {
    name: "Puzzle",
    icon: "puzzle",
    games: [
      { id: "mastermind", label: "Mastermind", icon: "hash", action: "open", contentType: "game", payload: "/games/mastermind/index.html", folder: "Puzzle", status: "Playable" },
      { id: "sudoku", label: "Sudoku", icon: "grid-3x3", action: "open", contentType: "game", payload: "/games/sudoku/index.html", folder: "Puzzle", status: "Playable" },
      { id: "bitwise", label: "Bitwise Ops", icon: "binary", action: "open", contentType: "game", payload: "/projects/js-demos/bitwise-ops/index.html", folder: "Puzzle", status: "Demo" },
    ],
  },
  {
    name: "Arcade",
    icon: "gamepad-2",
    games: [
      { id: "snake", label: "Snake", icon: "move", action: "open", contentType: "game", payload: "/games/snake/index.html", folder: "Arcade", status: "Playable" },
      { id: "pong", label: "Pong", icon: "rectangle-horizontal", action: "open", contentType: "game", payload: "/games/pong/index.html", folder: "Arcade", status: "Coming Soon" },
      { id: "flip7", label: "Flip 7", icon: "layers", action: "open", contentType: "game", payload: "/projects/js-demos/flip-7/index.html", folder: "Arcade", status: "New!" },
    ],
  },
  {
    name: "Visual",
    icon: "sparkles",
    games: [
      { id: "maze-gen", label: "Maze Generator", icon: "grid-3x3", action: "open", contentType: "game", payload: "/projects/js-demos/maze-generator/index.html", folder: "Visual", status: "Native JS" },
      { id: "maze-sol", label: "Maze Solver", icon: "navigation", action: "open", contentType: "game", payload: "/projects/js-demos/maze-solver/index.html", folder: "Visual", status: "Native JS" },
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
function TerminalWindow() {
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

  const [cwd, setCwd] = useState("/home/bobu");

  const processCommand = (cmd: string) => {
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
          `  Memory:    ${Math.round(navigator.deviceMemory || 0)} GB`,
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
          setCwd("/home/bobu");
        } else if (args[0] === "..") {
          const parts2 = cwd.split("/").filter(Boolean);
          parts2.pop();
          setCwd("/" + parts2.join("/") || "/");
        } else if (args[0].startsWith("/")) {
          setCwd(args[0]);
        } else {
          setCwd(cwd === "/" ? `/${args[0]}` : `${cwd}/${args[0]}`);
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
            const query = args[0].toLowerCase();
            const app = [...APPS, ...ALL_GAMES].find(
              a => a.id.toLowerCase() === query || a.label.toLowerCase().includes(query)
            );
            if (app && window.__openApp) {
              window.__openApp(app);
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
        setLines(prev => [...prev, `bobu@bobuos:${cwd}$ `, ""]);
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
    <div className={styles.terminalWin}>
      <div className={styles.terminalBody}>
        {lines.map((line, i) => (
          <div
            key={i}
            className={`${styles.terminalLine} ${line.startsWith("bobu@") ? styles.terminalLinePrompt : line.startsWith("  •") ? styles.terminalLineGame : ""}`}
          >
            {line}
          </div>
        ))}
        <div className={styles.terminalInputRow}>
          <span className={styles.terminalPrompt}>bobu@bobuos:{cwd}$</span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.terminalInput}
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
        <div className={styles.explorerAppsRow}>
          {APPS.map(app => (
            <button key={app.id} onClick={() => onOpenApp(app)} className={`${styles.iconBtn} ${styles.iconBtnMinW64}`}>
              <span className={styles.iconGlyphBlue}>{ICONS[app.icon]}</span>
              <span className={styles.miniLabel}>{app.label}</span>
            </button>
          ))}
          <div className={styles.vDivider} />
          {GAME_FOLDERS.map(folder => (
            <button key={folder.name} onClick={() => setCurrentPath(folder.name)} className={`${styles.iconBtn} ${styles.iconBtnMinW64}`}>
              <span className={styles.iconGlyphYellow}>{ICONS[folder.icon]}</span>
              <span className={styles.miniLabel}>{folder.name}</span>
            </button>
          ))}
        </div>
      );
    }

    const folder = GAME_FOLDERS.find(f => f.name === currentPath);
    if (folder) {
      return (
        <div>
          <div className={styles.explorerHeader}>
            <button onClick={() => setCurrentPath("/")} className={styles.backBtn}>← Back</button>
            <span className={styles.explorerTitle}>{folder.name}</span>
          </div>
          <div className={styles.explorerGrid}>
            {folder.games.map(game => (
              <button key={game.id} onClick={() => onOpenApp(game)} className={styles.gameCard}>
                <span>{ICONS[game.icon]}</span>
                <span className={styles.gameCardLabel}>{game.label}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return <div className={styles.explorerEmpty}>Folder not found</div>;
  };

  return (
    <div className={styles.explorerRoot}>
      <div className={styles.explorerTitlebar}>
        {ICONS["hard-drive"]}
        <span className={styles.explorerPath}>bobu@bobuos: ~{currentPath}</span>
      </div>
      <div className={styles.explorerContent}>
        {renderPath(currentPath)}
      </div>
    </div>
  );
}

// ─── About Window ────────────────────────────────────────────
function AboutWindow() {
  return (
    <div className={styles.aboutRoot}>
      <div className={styles.aboutAvatar}>B</div>
      <h2 className={styles.aboutName}>BobuOS</h2>
      <p className={styles.aboutRole}>Developer & Creative Coder</p>
      <div className={styles.aboutLinks}>
        <a href="https://github.com/giosuetedeschi-spec" target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>GitHub</a>
        <a href="https://it.linkedin.com/in/giosu%C3%A8-tedeschi-b287b9225" target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>LinkedIn</a>
        <a href="https://x.com/Pizzibarbaro" target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>Twitter</a>
      </div>
      <div className={styles.aboutInfoCard}>
        <div className={styles.aboutInfoGrid}>
          <span className={styles.aboutInfoLabel}>OS</span><span className={styles.aboutInfoValue}>BobuOS 1.0</span>
          <span className={styles.aboutInfoLabel}>Games</span><span className={styles.aboutInfoValue}>{ALL_GAMES.length} installed</span>
          <span className={styles.aboutInfoLabel}>Stack</span><span className={styles.aboutInfoValue}>Next.js + React</span>
          <span className={styles.aboutInfoLabel}>Theme</span><span className={styles.aboutInfoValue}>Material UI</span>
        </div>
      </div>
    </div>
  );
}

// ─── CV Window ───────────────────────────────────────────────
function CVWindow() {
  return (
    <div className={styles.cvRoot}>
      <h2 className={styles.cvName}>Giosu&egrave; &ldquo;Bobu&rdquo; Tedeschi</h2>
      <p className={styles.cvRole}>Full Stack Engineer & Creative Technologist</p>
      <div className={styles.cvTags}>
        <span className={styles.cvTag}>Milan, IT</span>
        <span className={styles.cvTag}>giosue.tedeschi@edu-its.it</span>
      </div>
      <h3 className={`${styles.cvSection} ${styles.cvSectionBlue}`}>Experience</h3>
      <div className={styles.cvEntry}>
        <div className={styles.cvEntryHeader}>
          <strong>Full Stack Developer</strong>
          <span className={styles.cvEntryDate}>2023 - Present</span>
        </div>
        <p className={styles.cvEntryDesc}>Building modern web applications with Next.js and Spring Boot. Leading frontend architecture decisions.</p>
      </div>
      <div className={styles.cvEntry}>
        <div className={styles.cvEntryHeader}>
          <strong>Creative Coder</strong>
          <span className={styles.cvEntryDate}>2021 - 2023</span>
        </div>
        <p className={styles.cvEntryDesc}>Developed interactive websites, generative art pieces, and browser-based games using Three.js, React, and Rust.</p>
      </div>
      <h3 className={`${styles.cvSection} ${styles.cvSectionPurple}`}>Education</h3>
      <div className={styles.cvEntry}>
        <div className={styles.cvEntryHeader}>
          <strong>ITS Piemonte</strong>
          <span className={styles.cvEntryDate}>2021 - Present</span>
        </div>
        <p className={styles.cvEntryDesc}>Higher Education in Software Engineering and Web Development.</p>
      </div>
      <h3 className={`${styles.cvSection} ${styles.cvSectionGreen}`}>Skills</h3>
      <div className={styles.cvSkills}>
        {["TypeScript","React","Next.js","Rust","Python","Java","Spring Boot","Tailwind","PostgreSQL","Docker","Git","WASM"].map(s => (
          <span key={s} className={styles.cvSkillChip}>{s}</span>
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

  // Real-time drag/resize/maximize state — irreducible to static CSS, kept as
  // the sole inline style on the page.
  const posStyle: React.CSSProperties = win.maximized
    ? { left: 0, top: 0, width: "100%", height: "calc(100% - 48px)", zIndex: win.zIndex }
    : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.zIndex };

  const renderContent = () => {
    switch (win.content) {
      case "game":
        return <iframe src={`${basePath}${win.payload}`} className={styles.windowIframe} title={win.title} />;
      case "terminal":
        return <TerminalWindow />;
      case "files":
        return <FileExplorer window={win} onOpenApp={onOpenApp} />;
      case "about":
        return <AboutWindow />;
      case "cv":
        return <CVWindow />;
      default:
        return <div className={styles.windowUnknown}>Unknown content</div>;
    }
  };

  return (
    <div
      className={`${styles.osWindow} ${win.maximized ? styles.osWindowMaximized : ""}`}
      style={posStyle}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div onMouseDown={handleDragStart} className={styles.windowTitlebar}>
        <span className={styles.windowTitlebarIcon}>{ICONS[win.icon] || ICONS["folder"]}</span>
        <span className={styles.windowTitlebarTitle}>{win.title}</span>
        <div className={styles.windowTitlebarBtns}>
          <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className={styles.windowBtn} title="Minimize">─</button>
          <button onClick={(e) => { e.stopPropagation(); onMaximize(); }} className={styles.windowBtn} title="Maximize">□</button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={styles.windowBtn} title="Close">✕</button>
        </div>
      </div>
      {/* Content */}
      <div className={styles.windowContent}>
        {renderContent()}
      </div>
      {/* Resize handle */}
      {!win.maximized && (
        <div onMouseDown={handleResizeStart} className={styles.windowResizeHandle} />
      )}
    </div>
  );
}

// ─── Start Menu ──────────────────────────────────────────────
function StartMenu({ open, onClose, onOpenApp }: { open: boolean; onClose: () => void; onOpenApp: (app: DesktopIcon) => void }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filteredGames = search
    ? [...APPS, ...ALL_GAMES].filter(g => g.label.toLowerCase().includes(search.toLowerCase()) || g.folder?.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <>
      <div className={styles.startOverlay} onClick={onClose} />
      <div className={styles.startPanel}>
        {/* Search */}
        <div className={styles.startSearchWrap}>
          <div className={styles.startSearchBox}>
            {ICONS["search"]}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps..." className={styles.startSearchInput} autoFocus />
          </div>
        </div>

        {/* Quick apps */}
        <div className={styles.startQuickWrap}>
          <div className={styles.startQuickRow}>
            {APPS.map(app => (
              <button key={app.id} onClick={() => { onOpenApp(app); onClose(); }} className={styles.startQuickBtn}>
                <span className={styles.iconGlyphBlue}>{ICONS[app.icon]}</span>
                <span className={styles.miniLabel}>{app.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Games list */}
        <div className={styles.startListWrap}>
          {filteredGames ? (
            filteredGames.map(game => (
              <button key={game.id} onClick={() => { onOpenApp(game); onClose(); }} className={styles.startListItem}>
                <span>{ICONS[game.icon]}</span>
                <div>
                  <div className={styles.startItemTitle}>{game.label}</div>
                  <div className={styles.startItemSub}>{game.folder}</div>
                </div>
              </button>
            ))
          ) : (
            GAME_FOLDERS.map(folder => (
              <div key={folder.name}>
                <div className={styles.startFolderHeading}>{folder.name}</div>
                {folder.games.map(game => (
                  <button key={game.id} onClick={() => { onOpenApp(game); onClose(); }} className={styles.startListItem}>
                    <span>{ICONS[game.icon]}</span>
                    <div>
                      <div className={styles.startItemTitle}>{game.label}</div>
                      <div className={styles.startItemSub}>{game.status}</div>
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
    window.__openApp = openApp;
    return () => {
      window.__openApp = undefined;
    };
  }, [openApp]);

  return (
    <div className={styles.desktopRoot}>
      {/* Desktop icons */}
      <div className={styles.desktopIcons}>
        {APPS.map(app => (
          <button
            key={app.id}
            onDoubleClick={() => openApp(app)}
            className={styles.desktopIconBtn}
            title={app.label}
          >
            <span className={styles.desktopIconGlyphBlue}>{ICONS[app.icon]}</span>
            <span className={styles.desktopIconLabel}>{app.label}</span>
          </button>
        ))}
        <div className={styles.desktopDivider} />
        {GAME_FOLDERS.map(folder => (
          <button
            key={folder.name}
            onDoubleClick={() => openApp({ id: folder.name, label: folder.name, icon: folder.icon, action: "open", contentType: "files", payload: folder.name })}
            className={styles.desktopIconBtn}
            title={folder.name}
          >
            <span className={styles.desktopIconGlyphYellow}>{ICONS[folder.icon]}</span>
            <span className={styles.desktopIconLabel}>{folder.name}</span>
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
      <div className={styles.taskbar}>
        {/* Start button */}
        <button
          onClick={() => setStartOpen(!startOpen)}
          className={`${styles.startBtn} ${startOpen ? styles.startBtnActive : ""}`}
        >
          B
        </button>

        <div className={styles.taskbarDivider} />

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
            className={`${styles.taskbarAppBtn} ${!win.minimized ? styles.taskbarAppBtnActive : ""}`}
          >
            <span className={styles.taskbarAppIcon}>{ICONS[win.icon] || ICONS["folder"]}</span>
            <span className={styles.taskbarAppLabel}>{win.title}</span>
          </button>
        ))}

        <div className={styles.taskbarSpacer} />

        {/* System tray */}
        <div className={styles.systemTray}>
          <span>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span>{time.toLocaleDateString([], { day: "2-digit", month: "short" })}</span>
        </div>
      </div>

      {/* Start Menu */}
      <StartMenu open={startOpen} onClose={() => setStartOpen(false)} onOpenApp={openApp} />
    </div>
  );
}
