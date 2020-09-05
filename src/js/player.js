import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';

import player_model from "../assets/models/wache02.gltf";

import steps_sound from '../assets/sound/simple_steps.mp3';
import sprint_sound from '../assets/sound/simple_sprint.mp3';


class Player {
    constructor(scene, canvas, world, assetManager) {
        this.scene = scene;
        this.canvas = canvas;
        this.world = world;

        
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
        
        
        this.camera = new BABYLON.ArcRotateCamera(
            "PlayerCamera",
            Math.PI/2,
            Math.PI/2,
            4.5,
            null,
            this.scene,
            true);

        this.camera.attachControl(this.canvas, true);
        this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
        this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);

        this.camera.inputs.attached.pointers.angularSensibilityX = 1000;
        this.camera.inputs.attached.pointers.angularSensibilityY = 1000;

        this.camera.upperBetaLimit = 1.9; // 1.5;
        this.camera.lowerBetaLimit = 0;
        // this.camera.checkCollisions = true;
        // console.log("attached inputs", this.camera.inputs.attached);


        this.scene.activeCamera = this.camera;
        
        
        // physical representation --------------------------------------------
        this.characterBox = BABYLON.MeshBuilder.CreateBox(
            "PlayerSphere", 
            {   
                size: 2
            }, 
            this.scene);
            
        this.characterWidth = 0.7;
        this.characterDepth = 0.3;
        this.characterHeight = 1.9;
        this.characterWeight = 75.0; //kg

        this.characterBox.scaling.x = this.characterWidth/2;
        this.characterBox.scaling.z = this.characterDepth/2;
        this.characterBox.position = this.world.player_start_position;
        this.characterBox.checkCollisions = true;
        this.characterBox.ellipsoid = new BABYLON.Vector3(
            this.characterWidth/2, 
            this.characterHeight/2, 
            this.characterDepth/2);
        this.characterBox.material = new BABYLON.StandardMaterial();
        this.camera.lockedTarget = this.characterBox;        
        
        this.characterBox.onCollideObservable.add((others) => {
            this.falling = false;
            // console.log("Ground hit!");
        });        
    
        // player internal movement state -------------------------------------
        this.falling = true;
        this.fallingVel = 0;
        this.jumpSpeed = 10;
        this.moveVel = 0;
        this.moveSpeedMax = 5;  
        this.sprintSpeedMax = 12;
        this.rotateSpeedMax = 2;
        this.moveAcc = 0.1;
        this.moveDamp = 0.1;
        this.strafe = true; // always strafe
        this.sprint = false;
        
        this.inputMoveVec = new BABYLON.Vector3(0, 0, 0);
        this.inputRotateY = 0;

        this.contactRay = new BABYLON.Ray(
            this.characterBox.position,
            new BABYLON.Vector3(0, -1, 0));
        this.contactRay.length = this.characterHeight/2 + 0.01;

        // sounds
        this.sound_steps = new BABYLON.Sound("Steps", steps_sound, scene, null, {
            loop: true,
            autoplay: false
          });
        
        this.sound_sprint = new BABYLON.Sound("Sprint", sprint_sound, scene, null, {
            loop: true,
            autoplay: false
        });

        // visual representation ----------------------------------------------
        this.mesh = null;
        var assetTask = assetManager.addMeshTask(
            "PlayerModel", 
            null, 
            './', 
            player_model);
        
