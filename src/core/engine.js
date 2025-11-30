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

// Custom Shaders
const VignetteShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "offset": { value: 1.0 },
        "darkness": { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
    fragmentShader: `
        uniform float offset;
        uniform float darkness;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
            vec4 texel = texture2D( tDiffuse, vUv );
            vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
            gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );
        }`
};

const PixelateShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "resolution": { value: new THREE.Vector2( 1024, 768 ) },
        "pixelSize": { value: 1.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float pixelSize;
        varying vec2 vUv;
        void main() {
            vec2 dxy = pixelSize / resolution;
            vec2 coord = dxy * floor( vUv / dxy );
            gl_FragColor = texture2D( tDiffuse, coord );
        }`
};

export function initEngine(container) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 2, 8);

    // Shadow Map Support
    renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); // preserveDrawingBuffer needed for screenshot/video
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const l = new THREE.DirectionalLight(0xffffff, 1);
    l.position.set(2, 5, 5);
    l.castShadow = true; // Default
    l.shadow.mapSize.width = 1024;
    l.shadow.mapSize.height = 1024;
    scene.add(l);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    // --- Post Processing Stack ---
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // 1. Bloom
    passes.bloom = new UnrealBloomPass(new THREE.Vector2(container.clientWidth, container.clientHeight), 1.5, 0.4, 0.85);
    passes.bloom.strength = 0; // Default off
    composer.addPass(passes.bloom);

    // 2. Afterimage
    passes.after = new AfterimagePass();
    passes.after.uniforms['damp'].value = 0; // Default off
    composer.addPass(passes.after);

    // 3. RGB Shift
    passes.rgb = new ShaderPass(RGBShiftShader);
    passes.rgb.uniforms['amount'].value = 0; // Default off
    composer.addPass(passes.rgb);

    // 4. Film (Grain/Scanlines)
    passes.film = new FilmPass(0, 0, 0, false);
    composer.addPass(passes.film);

    // 5. Vignette
    passes.vignette = new ShaderPass(VignetteShader);
    passes.vignette.uniforms['offset'].value = 1.0;
    passes.vignette.uniforms['darkness'].value = 0; // Default off
    composer.addPass(passes.vignette);

    // 6. Pixelate
    passes.pixel = new ShaderPass(PixelateShader);
    passes.pixel.uniforms['resolution'].value = new THREE.Vector2(container.clientWidth, container.clientHeight);
    passes.pixel.uniforms['pixelSize'].value = 1.0; // 1.0 means no pixelation (normal size)
    composer.addPass(passes.pixel);
}

export function resizeEngine(container, force = false) {
    if (!renderer) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    
    if (force || renderer.domElement.width !== w * renderer.getPixelRatio() || renderer.domElement.height !== h * renderer.getPixelRatio()) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();

        passes.bloom.resolution.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
        if(passes.pixel) passes.pixel.uniforms['resolution'].value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    }
}

export function render() {
    if (controls) controls.update();
    if (composer) composer.render();
}
