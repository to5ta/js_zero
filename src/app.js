var Stats = require("stats.js");

var THREE = require('three');
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

import { Environment } from "./environment";
import { Menu } from "./menu";
import { Player } from './player';

import './style.css'
import './component'
// import './scene'


class App {
  constructor() { 

    this.env = new Environment();
    this.menu = new Menu(this.env);
    this.player = new Player();

    this.cameras = [];
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

    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    this.orbit_controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.orbit_controls.target.y = 2;
    this.orbit_controls.maxPolarAngle = Math.PI/2 - 0.1;
    this.orbit_controls.enablePan = false;
    
    this.debug_camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.pointerlock_controls = new PointerLockControls( this.debug_camera, document.body );
    this.cameras.push(this.camera, this.debug_camera);
    
    

    document.body.addEventListener("click", (event) => {
      if(this.camera_index  == 1) {
        this.pointerlock_controls.lock();
      }
    });

    document.body.addEventListener("keydown", (event) => {
      if(event.key == "c" || event.key == "C") {

      }  
    });

    document.body.addEventListener("keydown", (event) => {
      if(event.key == "c" || event.key == "C") {
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
        if(event.key == "ArrowLeft" || event.key == "a" || event.key == "A" ) {
          delta_position.x = -1;
        }
        if(event.key == "ArrowRight" || event.key == "d" || event.key == "D") {
          delta_position.x = 1;
        }
        if(event.key == "ArrowUp" || event.key == "w" || event.key == "W") {
          delta_position.z = -1;
        }
        if(event.key == "ArrowDown" || event.key == "s" || event.key == "S") {
          delta_position.z = 1;
        }
        if( event.key == "q" || event.key == "Q") {
          delta_position.y = 1;
        }
        if( event.key == "e" || event.key == "E") {
          delta_position.y = -1;
        }

        if([37,38,39,40, 81, 87, 69, 65, 83, 68].includes(event.keyCode)){
          this.debug_camera.position.add(
            delta_position.transformDirection(this.debug_camera.matrixWorld).multiplyScalar(0.25)
          );
        } 
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