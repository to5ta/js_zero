var BABYLON = require('babylonjs');

class PlayerCamera {
    constructor(scene, canvas) {
        this.canvas = canvas;
        this.scene = scene;
      
        // Add a camera to the scene and attach it to the canvas
        this.camera = new BABYLON.ArcRotateCamera(
            "Camera", 
            Math.PI / 2,
            Math.PI / 2, 
            5,
            new BABYLON.Vector3(0,0,0), 
            this.scene);

        this.camera.position = new BABYLON.Vector3(-5, 2, 0);

        this.camera.attachControl(this.canvas, true);
        // this.camera = new BABYLON.UniversalCamera("Camera_asdf",
        //                                           new BABYLON.Vector3(2, 2, 2), 
        //                                           this.scene);

        this.scene.activeCamera = this.camera;
        this.camera.setTarget(BABYLON.Vector3.Zero());

    }

    activate() {
        this.scene.activeCamera =this.camera;
        this.camera.attachControl(this.canvas, true);
                
    }

    deactivate() {
        this.camera.detachControl(this.canvas);
    }

}




export { PlayerCamera };
