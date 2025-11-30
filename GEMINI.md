# Pu - Web-Based Visual Programming Environment

> **CORE MANDATE:** Every node MUST have a unique, meaningful, and creative real-time visualization on the node body itself. Users should understand what a node is doing just by looking at it, without opening the inspector. (e.g., Audio nodes show spectrums, Texture nodes show thumbnails, Math nodes show large numbers/graphs).

## Project Overview
**Pu** is a professional-grade visual programming environment for the web, inspired by TouchDesigner and Max/MSP. It uses a strict separation of concerns between Data (Signals), Logic (Math), Definitions (Geometry/Material), and Scene Objects.

## Tech Stack
*   **Engine:** Three.js (WebGL)
*   **Build:** Vite + Modules
*   **Styling:** TailwindCSS

---

## System Architecture (v3.0)

### 1. SIG (Signals) - 💛 Yellow
**Data:** `Float` / `Array`
Generates or processes raw data streams.
*   **Nodes:** `sig_lfo`, `sig_mic`, `sig_beat`, `sig_noise`.

### 2. MATH (Logic) - 💚 Green
**Data:** `Float`
Mathematical operations and logic gates.
*   **Nodes:** `math_map`, `math_op`, `math_clamp`, `math_smooth`.

### 3. GEO (Geometry Definition) - 💙 Blue
**Data:** `Three.BufferGeometry`
**Role:** Generates raw vertex data. **Does NOT render to the scene.**
*   **Nodes:** `geo_box`, `geo_sphere`, `geo_torus`, `geo_file`.

### 4. MAT (Material Definition) - 🧡 Orange
**Data:** `Three.Material`
**Role:** Defines surface properties.
*   **Nodes:** `mat_standard`, `mat_wire`, `mat_basic`.

### 5. OBJ (Scene Objects) - ❤️ Red
**Data:** `Three.Object3D` (Rendered in Scene)
**Role:** The "Container" that brings Geo and Mat together and places them in the world. Handles Transforms.
*   **Nodes:** `obj_mesh`, `obj_cam`, `obj_light`, `obj_instancer`.

### 6. TEX (Texture Ops) - 🩶 Grey
**Data:** `Three.Texture`
**Role:** Image/Video loading and processing.
*   **Nodes:** `tex_file`, `tex_transform`.

### 7. SND (Audio Ops) - 🩷 Pink
**Data:** `AudioNode` (Web Audio API)
**Role:** Audio playback, routing, and analysis.
*   **Nodes:** `snd_player`, `snd_mic`, `snd_analyze`, `snd_output`.

### 8. FX (Post-Process) - 💜 Purple
**Data:** `ShaderPass`
**Role:** Full-screen pixel processing.
*   **Nodes:** `fx_bloom`, `fx_rgb`, `fx_kaleido`.

---

## Theme System & UI Implementation

The application uses a CSS Variable-based theming system to ensure consistent styling across different visual modes (Dark, Light, Cyberpunk, etc.).

### 1. Theme Definition (`src/core/themes.js`)
Themes are defined as Javascript objects containing CSS variable mappings.
**Key Variables:**
*   `--bg-app`: Main application background.
*   `--bg-panel`: Sidebar/Inspector background.
*   `--bg-node`: Node body background.
*   `--bg-input`: Input fields and list item background.
*   `--border`: Border color for panels, inputs, and dividers.
*   `--text-main`: Primary text color.
*   `--text-dim`: Secondary/Label text color.
*   `--c-[category]`: Category specific accent colors (e.g., `--c-sig` for Signals).

### 2. Implementation Strategy
When creating UI elements dynamically (like Sidebar Template Items), **DO NOT use hardcoded colors** (e.g., `bg-[#1a1a1a]`). Instead:

1.  **Use CSS Variables:** Apply colors using `var(--variable-name)`.
    ```javascript
    element.style.backgroundColor = "var(--bg-input)";
    element.style.borderColor = "var(--border)";
    element.style.color = "var(--text-main)";
    ```
2.  **Tailwind Integration:** Tailwind is used for layout (padding, margin, flex), but color theming is handled via the variables injected by `applyTheme()`.
3.  **Hover States:** Implement hover effects using Javascript events (`onmouseenter`/`onmouseleave`) to modify the CSS variables or style properties dynamically to ensure they respond to theme changes.

### 3. Adding a New Theme
1.  Open `src/core/themes.js`.
2.  Add a new entry to the `THEMES` object with a unique key.
3.  Define all required CSS variables in the `colors` object.
4.  The Settings UI (`src/ui/settings.js`) will automatically pick up the new theme.

---

## Development Standards
1.  **Atomicity:** Nodes should do one thing well.
2.  **Separation:** Data nodes (GEO/MAT) never touch the `scene`. Only OBJ nodes interact with the `scene`.
3.  **Visual Feedback:** All nodes must implement `updateViz` logic.
    *   **SIG/MATH:** Bar chart or Value display.
    *   **ARR (Arrays):** 2D Canvas Plot.
    *   **TEX:** Image Thumbnail.
    *   **SND:** Frequency Spectrum / Waveform. (Emphasize transparent background and distinct colors for clarity, as implemented in `snd_analyze`).
    *   **GEO:** Info Box (Vertex Count).

## Roadmap
*   [IMPLEMENTED] Modular File Structure (Vite).
*   [IMPLEMENTED] Save/Load System.
*   [IMPLEMENTED] **GEO/OBJ Split (SOP/COMP paradigm).**
*   [IMPLEMENTED] **Camera & Project Settings.**
*   [IMPLEMENTED] **Texture System (TOPs).**
*   [IMPLEMENTED] **Instancing (Particle System).**
*   [IMPLEMENTED] **Audio System (CHOPs).**
*   [TODO] Undo/Redo System.
*   [TODO] Custom Shader Node.
