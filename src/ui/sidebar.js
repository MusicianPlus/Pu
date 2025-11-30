import { NODES, getIcon } from '../nodes/registry.js';
import { t, sysT } from '../core/utils.js';
import { addNode, resetScene, drawCables } from './canvas.js';
import { graph } from '../core/state.js';

export function initSidebar() {
    // Texts & Buttons
    document.getElementById('btn-tab-nodes').innerText = sysT('tabs.nodes');
    document.getElementById('btn-tab-templates').innerText = sysT('tabs.tpls');
    document.getElementById('lbl-props').innerText = sysT('props');
    document.getElementById('lbl-render').innerText = sysT('render');
    document.getElementById('lbl-select-hint').innerHTML = sysT('hint');
    document.getElementById('btn-save').innerText = sysT('save');
    document.getElementById('btn-load').innerText = sysT('load');
    document.getElementById('btn-reset').innerText = sysT('reset');

    // Tabs
    const tabNodes = document.getElementById('btn-tab-nodes');
    const tabTpls = document.getElementById('btn-tab-templates');
    const pnlNodes = document.getElementById('lib-nodes');
    const pnlTpls = document.getElementById('lib-templates');

    tabNodes.onclick = () => {
        tabNodes.classList.add('active'); tabTpls.classList.remove('active');
        pnlNodes.classList.remove('hidden'); pnlTpls.classList.add('hidden');
    };
    tabTpls.onclick = () => {
        tabTpls.classList.add('active'); tabNodes.classList.remove('active');
        pnlTpls.classList.remove('hidden'); pnlNodes.classList.add('hidden');
    };

    // --- BUILD LIBRARY ---
    const container = document.getElementById('node-list-container');
    const searchInput = document.getElementById('node-search');
    
    const cats = {
        sig: { label: 'DATA (Signals)', items: [] },
        math: { label: 'MATH (Logic)', items: [] },
        obj: { label: 'SCENE (Objects)', items: [] },
        geo: { label: 'SHAPE (Geometry)', items: [] },
        mat: { label: 'LOOK (Materials)', items: [] },
        tex: { label: 'IMAGE (Textures)', items: [] },
        snd: { label: 'AUDIO (Sound)', items: [] },
        fx: { label: 'EFFECTS (Post)', items: [] }
    };

    Object.entries(NODES).forEach(([type, def]) => {
        if(cats[def.cat]) cats[def.cat].items.push({ type, def });
    });

    function renderLibrary(filter = '') {
        container.innerHTML = '';
        const f = filter.toLowerCase();

        Object.entries(cats).forEach(([catKey, catData]) => {
            const visibleItems = catData.items.filter(i => 
                t(i.def.name).toLowerCase().includes(f) || catKey.includes(f)
            );

            if(visibleItems.length > 0) {
                const header = document.createElement('div');
                header.className = 'lib-cat-header';
                header.innerHTML = `<span>${catData.label}</span><i class="fas fa-chevron-down"></i>`;
                
                const grid = document.createElement('div');
                grid.className = 'lib-grid';

                header.onclick = () => {
                    grid.classList.toggle('hidden');
                    header.classList.toggle('collapsed');
                };

                visibleItems.forEach(item => {
                    const el = document.createElement('div');
                    el.className = `lib-item ${catKey}`;
                    el.onclick = () => addNode(item.type);
                    el.innerHTML = `<i class="fas ${getIcon(item.type)}"></i><span>${t(item.def.name)}</span>`;
                    grid.appendChild(el);
                });

                container.appendChild(header);
                container.appendChild(grid);
            }
        });
    }

    renderLibrary();
    searchInput.oninput = (e) => renderLibrary(e.target.value);

    // --- TEMPLATES SHOWCASE ---
    const tplList = document.getElementById('template-list');
    
    // 8 Complex Templates
    const TEMPLATES = {
        'neon_city': {
            name: {tr:'Neon Şehir', en:'Neon City'},
            desc: {tr:'Parlayan gökdelenler.', en:'Glowing procedural skyscrapers.'},
            data: {
                n:[
                    {t:'sig_grid_pos', x:-400, y:0, p:{Rows:15, Cols:15, Space:1.2}}, // 1
                    {t:'sig_random_array', x:-400, y:150, p:{Count:225, Min:0.5, Max:4, Seed:1}}, // 2 (Height)
                    {t:'sig_random_array', x:-400, y:300, p:{Count:225, Min:0, Max:1, Seed:2}}, // 3 (Color Mix)
                    {t:'geo_box', x:-200, y:-100, p:{Size:1, Segments:1}}, // 4
                    {t:'mat_standard', x:-200, y:-250, p:{R:0.1, G:0.1, B:0.2, Metalness:0.8, Roughness:0.2}}, // 5
                    {t:'obj_instancer', x:50, y:0, p:{Count:225}}, // 6
                    {t:'fx_bloom', x:250, y:0, p:{Strength:2.5, Radius:0.6}}, // 7
                    {t:'obj_light_point', x:50, y:-200, p:{Intensity:2, Y:5}}, // 8
                    {t:'sig_lfo', x:-200, y:400, p:{Frequency:0.2, Amplitude:0.2}}, // 9 (Slight movement)
                    {t:'math_op', x:0, y:200, p:{Op:0}}, // 10 (Add Height + LFO)
                    {t:'obj_cam', x:50, y:200, p:{PosX:15, PosY:10, PosZ:15, LookY:0}} // 11
                ],
                c:[
                    {f:1,p1:'Arr',t:6,p2:'PosArr'},
                    {f:4,p1:'Geo',t:6,p2:'Geo'}, {f:5,p1:'Mat',t:6,p2:'Mat'},
                    {f:2,p1:'Arr',t:6,p2:'ScaleArr'},
                    {f:3,p1:'Arr',t:6,p2:'ColorArr'}
                ]
            }
        },
        'audio_tunnel': {
            name: {tr:'Ses Tüneli', en:'Audio Tunnel'},
            desc: {tr:'Sese tepki veren halka tüneli.', en:'Music reactive torus tunnel.'},
            data: {
                n:[
                    {t:'snd_player', x:-500, y:-50, p:{Play:1}}, // 1
                    {t:'snd_analyze', x:-350, y:-50}, // 2
                    {t:'snd_output', x:-350, y:50}, // 3
                    {t:'sig_grid_pos', x:-500, y:150, p:{Rows:40, Cols:1, Space:0.5}}, // 4 (Line)
                    {t:'math_map', x:-200, y:-50, p:{InMin:0, InMax:1, OutMin:0.5, OutMax:2}}, // 5
                    {t:'geo_torus', x:-200, y:150, p:{Radius:1, Tube:0.05, Segments:32}}, // 6
                    {t:'mat_wire', x:-200, y:250, p:{R:0, G:1, B:1}}, // 7
                    {t:'obj_instancer', x:50, y:0, p:{Count:40}}, // 8
                    {t:'fx_bloom', x:200, y:0, p:{Strength:3}}, // 9
                    {t:'sig_lfo', x:-200, y:-200, p:{Frequency:0.2}}, // 10 (Cam Move)
                    {t:'obj_cam', x:200, y:200, p:{PosZ:0, PosX:0, PosY:0, LookZ:-10}} // 11
                ],
                c:[
                    {f:1,p1:'Stream',t:2,p2:'Stream'}, {f:1,p1:'Stream',t:3,p2:'Stream'},
                    {f:2,p1:'Bass',t:5,p2:'In'},
                    {f:5,p1:'Out',t:8,p2:'ScaleArr'}, // Bass -> Scale
                    {f:4,p1:'Arr',t:8,p2:'PosArr'},
                    {f:6,p1:'Geo',t:8,p2:'Geo'}, {f:7,p1:'Mat',t:8,p2:'Mat'}
                ]
            }
        },
        'liquid_metal': {
            name: {tr:'Sıvı Metal', en:'Liquid Metal'},
            desc: {tr:'Dalgalanan krom küre.', en:'Chrome sphere with noise displacement.'},
            data: {
                n:[
                    {t:'geo_sphere', x:-300, y:0, p:{Radius:2, Segments:128}}, // 1
                    {t:'geo_noise', x:-100, y:0, p:{Scale:1.5, Speed:0.5, Amount:0.3}}, // 2
                    {t:'mat_standard', x:-100, y:-150, p:{R:1, G:1, B:1, Metalness:1, Roughness:0}}, // 3
                    {t:'obj_background', x:-100, y:150, p:{R:0.05, G:0.05, B:0.1}}, // 4
                    {t:'obj_mesh', x:150, y:0}, // 5
                    {t:'obj_light_dir', x:150, y:-150, p:{Intensity:2, Y:5, X:5}}, // 6
                    {t:'fx_rgb', x:350, y:0, p:{Amount:0.005}} // 7
                ],
                c:[
                    {f:1,p1:'Geo',t:2,p2:'Geo'},
                    {f:2,p1:'Geo',t:5,p2:'Geo'},
                    {f:3,p1:'Mat',t:5,p2:'Mat'}
                ]
            }
        },
        'kaleido_mandala': {
            name: {tr:'Mandala', en:'Mandala'},
            desc: {tr:'Kaleydoskopik desenler.', en:'Kaleidoscopic patterns.'},
            data: {
                n:[
                    {t:'tex_file', x:-400, y:0}, // 1
                    {t:'tex_transform', x:-200, y:0}, // 2
                    {t:'sig_lfo', x:-400, y:150, p:{Frequency:0.1, Amplitude:3.14}}, // 3
                    {t:'mat_basic', x:0, y:0}, // 4
                    {t:'geo_box', x:0, y:-150, p:{Size:10}}, // 5
                    {t:'obj_mesh', x:200, y:0}, // 6
                    {t:'fx_kaleido', x:400, y:0, p:{Sides:12, Angle:0}}, // 7
                    {t:'sig_lfo', x:200, y:150, p:{Frequency:0.05}} // 8 (Kaleido Angle)
                ],
                c:[
                    {f:1,p1:'Tex',t:2,p2:'In'},
                    {f:3,p1:'Val',t:2,p2:'Rotation'},
                    {f:2,p1:'Tex',t:4,p2:'Map'},
                    {f:5,p1:'Geo',t:6,p2:'Geo'}, {f:4,p1:'Mat',t:6,p2:'Mat'},
                    {f:8,p1:'Val',t:7,p2:'Angle'}
                ]
            }
        },
        'particle_galaxy': {
            name: {tr:'Galaksi', en:'Galaxy'},
            desc: {tr:'Dönen parçacık bulutu.', en:'Swirling particle cloud.'},
            data: {
                n:[
                    {t:'sig_random_array', x:-400, y:0, p:{Count:2000, Min:-5, Max:5, Seed:1}}, // 1 (Pos)
                    {t:'sig_color_gradient', x:-400, y:150, p:{Count:2000, R:0.5, G:0, B:1, Frequency:0.05}}, // 2
                    {t:'geo_sphere', x:-200, y:-100, p:{Radius:0.05, Segments:4}}, // 3
                    {t:'mat_basic', x:-200, y:-200}, // 4
                    {t:'obj_instancer', x:50, y:0, p:{Count:2000}}, // 5
                    {t:'sig_lfo', x:-200, y:150, p:{Frequency:0.2, Amplitude:3}}, // 6
                    {t:'fx_bloom', x:250, y:0, p:{Strength:2, Radius:0.5}} // 7
                ],
                c:[
                    {f:1,p1:'Arr',t:5,p2:'PosArr'},
                    {f:2,p1:'ColArr',t:5,p2:'ColorArr'},
                    {f:3,p1:'Geo',t:5,p2:'Geo'}, {f:4,p1:'Mat',t:5,p2:'Mat'},
                    {f:6,p1:'Val',t:5,p2:'RotY'} // Rotate whole system
                ]
            }
        },
        'cyber_heart': {
            name: {tr:'Siber Kalp', en:'Cyber Heart'},
            desc: {tr:'Atan tel kafes kalp.', en:'Beating wireframe heart.'},
            data: {
                n:[
                    {t:'geo_sphere', x:-300, y:0, p:{Radius:1.5, Segments:32}}, // 1
                    {t:'sig_beat', x:-300, y:150, p:{BPM:60}}, // 2
                    {t:'math_map', x:-150, y:150, p:{InMin:0, InMax:1, OutMin:1, OutMax:1.2}}, // 3
                    {t:'mat_wire', x:-150, y:-150, p:{R:1, G:0, B:0.3}}, // 4
                    {t:'obj_mesh', x:100, y:0}, // 5
                    {t:'obj_light_point', x:100, y:-150, p:{Intensity:5, R:1, G:0, B:0}}, // 6
                    {t:'fx_bloom', x:300, y:0, p:{Strength:3}} // 7
                ],
                c:[
                    {f:1,p1:'Geo',t:5,p2:'Geo'}, {f:4,p1:'Mat',t:5,p2:'Mat'},
                    {f:2,p1:'Pulse',t:3,p2:'In'},
                    {f:3,p1:'Out',t:5,p2:'Scale'}
                ]
            }
        },
        'glitch_monolith': {
            name: {tr:'Glitch Monolit', en:'Glitch Monolith'},
            desc: {tr:'Bozuk veri anıtı.', en:'Corrupted data monument.'},
            data: {
                n:[
                    {t:'geo_box', x:-300, y:0, p:{Size:2, Segments:10}}, // 1
                    {t:'geo_noise', x:-150, y:0, p:{Amount:0.2, Speed:10}}, // 2
                    {t:'mat_standard', x:-150, y:-150, p:{R:0.1, G:0.1, B:0.1, Roughness:0.1}}, // 3
                    {t:'obj_mesh', x:50, y:0, p:{RotY:0.7}}, // 4
                    {t:'fx_rgb', x:250, y:0, p:{Amount:0.05}}, // 5
                    {t:'fx_bloom', x:250, y:150, p:{Strength:1}}, // 6
                    {t:'obj_light_dir', x:50, y:-200, p:{Intensity:5, X:-5}} // 7
                ],
                c:[
                    {f:1,p1:'Geo',t:2,p2:'Geo'},
                    {f:2,p1:'Geo',t:4,p2:'Geo'}, {f:3,p1:'Mat',t:4,p2:'Mat'}
                ]
            }
        },
        'solar_orbit': {
            name: {tr:'Yörünge', en:'Solar Orbit'},
            desc: {tr:'Gezegen yörüngesi.', en:'Planetary orbit simulation.'},
            data: {
                n:[
                    {t:'geo_sphere', x:-300, y:-200, p:{Radius:1}}, // 1 Sun
                    {t:'mat_basic', x:-300, y:-300, p:{R:1, G:0.6, B:0.1}}, // 2
                    {t:'obj_mesh', x:-100, y:-250}, // 3
                    {t:'obj_light_point', x:-100, y:-150, p:{Intensity:10}}, // 4
                    
                    {t:'sig_lfo', x:-300, y:0, p:{Frequency:0.5, Type:0, Offset:0}}, // 5 Sin
                    {t:'sig_lfo', x:-300, y:150, p:{Frequency:0.5, Type:0, Phase:1.57}}, // 6 Cos
                    
                    {t:'math_map', x:-100, y:0, p:{InMin:-1, InMax:1, OutMin:-4, OutMax:4}}, // 7
                    {t:'math_map', x:-100, y:150, p:{InMin:-1, InMax:1, OutMin:-4, OutMax:4}}, // 8
                    
                    {t:'geo_sphere', x:150, y:-200, p:{Radius:0.3}}, // 9 Planet
                    {t:'mat_standard', x:150, y:-300, p:{R:0, G:0.4, B:1}}, // 10
                    {t:'obj_mesh', x:200, y:0} // 11
                ],
                c:[
                    {f:1,p1:'Geo',t:3,p2:'Geo'}, {f:2,p1:'Mat',t:3,p2:'Mat'},
                    {f:5,p1:'Val',t:7,p2:'In'}, {f:6,p1:'Val',t:8,p2:'In'},
                    {f:7,p1:'Out',t:11,p2:'PosX'}, {f:8,p1:'Out',t:11,p2:'PosZ'},
                    {f:9,p1:'Geo',t:11,p2:'Geo'}, {f:10,p1:'Mat',t:11,p2:'Mat'}
                ]
            }
        }
    };

    Object.entries(TEMPLATES).forEach(([key, def]) => {
        const el = document.createElement('div');
        el.className = "p-4 mb-2 rounded cursor-pointer group transition-all duration-200 border";
        el.style.backgroundColor = "var(--bg-input)";
        el.style.borderColor = "var(--border)";
        el.style.borderLeft = "4px solid var(--border)";
        
        el.onmouseenter = () => { 
            el.style.borderColor = "var(--text-main)"; 
            el.style.borderLeftColor = "var(--c-sig)"; 
            el.style.backgroundColor = "var(--bg-panel)"; 
        };
        el.onmouseleave = () => { 
            el.style.borderColor = "var(--border)";
            el.style.borderLeftColor = "var(--border)";
            el.style.backgroundColor = "var(--bg-input)";
        };
        
        el.onclick = () => loadTemplate(def.data);
        
        el.innerHTML = `
            <div class="text-xs font-bold mb-1 transition-colors" style="color: var(--text-main)">${t(def.name)}</div>
            <div class="text-[10px] leading-tight" style="color: var(--text-dim)">${t(def.desc)}</div>
        `;
        tplList.appendChild(el);
    });

    // Actions
    document.getElementById('btn-reset').onclick = resetScene;
    document.getElementById('btn-save').onclick = saveScene;
    document.getElementById('btn-load').onclick = loadScene;
}

