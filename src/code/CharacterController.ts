import * as BABYLON from "@babylonjs/core";
import { CharacterVisualization } from "./CharacterVisualization";
import { GameWorld } from "./world";
import { Player } from "./Player";
import { GameEventDispatcher } from "./common/GameEvent";
import { NormaltoSlopeXZ } from "./utils";

class ControllerConfig {
    jumpSpeed: number;
    moveSpeed: number;
    sprintSpeed: number;
    width: number;
    depth: number;
    height: number;
    weight: number;
}



class CharacterController extends GameEventDispatcher {

    private world: GameWorld;
    readonly imposter: BABYLON.Mesh;
    private parent: Player;
    readonly animatedModel: CharacterVisualization;
    
    private config: ControllerConfig;
   
    private falling = true;
    private jumping = false;
    private sprint = false;

    private localInputDirection: BABYLON.Vector3;
    private anzimuth: number;
    
    private velocity: BABYLON.Vector3;

    private contactRay: BABYLON.Ray;

    private standingNormal: BABYLON.Vector3 = BABYLON.Vector3.Up();
    private positionLastFrame: BABYLON.Vector3;
    private currentVelocity: BABYLON.Vector3;

    constructor(
        config: ControllerConfig,  
        parent: Player,   
        world: GameWorld,
        animatedModel: CharacterVisualization
    ) {
        super(CharacterController.name);
        this.config             = config;
        this.world              = world;
        this.animatedModel      = animatedModel;
        this.parent             = parent;

        this.localInputDirection = BABYLON.Vector3.Zero();

        this.velocity = BABYLON.Vector3.Zero();

        // physical representation --------------------------------------------
        this.imposter = BABYLON.MeshBuilder.CreateSphere(
            "PlayerSphere", 
            {   
                diameterX: this.config.width,
                diameterY: this.config.height,
                diameterZ: this.config.depth,
            }, 
            world.scene);
            
        this.imposter.position = this.world.player_start_position.clone();
        this.currentVelocity = BABYLON.Vector3.Zero();
        this.positionLastFrame = this.imposter.position;

        
        this.imposter.checkCollisions = true;
        this.imposter.ellipsoid = new BABYLON.Vector3(
            this.config.width/2, 
            this.config.height/2, 
            this.config.depth/2);
            
        this.imposter.material = new BABYLON.StandardMaterial("player_box_material", world.scene);
        this.imposter.material.wireframe = true;            
        this.imposter.visibility = 0;

        this.contactRay = new BABYLON.Ray(
            this.imposter.position,
            new BABYLON.Vector3(0, -1.1, 0));
        this.contactRay.length = this.config.height/2 + 0.01;  

    }

    reset() {
        this.localInputDirection = BABYLON.Vector3.Zero();
        this.velocity = BABYLON.Vector3.Zero(); 
    }

 
    jump() {
        if (!this.falling) {
            this.jumping = true;
            this.velocity.add(new BABYLON.Vector3(0, this.config.jumpSpeed, 0));
        }
    }
   
    move(normalizedLocalDirection: BABYLON.Vector3) {
        this.localInputDirection = normalizedLocalDirection;
    }

