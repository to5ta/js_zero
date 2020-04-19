import { Player } from './player';
import World from './world';
import { DebugView } from "./debug_view";

import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';

// window.CANNON = require('cannon');
// window.Ammo = require('ammo.js');

// outsource to asset-loader-class later
import sky_px from "../assets/textures/skybox/sky_px.jpg";
import sky_nx from "../assets/textures/skybox/sky_nx.jpg";
import sky_py from "../assets/textures/skybox/sky_py.jpg";
import sky_ny from "../assets/textures/skybox/sky_ny.jpg";
import sky_pz from "../assets/textures/skybox/sky_pz.jpg";
import sky_nz from "../assets/textures/skybox/sky_nz.jpg";

import player_model from "../assets/models/wache02.gltf";


class Game {
    constructor(engine, canvas) { 
        this.engine = engine;
        this.canvas = canvas;

        // Create the scene space
        this.scene = new BABYLON.Scene(this.engine);

        this.scene.gravity = BABYLON.Vector3(0,-9.81, 0);
        this.scene.collisionsEnabled = true;


        // Load all assets first
        var assetsManager = new BABYLON.AssetsManager(this.scene);
        var tasks = [];
        tasks.push(assetsManager.addImageTask("sky_px", sky_px));
        tasks.push(assetsManager.addImageTask("sky_nx", sky_nx));
        tasks.push(assetsManager.addImageTask("sky_py", sky_py));
        tasks.push(assetsManager.addImageTask("sky_ny", sky_ny));
        tasks.push(assetsManager.addImageTask("sky_pz", sky_pz));
        tasks.push(assetsManager.addImageTask("sky_nz", sky_nz)); 
        tasks.push(assetsManager.addMeshTask("players mesh", null, './', player_model));
        
        tasks.forEach(imageTask => {
          imageTask.onSuccess = function(task) {
            console.log("Loaded", task.name);
          }
          imageTask.onError = function(task) {
            console.log("FAILED", task);
          }
        });
        
        assetsManager.onFinish = () => {
            this.init(canvas);
            // register renderloop
            this.engine.runRenderLoop(() => { 
                this.mainloop(this.engine.getDeltaTime());
                this.scene.render();
            });
        };

        assetsManager.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
            let text = 'We are loading the scene. ' + remainingCount + ' out of ' + totalCount + ' items still need to be loaded.';
            console.log(text);
        };
        
        assetsManager.load();
    }


    init(canvas) {
        
        // TODO why does ammo.js not work / fs not found error
        // var physicsPlugin = new BABYLON.AmmoJSPlugin();
        // this.scene.enablePhysics(gravityVector, physicsPlugin);
        
    
        // the Level should create the scene, players etc. will be added to that scene / within that
        this.world = new World(this.scene);

        this.player = new Player(this.scene, canvas, this.world);
        this.debug_view = new DebugView(this.scene, canvas);
        

        // Add and manipulate meshes in the scene
        // var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:1}, this.scene);
        // sphere.position = new BABYLON.Vector3(0, 0.5, 0);
        // this.camera.setTarget(sphere.position);



        var mypoints = [
        new BABYLON.Vector3(0,2,0),
            new BABYLON.Vector3(1,2,0)];

        this.debug_mode = false;
        this.paused = false;
    }

    //TODO forward to debug camera / player and its camera
    handleInput(keyEvent) {
        if(keyEvent.keyCode == 67 && keyEvent.type == "keydown") { 
            console.log("Event", keyEvent);
            this.debug_mode = !this.debug_mode;
            if (!this.debug_mode) {
                this.debug_view.deactivate();
                this.player.activate();
            } else {
                this.debug_view.activate();
                this.player.deactivate();
            }
        }
        if(!this.debug_mode) {
            this.player.handleInput(keyEvent);
        } else {
            // forward to debug_view 
        }
    }

    mainloop(dTimeMs){
        if(this.player){
            this.player.update(dTimeMs);
        }
    }
}
  
export { Game };
  