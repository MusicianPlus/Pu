import * as THREE from 'three';
import { getIn } from '../helpers.js';
import { updateViz } from '../../ui/visualization.js';

const loader = new THREE.TextureLoader();

export const TexNodes = {
    'tex_file': {
        cat: 'tex', name: { tr:'Resim Dosyası', en:'Image File' },
        desc: { tr:'Resim dosyası (JPG/PNG).', en:'Image texture loader.' },
        ports: { out:['Tex'] },
        params: { File:{type:'file', label:'Image'} },
        init: (n) => {
            // Default placeholder texture (Checkerboard)
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ccc'; ctx.fillRect(0,0,64,64);
            ctx.fillStyle = '#888'; ctx.fillRect(0,0,32,32); ctx.fillRect(32,32,32,32);
            n.val.Tex = new THREE.CanvasTexture(canvas);
            n.val.Tex.magFilter = THREE.NearestFilter; 
            // Initial viz update needs delay for DOM
            setTimeout(() => updateViz(n, n.val.Tex), 100);
        },
        logic: (n) => {
            if(n.data.needsUpdate && n.data.url) {
                loader.load(n.data.url, (tex) => {
                    if(n.val.Tex) n.val.Tex.dispose();
                    n.val.Tex = tex;
                    n.val.Tex.colorSpace = THREE.SRGBColorSpace;
                    updateViz(n, n.val.Tex);
                });
                n.data.needsUpdate = false;
            }
        }
    },
    'tex_transform': {
        cat: 'tex', name: { tr:'Doku Dönüştür', en:'Transform Tex' },
        desc: { tr:'Doku pozisyonunu değiştir.', en:'Offset/Repeat texture.' },
        ports: { in:['In', 'OffsetX', 'OffsetY', 'RepeatX', 'RepeatY', 'Rotation'], out:['Tex'] },
        params: { OffsetX:{v:0}, OffsetY:{v:0}, RepeatX:{v:1}, RepeatY:{v:1}, Rotation:{v:0} },
        init: (n) => { n.val.Tex = null; },
        logic: (n) => {
            const inTex = getIn(n, 'In');
            if(inTex && inTex.isTexture) {
                // Clone allows different transforms on same base texture
                // We check if the SOURCE texture uuid matches our last known source
                if(!n.val.Tex || n.data.sourceUuid !== inTex.uuid) {
                     if(n.val.Tex) n.val.Tex.dispose();
                     n.val.Tex = inTex.clone(); 
                     n.data.sourceUuid = inTex.uuid;
                     updateViz(n, n.val.Tex);
                }
                
                const t = n.val.Tex;
                t.offset.set(
                    getIn(n,'OffsetX')||n.params.OffsetX.v,
                    getIn(n,'OffsetY')||n.params.OffsetY.v
                );
                t.repeat.set(
                    getIn(n,'RepeatX')||n.params.RepeatX.v,
                    getIn(n,'RepeatY')||n.params.RepeatY.v
                );
                t.rotation = getIn(n,'Rotation')||n.params.Rotation.v;
                t.needsUpdate = true;
            } else if (n.val.Tex) {
                // Input disconnected? Clear?
                // For now keep last or clear.
            }
        }
    }
};