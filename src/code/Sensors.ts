import * as BABYLON from "@babylonjs/core";

import { Logging } from "./common/Logging";
import { GameEventHandler, GameEventType } from "./common/GameEvent";


interface TriggerObject {
    getPosition(): BABYLON.Vector3;
}

abstract class SensorBase  {
    abstract update(TriggerObject: TriggerObject) : void;
}


class SphereSensor extends SensorBase {
    private isActivate: boolean = false;
    radius: number;
    position: BABYLON.Vector3;
    sphere: BABYLON.Mesh;
    material: BABYLON.StandardMaterial;

    constructor(
        name: string,
        radius: number, 
        position: BABYLON.Vector3,
        world: BABYLON.Scene) {
        super();
        this.radius = radius;
        // add shpere to world
        let sphere = BABYLON.MeshBuilder.CreateSphere(name, {diameter: radius*2}, world);
        sphere.position = position;
        // add red material 
        let material = new BABYLON.StandardMaterial(name, world);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        sphere.material = material;
        this.sphere = sphere;
        this.material = material;
        this.position = position;
        
    }

    update(TriggerObject: TriggerObject) : void {
        let distance = BABYLON.Vector3.Distance(this.position, TriggerObject.getPosition());
        if (distance < this.radius) {
            if (!this.isActivate) {
                GameEventHandler.dispatchEvent(GameEventType.SensorActivated, this, {object: TriggerObject});
                this.isActivate = true;
                this.onActivate();
            }
        } else {
            if (this.isActivate) {
                GameEventHandler.dispatchEvent(GameEventType.SensorDeactivated, this, {object: TriggerObject});
                this.isActivate = false;
                this.onDeactivate();
            }
        }
    }

    onActivate() {
        this.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    }

    onDeactivate() {
        this.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    }
}

export { TriggerObject, SphereSensor, SensorBase };