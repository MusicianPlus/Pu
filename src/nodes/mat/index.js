import * as THREE from 'three';
import { getIn } from '../helpers.js';

export const MatNodes = {
    'mat_standard': {
        cat: 'mat', name: { tr:'PBR Materyal', en:'Standard Mat' },
        desc: { tr:'Fiziksel tabanlı materyal.', en:'Physically Based Rendering material.' },
        ports: { in:['Map', 'R', 'G', 'B', 'Metalness', 'Roughness'], out:['Mat'] },
        params: { R:{v:1}, G:{v:1}, B:{v:1}, Metalness:{v:0.2}, Roughness:{v:0.5} },
        init: (n) => { n.val.Mat = new THREE.MeshStandardMaterial({color:0xffffff, side:THREE.DoubleSide}); },
        logic: (n) => {
            n.val.Mat.color.setRGB(getIn(n,'R'), getIn(n,'G'), getIn(n,'B'));
            n.val.Mat.metalness = getIn(n,'Metalness');
            n.val.Mat.roughness = getIn(n,'Roughness');
            
            // Texture Handling
            const map = getIn(n, 'Map');
            if(map && map.isTexture && n.val.Mat.map !== map) {
                n.val.Mat.map = map;
                n.val.Mat.needsUpdate = true;
            } else if (!map && n.val.Mat.map) {
                n.val.Mat.map = null;
                n.val.Mat.needsUpdate = true;
            }
        }
    },
    'mat_basic': {
        cat: 'mat', name: { tr:'Temel Materyal', en:'Basic Mat' },
        desc: { tr:'Düz, ışıksız renk.', en:'Unlit, flat color material.' },
        ports: { in:['Map', 'R', 'G', 'B'], out:['Mat'] },
        params: { R:{v:1}, G:{v:1}, B:{v:1} },
        init: (n) => { n.val.Mat = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide}); },
        logic: (n) => {
            n.val.Mat.color.setRGB(getIn(n,'R'), getIn(n,'G'), getIn(n,'B'));
             
            const map = getIn(n, 'Map');
            if(map && map.isTexture && n.val.Mat.map !== map) {
                n.val.Mat.map = map;
                n.val.Mat.needsUpdate = true;
            } else if (!map && n.val.Mat.map) {
                n.val.Mat.map = null;
                n.val.Mat.needsUpdate = true;
            }
        }
    },
    'mat_wire': {
        cat: 'mat', name: { tr:'Tel Kafes', en:'Wireframe' },
        desc: { tr:'Sadece kenar çizgilerini gösterir.', en:'Renders edges only.' },
        ports: { in:['R', 'G', 'B'], out:['Mat'] },
        params: { R:{v:0}, G:{v:1}, B:{v:0} },
        init: (n) => { n.val.Mat = new THREE.MeshBasicMaterial({color:0x00ff00, wireframe:true, side:THREE.DoubleSide}); },
        logic: (n) => {
            n.val.Mat.color.setRGB(getIn(n,'R'), getIn(n,'G'), getIn(n,'B'));
        }
    }
};