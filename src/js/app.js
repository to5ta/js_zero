import * as BABYLON from "babylonjs";

import { Environment } from "./environment";
import { Menu } from "./menu";

import { Game } from "./game";
import '../css/style.css'

class App {
  constructor() { 
    this.env = new Environment();
    this.menu = new Menu(this.env);
    this.engine = new BABYLON.Engine(this.env.canvas, true);
    this.game = new Game(this.engine);  
    
    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () { 
      app.engine.resize();
    });
    
    // Register a render loop to repeatedly render the scene
    
  }
}




export { App };
