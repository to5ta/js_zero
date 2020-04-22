import * as BABYLON from "babylonjs";
import 'babylonjs-loaders';

class Player {
    constructor(scene, canvas, world, mesh) {
        this.scene = scene;
        this.canvas = canvas;
        this.world = world;
        
        // this.camera = new BABYLON.UniversalCamera(
        //     "Camera",
        //     new BABYLON.Vector3(5, 5, 0), 
        //     this.scene);
        
        this.camera = new BABYLON.FollowCamera("FollowCamera", new BABYLON.Vector3(0,0,0), this.scene);
        this.camera.radius = 5;
        this.camera.heightOffset = 1.7;
        this.camera.rotationOffset = 0;
        this.camera.maxCameraSpeed = 0.2;
        
        setTimeout(()=>{
            this.camera.maxCameraSpeed = 1;
        }, 2500);

        // this.camera.lowerHeightOffsetLimit = -0.5;
        // this.camera.upperHeightOffsetLimit = 10;
        // this.camera.lowerRotationOffsetLimit = -180;
        // this.camera.upperRotationOffsetLimit = 180;
        
        this.camera.rotation = new BABYLON.Vector3(0, 20, 0);
        // this.camera.positdion = new BABYLON.Vector3(10, 2, 0);
        this.camera.position = this.world.camera_start_position;
        
        // this.camera.attachControl(this.canvas, true);
        // this.camera.inputs.remove(this.camera.inputs.attached.keyboard);
        
        this.scene.activeCamera = this.camera;
                
        this.box = BABYLON.MeshBuilder.CreateBox("PlayerSphere", {size: 2}, this.scene);
        this.box.scaling.x = 0.5;
        this.box.scaling.z = 0.5;
        this.box.position = this.world.player_start_position;
        this.box.checkCollisions = true;
        this.box.material = new BABYLON.StandardMaterial();
        
        
        if (mesh) {
            this.mesh.rotation = this.box.rotation;
            // this.mesh.position = this.box.position;
        }

        this.camera.lockedTarget = this.box;        
        this.falling = true;
        this.fallingVel = 0;
        this.jumpSpeed = 7;
        this.moveVel = 0;
        this.moveSpeedMax = 5;  
        this.sprintSpeedMax = 12;
        this.rotateSpeedMax = 1.5;
        this.moveAcc = 0.1;
        this.moveDamp = 0.1;
        this.strafe = false;
        this.sprint = false;
        
        this.inputMoveVec = new BABYLON.Vector3(0, 0, 0);
        this.inputRotateY = 0;

        this.contactRay = new BABYLON.Ray(this.box.position,
            new BABYLON.Vector3(0, -1, 0));
        this.contactRay.length = 1.1;
        
                this.box.onCollideObservable.add((others) => {
            this.falling = false;
            console.log("Ground hit!");
        });        
    }

    attachMesh(mesh){
        this.box.visibility = false;
        this.mesh = mesh;
        // mesh.position = this.box.position;
        mesh.rotation = this.box.rotation;
    }

    handleInput(keyEvent) {
        // console.log("KeyEvent in Player:", event);
        
        const keyPressed = keyEvent.type == "keydown";
        
        if (keyEvent.keyCode == 37) {
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
        if (keyEvent.keyCode == 39) {
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
        if (keyEvent.keyCode == 38) {
            this.inputMoveVec.z = keyPressed ? -1 : 0;
        }  
        if (keyEvent.keyCode == 40) {
            this.inputMoveVec.z = keyPressed ? 1 : 0;
        }  
        if (keyEvent.keyCode == 32 && !this.falling && keyPressed){
            this.falling = true;
            this.fallingVel = this.jumpSpeed;  
        }
        if (keyEvent.keyCode == 17) {
            this.strafe = keyPressed ? true : false;
            if (keyPressed) {
                this.inputMoveVec.x = 0;
            }
        }      
        if (keyEvent.keyCode == 16) {
            this.sprint = keyPressed ? true : false;
        }      
    
        if (this.inputMoveVec.length > 0.9) {
            this.inputMoveVec.normalize();
        }  
    }
    
    update(dTimeMs) {
        const dTimeSec = dTimeMs / 1000;

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
            this.mesh.rotation = this.box.rotation;
            this.mesh.position.x = this.box.position.x;
            this.mesh.position.z = this.box.position.z;
            this.mesh.position.y = this.box.position.y - 0.9;
        }

        this.box.rotation.y += this.inputRotateY * this.rotateSpeedMax * dTimeSec;
    
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

        let speed = this.sprint ? this.sprintSpeedMax : this.moveSpeedMax;
        this.box.moveWithCollisions(
            this.fallVec.scale(dTimeSec).add(
                BABYLON.Vector3.TransformCoordinates(
                    this.inputMoveVec.scale(speed * dTimeSec), 
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
