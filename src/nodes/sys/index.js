import { getIn } from '../helpers.js';
import { graph } from '../../core/state.js';

export function initSysNodes() {
    //
}

export const SysNodes = {
    'sys_group': {
        cat: 'sys', name: { tr:'Grup (Çerçeve)', en:'Group (Frame)' },
        desc: { tr:'Düğümleri gruplar ve taşır.', en:'Visually groups and moves nodes.' },
        ports: { in:[], out:[] },
        params: { Width:{v:300, min:100, max:2000, step:10}, Height:{v:200, min:100, max:2000, step:10}, Label:{type:'string', v:'Group'} },
        init: (n) => {
            // Visual logic handled in canvas renderer or CSS
            // We need to inject styles or attributes to the node DOM
            setTimeout(() => {
                const el = document.getElementById(`node-${n.id}`);
                if(el) {
                    el.classList.add('node-group');
                    el.style.zIndex = "0"; // Behind other nodes
                    // Remove body content to clear visual noise, just keep header/resize
                    const body = el.querySelector('.node-body');
                    if(body) body.style.display = 'none'; // Or keep for resizing?
                }
            }, 50);
        },
        logic: (n) => {
            const w = n.params.Width.v;
            const h = n.params.Height.v;
            // Update DOM style
            const el = document.getElementById(`node-${n.id}`);
            if(el) {
                el.style.width = w + 'px';
                el.style.height = h + 'px';
                // Update Label if we add label logic
            }

            // Check for children to move
            // Logic: If group moves, delta is applied to all nodes strictly inside it
            // This requires state tracking of "last position" to calc delta
            // And checking intersection

            // Simple approach: When dragging GROUP, we find contained nodes and move them.
            // This logic belongs in drag handler in canvas.js, but we can't easily hook there without mess.
            // Alternative: Group just stays there. User selects multiple to move.
            // "Active" grouping is complex.
            // Let's implement "Passive" visual framing first.
        }
    }
};
