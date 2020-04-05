var Stats = require("stats.js");

import * as BABYLON from "babylonjs";

import { Environment } from "./environment";
import { Menu } from "./menu";
import { Player } from './player';

import {World} from './world';

require('../css/style.css');

class App {
  constructor() { 
    this.env = new Environment();
    this.menu = new Menu(this.env);
    this.player = new Player();

    this.canvas = this.env.canvas;
    document.body.appendChild(this.canvas);
    
    this.engine = new BABYLON.Engine(this.canvas, true); // Generate the BABYLON 3D engine
    
    // Create the scene space
    this.scene = new BABYLON.Scene(this.engine);
    this.world = new World(this.scene);

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

    
    this.stats = new Stats();
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );


    document.body.addEventListener("keydown", (event) => {
      // c
      if(event.keyCode == 67) { 
        this.debug_mode = !this.debug_mode;
        if (this.debug_mode) {
          this.scene.activeCamera =this.debug_camera;
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
    });

  }


  prerender() {
    this.stats.begin();
  }

  postrender() {
    this.stats.end();
  }
}


export { App };
