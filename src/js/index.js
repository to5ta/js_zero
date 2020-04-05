import { App } from "./app";

var app = new App();

app.engine.runRenderLoop(function () { 
        app.game.prerender();
        app.game.scene.render();
        app.game.postrender();
      });
      