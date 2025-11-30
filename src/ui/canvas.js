import { graph, view, objects } from '../core/state.js';
import { scene, passes, camera, controls } from '../core/engine.js';
import * as THREE from 'three';
import { NODES } from '../nodes/registry.js';
import { t, sysT } from '../core/utils.js';
import { selectNode } from './inspector.js';

let nextId = 1;

// Global interaction state (moved from main.js)
export const drag = { on:false, id:null };
export const wire = { on:false, src:null, port:null, isInputPull:false };

// ... (startDrag and startWire functions remain the same) ...

export function startDrag(e, id) { 
    drag.on = true; 
    drag.id = id; 
    document.body.classList.add('dragging');
    selectNode(id); 
}

export function startWire(e, id, port, io) {
    e.stopPropagation();
    document.getElementById('drag-cable').style.display = 'block';
    if (io === 'in') {
        const existing = graph.cables.find(c => c.to === id && c.toPort === port);
        if (existing) {
            wire.src = existing.from; wire.port = existing.fromPort;
            const idx = graph.cables.indexOf(existing);
            if(idx>-1) graph.cables.splice(idx,1);
            drawCables();
            wire.on = true; wire.isInputPull = true;
        }
    } else {
        wire.on = true; wire.src = id; wire.port = port; wire.isInputPull = false;
    }
}

// ... (rest of the file until resetScene) ...

