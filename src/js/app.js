import * as BABYLON from "babylonjs";
import CANNON from "cannon";

import Stats from "stats.js";

import { Environment } from "./environment";

import { Game } from "./game";
import '../css/style.css'

/**
 * Contains and handles all the dependencies to the outer world
 */
class App {
  constructor() { 
    this.env = new Environment();

    this.engine = new BABYLON.Engine(this.env.canvas, true);
    this.game = new Game(this.engine, this.env.canvas);  
    
    this.stats = new Stats();
    this.stats.showPanel( 0 );
    document.body.appendChild( this.stats.dom );

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () { 
      app.engine.resize();
    });

    // register renderloop
    this.engine.runRenderLoop(() => { 
      this.stats.begin();
      this.game.mainloop(this.engine.getDeltaTime());
      this.game.scene.render();
      this.stats.end();
    });

    // register input handle
    this.env.canvas.addEventListener("keydown", (event) => {
      this.game.handleInput(event);
    });

    this.env.canvas.addEventListener("keyup", (event) => {
      this.game.handleInput(event);
    });
    
  }
}




export { App };
