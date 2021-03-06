
import * as BABYLON from "@babylonjs/core";
import { CharacterVisualization } from "./CharacterVisualization";
import { GameWorld } from "./world";
import { Player } from "./Player";

class ControllerConfig {
    jumpSpeed: number;
    moveSpeed: number;
    sprintSpeed: number;
}


class CharacterController {

    private world: GameWorld;
    imposter: BABYLON.Mesh;
    private parent: Player;
    animatedModel: CharacterVisualization;
    
    private config: ControllerConfig;
   
    falling: boolean;
    private jumping: boolean;
    private sprinting: boolean;

    private normalizedLocalDirection: BABYLON.Vector3;
    private velocity: BABYLON.Vector3;
    private anzimuth: number;

    width: number;
    depth: number;
    height: number;

    contactRay: BABYLON.Ray;
    
    weight: number;

    constructor(
        config: ControllerConfig,  
        parent: Player,   
        world: GameWorld,
        animatedModel: CharacterVisualization
    ) {
        this.config = config;

        this.world = world;
        this.animatedModel = animatedModel;
        this.parent = parent;



        this.normalizedLocalDirection = BABYLON.Vector3.Zero();
        this.velocity = BABYLON.Vector3.Zero();

        // physical representation --------------------------------------------

        this.width = 0.7;
        this.depth = 0.3;
        this.height = 1.9;
        this.weight = 75.0; //kg

        this.imposter = BABYLON.MeshBuilder.CreateSphere(
            "PlayerSphere", 
            {   
                diameterX: this.width,
                diameterY: this.height,
                diameterZ: this.depth,
            }, 
            world.scene);
            
        this.imposter.position = this.world.player_start_position;
        
        this.imposter.checkCollisions = true;
        this.imposter.ellipsoid = new BABYLON.Vector3(
            this.width/2, 
            this.height/2, 
            this.depth/2);
            
        this.imposter.material = new BABYLON.StandardMaterial("player_box_material", world.scene);
        this.imposter.material.wireframe = true;            
        this.imposter.visibility = 0;

        var floatingDistToGround = 0.05;


        this.contactRay = new BABYLON.Ray(
            this.imposter.position,
            new BABYLON.Vector3(0, -1.1, 0));
        this.contactRay.length = this.height/2 + 0.01;
    
    }

 
    jump() {
        if (!this.falling) {
            this.jumping = true;
            this.velocity.add(new BABYLON.Vector3(0, this.config.jumpSpeed, 0));
        }
    }
   
    move(normalizedLocalDirection: BABYLON.Vector3) {
        this.normalizedLocalDirection = normalizedLocalDirection;
    }


    setPosition(position: BABYLON.Vector3) {
        this.imposter.position = position.add(BABYLON.Vector3.Up().scale(this.imposter.scaling.y));
    }

    getPosition() : BABYLON.Vector3 {
        return this.imposter.position.subtract(BABYLON.Vector3.Up().scale(this.imposter.scaling.y));
    }

    setOrientation(anzimuth: number) {
        this.anzimuth = anzimuth;
    }

    getOrientation(): number {
        return this.anzimuth;
    }


    handleInput(keyEvent: KeyboardEvent) {
        
        const keyPressed = keyEvent.type == "keydown";

        if (keyEvent.key == "ArrowLeft" || keyEvent.key == "a") {
            if (keyPressed) {
                this.normalizedLocalDirection.x = -0.5;
            } else {
                this.normalizedLocalDirection.x = 0;
            }
        }  
        if (keyEvent.key == "ArrowRight" || keyEvent.key == "d") {
            if (keyPressed) {
                this.normalizedLocalDirection.x = 0.5;
            } else {
                this.normalizedLocalDirection.x = 0;
            }
        }  
        if (keyEvent.key == "ArrowUp" || keyEvent.key == "w") {
            this.normalizedLocalDirection.z = keyPressed ? 1 : 0;
        }  
        if (keyEvent.key == "ArrowDown" || keyEvent.key == "s") {
            this.normalizedLocalDirection.z = keyPressed ? -1 : 0;
        }  
        if (keyEvent.key == " " && keyPressed){
            this.jump();
        }

        // if (keyEvent.key == "CTRL") {
        //     this.strafe = keyPressed ? true : false;
        //     if (keyPressed) {
        //         // this.inputDirection.x = 0;
        //     }
        // }      

        if (keyEvent.key == "Shift") {
            this.sprinting = keyPressed ? true : false;
        }
        
    }


