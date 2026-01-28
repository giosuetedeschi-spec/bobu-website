# BobuOS: Implementation Details

## New Resources & Dependencies
To ensure a premium feel with high-performance interactions, we will integrate:
- **[react-rnd](https://github.com/bokuweb/react-rnd)**: A mature library for Draggable and Resizable components.
- **[Framer Motion](https://www.framer.com/motion/)**: For "launch" animations and window minimize/restore transitions.
- **[Lucide React](https://lucide.dev/)**: For high-quality, consistent OS icons.
- **Audio Assets**: Subtle mechanical sound effects for window operations (Blips, Clicks).

## Component Roadmap

### 1. The Wrapper: `Desktop.tsx`
- Location: `src/components/os/Desktop.tsx`
- Responsibility: Main canvas that handles the background and window stacking.

### 2. The Core: `WindowFrame.tsx`
- Location: `src/components/os/WindowFrame.tsx`
- Features: Custom title bar, drag handles, resize corners, and shadow/blur effects (Glassmorphism).

### 3. The Runners (Adaptations)
We need to modify existing runners to work inside flexible frames:
- **`PygameRunner.tsx`**: Update to support re-scaling and window-specific input capturing.
- **`PyodideRunner.tsx`**: Extract logic into a hook `usePyodide` to be shared across multiple "App" instances.

## Proposed File Changes

### [MODIFY] `src/app/progetti/page.tsx`
- Remove: Static card grid.
- Add: `<BobuOSProvider>` and `<Desktop />` component.
- Strategy: Use a "Mobile Fallback" where the OS view reverts to a list for small screens.

### [NEW] `src/context/BobuOSContext.tsx`
- Purpose: Global state for window management, taskbar state, and shared WASM status.

### [NEW] `src/styles/os.css`
- Purpose: Specialized styles for glassmorphism, scanline effects (retro terminal look), and window animations.
