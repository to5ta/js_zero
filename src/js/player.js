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

        this.box = BABYLON.MeshBuilder.CreateSphere("PlayerSphere", {size: 1}, this.scene);
     
        this.box.position = new BABYLON.Vector3(0, 5, 0);
        
        this.box.checkCollisions = true;

        this.fallingVel = 0;
        this.speedMax = 0.1;
        this.acc = 0.1;
        this.damp = 0.1;

        this.inputVec = new BABYLON.Vector3(0, 0, 0);

        this.box.onCollideObservable.add((others) => {
            this.falling = false;
        });


    }

    handleInput(keyEvent) {
        console.log("KeyEvent in Player:", event);
        const keyReleased = keyEvent.type == "keydown";
        
        if (keyEvent.keyCode == 37){
            this.inputVec.z = keyReleased ? 1 : 0;
        }  if(keyEvent.keyCode == 39){
            this.inputVec.z = keyReleased ? -1 : 0;
        }  if(keyEvent.keyCode == 38){
            this.inputVec.x = keyReleased ? 1 : 0;
        }  if(keyEvent.keyCode == 40){
            this.inputVec.x = keyReleased ? -1 : 0;
        }
        if (this.inputVec.length > 0.9) {
            this.inputVec.normalize();
        }  
    
        if(keyEvent.keyCode == 32 && !this.falling){
            this.falling = true;
            this.fallingVel = 5;  
        }
        
        else if (keyEvent.type == "keyup") {
            this.inputVec = new BABYLON.Vector3(0, 0, 0);
        }        
    }
    
    update(dTimeMs) {
        this.inputVec = this.inputVec.multiplyByFloats(this.speed, this.speed, this.speed);
        let moveVec = this.inputVec.add(new BABYLON.Vector3(
            0,
            -0.1,
            0,
        ));
        this.box.moveWithCollisions(moveVec);
        
    }

    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }
}




export { Player };