        assetTask.onSuccess = () => {
            this.mesh = assetTask.loadedMeshes[0];
            this.animation = assetTask.loadedAnimationGroups[0];
            
            world.shadowGenerator.addShadowCaster(this.mesh);
      
            this.walkAni = this.animation.start();
            this.walkAni.stop();
            this.jumpAni = this.walkAni.clone();
            this.jumpAni.stop();
            this.idleAni = this.walkAni.clone();
            this.idleAni.stop();
            this.sprintAni = this.walkAni.clone();
            this.sprintAni.stop();
            
            this.characterBox.visibility = false;
            this.startIdleAni();
        }

    }

    getTotalWeight() {
        return this.characterWeight; // + items later
    }

    startWalkAni() {
        this.jumpAni.stop();
        this.idleAni.stop();
        this.sprintAni.stop();
        this.walkAni = this.walkAni.start(true, 1.3, 0.0, 1.0, false);
        this.sound_steps.play();  
        this.sound_sprint.pause();      
    }

    startJumpAni() {
        this.walkAni.stop();
        this.idleAni.stop();
        this.sprintAni.stop();
        this.jumpAni = this.jumpAni.start(false, 1.0, 70/60, 90/60, false);
        this.sound_steps.pause();
        this.sound_sprint.pause();
    }

    startIdleAni() {
        this.walkAni.stop();
        this.jumpAni.stop();
        this.sprintAni.stop();
        this.idleAni = this.idleAni.start(true, 1.0, 100/60, 160/60, false);
        this.sound_steps.pause();
        this.sound_sprint.pause();
    }

    startSprintAni() {
        this.walkAni.stop();
        this.jumpAni.stop();
        this.idleAni.stop();
        this.sprintAni = this.sprintAni.start(true, 3.0, 190/60, 289/60, false);
        this.sound_steps.pause();
        this.sound_sprint.play();
    }

    // process player input ---------------------------------------------------
    handleInput(keyEvent) {
        const keyPressed = keyEvent.type == "keydown";

        if (keyEvent.keyCode == 37 || keyEvent.keyCode == 65) {
            if (keyPressed) {
                if (this.strafe) {
                    this.inputMoveVec.x = 1;
                } else {
                    this.inputRotateY = -1;
                }
            } else {
                this.inputRotateY = 0;
                this.inputMoveVec.x = 0;
            }
        }  
        if (keyEvent.keyCode == 39 || keyEvent.keyCode == 68) {
            if (keyPressed) {
                if (this.strafe) {
                    this.inputMoveVec.x = -1;
                } else {
                    this.inputRotateY = 1;
                }
            } else {
                this.inputRotateY = 0;
                this.inputMoveVec.x = 0;
            }
        }  
        if (keyEvent.keyCode == 38 || keyEvent.keyCode == 87) {
            this.inputMoveVec.z = keyPressed ? -1 : 0;
        }  
        if (keyEvent.keyCode == 40 || keyEvent.keyCode == 83) {
            this.inputMoveVec.z = keyPressed ? 1 : 0;
        }  
        if (keyEvent.keyCode == 32 && !this.falling && keyPressed){
            this.falling = true;
            this.fallingVel = this.jumpSpeed * 80 / this.getTotalWeight();
            if (this.animation && !this.jumpAni.isPlaying) {
                this.startJumpAni();
            } 
        }
        // if (keyEvent.keyCode == 17) {
        //     this.strafe = keyPressed ? true : false;
        //     if (keyPressed) {
        //         this.inputMoveVec.x = 0;
        //     }
        // }      
        if (keyEvent.keyCode == 16) {
            this.sprint = keyPressed ? true : false;
        }      
    
        if (this.inputMoveVec.length > 0.9) {
            this.inputMoveVec.normalize();
        }  
    }
    

    // physical state calculations --------------------------------------------
    update(dTimeMs) {
        const dTimeSec = dTimeMs / 1000;

        // TODO
        // detailed movement model using accelerations
        // console.log("Contact: ", this.contactRay.intersectsMesh(this.world.plane, false));

        // this.moveVel += this.inputVec.scale(dTimeSec);

        // if (this.moveVel > this.moveSpeedMax) {
        //     this.moveVel.normalize().scale(this.moveSpeedMax);
        // }

        // if(this.moveAcc > 0)

        // const localInput = new BABYLON.Vector3(
        //     Math.sin(this.box.rotation.y),
        //     0,
        //     Math.cos(this.box.rotation.y)
        // );
        
        if(this.mesh) {
            this.mesh.rotation = this.characterBox.rotation;
            this.mesh.position.x = this.characterBox.position.x;
            this.mesh.position.z = this.characterBox.position.z;
            this.mesh.position.y = this.characterBox.position.y - 0.9;
        }
    
        const rotation_matrix = new BABYLON.Matrix.RotationYawPitchRoll(
            this.characterBox.rotation.y,
            0,
            0);
        
        if (this.falling) {
            this.fallingVel += (this.world.gravity * dTimeSec* 2);
        } else {
            this.fallingVel = -0.01;
        }

        this.fallVec = new BABYLON.Vector3(
            0,
            this.fallingVel,
            0);
        
        if(this.inputMoveVec.length() > 0.1){
            this.mesh.rotation.y = Math.PI/2 -  this.camera.alpha; // copy rotation from camera orientation
        }

        if (this.animation) {
            if (!this.falling && this.inputMoveVec.length() > 0.1) {
                if (this.sprint) {
                    if (!this.sprintAni.isPlaying) {
                        this.startSprintAni();
                    }
                } else {
                    if (!this.walkAni.isPlaying) {
                        this.startWalkAni();
                    }
                }

            } else {
                if (!this.idleAni.isPlaying && !this.falling) {
                    this.startIdleAni();
                }
            }
        }

        let speed = this.sprint ? this.sprintSpeedMax : this.moveSpeedMax;
        this.characterBox.moveWithCollisions(
            this.fallVec.scale(dTimeSec).add(
                BABYLON.Vector3.TransformCoordinates(
                    this.inputMoveVec.scale(speed * dTimeSec), 
                    rotation_matrix)));

        const pick = this.contactRay.intersectsMeshes(
            this.world.collision_meshes, 
            false);
            
        if (this.characterBox && pick.length) {
            this.characterBox.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
            this.falling = false;
        } else {
            this.characterBox.material.emissiveColor = new BABYLON.Color4(0, 1, 0, 1);
            this.falling = true;
        }
    }

    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }
}

export { Player };
