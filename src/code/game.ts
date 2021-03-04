import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

import { Player } from './Player';
import { GameWorld, Pausable } from './world';
import { DebugView } from "./debug_view";
import GameUI from "./GameUI";
import { GameEvent, GameEventListener } from "./GameEvent";

// import 'babylonjs-loaders';

class Game implements Pausable, GameEventListener  {
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

    ui: GameUI;


    onEvent(event: GameEvent) {
        if(event.data && event.data.hasOwnProperty("health")){
            var data = event.data as {health: string};
            this.ui.playerHealth.text = "\u2764 " + data.health;
        }
    }

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
                // console.log("GLTF_Loader:", loader);
                
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
            this.world, 
            this.assetManager);

        this.player.addGameEventListener(this, "hp_changed");
        this.player.addGameEventListener(this, "died");
        this.ui = new GameUI();

        

        this.player.setPosition(this.world.player_start_position);
        this.player.setHealth(100);
          

        // put debug functionality here 
        this.debug_view = new DebugView(
            this.scene, 
            canvas);
        
        this.assetManager.load();
        this.assetManager.onFinish = () => {
            this.onFinishedLoading();
        };
        this.pause();  
        
        this.engine.enterPointerlock();

    }

    // input forwarding -------------------------------------------------------
    // TODO: if game is not paused....
    handleInput(keyEvent: KeyboardEvent) {

        if(keyEvent.key == "F1" && keyEvent.type == "keydown") {
            this.showDebugInfo= !this.showDebugInfo;
            this.player.setDebug(this.showDebugInfo);
            this.world.setDebug(this.showDebugInfo);
        }


        if(keyEvent.key == "c" && keyEvent.type == "keydown") { 
            // console.log("Event", keyEvent);
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

    onFinishedLoading() {
        console.log("Finished loading resources! Starting game...");
        this.resume();
    }

    pause() {
        this.paused = true;
        this.world.pause();
        console.log("Game paused!")
    }

    resume() {
        this.paused = false;
        this.world.resume();
    }


    mainloop(dTimeMs : number){
        if(this.player && !this.paused && dTimeMs < 100){
            this.player.update(dTimeMs);
        }
    }
}
  
export { Game };
  