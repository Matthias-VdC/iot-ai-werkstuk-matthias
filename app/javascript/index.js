import * as THREE from 'three';
import OrbitControls from "./controls/OrbitControls.js";
import OBJLoader from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';
import GLTFLoader from "./loaders/GLTFLoader.js";


class BasicWorldDemo {
    constructor() {
        this.Initialize();
    }

    Initialize() {
        this.threejs = new THREE.WebGLRenderer({
            antialias: true,
        });
        this.threejs.shadowMap.enabled = true;
        this.threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        // https://stackoverflow.com/questions/16177056/changing-three-js-background-to-transparent-or-other-color
        this.threejs.setClearColor(0xffffff, 0);
        this.threejs.setPixelRatio(window.devicePixelRatio);
        this.threejs.setSize(window.innerWidth / 2.8, window.innerHeight / 2.8);

        this.threejs.domElement.id = "scene-soulplate";
        this.threejs.domElement.className = "canvas-scene";

        document.body.appendChild(this.threejs.domElement);

        window.addEventListener('resize', () => {
            this.OnWindowResize();
        }, false);

        const fov = 60;
        const aspect = window.innerWidth / window.innerHeight;
        const near = .01;
        const far = 5000.0;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(100, 0, 0);

        this.scene = new THREE.Scene();

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

        this.scene.add(light2);
        this.scene.add(light);

        let gltfLoader = new GLTFLoader();



        let texture = THREE.TextureLoader().load("../../assets/textures/test.jpg");
        let material = new THREE.MeshBasicMaterial({ map: texture });

        gltfLoader.load("../../assets/Model/soulplate/salomon_right.gltf", (object) => {
            let soulPlate = new THREE.Object3D()
            soulPlate = object.scene
            soulPlate.rotation.x = -Math.PI / 2;
            soulPlate.scale.set(3.5, 3.5, 3.5);
            soulPlate.customDistanceMaterial

            this.scene.add(soulPlate);
        });

        // let MtlLoader = new MTLLoader();
        // MtlLoader.setPath("../../assets/Model/soulplate/");
        // MtlLoader.load("salomon_right.mtl", (materials) => {
        //     materials.preload();

        //     let ObjLoader = new OBJLoader();
        //     ObjLoader.setMaterials(materials);
        //     ObjLoader.setPath("../../assets/Model/soulplate/");
        //     ObjLoader.load('salomon_right.obj', (object) => {

        //         object.rotation.x = -Math.PI / 2;
        //         object.scale.set(4, 4, 4);
        //         this.scene.add(object);
        //     });
        // });

        this.controls = new OrbitControls(this.camera, this.threejs.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.minDistance = 120;
        this.controls.maxDistance = 190;
        this.controls.dist
        this.controls.zoomSpeed = 1.2;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.01;
        this.controls.screenSpacePanning = false;
        // this._controls.maxPolarAngle = Math.PI / 2;

        this.RAF();
    }

    OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.threejs.setSize(window.innerWidth / 2.8, window.innerHeight / 2.8);
    }

    RAF() {
        requestAnimationFrame(() => {
            this.controls.update();
            this.threejs.render(this.scene, this.camera);
            this.RAF();
        });
    }
}


let APP = null;

window.addEventListener('DOMContentLoaded', () => {
    APP = new BasicWorldDemo();
});
