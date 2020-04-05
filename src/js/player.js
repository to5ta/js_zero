var BABYLON = require('babylonjs');

import { PlayerCamera } from "./player_camera";

class Player {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this.falling = false;
        this.camera = new PlayerCamera(scene, canvas);
    }

    handleInput(keyEvent) {
        console.log("KeyEvent in Player:", event);
    }
}




export { Player };
