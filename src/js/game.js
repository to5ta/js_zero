import { Player } from './player';
import World from './world';
import { DebugView } from "./debug_view";

window.CANNON = require('cannon');
// window.Ammo = require('ammo.js');

class Game {
    constructor(engine, canvas) { 
        this.engine = engine;
        this.canvas = canvas;
        this.canvas.focus();

        // Create the scene space
        this.scene = new BABYLON.Scene(this.engine);

        this.scene.gravity = BABYLON.Vector3(0,-9.81, 0);
        this.scene.collisionsEnabled = true;

        // TODO why does ammo.js not work / fs not found error
        // var physicsPlugin = new BABYLON.AmmoJSPlugin();
        // this.scene.enablePhysics(gravityVector, physicsPlugin);
        
    
        // the Level should create the scene, players etc. will be added to that scene / within that
        this.world = new World(this.scene);

        this.player = new Player(this.scene, canvas, this.world);
        this.debug_view = new DebugView(this.scene, canvas);
        

        // Add and manipulate meshes in the scene
        // var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:1}, this.scene);
        // sphere.position = new BABYLON.Vector3(0, 0.5, 0);
        // this.camera.setTarget(sphere.position);



        var mypoints = [
        new BABYLON.Vector3(0,2,0),
            new BABYLON.Vector3(1,2,0)];

        var line = BABYLON.Mesh.CreateLines("lines", mypoints, this.scene, true);
        // line.thick;
        // var dashedline = BABYLON.LinesBuilder.CreateDashedLines('myline', {points: mypoints}, null, null, null, this.scene);
        this.debug_mode = false;
        this.paused = false;
    }

    //TODO forward to debug camera / player and its camera
    handleInput(keyEvent) {
        if(keyEvent.keyCode == 67 && keyEvent.type == "keydown") { 
            console.log("Event", keyEvent);
            this.debug_mode = !this.debug_mode;
            if (!this.debug_mode) {
                this.debug_view.deactivate();
                this.player.activate();
            } else {
                this.debug_view.activate();
                this.player.deactivate();
            }
        }
        if(!this.debug_mode) {
            this.player.handleInput(keyEvent);
        } else {
            // forward to debug_view 
        }
    }

    mainloop(dTimeMs){
        this.player.update(dTimeMs);
    }
}
  
export { Game };
  