export function loadTemplate(tplDef) {
    resetScene();
    const map = {};
    tplDef.n.forEach((o,i) => {
        const n = addNode(o.t, o.x, o.y);
        if(o.p) Object.keys(o.p).forEach(pk => { if(n.params[pk]) n.params[pk].v = o.p[pk]; });
        map[i+1] = n.id;
    });
    setTimeout(() => {
        if(tplDef.c) tplDef.c.forEach(co => graph.cables.push({from:map[co.f], fromPort:co.p1, to:map[co.t], toPort:co.p2}));
        drawCables();
    }, 100);
}

function saveScene() {
    const data = {
        nodes: graph.nodes.map(n => ({
            id: n.id, type: n.type, x: n.x, y: n.y, 
            params: Object.keys(n.params).reduce((acc, k) => { acc[k] = {v: n.params[k].v}; return acc; }, {})
        })),
        cables: graph.cables
    };
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'project.json'; a.click();
}

function loadScene() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                resetScene();
                const idMap = {};
                data.nodes.forEach(n => {
                    const newNode = addNode(n.type, n.x, n.y);
                    if (newNode) {
                        idMap[n.id] = newNode.id;
                        if (n.params) Object.keys(n.params).forEach(k => { if (newNode.params[k]) newNode.params[k].v = n.params[k].v; });
                    }
                });
                setTimeout(() => {
                    data.cables.forEach(c => {
                        if (idMap[c.from] && idMap[c.to]) graph.cables.push({ from: idMap[c.from], fromPort: c.fromPort, to: idMap[c.to], toPort: c.toPort });
                    });
                    drawCables();
                }, 50);
            } catch(err) { console.error(err); alert("Error loading JSON"); }
        };
        reader.readAsText(file);
    };
    input.click();
}