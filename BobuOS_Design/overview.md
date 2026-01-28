# BobuOS Interface: Overview

## Vision
The BobuOS Interface is designed to transform the static project portfolio into an interactive, immersive "Virtual Desktop Environment" (VDE). Instead of just browsing a list of links, visitors "log in" to a technical playground where they can multitask across different experiments.

## Core Concepts
- **Atmospheric Immersion**: A custom boot-up sequence and OS-themed UI that sets the tone for a "developer's workspace."
- **Multitasking Technical Prowess**: Simultaneously running multiple WASM environments (Python via Pyodide, Rust via Bevy) in separate windows.
- **Developer Laboratory**: The projects aren't just games; they are live tools. Users can see logs, tweak parameters, and observe performance metrics within the OS.

## Key Features
1. **Window Management System**:
   - Draggable and resizable window frames.
   - Standard controls: Minimize (to taskbar), Maximize, and Close.
   - Z-index management (active window comes to front).
2. **Dynamic Taskbar**:
   - Start Menu (App Launcher).
   - System Tray with widgets (Memory usage, WASM status).
   - Taskbar buttons for active/minimized windows.
3. **Desktop Environment**:
   - Grid-based desktop icons for quick app access.
   - Custom desktop wallpaper with subtle shader animations.
4. **Integrated Logging**:
   - A global "Terminal" or "System Log" window that aggregates stdout/stderr from all running WASM instances.
