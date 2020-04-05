import { App } from "./app";

var app = new App();

// Register a render loop to repeatedly render the scene
app.engine.runRenderLoop(function () { 
        app.prerender();
        app.scene.render();
        app.postrender();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () { 
        app.engine.resize();
});
