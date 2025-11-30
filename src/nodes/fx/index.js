import { getIn } from '../helpers.js';
import { passes, composer } from '../../core/engine.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const KaleidoShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'sides': { value: 6.0 },
        'angle': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float sides;
        uniform float angle;
        varying vec2 vUv;
        void main() {
            vec2 p = vUv - 0.5;
            float r = length(p);
            float a = atan(p.y, p.x) + angle;
            float tau = 6.28318530718;
            a = mod(a, tau/sides);
            a = abs(a - tau/sides/2.0);
            p = r * vec2(cos(a), sin(a));
            gl_FragColor = texture2D(tDiffuse, p + 0.5);
        }`
};

export const FxNodes = {
    'fx_kaleido': {
        cat: 'fx', name: { tr:'Kaleydoskop', en:'Kaleidoscope' },
        desc: { tr:'Görüntü çoklama efekti.', en:'Fractal mirror effect.' },
        ports: { in:['Sides', 'Angle'] },
        params: { Sides:{v:6, min:2, max:20, step:1}, Angle:{v:0} },
        init: (n) => {
            if(!passes.kaleido) {
                const pass = new ShaderPass(KaleidoShader);
                pass.enabled = false;
                composer.addPass(pass); // Adds to end
                passes.kaleido = pass;
            }
        },
        logic: (n) => {
            const p = passes.kaleido;
            if(!p) return;
            
            // Enable ONLY if this node exists (Naive single instance logic)
            p.enabled = true;
            p.uniforms['sides'].value = getIn(n, 'Sides') || n.params.Sides.v;
            p.uniforms['angle'].value = getIn(n, 'Angle') || n.params.Angle.v;
        }
    },
    'fx_bloom': {
        cat: 'fx', name: { tr:'Işıma', en:'Bloom' },
        desc: { tr:'Parlak alanları ışıldatır.', en:'Glow effect for bright areas.' },
        ports: { in:['Strength', 'Radius'] },
        params: { Strength:{v:1.5, min:0, max:5}, Radius:{v:0.4} },
        logic: (n) => {
            if(passes.bloom) {
                passes.bloom.strength = getIn(n,'Strength');
                passes.bloom.radius = n.params.Radius.v;
            }
        }
    },
    'fx_rgb': {
        cat: 'fx', name: { tr:'Renk Kayması', en:'RGB Shift' },
        desc: { tr:'Kromatik sapma efekti.', en:'Chromatic aberration.' },
        ports: { in:['Amount'] },
        params: { Amount:{v:0.005, min:0, max:0.1} },
        logic: (n) => { if(passes.rgb) passes.rgb.uniforms['amount'].value = getIn(n,'Amount'); }
    }
};
