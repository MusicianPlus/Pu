// Localization
// Get stored lang or detect
let currentLang = localStorage.getItem('pu_lang') || (navigator.language.startsWith('tr') ? 'tr' : 'en');

export const TEXTS = {
    tr: {
        tabs: { nodes: 'ARAÇLAR', tpls: 'ŞABLONLAR' },
        props: 'ÖZELLİKLER',
        render: 'CANLI RENDER',
        hint: 'Düzenlemek için bir düğüme tıkla.<br><br>Bağlantıyı koparmak için kablo ucunu sağ tıklayın veya boşluğa sürükleyin.',
        reset: 'SAHNEYİ SİL',
        file: 'DOSYA SEÇ',
        save: 'KAYDET (JSON)',
        load: 'YÜKLE (JSON)'
    },
    en: {
        tabs: { nodes: 'TOOLS', tpls: 'TEMPLATES' },
        props: 'PROPERTIES',
        render: 'LIVE RENDER',
        hint: 'Click a node to edit.<br><br>Right-click a socket or drag cable end to disconnect.',
        reset: 'CLEAR SCENE',
        file: 'SELECT FILE',
        save: 'SAVE PROJECT',
        load: 'LOAD PROJECT'
    }
};

export function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('pu_lang', lang);
    location.reload(); // Reload to apply changes everywhere easily
}

export function getLang() { return currentLang; }

export function t(key) {
    if (typeof key === 'string') return key;
    return key[currentLang] || key['en'];
}

export function sysT(path) {
    const keys = path.split('.');
    let obj = TEXTS[currentLang];
    for(let k of keys) obj = obj[k];
    return obj;
}

// Math Helpers
export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
export const mapRange = (v, inMin, inMax, outMin, outMax) => {
    return outMin + (outMax - outMin) * (v - inMin) / (inMax - inMin);
};

// Topological Sort for Nodes
export function sortNodes(nodes, cables) {
    // Kahn's Algorithm
    const sorted = [];
    const inDegree = new Map();
    const adj = new Map();

    // Init graph
    nodes.forEach(n => {
        inDegree.set(n.id, 0);
        adj.set(n.id, []);
    });

    // Build edges
    cables.forEach(c => {
        // c.from -> c.to
        if (adj.has(c.from) && inDegree.has(c.to)) {
            adj.get(c.from).push(c.to);
            inDegree.set(c.to, inDegree.get(c.to) + 1);
        }
    });

    // Find 0 in-degree nodes
    const queue = [];
    inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
    });

    // Sort
    // While queue not empty
    while (queue.length > 0) {
        // 1. Sort queue by ID or position to be deterministic?
        // For now just shift.
        const uId = queue.shift();
        const uNode = nodes.find(n => n.id === uId);
        if (uNode) sorted.push(uNode);

        const neighbors = adj.get(uId);
        if (neighbors) {
            neighbors.forEach(vId => {
                const d = inDegree.get(vId) - 1;
                inDegree.set(vId, d);
                if (d === 0) queue.push(vId);
            });
        }
    }

    // Check for cycles or disconnected parts
    // If sorted.length != nodes.length, we have cycles or skipped nodes.
    // In case of cycles, we should append the remaining nodes (naive fallback)
    if (sorted.length !== nodes.length) {
        // Append missing nodes (so they still run, even if laggy)
        nodes.forEach(n => {
            if (!sorted.includes(n)) sorted.push(n);
        });
    }

    return sorted;
}
