import { App } from "./app";

var app = new App();

// Register a render loop to repeatedly render the scene
app.engine.runRenderLoop(function () { 
        app.scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () { 
        app.engine.resize();
});