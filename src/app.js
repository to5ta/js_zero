var Stats = require("stats.js");

// var BABYLON = require('babylonjs');
import * as BABYLON from "babylonjs";

import { Environment } from "./environment";
import { Menu } from "./menu";
import { Player } from './player';

// import { World } from './world';
// import { DebugControls } from './DebugControls';
// import { PlayerControls } from './PlayerControls';

import './style.css'

class App {
  constructor() { 
    this.env = new Environment();
    this.menu = new Menu(this.env);
    this.player = new Player();
    // this.world = new World();

    this.canvas = this.env.canvas;
    document.body.appendChild(this.canvas);

    // console.log(this.canvas);

    this.engine = new BABYLON.Engine(this.canvas, true); // Generate the BABYLON 3D engine

    // Create the scene space
    this.scene = new BABYLON.Scene(this.engine);

    // Add a camera to the scene and attach it to the canvas
    this.camera = new BABYLON.ArcRotateCamera("Camera", 
                                              Math.PI / 2,
                                              Math.PI / 2, 
                                              5,
                                              new BABYLON.Vector3(0,0,0), 
                                              this.scene);


    // this.camera = new BABYLON.UniversalCamera("Camera_asdf",
    //                                           new BABYLON.Vector3(2, 2, 2), 
    //                                           this.scene);

    this.debug_camera = new BABYLON.UniversalCamera("Debug_Camera", new BABYLON.Vector3(0,0,0), this.scene);

    this.camera.attachControl(this.canvas, true);
    this.debug_camera.attachControl(this.canvas, true);

    this.camera.setTarget(BABYLON.Vector3.Zero());

    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), this.scene);
    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), this.scene);

    // Add and manipulate meshes in the scene
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:2}, this.scene);
    
    this.debug_mode = false;
    this.paused = false;

    this.stats = new Stats();
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );


    document.body.addEventListener("keydown", (event) => {
      // c
      if(event.keyCode == 67) { 
        this.debug_mode = !this.debug_mode;
        this.scene.activeCamera = this.debug_mode ? this.debug_camera : this.camera;
        this.menu.debug_text.innerHTML = this.debug_mode ? "Debug" : "Player";
      }
    });

  }


}


export { App };