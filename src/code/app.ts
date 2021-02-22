import * as BABYLON from "babylonjs";

class App {

    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;

    constructor(){
        alert("App initialized");

        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.engine = new BABYLON.Engine(this.canvas, true);
    }

    testme(input: string) : number {
        return input.length;
    }
}

export { App };