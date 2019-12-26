var Stats = require("stats.js");

import { Environment } from "./environment";
import { Menu } from "./menu";

global.THREE = require('three');
const OrbitControls = require( 'three-orbit-controls' )( THREE );
// currently no better way
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

import './style.css'
import './component'
// import './scene'

class App {
  constructor() { 

    this.env = new Environment();
    this.menu = new Menu(this.env);
    
    console.log("Environment:", this.env);
    console.log("Menu:", this.menu);

    this.cameras = [];

    this.stats = new Stats();
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.debug_camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    this.cameras.push(this.camera, this.debug_camera);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    console.log("Initializing Renderer with Size: ", window.innerWidth, "x", window.innerHeight);
    document.body.appendChild( this.renderer.domElement );

    this.orbit_controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.orbit_controls.maxPolarAngle = Math.PI/2;
    this.pointerlock_controls = new PointerLockControls( this.debug_camera, document.body );

    document.body.addEventListener("click", (event) => {
      if(this.camera_index  == 1) {
        this.pointerlock_controls.lock();
      }
    });

    document.body.addEventListener("keydown", (event) => {
      console.log(event.keyCode);
      var speed = 0.1;
      if(event.key == "c") {
        this.camera_index = (this.camera_index+1) % this.cameras.length; 
        this.menu.debug_text.textContent ="Active Camera: " + (this.camera_index);
 
        if(this.camera_index == 1){
          this.pointerlock_controls.lock();
        } else {
          this.pointerlock_controls.unlock();
        }
      }

      if(this.camera_index == 1){
        var delta_position = new THREE.Vector3();
        if(event.key == "ArrowLeft") {
          delta_position.x = -1;
        }
        if(event.key == "ArrowRight") {
          delta_position.x = 1;
        }
        if(event.key == "ArrowUp") {
          delta_position.z = -1;
        }
        if(event.key == "ArrowDown") {
          delta_position.z = 1;
        }
        if([37,38,39,40].includes(event.keyCode)){
          this.debug_camera.position.add(delta_position.transformDirection(this.debug_camera.matrixWorld));
        }; 
      }
    });

    this.camera_index = 0;

    // add grid
    var size = 10;
    var divisions = 10;
    var gridHelper = new THREE.GridHelper( size, divisions, 0x888888, 0x404040 );
    this.scene.add( gridHelper );

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: this.env.isMobile ? 0xff0000 : 0x00ffff } );
    this. cube = new THREE.Mesh( geometry, material );
    this.scene.add( this.cube );

    this.camera.position.z = 9;
    this.camera.position.y = 3;
    this.camera.rotation.x = -0.3;

    this.debug_camera.position.z = 9;
    this.debug_camera.position.y = 3;
  }

  mainloop () {
    this.stats.begin();
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render( this.scene, this.cameras[this.camera_index] );
    this.stats.end();
  };
}


export { App };