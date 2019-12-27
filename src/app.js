var Stats = require("stats.js");

var THREE = require('three');

import { Environment } from "./environment";
import { Menu } from "./menu";
import { Player } from './player';
import { DebugControls } from './DebugControls';
import { PlayerControls } from './PlayerControls';

import './style.css'
import './component'
// import './scene'


class App {
  constructor() { 

    this.env = new Environment();
    this.menu = new Menu(this.env);
    this.player = new Player();

    this.debug_mode = false;
    this.paused = false;

    this.stats = new Stats();
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    console.log("Initializing Renderer with Size: ", window.innerWidth, "x", window.innerHeight);
    document.body.appendChild( this.renderer.domElement );
    
    this.scene = new THREE.Scene();
    this.scene.add( this.player.model );

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.camera_controls = new PlayerControls( this.player, this.camera, this.renderer.domElement );

    this.debug_camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.debug_controls = new DebugControls( this.debug_camera, document.body );

    document.body.addEventListener("click", (event) => {
      if(this.debug_mode) {
        this.debug_controls.lock();
      }
    });

    document.body.addEventListener("keydown", (event) => {
      if(event.key == "c" || event.key == "C") {
        this.debug_mode = !this.debug_mode;
        this.menu.debug_text.textContent ="Debug Mode: " + (!this.debug_mode ? 'false' : 'true');
        if(this.debug_mode){
          this.debug_controls.lock();
          this.camera_controls.enabled = false;
        } else {
          this.debug_controls.unlock();
          this.camera_controls.enabled = true;
        }
      }
      if(this.debug_mode) {
        this.debug_controls.handleEvent(event);
      } else {
        this.camera_controls.handleEvent(event);
      }
    });

    // add grid
    var size = 10;
    var divisions = 10;
    var gridHelper = new THREE.GridHelper( size, divisions, 0x888888, 0x404040 );
    this.scene.add( gridHelper );

 
  }

  mainloop () {
    this.stats.begin();
    this.renderer.render( this.scene, this.debug_mode ? this.debug_camera : this.camera );
    this.stats.end();
  };
}


export { App };