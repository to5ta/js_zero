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

import { KEYCODE } from "./key_codes";

import * as utils from "./utils";

import GameWorld from './world';

import { CharacterVisualization } from "./CharacterVisualization";
import { CharacterPhysics } from "./CharacterPhysics";

class Player {
    scene: BABYLON.Scene;
    canvas: HTMLCanvasElement;
    world: GameWorld;
    debug_mode: boolean;
    distanceToCharacter: number;
    camera: BABYLON.ArcRotateCamera;
    
    mCharacter: CharacterVisualization;
    mPhysics: CharacterPhysics;

    rotation: BABYLON.Vector3;
    position: BABYLON.Vector3; 


    characterWidth: number;
    characterDepth: number;
    characterHeight: number;
    characterWeight: number;

    character: BABYLON.Mesh;
    charNormal: BABYLON.LinesMesh;
    checkCollisions: boolean;
    ellipsoid: BABYLON.Vector3;
    contactRay: BABYLON.Ray;

    inputDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    velocity: BABYLON.Vector3;
    normal: BABYLON.Vector3;
    slope: number;
    
    falling: boolean;
    climbing: boolean;
    sprinting: boolean;
    jump: boolean;
    jumpSpeed: number;
    moveSpeed: number;
    sprintSpeed: number;
    strafe: boolean;
    
    inputRotateY: number;

    sound_steps: BABYLON.Sound;
    sound_sprint: BABYLON.Sound;

    turningRate: any;
    fallingVel: number = 0;

    startTime: Date;

    onGroundContact(speed: number) {
        // TODO calc damage
    }

    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement, world: GameWorld, assetManager: BABYLON.AssetsManager ) {
        this.scene = scene;
        this.canvas = canvas;
        this.world = world;

        this.debug_mode = false;

        this.startTime = new Date();

        this.mCharacter = new CharacterVisualization(
            player_model,
            assetManager,
            scene,
            {
                "walk": {loop: true, speed: 1.3, from: 0.0, to: 1.0},
                "jump": {loop: false, speed: 1.0, from: 70/60, to: 90/60},
                "idle": {loop: true, speed: 1.0, from: 100/60, to: 160/60},
                "sprint": {loop: true, speed: 3.0, from: 190/60, to: 289/60}
            }
        ) 


        // state
        this.falling = true;
        this.climbing = false;
        this.sprinting = false;
        this.jump = false;
    
        // settings
        this.jumpSpeed = 7;
        this.moveSpeed = 6;
        this.sprintSpeed = 10;
        this.strafe = true; // always strafe



        this.mPhysics = new CharacterPhysics(this.moveSpeed, this.sprintSpeed, this.jumpSpeed, this.onGroundContact, world, this.mCharacter);


        
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
        this.character.visibility = Number(debug);

        if (debug) {
        } else {
        }
    }


    getTotalWeight() {
        return this.characterWeight; // + items later
    }


    // process player input ---------------------------------------------------
    handleInput(keyEvent: KeyboardEvent) {
        const keyPressed = keyEvent.type == "keydown";

        if (keyEvent.keyCode == KEYCODE.LEFT || keyEvent.keyCode == KEYCODE.A) {
            if (keyPressed) {
                if (this.strafe) {
                    this.inputDirection.x = -0.5;
                } else {
                    this.inputRotateY = this.turningRate;
                }
            } else {
                this.inputRotateY = 0;
                this.inputDirection.x = 0;
            }
        }  
        if (keyEvent.keyCode == KEYCODE.RIGHT || keyEvent.keyCode == KEYCODE.D) {
            if (keyPressed) {
                if (this.strafe) {
                    this.inputDirection.x = 0.5;
                } else {
                    this.inputRotateY = -this.turningRate;
                }
            } else {
                this.inputRotateY = 0;
                this.inputDirection.x = 0;
            }
        }  
        if (keyEvent.keyCode == KEYCODE.UP || keyEvent.keyCode == KEYCODE.W) {
            this.inputDirection.z = keyPressed ? 1 : 0;
        }  
        if (keyEvent.keyCode == KEYCODE.DOWN || keyEvent.keyCode == KEYCODE.S) {
            this.inputDirection.z = keyPressed ? -1 : 0;
        }  
        if (keyEvent.keyCode == KEYCODE.SPACEBAR && keyPressed){
            this.mPhysics.jump();
        }

        // if (keyEvent.keyCode == KEYCODE.CTRL) {
        //     this.strafe = keyPressed ? true : false;
        //     if (keyPressed) {
        //         // this.inputDirection.x = 0;
        //     }
        // }      

        if (keyEvent.keyCode == KEYCODE.SHIFT) {
            this.sprinting = keyPressed ? true : false;
        }
        
        
        this.mPhysics.normalizedLocalDirection = this.inputDirection;
        this.mPhysics.sprinting =  this.sprinting;

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
