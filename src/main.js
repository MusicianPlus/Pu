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

    // Camera Toggle UI
    const camBtn = document.createElement('button');
    camBtn.innerHTML = '<i class="fas fa-video"></i>';
    camBtn.className = "text-dim hover:text-white px-2";
    camBtn.title = "Toggle Camera Mode (Free/Node)";
    camBtn.onclick = () => {
        cameraMode = cameraMode === 'free' ? 'node' : 'free';
        camBtn.style.color = cameraMode === 'node' ? '#ef4444' : '#999'; // Red for recording/node mode
        
        if(cameraMode === 'free') {
            controls.enabled = true;
        } else {
            controls.enabled = false;
        }
    };
    document.getElementById('preview-header').insertBefore(camBtn, document.getElementById('lbl-render'));
    
    // Sort flag to avoid sorting every frame if graph hasn't changed
    // We can assume graph changes when cables are modified
    let sortedNodes = [];
    let lastCableCount = -1;
    let lastNodeCount = -1;

    const loop = () => {
        ctx.time = performance.now() / 1000;
        
        // Check for graph changes to re-sort execution order
        if(graph.cables.length !== lastCableCount || graph.nodes.length !== lastNodeCount) {
             sortedNodes = sortNodes(graph.nodes, graph.cables);
             lastCableCount = graph.cables.length;
             lastNodeCount = graph.nodes.length;
        }

        // Update Graph Logic (in Topological Order)
        sortedNodes.forEach(n => {
            if(NODES[n.type] && NODES[n.type].logic) {
                // Only run camera logic if in Node Mode
                if(n.type === 'obj_cam' && cameraMode === 'free') return;
                
                NODES[n.type].logic(n, ctx);
            }
        });

        render();
        requestAnimationFrame(loop);
    };
    loop();


    // ... (Global Listeners) ...
    
    setupInteractions();
    setupHotkeys();
};

function setupHotkeys() {
    window.addEventListener('keydown', (e) => {
        // Undo/Redo
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
    const w = document.getElementById('graph-world');
    const pw = document.getElementById('preview-window');
    const ph = document.getElementById('preview-header');
    const pr = document.getElementById('resize-handle');

    // Preview Drag Start
    ph.onmousedown = e => {
        win.on = true; win.action = 'move';
        win.ox = e.clientX - pw.offsetLeft;
        win.oy = e.clientY - pw.offsetTop;
        e.preventDefault();
    };

    // Preview Resize Start
    pr.onmousedown = e => {
        win.on = true; win.action = 'resize';
        win.ox = e.clientX; win.oy = e.clientY;
        win.w = pw.clientWidth; win.h = pw.clientHeight;
        e.preventDefault(); e.stopPropagation();
    };

    // Panning
    ws.onmousedown = e => {
        if(e.target === ws || e.target === w || e.target.id === 'grid-layer') {
            pan.on = true; 
            document.body.classList.add('panning');
        }
    };

    // ... (Wheel) ...

    window.onmousemove = e => {
        // Update Context Mouse (Normalized -1 to 1)
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.mouse.x = (e.clientX / w) * 2 - 1;
        ctx.mouse.y = -(e.clientY / h) * 2 + 1;

        // Preview Window Logic
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
            return; // Stop other interactions
        }

        if(pan.on) { 
            view.x += e.movementX; 
            view.y += e.movementY; 
            updateView(); 
        }
        if(drag.on) { // drag.on is now imported
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
        if(wire.on) { // wire.on is now imported
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
        drag.on = false; // drag.on is now imported
        win.on = false;
        document.body.classList.remove('panning'); 
        document.body.classList.remove('dragging');

        if(wire.on) { // wire.on is now imported
            const t = e.target;
            if(t.classList.contains('socket') && t.dataset.io === 'in') {
                const tid = parseInt(t.dataset.nid);
                const tport = t.dataset.p;
                if(tid !== wire.src) {
                    const exists = graph.cables.find(c => c.to === tid && c.toPort === tport);

                    // Logic to add cable
                    // Was: graph.cables.push(...)
                    // Now: execute(...)
                    if(!exists) {
                         execute({
                             type: ACT.CONN,
                             mode: 'do',
                             cable: { from:wire.src, fromPort:wire.port, to:tid, toPort:tport }
                         });
                    }
                }
            } 
            wire.on = false; // wire.on is now imported
            document.getElementById('drag-cable').setAttribute('d',''); 
            document.getElementById('drag-cable').style.display = 'none';
            drawCables();
        }
    };
}
