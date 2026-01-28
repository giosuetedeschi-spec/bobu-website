# BobuOS: Implementation Roadmap

This roadmap outlines the phased implementation of the BobuOS Virtual Desktop Environment. It is structured to build a stable core first, then layer on complex window management, and finally integrate the WASM runtimes.

## Phase 1: The Infrastructure (Foundation)
*Goal: Establish the global state and styling system that will support the entire OS.*

1. **[NEW] `src/context/BobuOSContext.tsx`**: 
   - Implement the `BobuOSProvider` using React Context.
   - Define the `BobuWindow` type and initial state.
   - Actions: `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `maximizeWindow`.
2. **[NEW] `src/styles/os.css` & Global Integration**:
   - Define CSS variables for the OS (colors, blurs, transitions).
   - Implement glassmorphism utility classes.
   - Set up the global `z-index` hierarchy (Desktop < Windows < Taskbar < Modals).

## Phase 2: The Core Workspace (Desktop & Shell)
*Goal: Visualizing the environment and the persistent navigation elements.*

3. **[NEW] `src/components/os/Desktop.tsx`**:
   - The main relative-positioned container.
   - Integration of a basic animated wallpaper (Three.js or CSS gradient).
4. **[NEW] `src/components/os/Taskbar.tsx`**:
   - Sticky bottom bar.
   - **Start Menu**: List of available "Apps" (our projects).
   - **Active Tasks**: Icons for currently open/minimized windows with "Restoring" animations.
   - **System Tray**: Clock and placeholder for system metrics.

## Phase 3: The Windowing System (Interactivity)
*Goal: Making the workspace feel like a real OS with draggable, resizable frames.*

5. **[NEW] `src/components/os/WindowFrame.tsx`**:
   - Integration with `react-rnd`.
   - **Title Bar**: Drag handle, Title, Icon, and Window Controls (Min/Max/Close).
   - **Active state**: Visual highlight (glow/border) when `isFocused` is true.
6. **[NEW] `src/components/os/WindowManager.tsx`**:
   - A wrapper that maps the `windows` state array to multiple `WindowFrame` components.
   - Ensures proper z-index switching when a user clicks a window.

## Phase 4: Project Integration (WASM Bridge)
*Goal: Bringing the existing Python/Rust projects into the new environment.*

7. **Refactor `usePyodide` Hook**:
   - Move shared initialization logic out of components to avoid redundant WASM loads.
   - Implement "Pause/Resume" broadcast for minimized windows.
8. **Adapt `PygameRunner.tsx` & `PyodideRunner.tsx`**:
   - Modify CSS to be `100%` width/height based on the parent `WindowFrame`.
   - Ensure input events don't leak to the Desktop when a window is active.
9. **Aggregate System Logs**:
   - Redirect standard output from all runners to a shared stream in the Context.
   - Create a "Global Terminal" app that displays these logs.

## Phase 5: Polish & UX Optimization
*Goal: Elevating the feel to a "Premium" standard.*

10. **Framer Motion Transitions**:
    - "Pop-in" animations for windows.
    - Squeezing animation when minimizing to the taskbar.
11. **Sound Design**:
    - Trigger subtle SFX for boot-up, window open/close, and taskbar clicks.
12. **Mobile Fallback & Responsive Check**:
    - Implement the logic in `src/app/progetti/page.tsx` to detect screen size and conditionally render the OS or the legacy card view.
13. **Performance Audit**:
    - Profile memory usage with multiple windows open.
    - Implement `React.memo` on frames and icons to prevent unnecessary re-renders.
