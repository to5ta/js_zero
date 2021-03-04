import envMap from  "../assets/textures/skybox/kloppenheim_06_2k.png";

import sky_px from  "../assets/textures/skybox/skybox0000_px.png";
import sky_nx from  "../assets/textures/skybox/skybox0000_nx.png";
import sky_py from  "../assets/textures/skybox/skybox0000_py.png";
import sky_ny from  "../assets/textures/skybox/skybox0000_ny.png";
import sky_pz from  "../assets/textures/skybox/skybox0000_pz.png";
import sky_nz from  "../assets/textures/skybox/skybox0000_nz.png";
import medieval_theme_01 from  '../assets/music/medieval_theme_01.mp3';
import medieval_theme_02 from  '../assets/music/medieval_theme_02.mp3';
import test_level_model from  '../assets/models/test_level_2.gltf';
import box_model from  '../assets/models/box.gltf';

import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

interface Pausable {
    pause(): void;
    resume(): void;
}

class GameWorld implements Pausable {
    
    shadowGenerator:  BABYLON.ShadowGenerator;

    scene : BABYLON.Scene;
    gravity: number;
    player_start_position: BABYLON.Vector3;
    camera_start_position: BABYLON.Vector3;
    collision_meshes: BABYLON.Mesh[];
    box: BABYLON.Mesh;
    music2: BABYLON.Sound;
    music: BABYLON.Sound;
    photoDome: BABYLON.PhotoDome;
    

    constructor(scene: BABYLON.Scene, assetManager: BABYLON.AssetsManager) {
        
        // Create the scene space
        this.scene = scene;

        this.gravity = -9.81;

        this.player_start_position = new BABYLON.Vector3(0,3,0);
        this.camera_start_position = new BABYLON.Vector3(30,30,30);

        // Add a camera to the scene and attach it to the canvas

        // Add lights to the scene
        var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
        light1.intensity = 0.25;
        // var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), this.scene);
        var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-1, -5, -1).normalize(), this.scene);
        light2.intensity = 0.65;

        this.shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
        this.shadowGenerator.useExponentialShadowMap = true;

        // console.log(light2)
        // console.log(this.shadowGenerator)

        this.collision_meshes = [];
        var ground_material = new BABYLON.PBRMetallicRoughnessMaterial("ground_material", this.scene);
        // ground_material.wireframe = true;

        // ground_material.specularPower = 0;
        // ground_material.emissiveColor = new BABYLON.Color3(1,1,1);
        // ground_material.roughness = 0.1;

        // Add and manipulate meshes in the scene
        // this.plane = BABYLON.MeshBuilder.CreatePlane("Ground", {size: 30}, this.scene);
        // this.plane.rotation.x = Math.PI / 2;
        // this.plane.material = ground_material;
        // this.plane.checkCollisions = true;
        // this.collision_meshes.push(this.plane);
        // this.plane.receiveShadows = true;

        this.box = BABYLON.MeshBuilder.CreateBox("GroundBox", {size: 2}, this.scene);
        this.box.position = new BABYLON.Vector3(0, 1, 5);
        this.box.checkCollisions = true;
        this.box.material = ground_material;
        this.box.receiveShadows = true;
        this.collision_meshes.push(this.box); 



        var levelLoadTask = assetManager.addMeshTask(
            "LevelModel", 
            null, 
            './', 
            test_level_model);   

        levelLoadTask.onSuccess = () => {
            // console.log(levelLoadTask);

            // start ambient animations
            levelLoadTask.loadedAnimationGroups.forEach(animation => {
                animation.start(true);
            });
            levelLoadTask.loadedMeshes.forEach((mesh) => {
                this.collision_meshes.push(mesh as BABYLON.Mesh);
                mesh.checkCollisions = true;
                // mesh.material.wireframe = true;
            });
        }

        // var boxLoadTask = assetManager.addMeshTask(
        //     "BoxModel", 
        //     null, 
        //     './', 
        //     box_model);   

        //     boxLoadTask.onSuccess = () => {
        //     // console.log(boxLoadTask);
        //     // console.log("boxTask: ", boxLoadTask);
        //     boxLoadTask.loadedMeshes.forEach((mesh) => {
        //         this.collision_meshes.push(mesh);
        //         // console.log("Add Mesh to Collision: ", mesh);
        //         mesh.checkCollisions = true;
        //         // mesh.material.wireframe = true;
        //     });
        // }

        //     levelLoadTask.loadedMeshes.forEach((mesh) => {

        //         // this.collision_meshes.push(mesh);
                
        //         mesh.receiveShadows = true;
        //         console.log("mesh", mesh.name)
        //         this.collision_meshes.push(mesh);


        //         mesh.isVisible = false;
                   
        //         var box = BABYLON.MeshBuilder.CreateBox("GroundBox", {size: 2}, this.scene);
        //         box.position = new BABYLON.Vector3(5, 0.5, 5);
        //         box.rotationQuaternion = mesh.rotationQuaternion;
        //         box.scaling = mesh.scaling;
        //         box.checkCollisions = true;
        //         console.log(box.scaling)
        //         console.log(box.position)
        //         console.log(box.rotationQuaternion)
        //         box.material = ground_material;
        //         this.collision_meshes.push(box);

        //         // if (mesh.name.includes('collision')) {

        //         // }
        //     });
        // } 

        // self-made skybox, currently ugly
        // var envTexture = new BABYLON.CubeTexture.CreateFromImages(
        //     [sky_px, sky_py, sky_pz, sky_nx, sky_ny, sky_nz], 
        //     this.scene, 
        //     false);    
        // this.scene.createDefaultSkybox(envTexture, false, 1000, 0, false);

        this.photoDome = new BABYLON.PhotoDome("envMapDome", envMap, {}, scene);

        setInterval(()=>{
            this.photoDome.rotate(BABYLON.Vector3.Up(), 0.0006);
        }, 50);

        this.music2 = new BABYLON.Sound("Music1", medieval_theme_01, scene, null, {
            loop: true,
            autoplay: false
        });
          
        this.music = new BABYLON.Sound("Music2", medieval_theme_02, scene, null, {
            loop: true,
            autoplay: false
        });
    
        this.music2.setVolume(0.05);      
        this.music.setVolume(0.05);      
    }


    pause(): void {
        if(!this.music.isPlaying){
            this.music.play();
        }
    }
    resume(): void {
        if(!this.music.isPlaying){
            this.music.play();
        }
    }

    setDebug(debug: boolean) {

    }
}

export { GameWorld, Pausable };