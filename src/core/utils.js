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