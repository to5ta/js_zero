import * as BABYLON from "@babylonjs/core";

class VectorVisuHelper {
    vectorLine : BABYLON.LinesMesh;
    
    constructor(scene: BABYLON.Scene){
        this.vectorLine = BABYLON.LinesBuilder.CreateLines("vectorLine", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,1,0)]}, scene);
    }

    update(vector: BABYLON.Vector3 ) : void {
        this.vectorLine.setVerticesData(BABYLON.VertexBuffer.PositionKind, [0,0,0, vector.x, vector.y, vector.z]);
    }
}