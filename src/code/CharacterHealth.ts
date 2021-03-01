import * as BABYLON from "@babylonjs/core";

export class CharacterHealth {

    private maxSpeedNoHurt = 10;
    private healthPoints: number;
    totalHealhPoints: number;

    onChange: () => void;
    onDying: () => void;
    
    constructor(
        totalHealthpoints: number,
        onchange: ()=> void,
        onDying: () => void){
        this.totalHealhPoints = totalHealthpoints;
        this.healthPoints = totalHealthpoints;
        this.onChange = onchange;
        this.onDying = onDying;

    }

    private dealDamage(damage: number) {
        this.healthPoints -= damage;
        if(this.healthPoints>0) {
            this.onChange();
        } else {
            this.onDying();
        }
    }

    dealFallDamage(speed: number) {
        var absSpeed = Math.abs(speed);
        if(absSpeed>this.maxSpeedNoHurt) {
            this.dealDamage(absSpeed);   
        }
    }

    dealAttackDamage(attackDamage: number) {
        this.dealDamage(attackDamage);
    }
}