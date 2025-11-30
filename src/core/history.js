import { graph } from './state.js';
import { selectNode } from '../ui/inspector.js';

const stack = {
    undo: [],
    redo: []
};

const MAX_HISTORY = 50;

// Dependency Injection Placeholder
const OPS = {
    restoreNode: null,
    silentRemoveNode: null,
    drawCables: null
};

export function registerOps(ops) {
    OPS.restoreNode = ops.restoreNode;
    OPS.silentRemoveNode = ops.silentRemoveNode;
    OPS.drawCables = ops.drawCables;
}

// Action Types
export const ACT = {
    ADD_NODE: 'ADD_NODE',
    DEL_NODE: 'DEL_NODE',
    CONN: 'CONN',
    DISCONN: 'DISCONN',
    PARAM: 'PARAM',
    MOVE: 'MOVE'
};

export function execute(action) {
    if(!action.isUndoRedo) {
        stack.redo = [];
        stack.undo.push(action);
        if(stack.undo.length > MAX_HISTORY) stack.undo.shift();
    }

    switch(action.type) {
        case ACT.ADD_NODE:
            if(action.mode === 'do') {
                if(action.nodeData && OPS.restoreNode) {
                    OPS.restoreNode(action.nodeData);
                }
            } else {
                if(OPS.silentRemoveNode) OPS.silentRemoveNode(action.nodeData.id);
            }
            break;

        case ACT.DEL_NODE:
            if(action.mode === 'do') {
                if(OPS.silentRemoveNode) OPS.silentRemoveNode(action.nodeId);
            } else {
                if(OPS.restoreNode) OPS.restoreNode(action.nodeRestoreData);
            }
            break;

        case ACT.CONN:
            if(action.mode === 'do') {
                graph.cables.push(action.cable);
            } else {
                const idx = graph.cables.findIndex(c => c.from===action.cable.from && c.fromPort===action.cable.fromPort && c.to===action.cable.to && c.toPort===action.cable.toPort);
                if(idx>-1) graph.cables.splice(idx,1);
            }
            if(OPS.drawCables) OPS.drawCables();
            break;

        case ACT.DISCONN:
            if(action.mode === 'do') {
                const idx = graph.cables.findIndex(c => c.from===action.cable.from && c.fromPort===action.cable.fromPort && c.to===action.cable.to && c.toPort===action.cable.toPort);
                if(idx>-1) graph.cables.splice(idx,1);
            } else {
                graph.cables.push(action.cable);
            }
            if(OPS.drawCables) OPS.drawCables();
            break;

        case ACT.PARAM:
             const n = graph.nodes.find(x => x.id === action.nodeId);
             if(n && n.params[action.key]) {
                 n.params[action.key].v = (action.mode === 'do') ? action.newVal : action.oldVal;
                 selectNode(n.id);
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
