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

        this.moveVec = new BABYLON.Vector3(0, -0.1, 0);
        this.speed = 0.1;

        this.box.onCollideObservable.add((others) => {
            this.falling = false;
        });


    }

    handleInput(keyEvent) {
        console.log("KeyEvent in Player:", event);

        this.moveVec = new BABYLON.Vector3(0, 0, 0);
        if (keyEvent.type == "keydown") {
            if (keyEvent.keyCode == 37){
                this.moveVec.z += 1;
            }  if(keyEvent.keyCode == 39){
                this.moveVec.z -= 1;
            }  if(keyEvent.keyCode == 38){
                this.moveVec.x += 1;
            }  if(keyEvent.keyCode == 40){
                this.moveVec.x -= 1;
            }  if(keyEvent.keyCode == 32 && !this.falling){
                this.falling = true;  
            }
            this.moveVec.normalize();
            this.moveVec = this.moveVec.multiplyByFloats(this.speed, this.speed, this.speed);
        }        
    }

    update() {
        this.box.moveWithCollisions(this.moveVec);
        
    }

    activate() {
        this.scene.activeCamera = this.camera;       
    }

    deactivate() {  
    }
}




export { Player };
