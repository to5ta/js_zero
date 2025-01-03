import * as BABYLON from "@babylonjs/core";

class DebugView {
    canvas: HTMLCanvasElement;
    scene: BABYLON.Scene;
    debug_camera: any;

    constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.scene = scene;

        this.debug_camera = new BABYLON.UniversalCamera(
            "Debug_Camera", 
            new BABYLON.Vector3(0,0,0), 
            this.scene);
    }

    activate() {
        this.debug_camera.attachControl(this.canvas, true);
        this.scene.activeCamera = this.debug_camera;
    }

    deactivate() {
        this.debug_camera.detachControl(this.canvas);
    }

}

export { DebugView };
