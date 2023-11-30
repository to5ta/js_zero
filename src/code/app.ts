import { Environment } from "./environment";

import { Game } from "./game";
import '../css/style.css'

import * as BABYLON from "@babylonjs/core";

import Stats from "stats-js";

/**
 * Contains and handles all the dependencies to the outer world
 */
class App {
  env: Environment;
  engine: BABYLON.Engine;
  game: Game;
  stats: Stats;
  
  constructor() { 
    this.env = new Environment();

    this.engine = new BABYLON.Engine(
      this.env.canvas, 
      true);
        
    this.game = new Game(
      this.engine, 
      this.env.canvas, 
      this);

    this.stats = new Stats();
    this.stats.showPanel( 0 );
    document.body.appendChild( this.stats.dom );
   
    // Watch for browser/canvas resize events
    window.addEventListener("resize",  () => { 
      if(this.engine) {
        this.engine.resize();
      }
    });

    window.addEventListener('focusin', () => {
      console.log('App gets focus again...');
      this.game.resume();
    });

    window.addEventListener('focusout', () => {
      console.log('App lost focus...');
      this.game.pause();
    });


    window.addEventListener('focus', () => {
      console.log('App gets focus again...');
      this.game.resume();
    });

    window.addEventListener('blur', () => {
      console.log('App lost focus...');
      this.game.pause();
    });

    // register input handle
    document.body.addEventListener("keydown", (event) => {
      this.game.handleInput(event);
    });

    document.body.addEventListener("keyup", (event) => {
      this.game.handleInput(event);
    });

    
    // mouse? if we'd implement an own camera handler


    // catch the cursor to control the camera
    if (!this.env.isMobile) {
      document.body.addEventListener("click", (event) => {
        this.env.canvas.requestPointerLock();
      });
    }
  }


  onReady() {
    console.log(Date.now(), "Resources loaded, register render loop function...");
    // register renderloop

    this.engine.runRenderLoop(() => { 
      this.stats.begin();
      if (!this.game.paused) {
        this.game.scene.render();
        
        this.game.mainloop(this.engine.getDeltaTime());
      }
      this.stats.end();
    });
  }
}

export { App };
