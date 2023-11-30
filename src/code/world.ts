import envMap from  "../assets/textures/skybox/kloppenheim_06_2k.png";

import sky_px from  "../assets/textures/skybox/skybox0000_px.png";
import sky_nx from  "../assets/textures/skybox/skybox0000_nx.png";
import sky_py from  "../assets/textures/skybox/skybox0000_py.png";
import sky_ny from  "../assets/textures/skybox/skybox0000_ny.png";
import sky_pz from  "../assets/textures/skybox/skybox0000_pz.png";
import sky_nz from  "../assets/textures/skybox/skybox0000_nz.png";
import medieval_theme_01 from  '../assets/music/medieval_theme_01.mp3';
import medieval_theme_02 from  '../assets/music/medieval_theme_02.mp3';
import test_level_model from '../assets/models/level0.gltf';
import test_level_model_bin from  '../assets/models/level0.bin';
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
    music: BABYLON.Sound;
    music_tracks: { [key: string]: BABYLON.Sound } = {};
    photoDome: BABYLON.PhotoDome;
    

    constructor(scene: BABYLON.Scene, assetManager: BABYLON.AssetsManager) {
        
        // Create the scene space
        this.scene = scene;

        this.gravity = -9.81;

        this.player_start_position = new BABYLON.Vector3(0,1.2,0);
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

        this.collision_meshes = [];
        var ground_material = new BABYLON.PBRMetallicRoughnessMaterial("ground_material", this.scene);


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
                if (!mesh.name.includes("_np_")) { // no physics
                    this.collision_meshes.push(mesh as BABYLON.Mesh);
                    mesh.checkCollisions = true;
                } 
                
                if (mesh.name.includes("_ho_")) { // hidden obstacle
                    mesh.visibility = 0;
                }
                // mesh.material.wireframe = true;
            });
        }


        // self-made skybox, currently ugly
        // var envTexture = new BABYLON.CubeTexture.CreateFromImages(
        //     [sky_px, sky_py, sky_pz, sky_nx, sky_ny, sky_nz], 
        //     this.scene, 
        //     false);    
        // this.scene.createDefaultSkybox(envTexture, false, 1000, 0, false);

        this.photoDome = new BABYLON.PhotoDome("envMapDome", envMap, {}, scene);

        for (const music of [
            {url: medieval_theme_01, name: "theme_01", volume: 0.07, default: true },
            {url: medieval_theme_02, name: "theme_02", volume: 0.045 }]) {
            let task = assetManager.addBinaryFileTask(
                music.name, 
                music.url);
            task.onSuccess = (task: BABYLON.BinaryFileAssetTask) => {
                this.music_tracks[music.name] = new BABYLON.Sound(
                    music.name, 
                    task.data, scene, 
                    ()=>{}, 
                    {
                        loop: false,
                        autoplay: false
                    });
                this.music_tracks[music.name].setVolume(music.volume);

                console.log("loaded music track: ", music.name, " from ", music.url);

                if (music.default) {
                    this.music = this.music_tracks[music.name];
                    this.music.play();
                    console.log("playing music track: ", this.music );
                    console.log("available music tracks: ", Object.keys(this.music_tracks));
                }

                // get keys from music_tracks, get next key, play it
                this.music_tracks[music.name].onEndedObservable.add(() => {
                    let keys = Object.keys(this.music_tracks);
                    let next = keys[(keys.indexOf(music.name)+1) % keys.length];
                    this.music_tracks[next].play();
                });
            }
        }
    }

    pause(): void {
        if(this.music && this.music.isPlaying){
            this.music.pause();
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