
import * as BABYLON from "@babylonjs/core";
import { CharacterVisualization } from "./CharacterVisualization";
import { GameWorld } from "./world";
import { Player } from "./Player";
import { GameEventDispatcher } from "./GameEvent";
import { Scene } from "@babylonjs/core";

class ControllerConfig {
    jumpSpeed: number;
    moveSpeed: number;
    sprintSpeed: number;
}



function NormaltoSlopeXZ(vec3: BABYLON.Vector3): [number, number] {
    var vecXY = new BABYLON.Vector3(vec3.x, vec3.y, 0); vecXY.normalize();
    var vecYZ = new BABYLON.Vector3(0, vec3.y, vec3.z); vecYZ.normalize();
    var pitch = Math.acos(
            BABYLON.Vector3.Dot(vecYZ, BABYLON.Vector3.Up()));
    var roll = Math.acos(
            BABYLON.Vector3.Dot(vecXY, BABYLON.Vector3.Up()));
    return [
        vec3.z<0 ? -pitch : pitch,
        vec3.x<0 ? -roll : roll
    ];
}

class VectorVisuHelper {
    vectorLine : BABYLON.LinesMesh;
    
    constructor(scene: BABYLON.Scene){
        this.vectorLine = BABYLON.LinesBuilder.CreateLines("vectorLine", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,1,0)]}, scene);
    }

    update(vector: BABYLON.Vector3 ) : void {
        this.vectorLine.setVerticesData(BABYLON.VertexBuffer.PositionKind, [0,0,0, vector.x, vector.y, vector.z]);
    }
}

class CharacterController extends GameEventDispatcher {

    private world: GameWorld;
    imposter: BABYLON.Mesh;
    private parent: Player;
    animatedModel: CharacterVisualization;
    
    private config: ControllerConfig;
   
    falling = true;
    private jumping = false;
    private sprinting = false;

    private normalizedLocalDirection: BABYLON.Vector3;
    velocity: BABYLON.Vector3;
    private anzimuth: number;

    width: number;
    depth: number;
    height: number;



    contactRay: BABYLON.Ray;
    
    weight: number;

    standingNormal: BABYLON.Vector3 = BABYLON.Vector3.Up();



    // debugging elements
    slopeNormalVisu: VectorVisuHelper;
    localDirVisu: VectorVisuHelper;

    constructor(
        config: ControllerConfig,  
        parent: Player,   
        world: GameWorld,
        animatedModel: CharacterVisualization
    ) {
        super(CharacterController.name);
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
            
        this.imposter.position = this.world.player_start_position.clone();
        
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
        
        // debugging
        this.slopeNormalVisu = new VectorVisuHelper(this.parent.scene);
        this.slopeNormalVisu.vectorLine.parent = this.imposter;

        this.localDirVisu = new VectorVisuHelper(this.parent.scene);
        this.localDirVisu.vectorLine.parent = this.imposter;

    }

    reset() {
        this.normalizedLocalDirection = BABYLON.Vector3.Zero();
        this.velocity = BABYLON.Vector3.Zero(); 
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
        var pitch=0;
        var roll=0;

        if (rayCastToGroundHit) {
            let dist = rayCastResults[0].distance;


            this.standingNormal = rayCastResults[0].getNormal(true) ?? BABYLON.Vector3.Up();
           
           
           
            //this.slopeNormal.update(this.standingNormal);
            [pitch, roll] = NormaltoSlopeXZ(this.standingNormal);



            if(this.falling) {
                this.parent.onGroundContact(this.velocity.y);
            }
            this.slopeNormalVisu.vectorLine.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(0, pitch, -roll);

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

        let velocityIntended = this.normalizedLocalDirection.normalizeToNew();

       //  const slopeDelta = Math.abs(this.standingNormal.x) > 0.01 || Math.abs(this.standingNormal.y) > 0.01 ? -0.2 : 0;
        velocityIntended
            // .addInPlace(new BABYLON.Vector3(0, slopeDelta + this.standingNormal.x * velocityIntended.x + this.standingNormal.z * velocityIntended.z , 0))
            .scaleInPlace(
                this.sprinting ? this.config.sprintSpeed : this.config.moveSpeed);

        const toWorld = BABYLON.Matrix.RotationYawPitchRoll(
            this.anzimuth,
            0,
            0); 
        
        const toWorldsSlope = BABYLON.Matrix.RotationYawPitchRoll(
            0,
            pitch,
            -roll);
        
        velocityIntended = BABYLON.Vector3.TransformCoordinates(velocityIntended, toWorld);
        velocityIntended = BABYLON.Vector3.TransformCoordinates(velocityIntended, toWorldsSlope);

        if (velocityIntended.length() > 0.1) {
             this.localDirVisu.update(velocityIntended);
        }
        

        // combine kinematic impacts such as gravity ----------------------------------------------------------------
        if (this.falling || externalPhysicalImpact) {
            velocityPhysics.y = this.velocity.y - dTimeSec * 20; // should be 9.81 but looks bad
            this.velocity.y = velocityPhysics.y;
        } else {
            this.velocity.y = 0.01;
        }


        
        const moveCombined = velocityPhysics.add( velocityIntended );

        // move the player based on input + physics
        this.imposter.moveWithCollisions(moveCombined.scale(dTimeSec));

        var sprintValid = this.sprinting && this.normalizedLocalDirection.z == 1 && this.normalizedLocalDirection.x == 0;

        if(!this.parent.died) {
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
                this.animatedModel.play("fall");
            }
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

        if (!this.parent.died && this.imposter.position.y < -50) {
            this.dispatchEvent({type: "died", data: {reason: "abyss"}});
        }
    }
}

export { CharacterController, ControllerConfig };