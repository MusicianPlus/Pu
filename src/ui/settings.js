import { renderer, resizeEngine } from '../core/engine.js';
import { setLang, getLang } from '../core/utils.js';
import { THEMES, applyTheme, getStoredTheme } from '../core/themes.js';

export let config = {
    resolution: 1.0
};

export function initSettings() {
    const modal = document.getElementById('settings-modal');
    const btnOpen = document.getElementById('btn-settings');
    const btnClose = document.getElementById('btn-close-settings');
    const selLang = document.getElementById('set-lang');
    const selTheme = document.getElementById('set-theme');
    const selRes = document.getElementById('set-resolution');
    const rngGrid = document.getElementById('set-grid');
    const btnClear = document.getElementById('btn-clear-data');

    // Init Values
    selLang.value = getLang();
    
    // Load Theme
    const currentTheme = getStoredTheme();
    applyTheme(currentTheme);

    // Populate Theme Select
    Object.keys(THEMES).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.innerText = THEMES[key].name;
        if(key === currentTheme) opt.selected = true;
        selTheme.appendChild(opt);
    });

    // Events
    selLang.onchange = (e) => setLang(e.target.value);
    
    selTheme.onchange = (e) => {
        applyTheme(e.target.value);
    };

    selRes.onchange = (e) => {
        config.resolution = parseFloat(e.target.value);
        if(renderer) {
            renderer.setPixelRatio(window.devicePixelRatio * config.resolution);
            resizeEngine(renderer.domElement.parentElement, true);
        }
    };

    rngGrid.oninput = (e) => {
        const val = e.target.value;
        // Grid uses CSS variable now, but opacity tweak might need raw style access
        // Or update the --grid-line alpha channel dynamically.
        // For simplicity, let's update the DOM opacity of grid layer
        document.getElementById('grid-layer').style.opacity = val * 10; // scale 0.1 to 1
    };

    btnClear.onclick = () => {
        if(confirm("Reset all settings and clear local cache?")) {
            localStorage.clear();
            location.reload();
        }
    };

    // Open/Close
    btnOpen.onclick = () => modal.classList.remove('hidden');
    btnClose.onclick = () => modal.classList.add('hidden');
}