import { getIn } from '../helpers.js';
import { audioCtx, initAudio } from '../../core/state.js';
import { updateViz } from '../../ui/visualization.js';

// Simple Seeded PRNG (Linear Congruential Generator)
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// 1D Perlin Noise Helper (Simplex-ish)
// Source: https://github.com/josephg/noisejs (Simplified)
// For 1D, we can just use a simple value noise interpolation
function noise1D(x) {
    const i = Math.floor(x);
    const f = x - i;
    const w = f * f * (3.0 - 2.0 * f); // Cubic easing
    // Pseudo-random hash
    const h = n => Math.sin(n * 12.9898) * 43758.5453;
    const r1 = h(i) - Math.floor(h(i));
    const r2 = h(i + 1.0) - Math.floor(h(i + 1.0));
    return r1 + (r2 - r1) * w;
}

export const SigNodes = {
    'sig_mouse': {
        cat: 'sig', name: { tr:'Fare Konumu', en:'Mouse Pos' },
        desc: { tr:'Fare X/Y konumu (-1 ile 1 arası).', en:'Mouse X/Y coordinates (-1 to 1).' },
        ports: { out: ['X', 'Y'] },
        params: {},
        logic: (n, ctx) => {
            n.val.X = ctx.mouse.x;
            n.val.Y = ctx.mouse.y;
            updateViz(n, (n.val.X+1)/2);
        }
    },
    'sig_lfo': {
        cat: 'sig', 
        name: { tr: 'LFO (Dalga)', en: 'LFO (Wave)' },
        desc: { tr: 'Zamanla değişen periyodik sinyal.', en: 'Generates periodic signal over time.' },
        ports: { in: ['Phase', 'Amplitude', 'Frequency'], out: ['Val'] },
        params: { Type: {v:0, min:0, max:3, step:1, label:'Type (Sin/Tri/Sqr/Saw)'}, Frequency: {v:1, min:0, max:10}, Amplitude: {v:1, min:0, max:5}, Offset: {v:0} },
        logic: (n, ctx) => {
            const t = ctx.time * (getIn(n, 'Frequency') || n.params.Frequency.v);
            const amp = getIn(n, 'Amplitude') || n.params.Amplitude.v;
            const ph = getIn(n, 'Phase'); 
            const type = n.params.Type.v;
            let raw = 0;
            if(type === 0) raw = Math.sin(t + ph);
            else if(type === 1) raw = Math.abs((t % 2) - 1) * 2 - 1;
            else if(type === 2) raw = Math.sign(Math.sin(t + ph));
            else if(type === 3) raw = (t % 1) * 2 - 1;
            n.val.Val = raw * amp + n.params.Offset.v;
            updateViz(n, (n.val.Val/amp + 1)/2);
        }
    },
    'sig_noise': {
        cat: 'sig', name: { tr:'Gürültü (Perlin)', en:'Noise (1D)' },
        desc: { tr:'Rastgele ama akışkan değer.', en:'Smooth random value (1D Perlin).' },
        ports: { in:['Speed', 'Scale'], out:['Val'] },
        params: { Speed:{v:1}, Scale:{v:1} },
        logic: (n, ctx) => {
            const speed = getIn(n, 'Speed') || n.params.Speed.v;
            const scale = getIn(n, 'Scale') || n.params.Scale.v;
            n.val.Val = noise1D(ctx.time * speed) * scale;
            updateViz(n, (n.val.Val/scale + 1)/2); // Approx viz
        }
    },
    'sig_trigger': {
        cat: 'sig', name: { tr:'Tetikleyici', en:'Trigger' },
        desc: { tr:'Manuel tetikleyici buton.', en:'Manual trigger button.' },
        ports: { out: ['Trig'] },
        params: { Fire:{v:0, min:0, max:1, step:1, label:'FIRE'} },
        logic: (n) => {
            n.val.Trig = n.params.Fire.v > 0.5 ? 1 : 0;
            if(n.val.Trig) n.params.Fire.v = 0; // Auto-reset
            updateViz(n, n.val.Trig);
        }
    },
    'sig_beat': {
        cat: 'sig', name: { tr:'BPM Vuruş', en:'BPM Beat' },
        desc: { tr:'BPM bazlı tetikleyici.', en:'BPM based trigger generator.' },
        ports: { in:['BPM'], out: ['Pulse', 'Ramp'] },
        params: { BPM:{v:120, min:40, max:200, step:1} },
        logic: (n, ctx) => {
            const bpm = getIn(n, 'BPM') || n.params.BPM.v;
            const bps = bpm / 60;
            const beatTime = ctx.time * bps;
            const ramp = beatTime % 1; 
            const pulse = ramp < 0.1 ? 1 : 0; 
            
            n.val.Ramp = ramp;
            n.val.Pulse = pulse;
            updateViz(n, pulse);
        }
    },
    'sig_grid_pos': {
        cat: 'sig', name: { tr:'Izgara Konum', en:'Grid Positions' },
        desc: { tr:'3D ızgara pozisyon dizisi.', en:'3D grid position array.' },
        ports: { out: ['Arr'] },
        params: { Rows:{v:10, min:1, max:50, step:1}, Cols:{v:10, min:1, max:50, step:1}, Space:{v:1} },
        init: (n) => { 
            n.val.Arr = null;
            setTimeout(() => n.data.needsViz = true, 100); 
        },
        logic: (n) => {
            const rows = Math.floor(n.params.Rows.v);
            const cols = Math.floor(n.params.Cols.v);
            const space = n.params.Space.v;
            const count = rows * cols;

            if(!n.data.arr || n.data.arr.length !== count * 3 || n.data.lastSpace !== space) {
                n.data.arr = new Float32Array(count * 3);
                let i = 0;
                const offX = (cols - 1) * space * 0.5;
                const offZ = (rows - 1) * space * 0.5;
                
                for(let z=0; z<rows; z++) {
                    for(let x=0; x<cols; x++) {
                        n.data.arr[i++] = (x * space) - offX;
                        n.data.arr[i++] = 0;
                        n.data.arr[i++] = (z * space) - offZ;
                    }
                }
                n.data.lastSpace = space;
                n.val.Arr = n.data.arr; 
                n.data.needsViz = true;
            }
            
            if(n.data.needsViz) {
                updateViz(n, n.data.arr);
                n.data.needsViz = false;
            }
        }
    },
    'sig_random_array': {
        cat: 'sig', name: { tr:'Rastgele Dizi', en:'Random Array' },
        desc: { tr:'Rastgele değer dizisi (Seed destekli).', en:'Seeded random value array.' },
        ports: { out: ['Arr'] },
        params: { Count:{v:100, min:10, max:5000, step:10}, Min:{v:0}, Max:{v:1}, Seed:{v:1, step:1} },
        init: (n) => { n.val.Arr = null; setTimeout(() => n.data.needsViz = true, 100); },
        logic: (n) => {
            const count = Math.floor(n.params.Count.v);
            const min = n.params.Min.v;
            const max = n.params.Max.v;
            const seed = Math.floor(n.params.Seed.v);
            
            // Rebuild if params changed
            if(!n.data.arr || n.data.arr.length !== count || n.data.lastSeed !== seed || n.data.lastMin !== min || n.data.lastMax !== max) {
                n.data.arr = new Float32Array(count);
                const rng = mulberry32(seed); // Initialize PRNG
                for(let i=0; i<count; i++) {
                    n.data.arr[i] = min + rng() * (max - min);
                }
                n.val.Arr = n.data.arr;
                n.data.lastSeed = seed; n.data.lastMin = min; n.data.lastMax = max;
                n.data.needsViz = true;
            }
            if(n.data.needsViz) {
                updateViz(n, n.data.arr);
                n.data.needsViz = false;
            }
        }
    },
    'sig_array_math': {
        cat: 'sig', name: { tr:'Dizi İşlemi', en:'Array Math' },
        desc: { tr:'Dizi elemanlarına matematiksel işlem.', en:'Mathematical operation on array elements.' },
        ports: { in:['Arr', 'Value'], out:['Out'] },
        params: { Value:{v:1}, Op:{v:2, min:0, max:3, step:1, label:'Op (+,-,*,/)'} },
        init: (n) => { n.val.Out = null; },
        logic: (n) => {
            const arr = getIn(n, 'Arr');
            const val = getIn(n, 'Value') || n.params.Value.v;
            
            if(!arr) return;
            
            if(!n.data.out || n.data.out.length !== arr.length) {
                n.data.out = new Float32Array(arr.length);
            }
            
            const op = n.params.Op.v;
            for(let i=0; i<arr.length; i++) {
                if(op===0) n.data.out[i] = arr[i] + val;
                else if(op===1) n.data.out[i] = arr[i] - val;
                else if(op===2) n.data.out[i] = arr[i] * val;
                else if(op===3) n.data.out[i] = arr[i] / (val===0?1:val);
            }
            n.val.Out = n.data.out;
            updateViz(n, n.val.Out);
        }
    },
    'sig_color_gradient': {
        cat: 'sig', name: { tr:'Renk Gradyanı', en:'Color Gradient' },
        desc: { tr:'Renk dizisi oluşturur.', en:'Generates color array.' },
        ports: { in:['Phase'], out:['ColArr'] },
        params: { Count:{v:100}, R:{v:1}, G:{v:1}, B:{v:1}, Frequency:{v:0.1} },
        init: (n) => { n.val.ColArr = null; },
        logic: (n) => {
            const count = Math.floor(n.params.Count.v);
            const freq = n.params.Frequency.v;
            const ph = getIn(n,'Phase') || 0;
            
            if(!n.data.arr || n.data.arr.length !== count * 3) {
                n.data.arr = new Float32Array(count * 3);
            }
            
            let idx = 0;
            for(let i=0; i<count; i++) {
                n.data.arr[idx]   = Math.sin(i * freq + ph) * 0.5 + 0.5 * n.params.R.v;
                n.data.arr[idx+1] = Math.sin(i * freq + ph + 2) * 0.5 + 0.5 * n.params.G.v;
                n.data.arr[idx+2] = Math.sin(i * freq + ph + 4) * 0.5 + 0.5 * n.params.B.v;
                idx += 3;
            }
            n.val.ColArr = n.data.arr;
            updateViz(n, n.val.ColArr);
        }
    },
    'sig_smooth': {
        cat: 'sig', name: { tr:'Yumuşat', en:'Smooth' },
        desc: { tr:'Değer değişimini yumuşatır (Lerp).', en:'Smoothes value changes.' },
        ports: { in:['In'], out:['Out'] },
        params: { Factor:{v:0.1, min:0.01, max:1} },
        init: (n) => { n.val.Out = 0; },
        logic: (n) => {
            const target = getIn(n, 'In');
            const f = n.params.Factor.v;
            n.val.Out += (target - n.val.Out) * f;
            updateViz(n, n.val.Out);
        }
    }
};
