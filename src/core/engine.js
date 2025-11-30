import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export let scene, camera, renderer, composer, controls;
export const passes = {};

export function initEngine(container) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 8); // Better initial pos

    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better colors
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Environment for PBR
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const l = new THREE.DirectionalLight(0xffffff, 1);
    l.position.set(2, 5, 5);
    scene.add(l);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    // Post Processing
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // Bloom
    passes.bloom = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85);
    composer.addPass(passes.bloom);

    // Afterimage (Trails)
    passes.after = new AfterimagePass();
    passes.after.uniforms['damp'].value = 0;
    composer.addPass(passes.after);

    // RGB Shift
    passes.rgb = new ShaderPass(RGBShiftShader);
    passes.rgb.uniforms['amount'].value = 0;
    composer.addPass(passes.rgb);
    
    // Pixelate (Custom ShaderPass needed, simplified here)
    // To implement pixelate, we usually need a custom shader or use RenderPixelatedPass (newer three versions)
}

export function resizeEngine(container, force = false) {
    if (!renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    // If force is true, we ignore the check (useful when changing resolution scale)
    if (force || renderer.domElement.width !== w * renderer.getPixelRatio() || renderer.domElement.height !== h * renderer.getPixelRatio()) {
        renderer.setSize(w, h, false); // false means style.width/height is not overwritten, only internal canvas size
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        passes.bloom.resolution.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    }
}

export function render() {
    if (controls) controls.update();
    if (composer) composer.render();
}
