import { graph, view } from '../core/state.js';
import { updateView } from './canvas.js';
import { NODES } from '../nodes/registry.js';

export function initMinimap() {
    const container = document.createElement('div');
    container.id = 'minimap';
    container.className = 'minimap';
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Drag Logic
    let dragging = false;
    canvas.onmousedown = (e) => { dragging = true; move(e); };
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('mousemove', (e) => { if(dragging) move(e); });

    function move(e) {
        // Map Click (0-200) to World Space
        // We need bounds first
        const b = getBounds();
        const mapW = canvas.width;
        const mapH = canvas.height;

        // Normalize click 0-1
        const r = canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / mapW;
        const ny = (e.clientY - r.top) / mapH;

        // World target
        // bounds.x + nx * bounds.w
        const tx = b.minX + nx * (b.maxX - b.minX);
        const ty = b.minY + ny * (b.maxY - b.minY);

        // Update View (Center on target)
        // view.x is translation.
        // ScreenCenter = view.x + worldPoint * zoom
        // view.x = ScreenCenter - worldPoint * zoom

        const w = document.getElementById('workspace');
        view.x = (w.clientWidth/2) - tx * view.z;
        view.y = (w.clientHeight/2) - ty * view.z;
        updateView();
    }

    function getBounds() {
        if(graph.nodes.length === 0) return { minX: -1000, maxX: 1000, minY: -1000, maxY: 1000 };
        let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
        graph.nodes.forEach(n => {
            if(n.x < minX) minX = n.x;
            if(n.x > maxX) maxX = n.x;
            if(n.y < minY) minY = n.y;
            if(n.y > maxY) maxY = n.y;
        });
        // Pad
        return { minX: minX-500, maxX: maxX+650, minY: minY-500, maxY: maxY+500 }; // 150 width node approx
    }

    function render() {
        // Clear
        ctx.fillStyle = '#111';
        ctx.fillRect(0,0,canvas.width, canvas.height);

        const b = getBounds();
        const worldW = b.maxX - b.minX;
        const worldH = b.maxY - b.minY;

        // Scale to fit
        const scX = canvas.width / worldW;
        const scY = canvas.height / worldH;
        const sc = Math.min(scX, scY);

        // Offset to center
        const offX = (canvas.width - worldW*sc)/2;
        const offY = (canvas.height - worldH*sc)/2;

        // Draw Nodes
        graph.nodes.forEach(n => {
            const def = NODES[n.type];
            const x = offX + (n.x - b.minX) * sc;
            const y = offY + (n.y - b.minY) * sc;
            const w = 150 * sc;
            const h = 80 * sc; // Approx

            // Color by category
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue(`--c-${def.cat}`) || '#888';
            ctx.fillRect(x, y, w, h);
        });

        // Draw Viewport Rect
        const ws = document.getElementById('workspace');
        // Viewport in world space
        // 0 = view.x + wx * zoom => wx = -view.x / zoom
        const vx = -view.x / view.z;
        const vy = -view.y / view.z;
        const vw = ws.clientWidth / view.z;
        const vh = ws.clientHeight / view.z;

        const rX = offX + (vx - b.minX) * sc;
        const rY = offY + (vy - b.minY) * sc;
        const rW = vw * sc;
        const rH = vh * sc;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(rX, rY, rW, rH);

        requestAnimationFrame(render);
    }
    render();
}
