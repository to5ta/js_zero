import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

import { Player } from './Player';
import { GameWorld, Pausable } from './world';
import { DebugView } from "./debug_view";
import GameUI from "./GameUI";
import { GameEvent, GameEventListener } from "./GameEvent";
import { App } from "./app";
import { CustomLoadingScreen } from "./LoadingScreen";

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
    onReady: () => void;
    app: App;

    ui: GameUI;

    loadingScreen: CustomLoadingScreen;


    onEvent(event: GameEvent) {
        if (event.type == "ready" && event.data && event.data.hasOwnProperty("author")) {
            let data = event.data as {author: string};
            if (data.author == Player.name) {
                console.log("This.player is ready!");
                this.app.onReady();
            }
        }

        if (event.data && event.data.hasOwnProperty("health")){
            let data = event.data as {health: string};
            this.ui.playerHealth.text = "\u2764 " + data.health;
        }

        if (event.type == "died") {
            if (!this.player.died) {
                setTimeout(()=> {
                    this.player.died = false;
                    this.player.camera.alpha = -Math.PI/2;
                    this.player.setOrientation(-Math.PI);
                    this.player.mHealth.setHealthPoints(100);
                    this.player.mPhysics.velocity = BABYLON.Vector3.Zero(); 
                    this.player.setPosition(this.world.player_start_position.clone());
                }, 3000);
                this.player.died = true;
                console.log("Player died")
            }
        }
    }

    constructor(
        engine: BABYLON.Engine, 
        canvas: HTMLCanvasElement,
        onReady: () => void, 
        app: App) { 
        this.engine = engine;
        this.canvas = canvas;
        this.app = app;

        this.onReady = onReady;

        this.loadingScreen = new CustomLoadingScreen();
        this.engine.loadingScreen = this.loadingScreen;

        // game state ---------------------------------------------------------
        this.debug_fly_mode = false;
        this.showDebugInfo = false;
        
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
        
        this.player.setPosition(this.world.player_start_position.clone());

        this.player.addGameEventListener(this);
        this.player.addGameEventListener(this);
        this.player.addGameEventListener(this);
        
        this.ui = new GameUI();

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
        this.player.mHealth.setHealthPoints(100);
        console.log("Finished loading resources! Starting game...");
        if(this.world.music && !this.world.music.isPlaying){
            this.world.music.play();
        }
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
        if(this.player && !this.paused){
            this.player.update(dTimeMs);
        }
    }
}

export { Game };
  