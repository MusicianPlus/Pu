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
    'fx_after': {
        cat: 'fx', name: { tr:'İz Bırakma', en:'Trails' },
        desc: { tr:'Hareket izi bırakır.', en:'Afterimage / Trails effect.' },
        ports: { in:['Damp'] },
        params: { Damp:{v:0.8, min:0, max:0.99} },
        logic: (n) => {
            if(passes.after) passes.after.uniforms['damp'].value = getIn(n, 'Damp') || n.params.Damp.v;
        }
    },
    'fx_rgb': {
        cat: 'fx', name: { tr:'Renk Kayması', en:'RGB Shift' },
        desc: { tr:'Kromatik sapma efekti.', en:'Chromatic aberration.' },
        ports: { in:['Amount'] },
        params: { Amount:{v:0.005, min:0, max:0.1} },
        logic: (n) => { if(passes.rgb) passes.rgb.uniforms['amount'].value = getIn(n,'Amount'); }
    },
    'fx_film': {
        cat: 'fx', name: { tr:'Film Efekti', en:'Film Grain' },
        desc: { tr:'Gren ve tarama çizgileri.', en:'Noise and scanlines.' },
        ports: { in:['Noise', 'Lines'] },
        params: { Noise:{v:0.5, min:0, max:2}, Lines:{v:0.5, min:0, max:2}, Gray:{v:0, min:0, max:1, step:1, label:'Gray (0/1)'} },
        logic: (n) => {
            if(passes.film) {
                passes.film.uniforms.nIntensity.value = getIn(n,'Noise') || n.params.Noise.v;
                passes.film.uniforms.sIntensity.value = getIn(n,'Lines') || n.params.Lines.v;
                passes.film.uniforms.grayscale.value = n.params.Gray.v > 0.5;
            }
        }
    },
    'fx_vignette': {
        cat: 'fx', name: { tr:'Vinyet', en:'Vignette' },
        desc: { tr:'Köşeleri karartır.', en:'Darkens screen corners.' },
        ports: { in:['Offset', 'Darkness'] },
        params: { Offset:{v:1.0, min:0.5, max:2}, Darkness:{v:1.0, min:0, max:2} },
        logic: (n) => {
            if(passes.vignette) {
                passes.vignette.uniforms['offset'].value = getIn(n,'Offset') || n.params.Offset.v;
                passes.vignette.uniforms['darkness'].value = getIn(n,'Darkness') || n.params.Darkness.v;
            }
        }
    },
    'fx_pixelate': {
        cat: 'fx', name: { tr:'Piksellestir', en:'Pixelate' },
        desc: { tr:'Çözünürlüğü düşürür.', en:'Reduces screen resolution.' },
        ports: { in:['PixelSize'] },
        params: { PixelSize:{v:1, min:1, max:64, step:1} },
        logic: (n) => {
            if(passes.pixel) {
                const s = getIn(n,'PixelSize') || n.params.PixelSize.v;
                passes.pixel.uniforms['pixelSize'].value = s;
            }
        }
    }
};