export function updateView() { 
    // Graph World Transform
    document.getElementById('graph-world').style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`; 
    
    // Grid Logic (Infinite Illusion)
    const grid = document.getElementById('grid-layer');
    // Grid size scales with zoom to keep density consistent-ish, or just scales normally
    // TD Style: Grid gets bigger/smaller but stays crisp.
    // We apply background-position based on view.x/y
    
    const size = 20 * view.z; // Scale grid size with zoom
    grid.style.backgroundSize = `${size}px ${size}px`;
    grid.style.backgroundPosition = `${view.x}px ${view.y}px`;
    
    // Optional: Add opacity fade based on zoom level for "Major" lines if we had them
}

function getSocketPos(nid, p, io) {
    const el = document.querySelector(`.socket[data-nid="${nid}"][data-p="${p}"][data-io="${io}"]`);
    if(!el) return {x:0, y:0};
    const r = el.getBoundingClientRect();
    const wr = document.getElementById('graph-world').getBoundingClientRect();
    return { x:(r.left-wr.left+4)/view.z, y:(r.top-wr.top+4)/view.z };
}

export function drawCables() {
    const svg = document.getElementById('connections');
    // Keep drag-cable, remove others
    Array.from(svg.children).forEach(c => { if(c.id !== 'drag-cable') c.remove() });
    
    graph.cables.forEach(c => {
        const p1 = getSocketPos(c.from, c.fromPort, 'out');
        const p2 = getSocketPos(c.to, c.toPort, 'in');
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "cable");
        
        const src = graph.nodes.find(n => n.id === c.from);
        let valText = "0.0";
        if(src && src.val[c.fromPort] !== undefined) {
            valText = isNaN(src.val[c.fromPort]) ? "0.0" : (typeof src.val[c.fromPort] === 'number' ? src.val[c.fromPort].toFixed(2) : 'OBJ');
            const cat = NODES[src.type].cat;
            path.style.stroke = `var(--c-${cat})`;
        }
        const d = Math.abs(p1.x-p2.x)*0.5;
        path.setAttribute('d', `M ${p1.x} ${p1.y} C ${p1.x+d} ${p1.y}, ${p2.x-d} ${p2.y}, ${p2.x} ${p2.y}`);
        
        // Label
        const midX = (p1.x + p1.x+d + p2.x-d + p2.x)/4; 
        const midY = (p1.y + p2.y)/2; 
        const txtG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        txtG.setAttribute("transform", `translate(${midX},${midY})`);
        txtG.innerHTML = `<rect class="cable-label-bg" x="-12" y="-6" width="24" height="12"/><text class="cable-label-text">${valText}</text>`;
        
        g.appendChild(path); g.appendChild(txtG); svg.appendChild(g);
    });
}

export function drawBezier(id, p1, p2) {
    const d = Math.abs(p1.x-p2.x)*0.5;
    document.getElementById(id).setAttribute('d', `M ${p1.x} ${p1.y} C ${p1.x+d} ${p1.y}, ${p2.x-d} ${p2.y}, ${p2.x} ${p2.y}`);
}

export function addNode(type, x=null, y=null) {
    const def = NODES[type];
    if(!def) return;
    if(x===null) {
        const w = document.getElementById('workspace');
        x = (w.clientWidth/2 - view.x)/view.z - 75;
        y = (w.clientHeight/2 - view.y)/view.z - 50;
    }
    
    const node = { id:nextId++, type, x, y, params:{}, val:{}, data:{} };
    Object.keys(def.params).forEach(k => node.params[k] = {...def.params[k]});
    
    if(def.init) def.init(node);
    graph.nodes.push(node);
    
    // Create DOM
    const el = document.createElement('div');
    el.className = `node ${def.cat}`;
    
    // Identify Global Nodes (FX, Camera, Background)
    const isGlobal = def.cat === 'fx' || type === 'obj_cam' || type === 'obj_background';
    if(isGlobal) el.classList.add('global-node');

    el.id = `node-${node.id}`;
    el.style.left = node.x + 'px'; el.style.top = node.y + 'px';
    
    let ins = '', outs = '';
    if(def.ports) {
        if(def.ports.in) def.ports.in.forEach(p => {
            ins += `<div class="port-row"><div class="flex items-center"><div class="socket in" data-nid="${node.id}" data-p="${p}" data-io="in"></div><span>${p}</span></div></div>`;
        });
        if(def.ports.out) def.ports.out.forEach(p => {
            outs += `<div class="port-row justify-end"><span>${p}</span><div class="socket out" data-nid="${node.id}" data-p="${p}" data-io="out"></div></div>`;
        });
    }
    
    // Visualization Logic
    let vizHtml = '';
    
    if (def.cat === 'tex') {
        vizHtml = `<div class="viz-box"><img id="viz-${node.id}" class="viz-img" src=""></div>`;
    } 
    else if (type.includes('grid') || type.includes('random') || type.includes('array') || type.includes('gradient')) {
        vizHtml = `<div class="viz-box"><canvas id="viz-${node.id}" class="viz-canvas" width="148" height="40"></canvas></div>`;
    } 
    else if (def.cat === 'snd') {
        // Audio Spectrum Canvas
        vizHtml = `<div class="viz-box"><canvas id="viz-snd-${node.id}" class="viz-canvas" width="148" height="40"></canvas></div>`;
    }
    else if (def.cat === 'math' || def.cat === 'sig') {
        // Big Number Display + Mini Bar
        vizHtml = `
        <div class="viz-box flex-col p-1 bg-black/50">
            <div id="viz-txt-${node.id}" class="text-[10px] font-mono text-[#22c55e] w-full text-right truncate">0.00</div>
            <div class="viz-strip mt-1"><div class="viz-bar" id="viz-${node.id}"></div></div>
        </div>`;
    }
    else if (def.cat === 'geo') {
        // Info Box
        vizHtml = `
        <div class="viz-box p-2 flex flex-col justify-center items-start text-[9px] font-mono text-blue-400 leading-tight bg-blue-900/10">
            <span id="viz-geo-v-${node.id}">V: 0</span>
            <span id="viz-geo-f-${node.id}">F: 0</span>
        </div>`;
    }

    const globalBadge = isGlobal ? `<span class="global-tag">GLOBAL</span>` : '';

    el.innerHTML = `
        <div class="node-header" data-nid="${node.id}">
            <div class="flex items-center gap-2">
                <span>${t(def.name)}</span>
                ${globalBadge}
            </div>
            <i class="fas fa-times opacity-50 hover:opacity-100 delete-btn"></i>
        </div>
        <div class="node-body">${vizHtml}${ins}${outs}</div>
    `;
    
    // Listeners
    el.querySelector('.delete-btn').onclick = (e) => { e.stopPropagation(); removeNode(node.id); };
    el.querySelector('.node-header').onmousedown = (e) => { e.stopPropagation(); startDrag(e, node.id); };
    el.onclick = (e) => { e.stopPropagation(); selectNode(node.id); };
    
    // Socket Listeners
    el.querySelectorAll('.socket').forEach(s => {
        s.onmousedown = (e) => {
            const nid = parseInt(s.dataset.nid);
            const port = s.dataset.p;
            const io = s.dataset.io;
            startWire(e, nid, port, io);
        };
        s.oncontextmenu = (e) => {
             e.preventDefault(); e.stopPropagation();
             const nid = parseInt(s.dataset.nid);
             const port = s.dataset.p;
             const io = s.dataset.io;
             if(io === 'in') {
                 const idx = graph.cables.findIndex(c => c.to === nid && c.toPort === port);
                 if(idx > -1) graph.cables.splice(idx, 1);
             } else {
                 // Remove all from output? Or just specific? Usually one-to-many is allowed for outputs
                 // For now, remove all connections FROM this output
                 // graph.cables = graph.cables.filter(c => !(c.from === nid && c.fromPort === port));
             }
             drawCables();
        };
    });

    document.getElementById('node-container').appendChild(el);
    selectNode(node.id);
    return node;
}

export function removeNode(id) {
    const n = graph.nodes.find(x => x.id === id);
    if(n) {
        // Cleanup Audio
        if(n.data.source) { try{ n.data.source.stop(); n.data.source.disconnect(); }catch(e){} }
        if(n.data.stream) { try{ n.data.stream.disconnect(); }catch(e){} }
        if(n.data.analyser) { try{ n.data.analyser.disconnect(); }catch(e){} }
        
        // Cleanup Geometry/Material/Texture
        if(n.val.Geo) n.val.Geo.dispose();
        if(n.val.Mat) n.val.Mat.dispose();
        if(n.val.Tex) n.val.Tex.dispose();
    }

    const el = document.getElementById(`node-${id}`); if(el) el.remove();
    
    if(objects[id]) { 
        const obj = objects[id];
        
        // Remove Helper if exists
        if(obj.userData && obj.userData.helper) {
             scene.remove(obj.userData.helper);
             if(obj.userData.helper.dispose) obj.userData.helper.dispose();
        }

        scene.remove(obj); 
        
        // Dispose Mesh Geometry/Material if not shared (which is tricky, but let's try basic disposal)
        if(obj.geometry) obj.geometry.dispose();
        if(obj.material) {
            if(Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
        
        // If InstancedMesh, dispose logic handled above generally
        
        delete objects[id]; 
    }
    
    const idx = graph.nodes.findIndex(n=>n.id===id);
    if(idx > -1) graph.nodes.splice(idx, 1);
    
    // Remove cables
    for (let i = graph.cables.length - 1; i >= 0; i--) {
        if (graph.cables[i].from === id || graph.cables[i].to === id) {
            graph.cables.splice(i, 1);
        }
    }
    drawCables();
}

export function resetScene() {
    // 1. Resource Disposal Loop
    // We iterate to dispose geometries/materials/audio/textures
    [...graph.nodes].forEach(n => removeNode(n.id));
    
    // 2. Deep Clean Scene
    if(scene) {
        scene.clear(); // Removes all children (meshes, lights, helpers)
        scene.background = null;
        
        // Re-add Default Lights (Essential so scenes aren't pitch black)
        const ambient = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambient);
    }

    // 3. Reset State
    graph.nodes = [];
    graph.cables = [];
    for (const prop of Object.getOwnPropertyNames(objects)) {
        delete objects[prop];
    }

    // 4. Reset FX Defaults
    if(passes) {
        if(passes.bloom) { 
            passes.bloom.strength = 0; 
            passes.bloom.radius = 0; 
        }
        if(passes.after) { passes.after.uniforms['damp'].value = 0; }
        if(passes.rgb) { passes.rgb.uniforms['amount'].value = 0; }
        if(passes.kaleido) { passes.kaleido.enabled = false; }
    }
    
    // 5. Reset Camera & Controls
    if(camera && controls) {
        camera.position.set(0, 2, 8);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
    }
    
    // 6. Force Renderer Clear
    // To remove any "stuck" frames in the buffer
    const canvas = document.getElementById('preview-content')?.querySelector('canvas');
    if(canvas) {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if(gl) {
            gl.clearColor(0,0,0,1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }
}
