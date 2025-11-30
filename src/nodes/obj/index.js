import * as THREE from 'three';
import { getIn } from '../helpers.js';
import { objects } from '../../core/state.js';
import { scene, camera } from '../../core/engine.js'; // We need camera for cam node

export const ObjNodes = {
    'obj_background': {
        cat: 'obj', name: { tr:'Arkaplan', en:'Background' },
        desc: { tr:'Sahne arkaplan rengi veya resmi.', en:'Scene background color or image.' },
        ports: { in:['R', 'G', 'B', 'Image'], out:[] },
        params: { R:{v:0}, G:{v:0}, B:{v:0} },
        logic: (n) => {
            // Priority: Image > Color
            const img = getIn(n, 'Image');
            if(img && img.isTexture) {
                if(scene.background !== img) scene.background = img;
            } else {
                // Solid Color
                // Optimize: Don't create new Color every frame if not changed
                const r = getIn(n,'R')||n.params.R.v;
                const g = getIn(n,'G')||n.params.G.v;
                const b = getIn(n,'B')||n.params.B.v;
                
                if(!scene.background || !scene.background.isColor) {
                    scene.background = new THREE.Color(r,g,b);
                } else {
                    scene.background.setRGB(r,g,b);
                }
            }
        }
    },
    'obj_mesh': {
        cat: 'obj', name: { tr:'Nesne (Mesh)', en:'Mesh Object' },
        desc: { tr:'Sahneye geometri yerleştirir.', en:'Renders a geometry to the scene.' },
        ports: { in:['Geo', 'Mat', 'PosX', 'PosY', 'PosZ', 'RotX', 'RotY', 'RotZ', 'Scale'], out:['Obj'] },
        params: { 
            PosX:{v:0}, PosY:{v:0}, PosZ:{v:0},
            RotX:{v:0}, RotY:{v:0}, RotZ:{v:0},
            Scale:{v:1}
        },
        init: (n) => {
            // Default placeholder
            const g = new THREE.BoxGeometry(1,1,1);
            const m = new THREE.MeshStandardMaterial({color:0x888888});
            const mesh = new THREE.Mesh(g, m);
            scene.add(mesh);
            objects[n.id] = mesh;
            n.val.Obj = mesh;
        },
        logic: (n) => {
            const mesh = objects[n.id];
            if(!mesh) return;

            // 1. Update Geometry
            const inGeo = getIn(n, 'Geo');
            if(inGeo && inGeo.isBufferGeometry && mesh.geometry !== inGeo) {
                mesh.geometry = inGeo;
            }

            // 2. Update Material
            const inMat = getIn(n, 'Mat');
            if(inMat && inMat.isMaterial && mesh.material !== inMat) {
                mesh.material = inMat;
            }

            // 3. Transforms
            mesh.position.set(
                getIn(n, 'PosX') || n.params.PosX.v,
                getIn(n, 'PosY') || n.params.PosY.v,
                getIn(n, 'PosZ') || n.params.PosZ.v
            );
            
            mesh.rotation.set(
                getIn(n, 'RotX') || n.params.RotX.v,
                getIn(n, 'RotY') || n.params.RotY.v,
                getIn(n, 'RotZ') || n.params.RotZ.v
            );

            const s = getIn(n, 'Scale') || n.params.Scale.v;
            mesh.scale.set(s,s,s);
        }
    },
    'obj_cam': {
        cat: 'obj', name: { tr:'Kamera', en:'Camera' },
        desc: { tr:'Ana kamera kontrolü.', en:'Controls main camera transform.' },
        ports: { in:['PosX', 'PosY', 'PosZ', 'LookX', 'LookY', 'LookZ', 'FOV'], out:[] },
        params: { 
            PosX:{v:0}, PosY:{v:0}, PosZ:{v:5},
            LookX:{v:0}, LookY:{v:0}, LookZ:{v:0},
            FOV:{v:75, min:10, max:160}
        },
        logic: (n) => {
            // Directly manipulate the main camera
            camera.position.set(
                getIn(n, 'PosX') || n.params.PosX.v,
                getIn(n, 'PosY') || n.params.PosY.v,
                getIn(n, 'PosZ') || n.params.PosZ.v
            );
            
            camera.lookAt(
                getIn(n, 'LookX') || n.params.LookX.v,
                getIn(n, 'LookY') || n.params.LookY.v,
                getIn(n, 'LookZ') || n.params.LookZ.v
            );

            const fov = getIn(n, 'FOV') || n.params.FOV.v;
            if(camera.fov !== fov) {
                camera.fov = fov;
                camera.updateProjectionMatrix();
            }
        }
    },
    'obj_light_point': {
        cat: 'obj', name: { tr:'Nokta Işık', en:'Point Light' },
        desc: { tr:'Noktasal ışık kaynağı.', en:'Omnidirectional light source.' },
        ports: { in:['R', 'G', 'B', 'Intensity', 'X', 'Y', 'Z'], out:[] },
        params: { R:{v:1}, G:{v:1}, B:{v:1}, Intensity:{v:1, min:0, max:10}, X:{v:2}, Y:{v:2}, Z:{v:2} },
        init: (n) => {
            const l = new THREE.PointLight(0xffffff, 1, 100);
            scene.add(l);
            // Helper visual
            const h = new THREE.PointLightHelper(l, 0.5);
            scene.add(h);
            l.userData.helper = h;
            objects[n.id] = l;
        },
        logic: (n) => {
            const l = objects[n.id];
            l.color.setRGB(getIn(n,'R'), getIn(n,'G'), getIn(n,'B'));
            l.intensity = getIn(n, 'Intensity');
            l.position.set(getIn(n,'X'), getIn(n,'Y'), getIn(n,'Z'));
        }
    },
    'obj_light_dir': {
        cat: 'obj', name: { tr:'Yönlü Işık', en:'Directional Light' },
        desc: { tr:'Güneş benzeri ışık.', en:'Sun-like infinite light.' },
        ports: { in:['R', 'G', 'B', 'Intensity', 'X', 'Y', 'Z'], out:[] },
        params: { R:{v:1}, G:{v:1}, B:{v:1}, Intensity:{v:1, min:0, max:10}, X:{v:5}, Y:{v:5}, Z:{v:5} },
        init: (n) => {
            const l = new THREE.DirectionalLight(0xffffff, 1);
            scene.add(l);
            // Helper
            const h = new THREE.DirectionalLightHelper(l, 1);
            scene.add(h);
            l.userData.helper = h;
            objects[n.id] = l;
        },
        logic: (n) => {
            const l = objects[n.id];
            l.color.setRGB(getIn(n,'R'), getIn(n,'G'), getIn(n,'B'));
            l.intensity = getIn(n, 'Intensity');
            l.position.set(getIn(n,'X'), getIn(n,'Y'), getIn(n,'Z'));
            // Update helper
            if(l.userData.helper) l.userData.helper.update();
        }
    },
    'obj_light_spot': {
        cat: 'obj', name: { tr:'Spot Işık', en:'Spot Light' },
        desc: { tr:'Koni şeklinde ışık.', en:'Cone-shaped light source.' },
        ports: { in:['R', 'G', 'B', 'Intensity', 'X', 'Y', 'Z', 'Angle', 'Penumbra'], out:[] },
        params: { R:{v:1}, G:{v:1}, B:{v:1}, Intensity:{v:1}, X:{v:0}, Y:{v:5}, Z:{v:0}, Angle:{v:0.5, min:0, max:1.5}, Penumbra:{v:0.5, min:0, max:1} },
        init: (n) => {
            const l = new THREE.SpotLight(0xffffff, 1);
            scene.add(l);
            const h = new THREE.SpotLightHelper(l);
            scene.add(h);
            l.userData.helper = h;
            objects[n.id] = l;
        },
        logic: (n) => {
            const l = objects[n.id];
            l.color.setRGB(getIn(n,'R'), getIn(n,'G'), getIn(n,'B'));
            l.intensity = getIn(n, 'Intensity');
            l.position.set(getIn(n,'X'), getIn(n,'Y'), getIn(n,'Z'));
            l.angle = getIn(n, 'Angle') || n.params.Angle.v;
            l.penumbra = getIn(n, 'Penumbra') || n.params.Penumbra.v;
            if(l.userData.helper) l.userData.helper.update();
        }
    },
    'obj_instancer': {
        cat: 'obj', name: { tr:'Çoğaltıcı', en:'Instancer' },
        desc: { tr:'GPU tabanlı nesne çoğaltma.', en:'High performance GPU instancing.' },
        ports: { in:['Geo', 'Mat', 'PosArr', 'RotArr', 'ScaleArr', 'ColorArr'], out:['Obj'] },
        params: { Count:{v:100, min:10, max:5000, step:10} },
        init: (n) => {
            // Placeholder
            const g = new THREE.BoxGeometry(0.1,0.1,0.1);
            const m = new THREE.MeshStandardMaterial({color:0xffffff});
            const im = new THREE.InstancedMesh(g, m, 100);
            im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            scene.add(im);
            objects[n.id] = im;
            n.val.Obj = im;
            n.data.dummyObj = new THREE.Object3D();
            n.data.dummyCol = new THREE.Color();
        },
        logic: (n) => {
            let im = objects[n.id];
            if(!im) return;

            // 1. Update Geo/Mat
            const inGeo = getIn(n, 'Geo');
            if(inGeo && inGeo.isBufferGeometry && im.geometry !== inGeo) im.geometry = inGeo;

            const inMat = getIn(n, 'Mat');
            if(inMat && inMat.isMaterial && im.material !== inMat) im.material = inMat;

            // 2. Resize Count
            const count = Math.floor(n.params.Count.v);
            if(im.count !== count) {
                scene.remove(im);
                im.dispose();
                const newIm = new THREE.InstancedMesh(im.geometry, im.material, count);
                newIm.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
                scene.add(newIm);
                objects[n.id] = newIm;
                im = newIm;
                n.val.Obj = im;
            }

            // 3. Update Data
            const posArr = getIn(n, 'PosArr'); // [x,y,z...]
            const rotArr = getIn(n, 'RotArr'); // [x,y,z...]
            const scaleArr = getIn(n, 'ScaleArr'); // [s,s,s...] or just [s...] ? Let's assume [s] for uniform scale for now or [x,y,z]
            // Simpler: ScaleArr is single float per instance [s1, s2, s3...]
            const colArr = getIn(n, 'ColorArr'); // [r,g,b...]

            const dummy = n.data.dummyObj;
            const dummyCol = n.data.dummyCol;
            let idx3 = 0; // For vec3 arrays
            let idx1 = 0; // For scalar arrays

            if(posArr && posArr.length >= count * 3) {
                for(let i=0; i<count; i++) {
                    // Position
                    dummy.position.set(posArr[idx3], posArr[idx3+1], posArr[idx3+2]);
                    
                    // Rotation
                    if(rotArr && rotArr.length >= count * 3) {
                        dummy.rotation.set(rotArr[idx3], rotArr[idx3+1], rotArr[idx3+2]);
                    } else {
                        dummy.rotation.set(0,0,0);
                    }

                    // Scale
                    if(scaleArr && scaleArr.length >= count) {
                        const s = scaleArr[idx1];
                        dummy.scale.set(s,s,s);
                    } else {
                        dummy.scale.set(1,1,1);
                    }

                    // Color
                    if(colArr && colArr.length >= count * 3) {
                        dummyCol.setRGB(colArr[idx3], colArr[idx3+1], colArr[idx3+2]);
                        im.setColorAt(i, dummyCol);
                    } else {
                        // Reset color if disconnected? Or keep default white?
                        // im.setColorAt(i, new THREE.Color(1,1,1)); // Optional
                    }

                    dummy.updateMatrix();
                    im.setMatrixAt(i, dummy.matrix);
                    
                    idx3 += 3;
                    idx1 += 1;
                }
                im.instanceMatrix.needsUpdate = true;
                if(colArr && im.instanceColor) im.instanceColor.needsUpdate = true;
            }
        }
    }
};
