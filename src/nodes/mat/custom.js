import * as THREE from 'three';
import { getIn } from '../helpers.js';
import { updateViz } from '../../ui/visualization.js';
import { execute, ACT } from '../../core/history.js';

// Default Shaders
const defaultVertex = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const defaultFragment = `
varying vec2 vUv;
uniform float time;
void main() {
    vec3 col = 0.5 + 0.5 * cos(time + vUv.xyx + vec3(0,2,4));
    gl_FragColor = vec4(col, 1.0);
}
`;

export function initCustomNodes() {
    // We register this node manually or via index.js if this file is imported there.
    // Assuming this object is exported and merged in registry.
}

export const CustomNodes = {
    'mat_shader': {
        cat: 'mat', name: { tr:'Özel Shader', en:'GLSL Shader' },
        desc: { tr:'Kendi GLSL kodunuzu yazın.', en:'Write your own GLSL shader.' },
        ports: { in:['Time', 'Res', 'Mouse'], out:['Mat'] },
        params: {
            Vertex:{type:'code', v:defaultVertex},
            Fragment:{type:'code', v:defaultFragment}
        },
        init: (n) => {
            n.val.Mat = new THREE.ShaderMaterial({
                vertexShader: n.params.Vertex.v,
                fragmentShader: n.params.Fragment.v,
                uniforms: {
                    time: { value: 0 },
                    resolution: { value: new THREE.Vector2(1,1) },
                    mouse: { value: new THREE.Vector2(0,0) }
                },
                side: THREE.DoubleSide
            });
            n.data.needsCompile = false;
        },
        logic: (n, ctx) => {
            const m = n.val.Mat;
            m.uniforms.time.value = ctx.time;
            m.uniforms.mouse.value.set(ctx.mouse.x * 0.5 + 0.5, ctx.mouse.y * 0.5 + 0.5);
            // Res usually needs actual render size, but simplified here
            m.uniforms.resolution.value.set(100, 100);

            if(n.data.needsCompile) {
                m.vertexShader = n.params.Vertex.v;
                m.fragmentShader = n.params.Fragment.v;
                m.needsUpdate = true;
                n.data.needsCompile = false;
            }
        }
    }
};
