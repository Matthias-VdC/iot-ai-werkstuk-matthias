import * as THREE from 'three';
import OrbitControls from "./controls/OrbitControls.js";
import OBJLoader from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';
import GLTFLoader from "./loaders/GLTFLoader.js";


class BasicWorldDemo {
    constructor() {
        this.styleRatio = 0.1;
        this.resultContainer = document.getElementById("result-canvas");


        this.Initialize();
    }
    async loadInceptionStyle() {
        return await tf.loadGraphModel("../../model/style-js/model.json");
    }
    async loadTransformer() {
        return await tf.loadGraphModel("../../model/transformer-js/model.json");
    }
    async initializeStyleTransfer() {
        this.style1 = document.getElementById("frame1");
        this.style2 = document.getElementById("frame2");
        this.tensor1 = tf.browser.fromPixels(this.style1).toFloat().div(tf.scalar(255));
        this.tensor2 = tf.browser.fromPixels(this.style2).toFloat().div(tf.scalar(255));

        await this.loadInceptionStyle().then(model => {
            this.styleNet = model;
        });
        await this.loadTransformer().then(model => {
            this.transformNet = model;
        });
        const bottleneckStyle1 = await tf.tidy(() => {
            return this.styleNet.predict(this.tensor1.expandDims(0));
        });
        const bottleneckStyle2 = await tf.tidy(() => {
            return this.styleNet.predict(this.tensor2.expandDims(0));
        });
        const combinedBottleneck = await tf.tidy(() => {
            const scaledbottleneckStyle1 = bottleneckStyle1.mul(tf.scalar(1 - this.styleRatio));
            const scaledbottleneckStyle2 = bottleneckStyle2.mul(tf.scalar(this.styleRatio));
            return scaledbottleneckStyle1.add(scaledbottleneckStyle2);
        });
        const stylized = await tf.tidy(() => {
            return this.transformNet.predict([tf.browser.fromPixels(this.style1).toFloat().div(tf.scalar(255)).expandDims(0), combinedBottleneck]).squeeze();
        });
        // await tf.browser.toPixels(stylized, this.resultContainer);

        const combinedBottleneck2 = await tf.tidy(() => {
            const scaledbottleneckStyle1 = bottleneckStyle1.mul(tf.scalar(1 - this.styleRatio));
            const scaledbottleneckStyle2 = bottleneckStyle2.mul(tf.scalar(this.styleRatio));
            return scaledbottleneckStyle2.add(scaledbottleneckStyle1);
        });

        const stylized2 = await tf.tidy(() => {
            return this.transformNet.predict([tf.browser.fromPixels(this.style2).toFloat().div(tf.scalar(255)).expandDims(0), combinedBottleneck2]).squeeze();
        });
        await tf.browser.toPixels(stylized2, this.resultContainer);


        bottleneckStyle1.dispose();
        bottleneckStyle2.dispose();
        combinedBottleneck.dispose();
        combinedBottleneck2.dispose();

        // document.getElementById("result-container").style.display = "flex";
        this.threejs.domElement.style.display = "block";

        this.applyTexture();
        this.RAF();
    }

    applyTexture() {
        // const gltfLoader = new GLTFLoader();
        let canvasTexture = new THREE.CanvasTexture(document.getElementById("result-canvas"));
        var newMaterial = new THREE.MeshStandardMaterial({ map: canvasTexture });

        // const geometry = new THREE.SphereGeometry(20, 32, 16);
        // const sphere = new THREE.Mesh(geometry, newMaterial);
        // this.scene.add(sphere);

        const geometry = new THREE.BoxGeometry(50, 50, 50);
        const cube = new THREE.Mesh(geometry, newMaterial);
        this.scene.add(cube);

        // PROBLEEM = MODEL HEEFT GEEN UV MAPPING
        // gltfLoader.load("../../assets/Model/soulplate/salomon_right.gltf", (object) => {
        //     let soulPlate = object.scene

        //     soulPlate.traverse((child) => {
        //         if (child.isMesh) {
        //             child.material = newMaterial;
        //         }
        //         child.rotation.x = -Math.PI / 2;
        //         child.scale.set(2, 2, 2);
        //     });
        //     this.scene.add(soulPlate);
        // });
        document.getElementById("loading").style.display = "none";
        this.threejs.domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        this.threejs.setSize(window.innerWidth / 2, window.innerHeight / 2);

        this.threejs.domElement.id = "scene-soulplate";
        this.threejs.domElement.className = "canvas-scene";
        this.threejs.domElement.style.display = "none";
        this.threejs.domElement.style.marginTop = "40%";
        this.threejs.domElement.style.marginBottom = "40%";

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

        let globalLight = new THREE.AmbientLight(0xbfbfbf);
        this.scene.add(globalLight);

        // // Create a helper for the shadow camera(optional)
        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // this._scene.add(helper);

        this.scene.add(light2);
        this.scene.add(light);



        document.getElementById("submitImagesForm").addEventListener("submit", e => {
            e.preventDefault();

            document.getElementById("loading").style.display = "flex";

            this.initializeStyleTransfer();
        });


        this.controls = new OrbitControls(this.camera, this.threejs.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.minDistance = 100;
        this.controls.maxDistance = 190;
        this.controls.dist
        this.controls.zoomSpeed = 1.2;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        // this._controls.maxPolarAngle = Math.PI / 2;
    }

    OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.threejs.setSize(window.innerWidth / 2, window.innerHeight / 2);
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
