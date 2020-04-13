var BABYLON = require('babylonjs');

class Player {
    constructor(scene, canvas, world) {
        this.scene = scene;
        this.canvas = canvas;
        this.falling = false;

        this.camera = new BABYLON.UniversalCamera(
            "Camera",
            new BABYLON.Vector3(5, 5, 0), 
            this.scene);
                    
        this.camera.position = new BABYLON.Vector3(-10, 2, 0);
        this.scene.activeCamera = this.camera;
        this.camera.setTarget(BABYLON.Vector3.Zero());

        this.box = BABYLON.MeshBuilder.CreateBox("GroundBox", {size: 1}, this.scene);
        this.box.position = new BABYLON.Vector3(0,1, 0);
        
        this.box.physicsImpostor = new BABYLON.PhysicsImpostor(this.box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0.9 }, scene);
        this.box.physicsImpostor.registerOnPhysicsCollide(
            world.plane.physicsImpostor, 
            (self_obj, other_obj) => {
                this.falling = false;
                console.log("hit ground");
        });
    }

    handleInput(keyEvent) {
        console.log("KeyEvent in Player:", event);
        let moveVec = new BABYLON.Vector3(0);
        
        if (keyEvent.keyCode == 37){
            moveVec.z += 1;
        } else if(keyEvent.keyCode == 39){
            moveVec.z -= 1;
        } else if(keyEvent.keyCode == 38){
            moveVec.y += 1;
        } else if(keyEvent.keyCode == 40){
            moveVec.y -= 1;
        } else if(keyEvent.keyCode == 32 && !this.falling){
            let jumpVec = new BABYLON.Vector3(0,5,0);
            this.box.physicsImpostor.applyImpulse(jumpVec, this.box.position);
            console.log("Jump")
            this.falling = true; 
        }
        this.update();
    }

    update() {
        this.box.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0,0,0));
    }

    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }
}




export { Player };
