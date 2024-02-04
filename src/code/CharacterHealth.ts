import * as BABYLON from "@babylonjs/core";
import { GameEvent, GameEventDispatcher, GameEventListener } from "./common/GameEvent";

export class CharacterHealth extends GameEventDispatcher  {
    setHealthPoints(hp: number) {
        this.healthPoints = hp;
        this.dispatchEvent({type: "hp_changed", data: {health: this.healthPoints.toFixed(0).toString()}});
    }

    private maxSpeedNoHurt = 10;
    private healthPoints: number;
    totalHealhPoints: number;
   
    constructor(
        totalHealthpoints: number){
        super(CharacterHealth.name);
        this.totalHealhPoints = totalHealthpoints;
        this.healthPoints = totalHealthpoints;
    }

    private dealDamage(damage: number) {
        this.healthPoints -= damage;
        if(this.healthPoints>0) {
            this.dispatchEvent({type: "hp_changed", data: {health: this.healthPoints.toFixed(0).toString()}});
        } else {
            this.dispatchEvent({type: "died", data: {health: "DEAD"}});
        }
    }

    dealFallDamage(speed: number) {
        var absSpeed = Math.abs(speed);
        if(absSpeed>this.maxSpeedNoHurt) {
            this.dealDamage(absSpeed*5);   
        }
    }

    dealAttackDamage(attackDamage: number) {
        this.dealDamage(attackDamage);
    }
}