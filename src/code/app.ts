import { Environment } from "./environment";
import { Game } from "./game";
import '../css/style.css'

import { Logging } from "./common/Logging";

import * as BABYLON from "@babylonjs/core";

import Stats from "stats-js";

/**
 * Contains and handles all the dependencies to the outer world
 */
class App {
  engine: BABYLON.Engine;
  game: Game;
  stats: Stats;

  constructor() {
    Environment.init()
    this.engine = new BABYLON.Engine(Environment.canvas, true);

    this.game = new Game(
      this.engine,
      Environment.canvas,
      this);

    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
  }
  

  addEventlisteners() {
    window.addEventListener("resize", () => { this.engine.resize() });
    
        window.addEventListener('focusin', () => {
          Logging.info('App gets focus again...');
          this.game.resume();
        });
    
        window.addEventListener('focusout', () => {
          Logging.info('App lost focus...');
          this.game.pause();
        });
    
    
        window.addEventListener('focus', () => {
          Logging.info('App gets focus again...');
          this.game.resume();
        });
    
        window.addEventListener('blur', () => {
          Logging.info('App lost focus...');
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
        if (!Environment.isMobile) {
          document.body.addEventListener("click", (event) => {
            Environment.canvas.requestPointerLock();
          });
        }
      }
       
    
 onStarted() {
    // while(!this.engine){};

    this.addEventlisteners();
    Logging.info("Resources loaded, register render loop function...");
    // register renderloop

    this.game.menuScreen.hide();

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
