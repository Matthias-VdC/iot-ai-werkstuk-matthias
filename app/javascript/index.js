import * as THREE from 'three';
import OrbitControls from "./controls/OrbitControls.js";
import OBJLoader from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';


class BasicWorldDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        // https://stackoverflow.com/questions/16177056/changing-three-js-background-to-transparent-or-other-color
        this._threejs.setClearColor(0xffffff, 0);
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth / 2.8, window.innerHeight / 2.8);

        this._threejs.domElement.id = "scene-soulplate";
        this._threejs.domElement.className = "canvas-scene";

        document.body.appendChild(this._threejs.domElement);

        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);

        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = .01;
        const far = 5000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(100, 0, 0);

        this._scene = new THREE.Scene();

        let light = new THREE.DirectionalLight(0xFFFFFF, 1);
        light.position.set(20, 500, 100);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;

        let light2 = new THREE.DirectionalLight(0xFFFFFF, 1);
        light2.position.set(0, -500, 0);
        light2.target.position.set(0, 0, 0);
        light2.castShadow = true;

        // // Create a helper for the shadow camera(optional)
        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // this._scene.add(helper);

        this._scene.add(light2);
        this._scene.add(light);

        let ObjLoader = new OBJLoader();
        let MtlLoader = new MTLLoader();

        MtlLoader.load("../assets/Model/soulplate/salomon_right.mtl", (materials) => {
            materials.preload();
            ObjLoader
                .setMaterials(materials)
                .load('../assets/Model/soulplate/salomon_right.obj', (object) => {

                    object.rotation.x = -Math.PI / 2;
                    object.scale.set(4, 4, 4);

                    let texture = new THREE.TextureLoader().load("../assets/textures/test.jpg");
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(4, 4);

                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            child.material.map = texture;
                        }
                    });

                    this._scene.add(object);
                })
        });

        this._controls = new OrbitControls(this._camera, this._threejs.domElement);
        this._controls.target.set(0, 0, 0);
        this._controls.enablePan = false;
        this._controls.enableZoom = true;
        this._controls.minDistance = 120;
        this._controls.maxDistance = 190;
        this._controls.dist
        this._controls.zoomSpeed = 1.2;
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.01;
        this._controls.screenSpacePanning = false;
        // this._controls.maxPolarAngle = Math.PI / 2;

        this._RAF();
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth / 2.8, window.innerHeight / 2.8);
    }

    _RAF() {
        requestAnimationFrame(() => {
            this._controls.update();
            this._threejs.render(this._scene, this._camera);
            this._RAF();
        });
    }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
    _APP = new BasicWorldDemo();
});