    setPosition(position: BABYLON.Vector3) {
        this.imposter.position.copyFrom(position.clone()); // .add(BABYLON.Vector3.Up().scale(this.imposter.scaling.y)));
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


    getCurrentVelocity(): BABYLON.Vector3 {
        return this.currentVelocity;
    }


    handleDirectionalMovementInput(direction: BABYLON.Vector2) {
        this.localInputDirection.x = direction.x/2;
        this.localInputDirection.z = direction.y;
    }

    handleInput(keyEvent: KeyboardEvent) {
        
        const keyPressed = keyEvent.type == "keydown";

        if (keyEvent.key == "ArrowLeft" || keyEvent.key == "a") {
            if (keyPressed) {
                this.localInputDirection.x = -0.5;
            } else {
                this.localInputDirection.x = 0;
            }
        }  
        if (keyEvent.key == "ArrowRight" || keyEvent.key == "d") {
            if (keyPressed) {
                this.localInputDirection.x = 0.5;
            } else {
                this.localInputDirection.x = 0;
            }
        }  
        if (keyEvent.key == "ArrowUp" || keyEvent.key == "w") {
            this.localInputDirection.z = keyPressed ? 1 : 0;
        }  
        if (keyEvent.key == "ArrowDown" || keyEvent.key == "s") {
            this.localInputDirection.z = keyPressed ? -1 : 0;
        }  
        if ((keyEvent.key == " " || keyEvent.key == "Control") && keyPressed){
            this.jump();
        }

        // if (keyEvent.key == "CTRL") {
        //     this.strafe = keyPressed ? true : false;
        //     if (keyPressed) {
        //         // this.inputDirection.x = 0;
        //     }
        // }      

        if (keyEvent.key == "Shift") {
            this.sprint = keyPressed ? true : false;
        }
        
    }


    update(dTimeMs: number) {
        const dTimeSec = dTimeMs / 1000;

        var isSprinting = this.sprint && this.localInputDirection.z == 1 && this.localInputDirection.x == 0;



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
        var pitch=0;
        var roll=0;

        if (rayCastToGroundHit) {
            let dist = rayCastResults[0].distance;

            this.standingNormal = rayCastResults[0].getNormal(true) ?? BABYLON.Vector3.Up();
                 
            [pitch, roll] = NormaltoSlopeXZ(this.standingNormal);

            if(this.falling) {
                this.parent.onGroundContact(this.velocity.y);
            }

            // we could also use slope here or other surface attributes such as "marked-as-sticky"
            if(dist - 0.05 <= this.config.height/2) {
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



        // intended velocity from player input -----------------------------------------------------------------

        const toWorldOrientation = BABYLON.Matrix.RotationYawPitchRoll(
            this.anzimuth,
            0,
            0); 
        
        const toWorldSlope = BABYLON.Matrix.RotationYawPitchRoll(
            0,
            pitch,
            -roll);

        let inputVelocity = this.localInputDirection.normalizeToNew();

        inputVelocity
            .scaleInPlace(
                (this.sprint && isSprinting) ? this.config.sprintSpeed : this.config.moveSpeed);

        inputVelocity = BABYLON.Vector3.TransformCoordinates(inputVelocity, toWorldOrientation);
        inputVelocity = BABYLON.Vector3.TransformCoordinates(inputVelocity, toWorldSlope);
       



        // combine kinematic impacts such as gravity ----------------------------------------------------------------
        if (this.falling || externalPhysicalImpact) {
            // calc falling
            velocityPhysics.y = this.velocity.y - 20 * dTimeSec; // g = 9.81 looks shitty, use 20 instead
            // mix in furhter externalPhysicalImpact if any.. (TODO)        
            
            // cache current falling
            this.velocity.y = velocityPhysics.y;    
        } else {
            this.velocity.y = 0.01;
        }
        
        const moveCombined = velocityPhysics.add( inputVelocity );


        // move the player based on input + physics
        this.imposter.moveWithCollisions(moveCombined.scale(dTimeSec));
        
        this.positionLastFrame = this.imposter.position;
        this.currentVelocity = this.imposter.position.subtract(this.positionLastFrame).scale(1/(dTimeMs*1000)); 



        if (!this.parent.died) {
            if (!this.falling) {
                if (this.localInputDirection.length() > 0.1) {
                    if (isSprinting) {
                        this.animatedModel.play("sprint");
                    } else {
                        this.animatedModel.play("walk");
                    }
                }
                else {
                    this.animatedModel.play("idle");
                }
            } else {
                this.animatedModel.play("fall");
            }
        }


        // update the character mesh
        if(this.animatedModel.finishedLoading()) {
            this.animatedModel.setPosition(new BABYLON.Vector3(
                this.imposter.position.x,
                this.imposter.position.y - this.config.height/2,
                this.imposter.position.z));
        }
  
        if(this.localInputDirection.length() > 0.1){
            this.animatedModel.setOrientation(this.anzimuth - Math.PI);
        }


        if (!this.parent.died && this.imposter.position.y < -50) {
            this.dispatchEvent({type: "died", data: {reason: "abyss"}});
        }
    }
}

export { CharacterController, ControllerConfig };