import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

import { Player } from './player';
import GameWorld from './world';
import { DebugView } from "./debug_view";


// import 'babylonjs-loaders';
import { KEYCODE } from './key_codes';

class Game {
    engine: BABYLON.Engine;
    canvas: HTMLCanvasElement;
    debug_fly_mode: boolean;
    showDebugInfo: boolean;
    paused: boolean;
    scene: BABYLON.Scene;
    assetManager: BABYLON.AssetsManager;
    world: GameWorld;
    player: Player;
    debug_view: DebugView;

    constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement) { 
        this.engine = engine;
        this.canvas = canvas;
 
        // game state ---------------------------------------------------------
        this.debug_fly_mode = false;
        this.showDebugInfo = false;
        this.paused = true;
        
        // Create the scene ---------------------------------------------------
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.gravity = new BABYLON.Vector3(0,-9.81, 0);
        this.scene.collisionsEnabled = true;
       
        BABYLON.SceneLoader.OnPluginActivatedObservable.add(function (loader) {
            if (loader.name === "gltf") {
                // do something with the loader
                console.log("GLTF_Loader:", loader);
                
                // does not work ???
                // loader.animationStartMode = 0;
                
                // loader.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.NONE;
                // loader.<option2> = <...>
            }
        });
    
        this.assetManager = new BABYLON.AssetsManager(this.scene);

        // create the level to play in ----------------------------------------
        this.world = new GameWorld(this.scene, this.assetManager);

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
        this.assetManager.onFinish = () => {
            this.resume();
        };
        
        this.engine.enterPointerlock();
    }

    // input forwarding -------------------------------------------------------
    // TODO: if game is not paused....
    handleInput(keyEvent: KeyboardEvent) {

        if(keyEvent.keyCode == KEYCODE.F1 && keyEvent.type == "keydown") {
            this.showDebugInfo= !this.showDebugInfo;
            this.player.setDebug(this.showDebugInfo);
            this.world.setDebug(this.showDebugInfo);
        }


        if(keyEvent.keyCode == KEYCODE.C && keyEvent.type == "keydown") { 
            console.log("Event", keyEvent);
            this.debug_fly_mode = !this.debug_fly_mode;
            if (!this.debug_fly_mode) {
                this.debug_view.deactivate();
                this.player.activate();
            } else {
                this.debug_view.activate();
                this.player.deactivate();
            }
        }
        if(!this.debug_fly_mode) {
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
        if(!this.world.music.isPlaying){
            this.world.music.play();
        }
    }

    mainloop(dTimeMs : number){
        if(this.player && !this.paused){
            this.player.update(dTimeMs);
        }
    }
}
  
export { Game };
  