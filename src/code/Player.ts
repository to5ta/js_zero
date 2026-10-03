import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import "@babylonjs/loaders";

// import * as BABYLONLOADERS from "@babylonjs/loaders";

import steps_sound from '../assets/sound/simple_steps.mp3';
import sprint_sound from '../assets/sound/simple_sprint.mp3';
import player_model from '../assets/models/wache02.glb';

import { GameWorld } from './world';

import { CharacterVisualization } from "./CharacterVisualization";
import { CharacterController, ControllerConfig } from "./CharacterController";
import { CharacterHealth } from "./CharacterHealth";

import { Logging } from "./common/Logging";
import { GameEvent, GameEventHandler, GameEventType } from "./common/GameEvent";
import { Environment } from "./environment";
import { PlayerConfig } from "./config/PlayerConfig";

class Player {

    scene: BABYLON.Scene;
    canvas: HTMLCanvasElement;
    world: GameWorld;
    debug_mode: boolean;

    distanceToCharacter: number;
    camera: BABYLON.ArcRotateCamera;
    
    mCharacter: CharacterVisualization;
    mPhysics: CharacterController;
    mHealth: CharacterHealth;

    inputDirectionBuffer: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    normal: BABYLON.Vector3;
    slope: number;
   
    died = false;
    weight: any;

    private boundOnEvent: (gameEvent: GameEvent) => void;

    getPosition() : BABYLON.Vector3 {
        return this.mPhysics.getPosition();
    }

    getOrientation(): number {
        return this.mPhysics.getOrientation();
    }

    setPosition(position: BABYLON.Vector3) {
        if(this.mCharacter.finishedLoading()) {
            this.mPhysics.setPosition(position.clone());
            this.mCharacter.setPosition(position.clone());
        }
    }
    
    setOrientation(anzimuth: number) {
        this.mPhysics.setOrientation(anzimuth);
        this.mCharacter.setOrientation(anzimuth);
    }

    onGroundContact(speed: number) {
        if(this.mHealth) {
            this.mHealth.dealFallDamage(speed);
        }
    }

    onDying(event: GameEvent) {
        this.mCharacter.play("dieOnFall");
        Logging.info("start dying animation...");
        this.inputDirectionBuffer = BABYLON.Vector3.Zero();
        this.mPhysics.reset();
        this.died = true;
    }

    onEvent(gameEvent: GameEvent): void {
        
    }


    reset() {
        this.died = false;
        this.camera.alpha = -Math.PI/2;
        this.setOrientation(-Math.PI);
        this.mHealth.setHealthPoints(PlayerConfig.health.total);
        this.inputDirectionBuffer = BABYLON.Vector3.Zero();
        this.setPosition(this.world.player_start_position.clone());
    }


