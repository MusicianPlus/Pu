import { graph, audioCtx } from '../core/state.js';
import { NODES } from '../nodes/registry.js';
import { t, sysT } from '../core/utils.js';
import { execute, ACT } from '../core/history.js';

let selectedNodeId = null;

export function selectNode(id) {
    const node = graph.nodes.find(n => n.id === id);
    if(!node) return;
    selectedNodeId = id;
    
    document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
    document.getElementById(`node-${id}`).classList.add('selected');
    
    const pnl = document.getElementById('inspector-content');
    pnl.innerHTML = '';
    const def = NODES[node.type];
    
    // Header
    pnl.innerHTML += `
        <div class="p-4 border-b border-[#333]">
            <h2 class="text-sm font-bold text-white uppercase tracking-wider mb-1" style="color:var(--c-${def.cat})">${t(def.name)}</h2>
            <div class="text-[10px] text-gray-500 font-mono">ID: ${id}</div>
        </div>
        <div class="node-desc"><strong>INFO</strong>${t(def.desc)}</div>
    `;
    
    // Props
    Object.keys(node.params).forEach(k => {
        const p = node.params[k];
        const row = document.createElement('div');
        row.className = 'prop-row';
        
        let label = p.label ? (typeof p.label === 'object' ? t(p.label) : p.label) : k;
        
        if(p.type === 'file') {
             // ... keep file logic ...
             let inputHtml = `<div class="prop-file" id="btn-file-${id}">${sysT('file')}</div>
                             <input type="file" id="file-${id}" style="display:none" accept="${def.cat==='tex'?'image/*':'audio/*'}">`;
            row.innerHTML = `<label class="prop-label">${label}</label>${inputHtml}`;
            pnl.appendChild(row);
            
            // Bind File Events
            const btn = row.querySelector(`#btn-file-${id}`);
            const inp = row.querySelector(`#file-${id}`);
            btn.onclick = () => inp.click();
            
            if (def.cat === 'tex') inp.accept = "image/*";
            else if (def.cat === 'geo') inp.accept = ".glb,.gltf,.obj";
            else inp.accept = "audio/*";

            inp.onchange = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                
                if(file.type.startsWith('audio')) {
                    if(audioCtx) {
                        const reader = new FileReader();
                        reader.onload = ev => {
                            audioCtx.decodeAudioData(ev.target.result, b => {
                                node.data.buffer = b; 
                                if(node.params.Play) node.params.Play.v = 0;
                                selectNode(id); 
                            });
                        };
                        reader.readAsArrayBuffer(file);
                    }
                } 
                else if(file.type.startsWith('image')) {
                    const reader = new FileReader();
                    reader.onload = ev => { node.data.url = ev.target.result; node.data.needsUpdate = true; };
                    reader.readAsDataURL(file);
                }
                else if(file.name.endsWith('.glb') || file.name.endsWith('.gltf') || file.name.endsWith('.obj')) {
                    const reader = new FileReader();
                    reader.onload = ev => { 
                        node.data.url = ev.target.result; 
                        node.data.ext = file.name.split('.').pop().toLowerCase();
                        node.data.needsUpdate = true; 
                    };
                    reader.readAsDataURL(file);
                }
            };

        } else if (p.type === 'code') {
            // TEXT AREA FOR CODE
            row.innerHTML = `<label class="prop-label w-full block mb-1">${label}</label>`;
            const textarea = document.createElement('textarea');
            textarea.className = "w-full h-32 bg-black/50 text-xs font-mono text-gray-300 p-2 border border-gray-700 rounded resize-y focus:border-blue-500 outline-none";
            textarea.value = p.v;

            // Simple edit logic (no undo yet for code to avoid heavy history, maybe debounce later)
            textarea.onchange = (e) => {
                node.params[k].v = e.target.value;
                node.data.needsCompile = true; // Flag for recompilation
            };

            row.appendChild(textarea);
            pnl.appendChild(row);

        } else if (p.label === 'FIRE') {
            // Trigger
            let inputHtml = `<button class="w-full bg-red-600 text-white font-bold py-2 rounded active:bg-red-800" id="btn-trig-${id}-${k}">FIRE</button>`;
            row.innerHTML = inputHtml;
            pnl.appendChild(row);
            const btn = row.querySelector(`#btn-trig-${id}-${k}`);
            btn.onmousedown = () => node.params[k].v = 1;

        } else {
            // Number Drag
            const valBox = document.createElement('div');
            valBox.className = 'prop-val-box';
            valBox.innerText = p.v.toFixed(3);
            
            row.innerHTML = `<label class="prop-label">${label}</label>`;
            row.appendChild(valBox);
            pnl.appendChild(row);

            let startX, startVal, lastVal;
            const onMove = (e) => {
                const dx = e.clientX - startX;
                let mult = 0.01;
                if(e.shiftKey) mult = 0.001;
                if(e.ctrlKey) mult = 0.1;
                
                let newVal = startVal + dx * mult;
                if(p.min !== undefined) newVal = Math.max(newVal, p.min);
                if(p.max !== undefined) newVal = Math.min(newVal, p.max);
                if(p.step && Number.isInteger(1/p.step)) newVal = Math.round(newVal / p.step) * p.step;

                node.params[k].v = newVal;
                lastVal = newVal;
                valBox.innerText = newVal.toFixed(3);
            };
            
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.style.cursor = 'default';
                if(startVal !== lastVal) {
                    execute({ type: ACT.PARAM, mode: 'do', nodeId: node.id, key: k, oldVal: startVal, newVal: lastVal });
                }
            };

            valBox.onmousedown = (e) => {
                startX = e.clientX;
                startVal = node.params[k].v;
                lastVal = startVal;
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
                document.body.style.cursor = 'ew-resize';
            };

            valBox.ondblclick = () => {
                const oldVal = node.params[k].v;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldVal;
                input.className = 'prop-input-edit';
                
                input.onblur = () => { finishEdit(); };
                input.onkeydown = (e) => { if(e.key === 'Enter') finishEdit(); };
                
                function finishEdit() {
                    let v = parseFloat(input.value);
                    if(isNaN(v)) v = oldVal;
                    if(v !== oldVal) {
                         execute({ type: ACT.PARAM, mode: 'do', nodeId: node.id, key: k, oldVal: oldVal, newVal: v });
                    } else {
                        if(input.parentNode) valBox.innerHTML = v.toFixed(3);
                    }
                }
                valBox.innerHTML = '';
                valBox.appendChild(input);
                input.focus();
            };
        }
    });
}
