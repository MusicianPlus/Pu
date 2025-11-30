import { SigNodes } from './sig/index.js';
import { MathNodes } from './math/index.js';
import { GeoNodes } from './geo/index.js';
import { MatNodes } from './mat/index.js';
import { ObjNodes } from './obj/index.js';
import { TexNodes } from './tex/index.js';
import { SndNodes } from './snd/index.js';
import { FxNodes } from './fx/index.js';

// Combine all nodes
export const NODES = {
    ...SigNodes,
    ...MathNodes,
    ...GeoNodes,
    ...MatNodes,
    ...ObjNodes,
    ...TexNodes,
    ...SndNodes,
    ...FxNodes
};

export function getIcon(type) {
    // SIG
    if (type.includes('lfo')) return 'fa-wave-square';
    if (type.includes('mic')) return 'fa-microphone';
    if (type.includes('beat')) return 'fa-clock';
    if (type.includes('noise')) return 'fa-wind'; // or fa-braille
    if (type.includes('mouse')) return 'fa-mouse';
    if (type.includes('trigger')) return 'fa-bullseye';
    if (type.includes('grid')) return 'fa-border-all';
    if (type.includes('array')) return 'fa-list-ol';

    // MATH
    if (type.includes('map')) return 'fa-ruler-horizontal';
    if (type.includes('func')) return 'fa-square-root-variable'; // or fa-superscript
    if (type.includes('math')) return 'fa-calculator';

    // GEO
    if (type.includes('box')) return 'fa-cube';
    if (type.includes('sphere')) return 'fa-globe';
    if (type.includes('torus')) return 'fa-ring';
    if (type.includes('geo_file')) return 'fa-file-import';
    if (type.includes('geo_noise')) return 'fa-water';

    // MAT
    if (type.includes('wire')) return 'fa-border-none';
    if (type.includes('mat')) return 'fa-fill-drip';

    // OBJ
    if (type.includes('cam')) return 'fa-video';
    if (type.includes('light')) return 'fa-lightbulb';
    if (type.includes('instancer')) return 'fa-th'; // Grid layout icon
    if (type.includes('obj')) return 'fa-shapes';

    // TEX
    if (type.includes('tex')) return 'fa-image';

    // SND
    if (type.includes('player')) return 'fa-play-circle';
    if (type.includes('analyze')) return 'fa-chart-bar';
    if (type.includes('output')) return 'fa-volume-high';
    if (type.includes('snd')) return 'fa-music';

    // FX
    if (type.includes('kaleido')) return 'fa-snowflake';
    if (type.includes('bloom')) return 'fa-sun';
    if (type.includes('fx')) return 'fa-wand-magic-sparkles';

    return 'fa-circle-nodes'; // Default generic node icon
}
