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

    mainloop(dTimeMs){
        if(this.player){
            this.player.update(dTimeMs);
        }
    }
}
  
export { Game };
  