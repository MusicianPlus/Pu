import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { getIn } from '../helpers.js';
import { updateViz } from '../../ui/visualization.js';

const gltfLoader = new GLTFLoader();
const objLoader = new OBJLoader();

function updateGeoOutput(n, newGeo) {
    if(n.val.Geo) n.val.Geo.dispose();
    n.val.Geo = newGeo;
    updateViz(n, n.val.Geo);
}

export const GeoNodes = {
    'geo_file': {
        cat: 'geo', name: { tr:'3D Model', en:'3D Model' },
        desc: { tr:'3D Model Yükleyici (GLB/OBJ).', en:'Load 3D Models (GLB/OBJ).' },
        ports: { out:['Geo'] },
        params: { File:{type:'file', label:'Model'} },
        init: (n) => { 
            n.val.Geo = new THREE.BoxGeometry(1,1,1); 
            setTimeout(() => updateViz(n, n.val.Geo), 100);
        },
        logic: (n) => {
            if(n.data.needsUpdate && n.data.url) {
                if(n.data.ext === 'obj') {
                    objLoader.load(n.data.url, (root) => {
                        let foundGeo = null;
                        root.traverse(c => { if(!foundGeo && c.isMesh) foundGeo = c.geometry; });
                        if(foundGeo) updateGeoOutput(n, foundGeo.clone());
                    });
                } else {
                    gltfLoader.load(n.data.url, (gltf) => {
                        let foundGeo = null;
                        gltf.scene.traverse(c => { if(!foundGeo && c.isMesh) foundGeo = c.geometry; });
                        if(foundGeo) updateGeoOutput(n, foundGeo.clone());
                    });
                }
                n.data.needsUpdate = false;
            }
        }
    },
    'geo_noise': {
        cat: 'geo', name: { tr:'Gürültü Deformasyon', en:'Geo Noise' },
        desc: { tr:'Geometriyi gürültü ile bozar.', en:'Displaces vertices using noise.' },
        ports: { in:['Geo', 'Amount', 'Scale', 'Speed'], out:['Geo'] },
        params: { Amount:{v:0.5}, Scale:{v:1}, Speed:{v:1} },
        init: (n) => { n.val.Geo = null; },
        logic: (n, ctx) => {
            const inGeo = getIn(n, 'Geo');
            if(!inGeo) return;
            
            if(!n.data.outGeo || (n.data.baseUuid !== inGeo.uuid)) {
                if(n.data.outGeo) n.data.outGeo.dispose();
                n.data.outGeo = inGeo.clone();
                n.data.baseUuid = inGeo.uuid;
                n.val.Geo = n.data.outGeo;
            }
            
            const out = n.data.outGeo;
            const pos = out.attributes.position;
            const basePos = inGeo.attributes.position;
            
            const amt = getIn(n, 'Amount') || n.params.Amount.v;
            const scale = getIn(n, 'Scale') || n.params.Scale.v;
            const speed = getIn(n, 'Speed') || n.params.Speed.v;
            const time = ctx.time * speed;

            if(pos.count !== basePos.count) {
                n.data.outGeo.dispose();
                n.data.outGeo = inGeo.clone();
                n.val.Geo = n.data.outGeo;
                return;
            }

            for(let i=0; i<pos.count; i++) {
                const x = basePos.getX(i);
                const y = basePos.getY(i);
                const z = basePos.getZ(i);
                
                const nX = Math.sin(x * scale + time);
                const nY = Math.cos(y * scale + time * 0.8);
                const nZ = Math.sin(z * scale + time * 1.2);
                
                pos.setXYZ(i, x + nX*amt, y + nY*amt, z + nZ*amt);
            }
            if(pos) pos.needsUpdate = true;
            out.computeVertexNormals();
        }
    },
    'geo_box': {
        cat: 'geo', name: { tr:'Küp', en:'Box' },
        desc: { tr:'Küp geometrisi oluşturur.', en:'Generates box geometry.' },
        ports: { in:['Size', 'Segments'], out:['Geo'] },
        params: { Size:{v:1, min:0.1, max:10}, Segments:{v:1, min:1, max:10, step:1} },
        init: (n) => { n.val.Geo = new THREE.BoxGeometry(1,1,1); },
        logic: (n) => {
            const s = getIn(n, 'Size');
            const seg = Math.floor(getIn(n, 'Segments'));
            if(n.data.lastS !== s || n.data.lastSeg !== seg) {
                 updateGeoOutput(n, new THREE.BoxGeometry(s, s, s, seg, seg, seg));
                 n.data.lastS = s; n.data.lastSeg = seg;
            }
        }
    },
    'geo_sphere': {
        cat: 'geo', name: { tr:'Küre', en:'Sphere' },
        desc: { tr:'Küre geometrisi oluşturur.', en:'Generates sphere geometry.' },
        ports: { in:['Radius', 'Segments'], out:['Geo'] },
        params: { Radius:{v:1, min:0.1, max:5}, Segments:{v:16, min:3, max:64, step:1} },
        init: (n) => { n.val.Geo = new THREE.IcosahedronGeometry(1, 1); },
        logic: (n) => {
            const r = getIn(n, 'Radius');
            const s = Math.floor(getIn(n, 'Segments'));
            if(n.data.lastR !== r || n.data.lastS !== s) {
                 updateGeoOutput(n, new THREE.SphereGeometry(r, s, s));
                 n.data.lastR = r; n.data.lastS = s;
            }
        }
    },
    'geo_torus': {
        cat: 'geo', name: { tr:'Simit', en:'Torus' },
        desc: { tr:'Simit geometrisi oluşturur.', en:'Generates torus geometry.' },
        ports: { in:['Radius', 'Tube', 'Segments', 'TubularSegments'], out:['Geo'] },
        params: { Radius:{v:0.6}, Tube:{v:0.2}, Segments:{v:32, min:3, max:64, step:1}, TubularSegments:{v:16, min:3, max:64, step:1} },
        init: (n) => { n.val.Geo = new THREE.TorusGeometry(0.6, 0.2, 16, 32); },
        logic: (n) => {
            const r1 = getIn(n, 'Radius');
            const r2 = getIn(n, 'Tube');
            const seg = Math.floor(getIn(n, 'Segments')); // Radial
            const tub = Math.floor(getIn(n, 'TubularSegments') || n.params.TubularSegments.v);
            
            if(n.data.lastR1 !== r1 || n.data.lastR2 !== r2 || n.data.lastSeg !== seg || n.data.lastTub !== tub) {
                 updateGeoOutput(n, new THREE.TorusGeometry(r1, r2, seg, tub));
                 n.data.lastR1 = r1; n.data.lastR2 = r2; n.data.lastSeg = seg; n.data.lastTub = tub;
            }
        }
    },
    'geo_plane': {
        cat: 'geo', name: { tr:'Düzlem', en:'Plane' },
        desc: { tr:'2D Düzlem geometrisi.', en:'2D Plane geometry.' },
        ports: { in:['Width', 'Height', 'Segments'], out:['Geo'] },
        params: { Width:{v:1, min:0.1, max:10}, Height:{v:1, min:0.1, max:10}, Segments:{v:1, min:1, max:50, step:1} },
        init: (n) => { n.val.Geo = new THREE.PlaneGeometry(1,1); },
        logic: (n) => {
            const w = getIn(n, 'Width');
            const h = getIn(n, 'Height');
            const s = Math.floor(getIn(n, 'Segments'));
            if(n.data.lastW !== w || n.data.lastH !== h || n.data.lastS !== s) {
                updateGeoOutput(n, new THREE.PlaneGeometry(w, h, s, s));
                n.data.lastW = w; n.data.lastH = h; n.data.lastS = s;
            }
        }
    }
};