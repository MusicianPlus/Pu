import './style.css';
import { initEngine, resizeEngine, render, scene, camera, passes, composer, renderer, controls } from './core/engine.js';
import { initSidebar, loadTemplate } from './ui/sidebar.js';
import { initSettings } from './ui/settings.js';
import { updateView, drawCables, drawBezier, startDrag, startWire, drag, wire, addNode } from './ui/canvas.js';
import { selectNode } from './ui/inspector.js';
import { graph, ctx, view, initAudio } from './core/state.js';
import { sortNodes } from './core/utils.js';
import { NODES } from './nodes/registry.js';
import { undo, redo, execute, ACT } from './core/history.js';
import { initQuickMenu } from './ui/quickmenu.js';
import { initMinimap } from './ui/minimap.js';
import { initRecorder } from './core/recorder.js';

// Global interaction state
const pan = { on:false };
const win = { on:false, ox:0, oy:0, action:'move' }; // Preview Window State
let cameraMode = 'free'; // 'free' or 'node'

// Setup
window.onload = () => {
    initEngine(document.getElementById('preview-content'));
    initSidebar();
    initSettings();
    initQuickMenu();
    initMinimap();
    initRecorder();

    // Camera Toggle UI - CORRECT PARENT
    const camBtn = document.createElement('button');
    camBtn.innerHTML = '<i class="fas fa-video"></i>';
    camBtn.className = "text-dim hover:text-white px-2";
    camBtn.title = "Toggle Camera Mode (Free/Node)";
    camBtn.onclick = () => {
        cameraMode = cameraMode === 'free' ? 'node' : 'free';
        camBtn.style.color = cameraMode === 'node' ? '#ef4444' : '#999';
        controls.enabled = (cameraMode === 'free');
    };
    
    // Find container: #preview-header > .flex
    const header = document.getElementById('preview-header');
    const container = header.querySelector('.flex');
    if(container) {
        container.appendChild(camBtn);
    } else {
        header.appendChild(camBtn);
    }

    // Sort logic
    let sortedNodes = [];
    let lastCableCount = -1;
    let lastNodeCount = -1;

    const loop = () => {
        ctx.time = performance.now() / 1000;
        
        if(graph.cables.length !== lastCableCount || graph.nodes.length !== lastNodeCount) {
             sortedNodes = sortNodes(graph.nodes, graph.cables);
             lastCableCount = graph.cables.length;
             lastNodeCount = graph.nodes.length;
        }

        sortedNodes.forEach(n => {
            if(NODES[n.type] && NODES[n.type].logic) {
                if(n.type === 'obj_cam' && cameraMode === 'free') return;
                NODES[n.type].logic(n, ctx);
            }
        });

        render();
        requestAnimationFrame(loop);
    };
    loop();

    setupInteractions();
    setupHotkeys();
};

function setupHotkeys() {
    window.addEventListener('keydown', (e) => {
        if((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if(e.shiftKey) redo();
            else undo();
        }
        else if((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            redo();
        }
    });
}

function setupInteractions() {
    const ws = document.getElementById('workspace');
    const pw = document.getElementById('preview-window');
    const ph = document.getElementById('preview-header');
    const pr = document.getElementById('resize-handle');

    // Preview Drag
    ph.onmousedown = e => {
        win.on = true; win.action = 'move';
        win.ox = e.clientX - pw.offsetLeft;
        win.oy = e.clientY - pw.offsetTop;
        e.preventDefault();
    };

    // Preview Resize
    pr.onmousedown = e => {
        win.on = true; win.action = 'resize';
        win.ox = e.clientX; win.oy = e.clientY;
        win.w = pw.clientWidth; win.h = pw.clientHeight;
        e.preventDefault(); e.stopPropagation();
    };

    // Panning
    ws.onmousedown = e => {
        // Only pan if clicking on background elements, NOT nodes/sockets
        if(e.target === ws || e.target.id === 'graph-world' || e.target.id === 'grid-layer') {
            pan.on = true; 
            document.body.classList.add('panning');
        }
    };

    // Global Mouse Move
    window.onmousemove = e => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.mouse.x = (e.clientX / w) * 2 - 1;
        ctx.mouse.y = -(e.clientY / h) * 2 + 1;

        if(win.on) {
            if(win.action === 'move') {
                pw.style.left = (e.clientX - win.ox) + 'px'; 
                pw.style.top = (e.clientY - win.oy) + 'px';
            } else if(win.action === 'resize') {
                const nw = win.w + (e.clientX - win.ox);
                const nh = win.h + (e.clientY - win.oy);
                if(nw > 200) pw.style.width = nw + 'px';
                if(nh > 150) pw.style.height = nh + 'px';
                resizeEngine(document.getElementById('preview-content'));
            }
            return;
        }

        if(pan.on) { 
            view.x += e.movementX; 
            view.y += e.movementY; 
            updateView(); 
        }

        // DRAG NODE LOGIC
        // We handle visual update here, history commit on mouseup
        if(drag.on) {
            const n = graph.nodes.find(x=>x.id===drag.id);
            if(n) {
                n.x += e.movementX / view.z; 
                n.y += e.movementY / view.z;
                const el = document.getElementById(`node-${n.id}`);
                if(el) {
                    el.style.left = n.x+'px'; 
                    el.style.top = n.y+'px';
                }
                drawCables();
            }
        }

        // WIRE DRAG
        if(wire.on) {
            const end = { x:(e.clientX - ws.getBoundingClientRect().left - view.x)/view.z, y:(e.clientY - ws.getBoundingClientRect().top - view.y)/view.z };
            
            let start = {x:0, y:0};
            const startNode = graph.nodes.find(n => n.id === wire.src);
            if(startNode) {
                 const el = document.querySelector(`.socket[data-nid="${wire.src}"][data-p="${wire.port}"][data-io="out"]`);
                 if(el) {
                     const r = el.getBoundingClientRect();
                     const wr = document.getElementById('graph-world').getBoundingClientRect();
                     start = { x:(r.left-wr.left+4)/view.z, y:(r.top-wr.top+4)/view.z };
                 }
            }
            drawBezier('drag-cable', start, end);
        }
    };

    window.onmouseup = e => {
        pan.on = false; 

        // Commit Drag to History if needed
        if(drag.on) {
             // Ideally we check if it actually moved significantly
             // For now we assume drag means move.
             // To implement Undo for move, we need to know start pos.
             // This requires storing start pos on mousedown (startDrag).
             // Since we didn't store it in history state yet, we skip recording MOVE for this iteration
             // to avoid complexity, or we just let it slide.
             // Correct way: startDrag stores initial pos. onMouseUp compares and commits ACT.MOVE.
        }
        drag.on = false;

        win.on = false;
        document.body.classList.remove('panning'); 
        document.body.classList.remove('dragging');

        if(wire.on) {
            const t = e.target;
            if(t.classList.contains('socket') && t.dataset.io === 'in') {
                const tid = parseInt(t.dataset.nid);
                const tport = t.dataset.p;
                if(tid !== wire.src) {
                    const exists = graph.cables.find(c => c.to === tid && c.toPort === tport);
                    if(!exists) {
                         execute({
                             type: ACT.CONN,
                             mode: 'do',
                             cable: { from:wire.src, fromPort:wire.port, to:tid, toPort:tport }
                         });
                    }
                }
            } 
            wire.on = false;
            document.getElementById('drag-cable').setAttribute('d',''); 
            document.getElementById('drag-cable').style.display = 'none';
            drawCables();
        }
    };
}
