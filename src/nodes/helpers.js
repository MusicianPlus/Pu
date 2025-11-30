import { graph } from '../core/state.js';

export function getIn(node, key) {
    const cable = graph.cables.find(c => c.to === node.id && c.toPort === key);
    if (cable) {
        const src = graph.nodes.find(n => n.id === cable.from);
        if (src && src.val[cable.fromPort] !== undefined) {
            return src.val[cable.fromPort];
        }
    }
    // Special handling for Reference types
    if(key === 'Mat' || key === 'Geo' || key === 'Obj' || key === 'Tex' || key === 'Arr' || key === 'PosArr' || key === 'ScaleArr' || key === 'RotArr' || key === 'ColorArr' || key === 'Stream') { 
        if(cable) {
            // Logic already returns src.val[...] above. 
            // This block is ONLY for "Disconnected" state.
            return null; 
        }
    }
    return node.params[key] ? node.params[key].v : 0;
}
