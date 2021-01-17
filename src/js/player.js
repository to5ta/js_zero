import * as BABYLON from "babylonjs";
import * as BABYLONGUI from "babylonjs-gui";
import 'babylonjs-loaders';

import player_model from "../assets/models/wache02.gltf";

import steps_sound from '../assets/sound/simple_steps.mp3';
import sprint_sound from '../assets/sound/simple_sprint.mp3';

import { KEYCODE } from "./key_codes";

import * as utils from "./utils";

class Player {
    constructor(scene, canvas, world, assetManager) {
        this.scene = scene;
        this.canvas = canvas;
        this.world = world;

        this.debug_mode = false;


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
            null,
            this.scene,
            true);

        this.camera.attachControl(this.canvas, true);
        this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
        this.camera.inputs.remove(this.camera.inputs.attached.mousewheel);

        this.camera.inputs.attached.pointers.angularSensibilityX = 1500;
        this.camera.inputs.attached.pointers.angularSensibilityY = 1500;

        this.camera.upperBetaLimit = 1.7;       // ca. horizont
        this.camera.lowerBetaLimit = 0;         // zenit

        // works but not completely satisfying 
        // this.camera.checkCollisions = true;
        // this.camera.collisionRadius = new BABYLON.Vector3(0.2, 0.2, 0.2);

        this.scene.activeCamera = this.camera;
        

        // physical representation --------------------------------------------
        this.characterWidth = 0.7;
        this.characterDepth = 0.3;
        this.characterHeight = 1.9;
        this.characterWeight = 75.0; //kg
        this.character = BABYLON.MeshBuilder.CreateSphere(
            "PlayerSphere", 
            {   
                diameterX: this.characterWidth,
                diameterY: this.characterHeight,
                diameterZ: this.characterDepth,
            }, 
            this.scene);
            
        this.character.position = this.world.player_start_position;
        
        this.character.checkCollisions = true;
        this.character.ellipsoid = new BABYLON.Vector3(
            this.characterWidth/2, 
            this.characterHeight/2, 
            this.characterDepth/2);
            
        this.character.material = new BABYLON.StandardMaterial();
        this.character.material.wireframe = true;            
        this.character.visibility = false;

        this.camera.lockedTarget = this.character;        
        
       
        
        var floatingDistToGround = 0.05;

