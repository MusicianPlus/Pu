export const THEMES = {
    'default': {
        name: 'Dark Pro (Default)',
        colors: {
            '--bg-app': '#050505',
            '--bg-panel': '#111111',
            '--bg-node': 'rgba(18, 18, 18, 0.95)',
            '--bg-input': '#000000',
            '--border': '#333333',
            '--text-main': '#eeeeee',
            '--text-dim': '#999999',
            '--grid-line': 'rgba(255,255,255,0.04)',
            // Categories
            '--c-sig': '#eab308',
            '--c-math': '#22c55e',
            '--c-geo': '#3b82f6',
            '--c-mat': '#f97316',
            '--c-obj': '#ef4444',
            '--c-tex': '#9ca3af',
            '--c-snd': '#ec4899',
            '--c-fx': '#d946ef'
        }
    },
    'midnight': {
        name: 'Midnight Blue',
        colors: {
            '--bg-app': '#0f172a',
            '--bg-panel': '#1e293b',
            '--bg-node': 'rgba(30, 41, 59, 0.95)',
            '--bg-input': '#0f172a',
            '--border': '#334155',
            '--text-main': '#e2e8f0',
            '--text-dim': '#94a3b8',
            '--grid-line': 'rgba(148, 163, 184, 0.05)',
            // Pastel Tones
            '--c-sig': '#fbbf24',
            '--c-math': '#4ade80',
            '--c-geo': '#60a5fa',
            '--c-mat': '#fb923c',
            '--c-obj': '#f87171',
            '--c-tex': '#cbd5e1',
            '--c-snd': '#f472b6',
            '--c-fx': '#e879f9'
        }
    },
    'cyberpunk': {
        name: 'Cyberpunk',
        colors: {
            '--bg-app': '#000000',
            '--bg-panel': '#050505',
            '--bg-node': 'rgba(0, 0, 0, 0.9)',
            '--bg-input': '#1a1a1a',
            '--border': '#333', // Neon borders handled via overrides maybe?
            '--text-main': '#00ff00', // Hacker green
            '--text-dim': '#008800',
            '--grid-line': 'rgba(0, 255, 0, 0.1)',
            // Neon Tones
            '--c-sig': '#ffff00',
            '--c-math': '#00ff00',
            '--c-geo': '#00ffff',
            '--c-mat': '#ff8800',
            '--c-obj': '#ff0000',
            '--c-tex': '#888888',
            '--c-snd': '#ff00ff',
            '--c-fx': '#aa00ff'
        }
    },
    'paper': {
        name: 'Blueprint (Light)',
        colors: {
            '--bg-app': '#e0e0e0',
            '--bg-panel': '#f5f5f5',
            '--bg-node': 'rgba(255, 255, 255, 0.95)',
            '--bg-input': '#ffffff',
            '--border': '#cccccc',
            '--text-main': '#222222',
            '--text-dim': '#666666',
            '--grid-line': 'rgba(0,0,0,0.05)',
            // Darker Tones for contrast
            '--c-sig': '#d97706',
            '--c-math': '#16a34a',
            '--c-geo': '#2563eb',
            '--c-mat': '#ea580c',
            '--c-obj': '#dc2626',
            '--c-tex': '#64748b',
            '--c-snd': '#db2777',
            '--c-fx': '#c026d3'
        }
    }
};

export function applyTheme(key) {
    const theme = THEMES[key] || THEMES['default'];
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([k, v]) => {
        root.style.setProperty(k, v);
    });
    localStorage.setItem('pu_theme', key);
}

export function getStoredTheme() {
    return localStorage.getItem('pu_theme') || 'default';
}
