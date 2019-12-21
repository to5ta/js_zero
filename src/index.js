import { App } from "./app";

//import scene from "./scene";

var app = new App();

// ugly workaround to call method as mainloop 
app.renderer.setAnimationLoop(updateApp);

function updateApp() {
    app.mainloop();
}