    constructor(
        scene: BABYLON.Scene, 
        world: GameWorld, 
        assetManager: BABYLON.AssetsManager) {
        this.scene = scene;
        this.world = world;

        this.debug_mode = false;
        
        this.mHealth = new CharacterHealth(PlayerConfig.health.total);

        this.boundOnEvent = this.onEvent.bind(this);
        GameEventHandler.addGameEventsListener([GameEventType.PlayerHealthChanged, GameEventType.PlayerDied], this.boundOnEvent);

        this.mCharacter = new CharacterVisualization(
            player_model,
            assetManager,
            scene,
            {
                "walk": {loop: true, speed: 1.3, from: 0, to: 100, soundfile: steps_sound},
                "jump": {loop: false, speed: 1.0, from: 0, to: 100},
                "idle": {loop: true, speed: 0.5, from: 0, to: 100},
                "fall": {loop: true, speed: 1.5, from: 0, to: 100},
                "sprint": {loop: true, speed: 1.5, from: 0, to: 100, soundfile: sprint_sound},
                "dieOnFall": {loop: false, speed: 1.0, from: 0, to: 100}
            }); 
            
            
            var ctrlConfig: ControllerConfig = {
                jumpSpeed: PlayerConfig.physics.jumpSpeed,
                moveSpeed: PlayerConfig.physics.moveSpeed,
                sprintSpeed: PlayerConfig.physics.sprintSpeed,
                width: PlayerConfig.physics.width,
                depth: PlayerConfig.physics.depth,
                height: PlayerConfig.physics.height,
                weight: PlayerConfig.physics.weight
            };
            this.mPhysics = new CharacterController(ctrlConfig, this, world, this.mCharacter);
            
            
            // CAMERA ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            
            // 3rd person camera for player ---------------------------------------
            // this.camera = new BABYLON.FollowCamera(
                //     "FollowCamera", 
                //     new BABYLON.Vector3(0,0,0), 
                //     this.scene);
                // this.camera.radius = 5;
                // this.camera.heightOffset = 1.7;
                // this.camera.rotationOffset = 0;
                // this.camera.maxCameraSpeed = 1;
                // // this.camera.lowerHeightOffsetLimit = -0.5;
                // // this.camera.upperHeightOffsetLimit = 10;
                // // this.camera.lowerRotationOffsetLimit = -180;
                // // this.camera.upperRotationOffsetLimit = 180;
                // this.camera.rotation = new BABYLON.Vector3(0, 20, 0);
                // this.camera.position = this.world.camera_start_position;
                // // this.camera.attachControl(this.canvas, true);
                
                // we can tweak that value later for narrow parts of the map / indoor scenes
                if (Environment.isMobile) {
                    this.distanceToCharacter = PlayerConfig.camera.distanceMobile;
                } else {
                    this.distanceToCharacter = PlayerConfig.camera.distanceDesktop;
                }
                
                
                this.camera = new BABYLON.ArcRotateCamera(
                    "PlayerCamera",
                    -Math.PI/2,
                    Math.PI/2,
                    this.distanceToCharacter,
                    BABYLON.Vector3.Zero(),
                    this.scene,
                    true);
                    
                    if(!Environment.isMobile) {
                        this.camera.attachControl(this.canvas, true);
                    }
                    this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
                    this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);
                    
                    this.camera.angularSensibilityX = PlayerConfig.camera.angularSensibilityX;
                    this.camera.angularSensibilityY = PlayerConfig.camera.angularSensibilityY;
                    
                    this.camera.upperBetaLimit = PlayerConfig.camera.upperBetaLimit;       // ca. horizont
                    this.camera.lowerBetaLimit = PlayerConfig.camera.lowerBetaLimit;         // zenit
                    
                    // works but not completely satisfying 
        // this.camera.checkCollisions = true;
        // this.camera.collisionRadius = new BABYLON.Vector3(0.2, 0.2, 0.2);
        
        this.scene.activeCamera = this.camera;
        
        this.camera.lockedTarget = this.mPhysics.imposter;        
    }
    
    
    setDebug(debug : boolean) {
        this.debug_mode = debug;
        
        if (debug) {
        } else {
        }
    }


    getTotalWeight() {
        return this.weight; // + items later
    }


    // process player input ---------------------------------------------------
    handleInput(keyEvent: KeyboardEvent) {
        if (!this.died) {
            this.mPhysics.handleKeyEvent(keyEvent);
        }
    }


    // physical state calculations --------------------------------------------
    update(dTimeMs: number) {
        // preconditions
        const dTimeSec = dTimeMs / 1000;

        if(!this.died) {
            if(!Environment.isMobile) {
                this.mPhysics.setOrientation(Math.PI/2 - this.camera.alpha + Math.PI);
            }
            this.mPhysics.update(dTimeMs);
        }
    }


    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }

    dispose() {
        // Cleanup event listeners
        GameEventHandler.removeGameEventListener(GameEventType.PlayerHealthChanged, this.boundOnEvent);
        GameEventHandler.removeGameEventListener(GameEventType.PlayerDied, this.boundOnEvent);
        
        // Dispose 3D objects
        if (this.mPhysics) {
            this.mPhysics.dispose();
        }
        if (this.mCharacter) {
            this.mCharacter.dispose();
        }
        if (this.camera) {
            this.camera.dispose();
        }
    }
}

export { Player };
