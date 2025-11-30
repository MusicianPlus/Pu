// Global State
export const graph = {
    nodes: [],
    cables: []
};

export const ctx = {
    time: 0,
    audio: { bass:0, mid:0, high:0, vol:0 },
    mouse: { x:0, y:0 }
};

export const view = { x:0, y:0, z:1 };
export const objects = {}; // Three.js Mesh map (NodeID -> Mesh)

// Audio Context (Lazy init)
export let audioCtx = null;

export function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
