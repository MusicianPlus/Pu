import { graph, view } from '../core/state.js';
import { addNode, updateView } from './canvas.js';
import { NODES, getIcon } from '../nodes/registry.js';
import { t } from '../core/utils.js';

let active = false;
let menuEl = null;

export function initQuickMenu() {
    const ws = document.getElementById('workspace');

    // Create DOM
    menuEl = document.createElement('div');
    menuEl.id = 'quick-menu';
    menuEl.className = 'quick-menu hidden';
    menuEl.innerHTML = `
        <input type="text" id="qm-search" placeholder="Search Node..." autocomplete="off">
        <div id="qm-list" class="qm-list"></div>
    `;
    document.body.appendChild(menuEl);

    const input = document.getElementById('qm-search');
    const list = document.getElementById('qm-list');
    let searchPos = { x:0, y:0 }; // Screen space

    function show(x, y) {
        active = true;
        searchPos = { x, y };
        menuEl.style.left = x + 'px';
        menuEl.style.top = y + 'px';
        menuEl.classList.remove('hidden');
        input.value = '';
        input.focus();
        renderList('');

        // Prevent clicking outside immediately closing it if it was a right click
        setTimeout(() => {
            window.addEventListener('mousedown', onClickOutside);
        }, 10);
    }

    function hide() {
        active = false;
        menuEl.classList.add('hidden');
        window.removeEventListener('mousedown', onClickOutside);
    }

    function onClickOutside(e) {
        if (!menuEl.contains(e.target)) {
            hide();
        }
    }

    function renderList(filter) {
        list.innerHTML = '';
        const f = filter.toLowerCase();

        Object.entries(NODES).forEach(([type, def]) => {
            if(t(def.name).toLowerCase().includes(f) || type.includes(f) || def.cat.includes(f)) {
                const item = document.createElement('div');
                item.className = `qm-item ${def.cat}`;
                item.innerHTML = `<i class="fas ${getIcon(type)}"></i> <span>${t(def.name)}</span> <span class="text-xs opacity-50 ml-auto uppercase">${def.cat}</span>`;

                item.onclick = () => {
                    // Calculate World Pos
                    // x, y is screen pixel relative to top-left
                    // worldX = (screenX - offsetX) / zoom
                    const w = document.getElementById('workspace');
                    // We use searchPos relative to workspace
                    // But searchPos is from e.clientX which is window relative.
                    // Workspace is usually full screen but let's be safe
                    const wr = w.getBoundingClientRect();

                    const wx = (searchPos.x - wr.left - view.x) / view.z;
                    const wy = (searchPos.y - wr.top - view.y) / view.z;

                    addNode(type, wx, wy);
                    hide();
                };
                list.appendChild(item);
            }
        });

        // Select first item by default for Enter key?
        if(list.firstChild) list.firstChild.classList.add('selected');
    }

    input.oninput = (e) => renderList(e.target.value);

    input.onkeydown = (e) => {
        if(e.key === 'Enter') {
            const sel = list.querySelector('.selected'); // or just first child
            if(sel) sel.click();
            else if (list.firstChild) list.firstChild.click();
        }
        if(e.key === 'Escape') hide();
    };

    // Global Listeners for Activation
    ws.addEventListener('contextmenu', (e) => {
        // Only if on background
        if(e.target.id === 'workspace' || e.target.id === 'graph-world' || e.target.id === 'grid-layer') {
            e.preventDefault();
            show(e.clientX, e.clientY);
        }
    });

    window.addEventListener('keydown', (e) => {
        if(e.key === 'Tab' && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
            e.preventDefault();
            // Show at mouse position? We need to track mouse globally or center
            // Let's use center if we don't have mouse pos, but we track mouse in state.js
            // Actually main.js tracks ctx.mouse but that's normalized -1 to 1.
            // Let's just use center of screen for TAB
            show(window.innerWidth/2 - 100, window.innerHeight/2 - 150);
        }
    });
}
