import { Environment } from "./environment";
import { Menu } from "./menu";

var THREE = require('three');
var Stats = require("stats.js");

import './style.css'
import './component'
// import './scene'

var env = new Environment();
var menu = new Menu(env);

console.log("Environment:", env);
console.log("Menu:", menu);

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );


var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
console.log("Initializing Renderer with Size: ", window.innerWidth, "x", window.innerHeight);
document.body.appendChild( renderer.domElement );

document.body.addEventListener("keydown", (event) => {
  // console.log("Keydown:", event);
  if(event.key == "Escape") {
    menu.show();
  }
});



// add grid
var size = 10;
var divisions = 10;
var gridHelper = new THREE.GridHelper( size, divisions, 0x888888, 0x404040 );
scene.add( gridHelper );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ffff } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 9;
camera.position.y = 3;
camera.rotation.x = -0.3;


function mainloop () {
  stats.begin();
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render( scene, camera );
  stats.end();
};

renderer.setAnimationLoop(mainloop);
