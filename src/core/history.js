import { graph } from './state.js';
import { addNode, removeNode, drawCables } from '../ui/canvas.js';
import { selectNode } from '../ui/inspector.js';

const stack = {
    undo: [],
    redo: []
};

const MAX_HISTORY = 50;

// Action Types
export const ACT = {
    ADD_NODE: 'ADD_NODE',
    DEL_NODE: 'DEL_NODE',
    CONN: 'CONN',
    DISCONN: 'DISCONN',
    PARAM: 'PARAM',
    MOVE: 'MOVE' // Batch move
};

export function execute(action) {
    // If it's a new action (not undo/redo calling this), clear redo
    if(!action.isUndoRedo) {
        stack.redo = [];
        stack.undo.push(action);
        if(stack.undo.length > MAX_HISTORY) stack.undo.shift();
    }

    // Perform Action
    switch(action.type) {
        case ACT.ADD_NODE:
            // logic: if 'do', add. if 'undo', remove.
            if(action.mode === 'do') {
                // If ID exists (redo), reuse it to keep connections valid?
                // addNode logic in canvas.js might generate new ID.
                // We need addNode to accept an ID or we handle it here manually?
                // Better: Modify addNode to accept optional ID/state.
                // For now, let's assume we store the created node's data in action after first 'do'
                if(action.nodeData) {
                    // Restore
                    // We need a lower-level restore function in canvas.js that doesn't push history
                    restoreNode(action.nodeData);
                } else {
                    // First time
                    // We need to capture the created node
                    // This part is tricky because addNode is usually called from UI.
                    // Ideally UI calls History.execute(ADD_NODE, {type, x, y})
                }
            } else {
                // Undo: Remove
                // We need to store the ID
                silentRemoveNode(action.nodeData.id);
            }
            break;

        case ACT.DEL_NODE:
            if(action.mode === 'do') {
                silentRemoveNode(action.nodeId);
            } else {
                restoreNode(action.nodeRestoreData);
            }
            break;

        case ACT.CONN:
            if(action.mode === 'do') {
                graph.cables.push(action.cable);
            } else {
                const idx = graph.cables.findIndex(c => c.from===action.cable.from && c.fromPort===action.cable.fromPort && c.to===action.cable.to && c.toPort===action.cable.toPort);
                if(idx>-1) graph.cables.splice(idx,1);
            }
            drawCables();
            break;

        case ACT.DISCONN:
            if(action.mode === 'do') {
                const idx = graph.cables.findIndex(c => c.from===action.cable.from && c.fromPort===action.cable.fromPort && c.to===action.cable.to && c.toPort===action.cable.toPort);
                if(idx>-1) graph.cables.splice(idx,1);
            } else {
                graph.cables.push(action.cable);
            }
            drawCables();
            break;

        case ACT.PARAM:
             // Param change
             // Target: action.nodeId, action.key, action.oldVal, action.newVal
             const n = graph.nodes.find(x => x.id === action.nodeId);
             if(n && n.params[action.key]) {
                 n.params[action.key].v = (action.mode === 'do') ? action.newVal : action.oldVal;
                 // Trigger logic update if needed? usually loop handles it.
                 // Force UI update if inspector is open
                 selectNode(n.id); // Re-select to refresh inspector UI
             }
             break;
    }
}

export function undo() {
    if(stack.undo.length === 0) return;
    const action = stack.undo.pop();
    stack.redo.push(action);

    const reverseAction = { ...action, mode: 'undo', isUndoRedo: true };
    execute(reverseAction);
}

export function redo() {
    if(stack.redo.length === 0) return;
    const action = stack.redo.pop();
    stack.undo.push(action);

    const doAction = { ...action, mode: 'do', isUndoRedo: true };
    execute(doAction);
}

// Helpers that will be imported by Canvas/Sidebar to hook into this system
// We need to inject these dependencies or circular dependency hell awaits.
// Solution: We export simple "commands" and modify canvas.js to import 'commit' from here?
// Or we simply put the heavy lifting logic in canvas.js but exposed as "restoreNode".

import { restoreNode, silentRemoveNode } from '../ui/canvas.js';
