import * as BABYLON from "@babylonjs/core";
import { GameEventType, GameEventHandler } from "./common/GameEvent";
import { PlayerConfig } from "./config/PlayerConfig";

export class CharacterHealth  {
    setHealthPoints(hp: number) {
        this.healthPoints = hp;
        GameEventHandler.dispatchEvent(GameEventType.PlayerHealthChanged, this, {health: this.healthPoints.toFixed(0).toString()});
    }
    
    private maxSpeedNoHurt = PlayerConfig.health.maxSpeedNoHurt;
    private healthPoints: number;
    totalHealhPoints: number;
    
    constructor(
        totalHealthpoints: number){
            this.totalHealhPoints = totalHealthpoints;
            this.healthPoints = totalHealthpoints;
    }
        
        private dealDamage(damage: number) {
            this.healthPoints -= damage;
            if(this.healthPoints>0) {
            GameEventHandler.dispatchEvent(GameEventType.PlayerHealthChanged, this, {health: this.healthPoints.toFixed(0).toString()});
        } else {
            GameEventHandler.dispatchEvent(GameEventType.PlayerDied, this, {health: "DEAD"});
        }
    }

    dealFallDamage(speed: number) {
        var absSpeed = Math.abs(speed);
        if(absSpeed>this.maxSpeedNoHurt) {
            this.dealDamage(absSpeed * PlayerConfig.health.fallDamageMultiplier);   
        }
    }

    dealAttackDamage(attackDamage: number) {
        this.dealDamage(attackDamage);
    }
}