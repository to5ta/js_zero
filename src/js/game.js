import { Player } from './player';
import World from './world';

class Game {
    constructor(engine, canvas) { 
        this.engine = engine;
        this.canvas = canvas;
        
        // Create the scene space
        this.scene = new BABYLON.Scene(this.engine);
        this.world = new World(this.scene);

        // the Level should create the scene, players etc. will be added to that scene / within that

        this.player = new Player();
        
        // Add a camera to the scene and attach it to the canvas
        this.camera = new BABYLON.ArcRotateCamera("Camera", 
                                                Math.PI / 2,
                                                Math.PI / 2, 
                                                5,
                                                new BABYLON.Vector3(0,0,0), 
                                                this.scene);

        this.camera.position = new BABYLON.Vector3(-5, 2, 0);
        this.scene.activeCamera = this.camera;
        
        this.camera.attachControl(this.canvas, true);
        // this.camera = new BABYLON.UniversalCamera("Camera_asdf",
        //                                           new BABYLON.Vector3(2, 2, 2), 
        //                                           this.scene);

        this.debug_camera = new BABYLON.UniversalCamera("Debug_Camera", new BABYLON.Vector3(0,0,0), this.scene);


        this.camera.setTarget(BABYLON.Vector3.Zero());

        // Add and manipulate meshes in the scene
        // var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:1}, this.scene);
        // sphere.position = new BABYLON.Vector3(0, 0.5, 0);
        // this.camera.setTarget(sphere.position);

        var mypoints = [
        new BABYLON.Vector3(0,2,0),
            new BABYLON.Vector3(1,2,0)];

        var line = BABYLON.Mesh.CreateLines("lines", mypoints, this.scene, true);
        line.thick;
        // var dashedline = BABYLON.LinesBuilder.CreateDashedLines('myline', {points: mypoints}, null, null, null, this.scene);
        this.debug_mode = false;
        this.paused = false;

    }

    //TODO forward to debug camera / player and its camera
    handleInput(event) {
        console.log("Input: ", event);
        console.log("ME ", this);
        if(event.keyCode == 67) { 
            this.debug_mode = !this.debug_mode;
            if (this.debug_mode) {
                this.scene.activeCamera = this.debug_camera;
                this.debug_camera.attachControl(this.canvas, true);
                this.camera.detachControl(this.canvas);
                this.player.detachControl(this.canvas);
            } else {
                this.scene.activeCamera =this.camera;
                this.camera.attachControl(this.canvas, true);
                this.debug_camera.detachControl(this.canvas);
                this.player.attachControl(this.canvas);
            }
            this.menu.debug_text.innerHTML = this.debug_mode ? "Debug" : "Player";
        }
    }

    renderloop(self) {
        this.game.scene.render();
    }
}
  
export { Game };
  