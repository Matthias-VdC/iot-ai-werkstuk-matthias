import * as THREE from 'three';
import OrbitControls from "./controls/OrbitControls.js";
import OBJLoader from './loaders/OBJLoader.js';
import { MTLLoader } from './loaders/MTLLoader.js';
import GLTFLoader from "./loaders/GLTFLoader.js";


class BasicWorldDemo {
    constructor() {
        this.styleRatio = 0.5;
        this.resultContainer = document.getElementById("result1-canvas");
        this.resultContainer2 = document.getElementById("result2-canvas");
        this.textureContainer = document.getElementById("texture-canvas");

        this.Initialize();
    }
    async loadInceptionStyle() {
        return await tf.loadGraphModel("../../model/style-js/model.json");
    }
    async loadTransformer() {
        return await tf.loadGraphModel("../../model/transformer-js/model.json");
    }
    async initializeStyleTransfer() {
        this.firstStyle();
    }

    async firstStyle() {
        this.styleRatio = document.getElementById("image-range").value / 100;
        this.style1 = document.getElementById("frame1");
        this.style2 = document.getElementById("frame2");
        this.tensor1 = tf.browser.fromPixels(this.style1).toFloat().div(tf.scalar(255)).expandDims();
        this.tensor2 = tf.browser.fromPixels(this.style2).toFloat().div(tf.scalar(255)).expandDims();
        document.getElementById("texture-container").style.display = 'flex';
        document.getElementById("result2-container").style.display = 'flex';
        document.getElementById("result-container").style.display = 'flex';

        this.files = [];
        for (let i = 1; i < 85; i++) {
            if (i < 10) {
                this.files.push("pattern_0" + i);
            } else {
                this.files.push("pattern_" + i);
            }
        }
        // https://stackoverflow.com/questions/6011378/how-to-add-image-to-canvas

        console.log(this.files);

        this.textureContainer.src = `assets/textures/patterns/${this.files[Math.floor(Math.random() * (84 - 1 + 1) + 1)]}.png`;

        console.log(this.tensor1, this.tensor2);

        if (this.styleRatio > 0.5) {
            this.tensor1 = tf.browser.fromPixels(this.style2).toFloat().div(tf.scalar(255)).expandDims();
            this.tensor2 = tf.browser.fromPixels(this.style1).toFloat().div(tf.scalar(255)).expandDims();
        }


        document.getElementById("submitImages").value = "Loading models!";
        await this.loadInceptionStyle().then(model => {
            this.styleNet = model;
        });
        await this.loadTransformer().then(model => {
            this.transformNet = model;
        });

        document.getElementById("submitImages").value = "Generating texture!";
        let bottleneck = await tf.tidy(() => {
            return this.styleNet.predict(this.tensor2);
        });
        const bottleneckBase = await tf.tidy(() => {
            return this.styleNet.predict(this.tensor1);
        });

        const bottleneckStyle = bottleneck;

        bottleneck = await tf.tidy(() => {
            let scaledStyle = bottleneckStyle.mul(tf.scalar(this.styleRatio));
            let scaledBase = bottleneckBase.mul(tf.scalar(1.0 - this.styleRatio));
            return scaledStyle.add(scaledBase);
        });

        const stylized = await tf.tidy(() => {
            return this.transformNet.predict([this.tensor1, bottleneck]).squeeze();
        });
        await tf.browser.toPixels(stylized, this.resultContainer);


        this.threejs.domElement.style.display = "block";
        document.getElementById("submitImages").value = "Apply textures";

        if (this.styleRatio === 1) {
            await tf.browser.toPixels(tf.squeeze(this.tensor1), this.resultContainer2);
            this.applyTexture();
            this.RAF();
        } else if (this.styleRatio === 0.01) {
            await tf.browser.toPixels(tf.squeeze(this.tensor1), this.resultContainer2);
            this.applyTexture();
            this.RAF();
        } else {
            if (this.patternDisabled) {
                await tf.browser.toPixels(stylized, this.resultContainer2);
                document.getElementById("texture-container").style.display = 'none';
                document.getElementById("result2-container").style.display = 'none';
                this.applyTexture();
                this.RAF();
            } else {
                this.textureStyle();
            }
        }

        bottleneck.dispose();
        stylized.dispose();
        bottleneckStyle.dispose();
        bottleneckBase.dispose();
    }

