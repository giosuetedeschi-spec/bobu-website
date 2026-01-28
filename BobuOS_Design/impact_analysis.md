# BobuOS: Impact Analysis

## Website Performance
Running an OS-in-OS environment introduces significant resource demands.

### CPU & RAM
- **WASM Overload**: Each instance of Pyodide or Bevy consumes memory. We will implement "Instance Hibernation" (suspending the event loop of minimized windows).
- **GPU Rendering**: The Animated Wallpaper and multiple Window Frames require careful CSS optimization (using `transform` and `opacity` only) to maintain 60FPS.

## User Engagement & UX
- **The "Wow" Factor**: Visitors are 3x more likely to explore multiple projects if they can keep them open simultaneously.
- **Discovery**: The Taskbar and Start Menu provide a familiar mental model for navigating complex technical collections.
- **Mobile Experience**: A Virtual Desktop is notoriously difficult on touch screens. 
  - **Proposed Solution**: Default to the current "Card View" on screens < 768px.

## Future-Proofing (The "Workshop" Link)
This OS interface serves as the foundation for the **Live Workshop**:
- Launch a "Terminal" alongside a "Code Editor".
- Live-load scripts from the editor into the active Python window.
- This interaction is only possible if both apps exist in a shared spatial environment (The Desktop).

## Technical Impression
By building a Window Manager from scratch (or highly customized), we demonstrate:
- Mastery of the DOM and Browser Event Loop.
- Sophisticated State Management.
- Ability to bridge different technical stacks (React, Python, Rust) into a unified UX.