    update(dTimeMs: number) {
        const dTimeSec = dTimeMs / 1000;

        // collision detection for player ------------------------------------------------------------------------------------
        var externalPhysicalImpact = false;


        let meshes = this.world.collision_meshes;
        var rayCastResults : BABYLON.PickingInfo[] = Array();
        

        this.contactRay.intersectsMeshes(
            meshes as BABYLON.DeepImmutableObject<BABYLON.AbstractMesh>[], 
            false,
            rayCastResults );

        var rayCastToGroundHit = rayCastResults.length>0;


        // "collision response" for player -----------------------------------------------------------------------------------
        const velocityPhysics =  new BABYLON.Vector3(0,0,0);

        if (rayCastToGroundHit) {
            let dist = rayCastResults[0].distance;

            if(this.falling) {
                this.parent.onGroundContact(this.velocity.y);
            }

            // we could also use slope here or other surface attributes such as "marked-as-sticky"
            if(dist - 0.05 <= this.height/2) {
                this.falling = false;
                let matref = this.imposter.material as BABYLON.StandardMaterial;  
                matref.emissiveColor = new BABYLON.Color3(1, 0, 0);
            } 
        } else {
            let matref = this.imposter.material as BABYLON.StandardMaterial;
            matref.emissiveColor = new BABYLON.Color3(0, 1, 0);
            this.falling = true;
        }
    
        if (this.jumping) {
            this.jumping = false;
            this.falling = true;
            this.velocity.y = this.config.jumpSpeed;
        }

        // input form player + pyhsical interaction -----------------------------------------------------------------
        const velocityIntended = this.normalizedLocalDirection
            .normalize()
            .scale(
                this.sprinting ? this.config.sprintSpeed : this.config.moveSpeed);

        // combine kinematic impacts such as gravity ----------------------------------------------------------------
        if (this.falling || externalPhysicalImpact) {
            velocityPhysics.y = this.velocity.y - 9.81 * dTimeSec;
            this.velocity.y = velocityPhysics.y;
        } else {
            this.velocity.y = 0.01;
        }

        const toWorld = BABYLON.Matrix.RotationYawPitchRoll(
            this.anzimuth,
            0,
            0); 
        
        const moveCombined = velocityPhysics.add(
            BABYLON.Vector3.TransformCoordinates(velocityIntended, toWorld));

        // move the player based on input + physics
        this.imposter.moveWithCollisions(moveCombined.scale(dTimeSec));

        var sprintValid = this.sprinting && this.normalizedLocalDirection.z == 1 && this.normalizedLocalDirection.x == 0;

        if (!this.falling) {
            if ( this.normalizedLocalDirection.length() > 0.1) {
                if (sprintValid) {
                    this.animatedModel.play("sprint");
                } else {
                    this.animatedModel.play("walk");
                }
            }
            else {
                this.animatedModel.play("idle");
            }
        } else {
            this.animatedModel.play("jump");
        }

        // update the character mesh
        if(this.animatedModel.finishedLoading()) {
            this.animatedModel.setPosition(new BABYLON.Vector3(
                this.imposter.position.x,
                this.imposter.position.y - this.height/2,
                this.imposter.position.z));
        }
  
        if(this.normalizedLocalDirection.length() > 0.1){
            this.animatedModel.setOrientation(this.anzimuth - Math.PI);
        }
    }
}

export { CharacterController, ControllerConfig };