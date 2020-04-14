import { _BabylonLoaderRegistered } from 'babylonjs';

var BABYLON = require('babylonjs');

class Player {
    constructor(scene, canvas, world) {
        this.scene = scene;
        this.canvas = canvas;
        this.world = world;
        
        // this.camera = new BABYLON.UniversalCamera(
            //     "Camera",
        //     new BABYLON.Vector3(5, 5, 0), 
        //     this.scene);
        
        this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0,0,0), this.scene);
        this.camera.radius = 10;
        this.camera.heightOffset = 3;
        this.camera.rotationOffset = 0;
        this.camera.maxCameraSpeed = 1;
        // this.camera.position = new BABYLON.Vector3(10, 2, 0);
        // this.camera.positdion = new BABYLON.Vector3(10, 2, 0);
        
        
        // this.camera.inputs.removeByType('FollowCamKeyboardInput');
        // this.camera.attachControl(this.canvas, true);
        
        this.scene.activeCamera = this.camera;
                
        this.box = BABYLON.MeshBuilder.CreateBox("PlayerSphere", {size: 2}, this.scene);
        this.box.scaling.x = 0.5;
        this.box.scaling.z = 0.5;
        this.box.position = new BABYLON.Vector3(0,  5, 0);
        this.box.checkCollisions = true;
        this.box.material = new BABYLON.StandardMaterial();
        
        this.camera.lockedTarget = this.box;
        
        this.falling = true;
        this.fallingVel = 0;
        
        this.moveVel = 0;
        this.moveSpeedMax = 0.1;
        this.moveAcc = 0.1;
        this.moveDamp = 0.1;
        this.strafe = false;

        this.contactRay = new BABYLON.Ray(this.box.position,
            new BABYLON.Vector3(0, -1, 0));
        this.contactRay.length = 1.1;
        
        this.inputVec = new BABYLON.Vector3(0, 0, 0);
        
        this.box.onCollideObservable.add((others) => {
            this.falling = false;
            console.log("Ground hit!");
        });        
    }

    handleInput(keyEvent) {
        console.log("KeyEvent in Player:", event);
        
        const keyPressed = keyEvent.type == "keydown";
        if (keyEvent.keyCode == 37){
            if (this.strafe) {
                this.inputVec.x = keyPressed ? 1 : 0;
            } else {
                this.box.rotation.y -= 0.05;
            }
        }  if(keyEvent.keyCode == 39){
            if (this.strafe) {
                this.inputVec.x = keyPressed ? -1 : 0;
            } else {
                this.box.rotation.y += 0.05;
            }
        }  if(keyEvent.keyCode == 38){
            this.inputVec.z = keyPressed ? -1 : 0;
        }  if(keyEvent.keyCode == 40){
            this.inputVec.z = keyPressed ? 1 : 0;
        }  if(keyEvent.keyCode == 32 && !this.falling){
            this.falling = true;
            this.fallingVel = 7;  
        }  if (keyEvent.keyCode == 16) {
            this.strafe = keyPressed ? true : false;
            if (keyPressed) {
                this.inputVec.x = 0;
            }
        }      
    
        if (this.inputVec.length > 0.9) {
            this.inputVec.normalize();
        }  
    }
    
    update(dTimeMs) {
        const dTimeSec = dTimeMs / 1000;

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

        const rotation_matrix = new BABYLON.Matrix.RotationYawPitchRoll(
            this.box.rotation.y,
            0,
            0
        );
        

        if (this.falling) {
            this.fallingVel += (this.world.gravity * dTimeSec);
        } else {
            this.fallingVel = -0.01;
        }

        this.fallVec = new BABYLON.Vector3(
            0,
            this.fallingVel,
            0);

        this.box.moveWithCollisions(
            this.fallVec.scale(dTimeSec).add(
                BABYLON.Vector3.TransformCoordinates(
                    this.inputVec.scale(3*dTimeSec), 
                    rotation_matrix)));

        const pick = this.contactRay.intersectsMeshes(this.world.collision_meshes, false);
        if (this.box && pick.length) {
            this.box.material.emissiveColor = new BABYLON.Color4(1, 0, 0, 1);
            this.falling = false;
        } else {
            this.box.material.emissiveColor = new BABYLON.Color4(0, 1, 0, 1);
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