        // basic axis / vector visualiation, belongs actually to world.....   -----------------------------------------------------------------------------------
        var vecX = new BABYLON.LinesBuilder.CreateLines("vecX", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(1,0,0)]});
        var vecY = new BABYLON.LinesBuilder.CreateLines("vecY", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,1,0)]});
        var vecZ = new BABYLON.LinesBuilder.CreateLines("vecZ", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,0,1)]});
        vecX.position.y = 0.01; vecY.position.y = 0.01; vecZ.position.y = 0.01;
        vecX.color = new BABYLON.Color4(1,0,0,1);
        vecY.color = new BABYLON.Color4(0,1,0,1);
        vecZ.color = new BABYLON.Color4(0,0,1,1);
        

        var charX = vecX.clone(); charX.parent = this.character;
        var charY = vecY.clone(); charY.parent = this.character;
        var charZ = vecZ.clone(); charZ.parent = this.character;
        this.charNormal = vecY.clone(); this.charNormal.parent = this.character; 
        this.charNormal.color = new BABYLON.Color4(0.08, 0.88, 0.99);
        this.charNormal.position.x = -0.02;
    
        this.checkCollisions = true;
        this.ellipsoid = new BABYLON.Vector3(
            this.characterWidth/2, 
            this.characterHeight/2-floatingDistToGround, 
            this.characterDepth/2);
    
        this.contactRay = new BABYLON.Ray(
            this.character.position,
            new BABYLON.Vector3(0, -1.0, 0));
        this.contactRay.length = 1.5;
    
        var charRay = vecY.clone(); charRay.parent = this.character; 
        charRay.scaling = new BABYLON.Vector3(0, -1.01, 0);
        charRay.color = new BABYLON.Color4(0.96, 1, 0);
    


        this.inputDirection = new BABYLON.Vector3(0,0,0);
        this.velocity = new BABYLON.Vector3(0,0,0);
        this.normal = new BABYLON.Vector3(0,1,0);
        this.slope = 0;
    
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




        // GUI --------------------------------------------------------------------------------------------------------------------
        var fullscreenUI = BABYLONGUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.guiText01 = new BABYLONGUI.TextBlock("guiTextBlock01", "");
        this.guiText01.color = "white";
        this.guiText01.textHorizontalAlignment = BABYLONGUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.guiText01.textVerticalAlignment = BABYLONGUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
        this.guiText01.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.guiText01.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.guiText01.fontFamily = "Courier New";
        this.guiText01.fontSize = "15pt"; 

        var slider = new BABYLONGUI.Slider("Hello");
        slider.horizontalAlignment = BABYLONGUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        slider.verticalAlignment = BABYLONGUI.Control.VERTICAL_ALIGNMENT_TOP;
        slider.height = "20px";
        slider.width = "200px";
        slider.onValueChangedObservable.add((number, eventState) => {
            platform.speed = number / 200 * 12;
        });

        fullscreenUI.addControl(this.guiText01); 
        fullscreenUI.addControl(slider);





        // player internal movement state -------------------------------------
        this.moveNormal = new BABYLON.Vector3(0,1,0);
        
        this.inputDirection = new BABYLON.Vector3(0, 0, 0);
        this.inputRotateY = 0;

        this.contactRay = new BABYLON.Ray(
            this.character.position,
            new BABYLON.Vector3(0, -1.1, 0));
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
            console.log("loaded player content ", assetTask);
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
            
            this.startIdleAni();
        }
 
        // debugging visualization ----------------------------------------------------------------
        this.debugInputEnd = BABYLON.MeshBuilder.CreateBox("debugInputDirBox", {
            size: 0.2,
        },
        this.scene);
        this.debugInputEnd.material = new BABYLON.StandardMaterial();
        this.debugInputEnd.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);

        this.debugStandingNormalEnd = BABYLON.MeshBuilder.CreateBox("debugStandingNormalEnd", {
            size: 0.2,
        },
        this.scene);
        this.debugStandingNormalEnd.material = new BABYLON.StandardMaterial();
        this.debugStandingNormalEnd.emissiveColor = new BABYLON.Color4(0, 1, 0, 1);

    }



    setDebug(debug) {
        this.debug_mode = debug;
        this.character.visibility = debug;

        if (debug) {
        } else {
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
        if (keyEvent.keyCode == KEYCODE.SPACEBAR && !this.falling && keyPressed){
            this.falling = true;
            if (this.animation && !this.jumpAni.isPlaying) {
                this.startJumpAni();
                this.jump = true;
                this.fallingVel = this.jumpSpeed * 80 / this.getTotalWeight();
            } 
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
    }


        

    // physical state calculations --------------------------------------------
    update(dTimeMs) {
        // preconditions
        const dTimeSec = dTimeMs / 1000;
        var sprintValid = this.sprinting && this.inputDirection.z == 1 && this.inputDirection.x == 0;

   
        // players raycast

        // collision detection for player ------------------------------------------------------------------------------------
        var externalPhysicalImpact = false;
        var pitch, roll; 
        var dist;

        var rayCastResults = [];
        const pick = this.contactRay.intersectsMeshes(
            this.world.collision_meshes, 
            false,
            rayCastResults);

        var rayCastToGroundHit = rayCastResults.length>0;

        // var standOnMovingPlatform = rayCastToGroundHit && rayCastResults[0].pickedMesh == platform && platform.moving != "pause";

        
        // move with 'statical'-moving objects such as platforms - not yet implemented ---------------------------------------





        // "collision response" for player -----------------------------------------------------------------------------------
        const velocityPhysics =  new BABYLON.Vector3(0,0,0);

        if (rayCastToGroundHit) {
            dist = rayCastResults[0].distance;
            var normal = rayCastResults[0].getNormal(true);
            this.normal = normal;
            utils.InjectVec3toLine(this.normal, this.charNormal);
            var slope = 
                Math.acos(BABYLON.Vector3.Dot(
                    this.normal, new BABYLON.Vector3.Up()));
            
            [pitch, roll] = utils.NormaltoSlopeXZ(normal);
            this.charNormal.rotationQuaternion = new BABYLON.Quaternion.RotationYawPitchRoll(-this.character.rotation.y, pitch, -roll);


            // we could also use slope here or other surface attributes such as "marked-as-sticky"
            if(dist - 0.05 <= this.characterHeight/2) {
                this.falling = false;
                this.character.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
            } 

            // trampoline impact - we dont have one
            // if (rayCastResults[0].pickedMesh == trampoline) {
            //     this.velocity.y = 10;
            //     externalPhysicalImpact = true;
            //     this.character.charNormal.rotationQuaternion = new BABYLON.Quaternion();
            // }

        } else {
            this.character.material.emissiveColor = new BABYLON.Color4(0, 1, 0, 1);
            this.falling = true;
        }
    
        if (this.jump) {
            this.jump = false;
            this.falling = true;
            this.velocity.y = this.jumpSpeed;
        }




        // copy rotation from camera orientation if camera was turned and player is about to be moved ---------------
        if(this.inputDirection.length() > 0.1){
            // this.character.rotation.y = Math.PI/2 - this.camera.alpha + Math.PI;
            this.character.rotation.y = Math.PI/2 - this.camera.alpha + Math.PI; 
        }

        // input form player + pyhsical interaction -----------------------------------------------------------------
        const velocityIntended = this.inputDirection
            .normalize()
            .scale(
                this.sprinting ? this.sprintSpeed : this.moveSpeed);

        // combine kinematic impacts such as gravity ----------------------------------------------------------------
        if (this.falling || externalPhysicalImpact) {
            velocityPhysics.y = this.velocity.y - 9.81 * dTimeSec;
            this.velocity.y = velocityPhysics.y;
        } else {
            this.velocity.y = 0.01;
        }

        const toWorld = new BABYLON.Matrix.RotationYawPitchRoll(
            this.character.rotation.y,
            0,
            0); 
        
        const moveCombined = velocityPhysics.add(
            BABYLON.Vector3.TransformCoordinates(velocityIntended, toWorld));

        // move the player based on input + physics
        this.character.moveWithCollisions(moveCombined.scale(dTimeSec));



        if (this.animation) {
            if (!this.falling && this.inputDirection.length() > 0.1) {
                if (sprintValid) {
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




        // update the character mesh
        if(this.mesh) {
            this.mesh.rotation = this.character.rotation;
            this.mesh.position.x = this.character.position.x;
            this.mesh.position.z = this.character.position.z;
            this.mesh.position.y = this.character.position.y - this.characterHeight/2;
        }
        if(this.inputDirection.length() > 0.1){
            this.mesh.rotation.y = Math.PI/2 - this.camera.alpha; // copy rotation from camera orientation
            //this.mesh.rotation.y = this.camera.alpha; // copy rotation from camera orientation
        }
        
        // reset camera distance in case it was moved (if collision detection is enabled on camera)
        if (this.camera.radius > 4.5) {
            this.camera.radius -= 0.1;
        }

        if (this.camera.radius < 4.5) {
            this.camera.radius += 0.1;
        }

        if(this.debug_mode) {
            // if(this.inputDirection.length() > 0) {
            //     this.debugInputEnd.position = this.character.position.add(
            //     BABYLON.Vector3.TransformCoordinates(
            //         this.inputDirection.scale(2), 
            //         rotation_matrix));
            // }

            // if(rayCastToGroundHit > 0) {
            //     this.debugStandingNormalEnd.position = this.character.position.add(
            //         results[0].getNormal(true))
            // };
        }
    }


    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }
}

export { Player };
