// import * as BABYLON from "babylonjs";
// import * as BABYLON from "babylonjs-gui";
// import 'babylonjs-loaders';
import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import "@babylonjs/loaders";

// import * as BABYLONLOADERS from "@babylonjs/loaders";


import steps_sound from '../assets/sound/simple_steps.mp3';
import sprint_sound from '../assets/sound/simple_sprint.mp3';
import player_model from "../assets/models/wache02.gltf";

import { GameWorld } from './world';

import { CharacterVisualization } from "./CharacterVisualization";
import { CharacterPhysics } from "./CharacterPhysics";
import { CharacterHealth } from "./CharacterHealth";

import { GameEvent, GameEventEmitter, GameEventListener } from "./GameEvent";


class Player extends GameEventEmitter implements GameEventListener {

    scene: BABYLON.Scene;
    canvas: HTMLCanvasElement;
    world: GameWorld;
    debug_mode: boolean;

    distanceToCharacter: number;
    camera: BABYLON.ArcRotateCamera;
    
    mCharacter: CharacterVisualization;
    mPhysics: CharacterPhysics;
    mHealth: CharacterHealth;

    inputDirectionBuffer: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    normal: BABYLON.Vector3;
    slope: number;
    
    jumpSpeed: number;
    moveSpeed: number;
    sprintSpeed: number;

    strafe: boolean;
    
    inputRotateY: number;
    turningRate: any;

    setHealth(hp: number) {
        this.mHealth.setHealthPoints(hp);
    }

    onEvent(event: GameEvent) {
        console.log(`Player received event of type: ${event.type}`);
        console.log(`Event has data: ${event.data!=null}`);
        if (event.data) console.log("data: ", event.data);
        this.emitEvent(event);
    }

    getPosition() : BABYLON.Vector3 {
        return this.mPhysics.getPosition();
    }

    getOrientation(): number {
        return this.mPhysics.getOrientation();
    }

    setPosition(position: BABYLON.Vector3) {
        if(this.mCharacter.finishedLoading()) {
            this.mCharacter.setPosition(position);
        }
    }
    
    setOrientation(anzimuth: number) {
        this.mPhysics.setOrientation(anzimuth);
        this.mCharacter.setOrientation(anzimuth);
    }

    onGroundContact(speed: number) {
        if(this.mHealth) {
            this.mHealth.dealFallDamage(speed);
            console.log(`Player has hit the ground at ${speed} m/s`);
        }
    }


    constructor(
        scene: BABYLON.Scene, 
        world: GameWorld, 
        assetManager: BABYLON.AssetsManager) {
        super();
        this.scene = scene;
        this.world = world;

        this.debug_mode = false;

        this.mHealth = new CharacterHealth(100);

        this.mHealth.addGameEventListener(this, "hp_changed");
        this.mHealth.addGameEventListener(this, "died");

        this.mCharacter = new CharacterVisualization(
            player_model,
            assetManager,
            scene,
            {
                "walk": {loop: true, speed: 1.3, from: 0.0, to: 1.0, soundfile: steps_sound},
                "jump": {loop: false, speed: 1.0, from: 70/60, to: 90/60},
                "idle": {loop: true, speed: 1.0, from: 100/60, to: 160/60},
                "sprint": {loop: true, speed: 3.0, from: 190/60, to: 289/60, soundfile: sprint_sound}
            }
        ) 


        // settings
        this.jumpSpeed = 7;
        this.moveSpeed = 6;
        this.sprintSpeed = 10;

        this.strafe = true; // always strafe


        this.mPhysics = new CharacterPhysics(this.moveSpeed, this.sprintSpeed, this.jumpSpeed, this, world, this.mCharacter);


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
        this.distanceToCharacter = 4.5;
        

        this.camera = new BABYLON.ArcRotateCamera(
            "PlayerCamera",
            -Math.PI/2,
            Math.PI/2,
            this.distanceToCharacter,
            BABYLON.Vector3.Zero(),
            this.scene,
            true);

        this.camera.attachControl(this.canvas, true);
        this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
        this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);

        this.camera.angularSensibilityX = 1500;
        this.camera.angularSensibilityY = 1500;

        this.camera.upperBetaLimit = 1.7;       // ca. horizont
        this.camera.lowerBetaLimit = 0;         // zenit

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
        return this.mPhysics.weight; // + items later
    }


    // process player input ---------------------------------------------------
    handleInput(keyEvent: KeyboardEvent) {
        const keyPressed = keyEvent.type == "keydown";

        if (keyEvent.key == "ArrowLeft" || keyEvent.key == "a") {
            if (keyPressed) {
                if (this.strafe) {
                    this.inputDirectionBuffer.x = -0.5;
                } else {
                    this.inputRotateY = this.turningRate;
                }
            } else {
                this.inputRotateY = 0;
                this.inputDirectionBuffer.x = 0;
            }
        }  
        if (keyEvent.key == "ArrowRight" || keyEvent.key == "d") {
            if (keyPressed) {
                if (this.strafe) {
                    this.inputDirectionBuffer.x = 0.5;
                } else {
                    this.inputRotateY = -this.turningRate;
                }
            } else {
                this.inputRotateY = 0;
                this.inputDirectionBuffer.x = 0;
            }
        }  
        if (keyEvent.key == "ArrowUp" || keyEvent.key == "w") {
            this.inputDirectionBuffer.z = keyPressed ? 1 : 0;
        }  
        if (keyEvent.key == "ArrowDown" || keyEvent.key == "s") {
            this.inputDirectionBuffer.z = keyPressed ? -1 : 0;
        }  
        if (keyEvent.key == " " && keyPressed){
            this.mPhysics.jump();
        }

        // if (keyEvent.key == "CTRL") {
        //     this.strafe = keyPressed ? true : false;
        //     if (keyPressed) {
        //         // this.inputDirection.x = 0;
        //     }
        // }      

        if (keyEvent.key == "Shift") {
            this.mPhysics.sprinting = keyPressed ? true : false;
        }
        
        this.mPhysics.normalizedLocalDirection = this.inputDirectionBuffer;
    }


    // physical state calculations --------------------------------------------
    update(dTimeMs: number) {
        // preconditions
        const dTimeSec = dTimeMs / 1000;

        this.mPhysics.setOrientation(Math.PI/2 - this.camera.alpha + Math.PI);
        this.mPhysics.update(dTimeMs);
    }


    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }
}

export { Player };
