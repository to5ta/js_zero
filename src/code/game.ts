import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

import thankyounote_path from '../assets/models/thank_you_note.gltf';


import { Player } from './Player';
import { GameWorld, Pausable } from './world';
import { DebugView } from "./debug_view";
import GameUI from "./GameUI";
import { GameEvent, GameEventListener } from "./common/GameEvent";
import { App } from "./app";
import { CustomLoadingScreen } from "./LoadingScreen";
import { MenuScreen } from "./MenuScreen";
import { SphereSensor } from "./Sensors";

import { Logging } from "./common/Logging";

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
    app: App;
    sensor_test: SphereSensor;
    thankyou_note: BABYLON.Mesh;

    updateLoop: (dTimeMs: number) => {};

    timeStampStart_ms: number;

    ui: GameUI;

    loadingScreen: CustomLoadingScreen;
    menuScreen: MenuScreen;
    
    onPlayerDied(event: GameEvent) {
        if (!this.player.died) {
            setTimeout(()=> {
                this.player.reset();
            }, 3000);
            this.player.onDying(event);
            Logging.info("Player died:", event);
        }
    }

    onEvent(event: GameEvent) {
        if (event.data && event.data.hasOwnProperty("health")){
            let data = event.data as {health: string};
            this.ui.playerHealth.text = "\u2764 " + data.health;
        }

        if (event.type == "died") {
            this.onPlayerDied(event);
        }

        if (event.type == "sensor_activated") {
            Logging.debug(`Sensor activated:`, event );
            this.thankyou_note.setEnabled(true);
        }

        if (event.type == "sensor_deactivated") {
            Logging.debug(`Sensor deactivated:`, event);
            this.thankyou_note.setEnabled(false);
        }
    }

    constructor(
        engine: BABYLON.Engine, 
        canvas: HTMLCanvasElement,
        app: App) { 
        this.engine = engine;
        this.canvas = canvas;
        this.app = app;

        this.timeStampStart_ms = Date.now();

        this.loadingScreen = new CustomLoadingScreen();
        this.engine.loadingScreen = this.loadingScreen;
        
        this.menuScreen = new MenuScreen(this);

        // game state ---------------------------------------------------------
        this.debug_fly_mode = false;
        this.showDebugInfo = false;
        
        // Create the scene ---------------------------------------------------
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.gravity = new BABYLON.Vector3(0,-9.81, 0);
        this.scene.collisionsEnabled = true;
       
        // BABYLON.SceneLoader.OnPluginActivatedObservable.add(function (loader) {
        //     if (loader.name === "gltf") {
        //         // do something with the loader
        //         // Logging.info("GLTF_Loader:", loader);
                
        //         // does not work ???
        //         // loader.animationStartMode = 0;
                
        //         // loader.animationStartMode = BABYLON.GLTFLoaderAnimationStartMode.NONE;
        //         // loader.<option2> = <...>
        //     }
        // });


        if (BABYLON.Engine.audioEngine) {
            BABYLON.Engine.audioEngine.useCustomUnlockedButton = true;

            // Unlock audio on first user interaction.
            window.addEventListener('click', () => {
                if (BABYLON.Engine.audioEngine && !BABYLON.Engine.audioEngine.unlocked) {
                    BABYLON.Engine.audioEngine.unlock();
                }
            }, { once: true });
        }


        this.assetManager = new BABYLON.AssetsManager(this.scene);

        var thank_you_note_task = this.assetManager.addMeshTask(
            "thankyou_note", 
            "", 
            "./", 
            thankyounote_path);

        thank_you_note_task.onSuccess = (task) => {
            this.thankyou_note = task.loadedMeshes[0] as BABYLON.Mesh;
            this.scene.addMesh(this.thankyou_note);
            this.thankyou_note.position = new BABYLON.Vector3(
                -4,2.1,26.4);

            this.thankyou_note.scaling = new BABYLON.Vector3(1.6,1.6,1.6);
            this.thankyou_note.setEnabled(false);
        };

        // create the level to play in ----------------------------------------
        this.world = new GameWorld(this.scene, this.assetManager);

        this.sensor_test = new SphereSensor("sensor", 0.5, new BABYLON.Vector3(-3.5,0.0,23), this.scene);

        this.sensor_test.addGameEventListener(this);

        this.player = new Player(
            this.scene, 
            this.world, 
            this.assetManager);
        
        this.player.setPosition(this.world.player_start_position.clone());

        this.player.addGameEventListener(this);
        
        this.ui = new GameUI();

        // put debug functionality here 
        this.debug_view = new DebugView(
            this.scene, 
            canvas);
        
        this.assetManager.load();
                this.assetManager.onProgress = (remaing, total, task) => {
            this.loadingScreen.updateProgress(remaing, total, task)
        }
        this.assetManager.onFinish = () => {
            // notfiy game menu that game can be started now currently menu is just hidden
            // this.app.onReady();
            // this.start();
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
            // Logging.info("Event", keyEvent);
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

    start() {
        this.app.onStarted();
        Logging.info("Game started!");
        this.player.mHealth.setHealthPoints(100);
        this.resume();
    }

    pause() {
        this.paused = true;
        this.world.pause();
        Logging.info("Game paused!")
    }

    resume() {
        this.paused = false;
        this.world.resume();
    }


    mainloop(deltaTimeMs: number){
        var now_ms = Date.now(); 
        var elapsedTime_ms = now_ms - this.timeStampStart_ms;

        // fake physics screws up with large dt
        if(deltaTimeMs < 100) { 
            if(!this.paused){
                this.player.update(deltaTimeMs);
                this.sensor_test.update(this.player);
            }
        }
    }
}

export { Game };
  