    async textureStyle() {

        this.resultContainer = document.getElementById("result1-canvas");
        this.textureContainer = document.getElementById("texture-canvas");

        this.tensor3 = await tf.browser.fromPixels(this.resultContainer).toFloat().div(tf.scalar(255)).expandDims();
        this.tensor4 = await tf.browser.fromPixels(this.textureContainer).toFloat().div(tf.scalar(255)).expandDims();


        document.getElementById("submitImages").value = "Generating pattern!";
        let bottleneck2 = await tf.tidy(() => {
            return this.styleNet.predict(this.tensor3);
        });
        const bottleneckBase2 = await tf.tidy(() => {
            return this.styleNet.predict(this.tensor4);
        });

        const bottleneckStyle2 = bottleneck2;

        bottleneck2 = await tf.tidy(() => {
            let scaledStyle = bottleneckStyle2.mul(tf.scalar(0.75));
            let scaledBase = bottleneckBase2.mul(tf.scalar((Math.floor(Math.random() * (3 - 0 + 1)) + 0) / 10));
            return scaledStyle.add(scaledBase);
        });

        bottleneckStyle2.dispose();
        bottleneckBase2.dispose();

        const stylized2 = await tf.tidy(() => {
            return this.transformNet.predict([this.tensor3, bottleneck2]).squeeze();
        });
        await tf.browser.toPixels(stylized2, this.resultContainer2);


        bottleneck2.dispose();
        stylized2.dispose();


        this.applyTexture();
        this.RAF();
    }

    async applyTexture() {
        const gltfLoader = new GLTFLoader();
        let canvasTexture = new THREE.CanvasTexture(this.resultContainer2);
        var newMaterial = new THREE.MeshStandardMaterial({ map: canvasTexture });

        let model = "../../assets/Model/boot/fullroller.gltf"

        if (document.getElementById("custom-model").files.length !== 0) {
            let customFile = document.getElementById("custom-model").files[0];
            // https://stackoverflow.com/questions/67864724/threejs-load-gltf-model-directly-from-file-input
            model = URL.createObjectURL(customFile);
        }



        console.log(model);

        gltfLoader.load(model, (object) => {
            let soulPlate = object.scene

            soulPlate.traverse((child) => {
                if (child.isMesh) {
                    child.material = newMaterial;
                }
                child.rotation.y = -Math.PI / 2;
                child.position.y = -3;
                child.position.z = -1;
                child.position.x = 1;
                child.scale.set(15, 15, 15);
            });
            this.scene.add(soulPlate);
        });

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
        const far = 50000;
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

        document.getElementById('show-extra').addEventListener('change', function () {
            if (this.checked) {
                document.getElementById("result-container").style.display = 'flex';
                document.getElementById("texture-container").style.display = 'flex';
                document.getElementById("result2-container").style.display = 'flex';
            } else {
                document.getElementById("result-container").style.display = 'none';
                document.getElementById("texture-container").style.display = 'none';
                document.getElementById("result2-container").style.display = 'none';
            }
        });

        let disablePattern = document.getElementById('disable-pattern');

        disablePattern.addEventListener('change', () => {
            if (disablePattern.checked) {
                this.patternDisabled = true;
            } else {
                this.patternDisabled = false;
            }
        });


        document.getElementById("submitImagesForm").addEventListener("submit", e => {
            e.preventDefault();


            document.getElementById("loading").style.display = "flex";
            window.scrollTo(0, 0);

            this.initializeStyleTransfer();
        });


        this.controls = new OrbitControls(this.camera, this.threejs.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.enablePan = false;
        this.controls.enableZoom = true;
        this.controls.dist
        this.controls.zoomSpeed = 1.2;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minPolarAngle = -Math.PI;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.minAzimuthAngle = Math.PI;
        this.controls.maxAzimuthAngle = Math.PI * 2;
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
