var BABYLON = require('babylonjs');

class Player {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this.falling = false;

        this.camera = new BABYLON.UniversalCamera(
            "Camera",
            new BABYLON.Vector3(5, 5, 0), 
            this.scene);
                    
        this.camera.position = new BABYLON.Vector3(-5, 2, 0);
        this.scene.activeCamera = this.camera;
        this.camera.setTarget(BABYLON.Vector3.Zero());
    }

    handleInput(keyEvent) {
        console.log("KeyEvent in Player:", event);
        // this.camera.
    }

    activate() {
        this.scene.activeCamera = this.camera;       
    }

    activate() {
        this.scene.activeCamera =this.camera;       
    }

    deactivate() {  
    }
}




export { Player };
