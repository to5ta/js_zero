import * as BABYLON from "@babylonjs/core";
import { GameEvent, GameEventEmitter, GameEventListener } from "./GameEvent";

export class CharacterHealth extends GameEventEmitter  {
    setHealthPoints(hp: number) {
        this.healthPoints = hp;
        this.emitEvent({type: "hp_changed", data: {health: this.healthPoints.toFixed(0).toString()}});
    }

    private maxSpeedNoHurt = 10;
    private healthPoints: number;
    totalHealhPoints: number;
   
    constructor(
        totalHealthpoints: number){
        super();
        this.totalHealhPoints = totalHealthpoints;
        this.healthPoints = totalHealthpoints;
    }

    private dealDamage(damage: number) {
        this.healthPoints -= damage;
        if(this.healthPoints>0) {
            this.emitEvent({type: "hp_changed", data: {health: this.healthPoints.toFixed(0).toString()}});
        } else {
            this.emitEvent({type: "died", data: {health: "DEAD"}});
        }
    }

    dealFallDamage(speed: number) {
        var absSpeed = Math.abs(speed);
        if(absSpeed>this.maxSpeedNoHurt) {
            this.dealDamage(absSpeed*2);   
        }
    }

    dealAttackDamage(attackDamage: number) {
        this.dealDamage(attackDamage);
    }
}