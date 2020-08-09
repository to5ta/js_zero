import { Player } from './player';
import World from './world';
import { DebugView } from "./debug_view";

import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';

// window.CANNON = require('cannon');
// window.Ammo = require('ammo.js');


class Game {
    constructor(engine, canvas) { 
        this.engine = engine;
        this.canvas = canvas;
 
        // game state ---------------------------------------------------------
        this.debug_mode = false;
        this.paused = false;
        
        // Create the scene ---------------------------------------------------
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.gravity = BABYLON.Vector3(0,-9.81, 0);
        this.scene.collisionsEnabled = true;
       
        BABYLON.SceneLoader.OnPluginActivatedObservable.add(function (loader) {
            if (loader.name === "gltf") {
                // do something with the loader
                console.log("GLTF_Loader:", loader);
                loader.animationStartMode = 0;
                // loader.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.NONE;
                // loader.<option2> = <...>
            }
        });
    

        this.assetManager = new BABYLON.AssetsManager(this.scene);

        // TODO why does ammo.js not work / fs not found error
        // var physicsPlugin = new BABYLON.AmmoJSPlugin();
        // this.scene.enablePhysics(gravityVector, physicsPlugin);
        

        // create the level to play in ----------------------------------------
        this.world = new World(this.scene);

        this.player = new Player(
            this.scene, 
            this.canvas, 
            this.world, 
            this.assetManager);
        
        // put debug functionality here 
        this.debug_view = new DebugView(
            this.scene, 
            canvas);
        
        this.assetManager.load();
        this.engine.enterPointerlock();
    }

    // input forwarding -------------------------------------------------------
    // TODO: if game is not paused....
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
        } 
    }

    pause() {
        this.paused = true;
        this.world.music.pause();
        console.log("Pause")
    }

    resume() {
        this.paused = false;
        this.world.music.play();
    }

    mainloop(dTimeMs){
        if(this.player){
            this.player.update(dTimeMs);
        }
    }
}
  
export { Game };
  