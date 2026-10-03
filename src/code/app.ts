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
    this.sessionCommunication();
  }


  sessionCommunication() {
    let userId = localStorage.getItem('userId') || crypto.randomUUID();
    localStorage.setItem('userId', userId);

    // Both timestamps are set by the database with NOW(); the client only says
    // who it is and which session it is closing.
    fetch('session_start.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
      .then(res => res.json())
      .then(data => {
        // sessionId names the row, token authorizes writing to it
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('sessionToken', data.token);
      });

    const reportSessionEnd = () => {
      const sessionId = localStorage.getItem('sessionId');
      const token = localStorage.getItem('sessionToken');
      if (!sessionId || !token) return;

      navigator.sendBeacon('session_end.php', JSON.stringify({ sessionId, token }));
    };

    // beforeunload is unreliable on mobile: iOS Safari commonly skips it when
    // the app is backgrounded or swiped away, which would leave sessionEnd NULL
    // for exactly the devices the mobile controls target. visibilitychange
    // covers backgrounding, pagehide the remaining navigations. Reporting more
    // than once is harmless, it only moves sessionEnd forward.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportSessionEnd();
      }
    });
    window.addEventListener('pagehide', reportSessionEnd);
  }

  addEventlisteners() {
    window.addEventListener("resize", () => { this.engine.resize() });
    
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
