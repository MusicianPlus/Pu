import { getIn } from '../helpers.js';
import { clamp, mapRange } from '../../core/utils.js';
import { updateViz } from '../../ui/visualization.js';

export const MathNodes = {
    'math_map': {
        cat: 'math', name: { tr:'Değer Haritala', en:'Map Range' },
        desc: { tr:'Değer aralığını yeniden eşler.', en:'Remaps value range.' },
        ports: { in:['In'], out:['Out'] },
        params: { InMin:{v:0}, InMax:{v:1}, OutMin:{v:0}, OutMax:{v:1}, Clamp:{v:0, min:0, max:1, step:1, label:'Clamp (0/1)'} },
        logic: (n) => {
            const v = getIn(n, 'In');
            let res = mapRange(v, n.params.InMin.v, n.params.InMax.v, n.params.OutMin.v, n.params.OutMax.v);
            if(n.params.Clamp.v > 0.5) res = clamp(res, n.params.OutMin.v, n.params.OutMax.v);
            n.val.Out = res;
            updateViz(n, (res - n.params.OutMin.v) / (n.params.OutMax.v - n.params.OutMin.v));
            updateViz(n, n.val.Out);
        }
    },
    'math_func': {
        cat: 'math', name: { tr:'Mat Fonksiyon', en:'Math Func' },
        desc: { tr:'Gelişmiş matematiksel fonksiyonlar.', en:'Advanced math functions.' },
        ports: { in:['In'], out:['Out'] },
        params: { Func:{v:0, min:0, max:5, step:1, label:'F(Sin/Cos/Tan/Abs/Log/Round)'} },
        logic: (n) => {
            const v = getIn(n, 'In');
            const f = n.params.Func.v;
            if(f===0) n.val.Out = Math.sin(v);
            else if(f===1) n.val.Out = Math.cos(v);
            else if(f===2) n.val.Out = Math.tan(v);
            else if(f===3) n.val.Out = Math.abs(v);
            else if(f===4) n.val.Out = Math.log(v>0?v:0.0001);
            else if(f===5) n.val.Out = Math.round(v);
            updateViz(n, n.val.Out);
        }
    },
    'math_op': {
        cat: 'math', name: { tr:'Mat İşlem', en:'Math Op' },
        desc: { tr:'Temel matematiksel işlem.', en:'Basic math operation.' },
        ports: { in:['A', 'B'], out:['Out'] },
        params: { Op:{v:0, min:0, max:4, step:1, label:'Op (+,-,*,/,%)'} },
        logic: (n) => {
            const a = getIn(n, 'A'); const b = getIn(n, 'B');
            const op = n.params.Op.v;
            if(op === 0) n.val.Out = a + b;
            else if(op === 1) n.val.Out = a - b;
            else if(op === 2) n.val.Out = a * b;
            else if(op === 3) n.val.Out = b === 0 ? 0 : a / b;
            else if(op === 4) n.val.Out = a % b;
            updateViz(n, n.val.Out);
        }
    },
    'math_clamp': {
        cat: 'math', name: { tr:'Sınırla', en:'Clamp' },
        desc: { tr:'Değeri min/max arasında tutar.', en:'Restricts value between min/max.' },
        ports: { in:['In', 'Min', 'Max'], out:['Out'] },
        params: { Min:{v:0}, Max:{v:1} },
        logic: (n) => {
            const v = getIn(n, 'In');
            const min = getIn(n, 'Min') || n.params.Min.v;
            const max = getIn(n, 'Max') || n.params.Max.v;
            n.val.Out = Math.min(Math.max(v, min), max);
            updateViz(n, n.val.Out);
        }
    },
    'math_compare': {
        cat: 'math', name: { tr:'Karşılaştır', en:'Compare' },
        desc: { tr:'Mantıksal karşılaştırma (A > B ?).', en:'Logic gate (A > B ?).' },
        ports: { in:['A', 'B'], out:['Out'] },
        params: { Op:{v:0, min:0, max:3, step:1, label:'Op (>, <, ==, !=)'} },
        logic: (n) => {
            const a = getIn(n, 'A'); const b = getIn(n, 'B');
            const op = n.params.Op.v;
            let res = 0;
            if(op===0) res = a > b ? 1 : 0;
            else if(op===1) res = a < b ? 1 : 0;
            else if(op===2) res = Math.abs(a-b) < 0.001 ? 1 : 0;
            else if(op===3) res = Math.abs(a-b) > 0.001 ? 1 : 0;
            n.val.Out = res;
            updateViz(n, res);
        }
    }
};
