import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";


interface animationProperties {
    loop: boolean;
    speed: number;
    from: number;
    to: number;
    soundfile?: string;  // TODO
}

export class CharacterVisualization {
    
    constructor(
        modelfile: string,
        assetManager: BABYLON.AssetsManager,
        scene: BABYLON.Scene,
        namedAnimationProperties: {[key: string]: animationProperties}) {
        this.mNamedAnimationProperties = namedAnimationProperties;
        
        var assetTask = assetManager.addMeshTask(
            "PlayerModel", 
            null, 
            './', 
            modelfile);
            
        assetTask.onSuccess = () => {
            this.mMesh = assetTask.loadedMeshes[0] as BABYLON.Mesh;
            this.mMesh.rotation = BABYLON.Vector3.Zero();
            let animation = assetTask.loadedAnimationGroups[0];      
            animation.start();
            animation.stop();        
            console.log(Object.keys(namedAnimationProperties));    
            Object.keys(namedAnimationProperties).forEach(animationName => {
                this.mNamedAnimations[animationName] = animation.clone(animationName);
            });
            
            this.meshLoaded = true;
        }
    }

    isPlaying(animationName: string) : boolean {
        return this.mNamedAnimations[animationName]?.isPlaying ?? false;
    }
            
    play(animationName: string): void 
    {
        if (!this.meshLoaded || 
            !Object.keys(this.mNamedAnimations).includes(animationName) ||
            this.isPlaying(animationName)) {
            return;
        } else {
            Object.keys(this.mNamedAnimationProperties).forEach(animationName => { this.mNamedAnimations[animationName].stop() });
            this.mNamedAnimations[animationName].start(
                this.mNamedAnimationProperties[animationName].loop,
                this.mNamedAnimationProperties[animationName].speed,
                this.mNamedAnimationProperties[animationName].from,
                this.mNamedAnimationProperties[animationName].to,
                false);                
        }
    }

    setPosition(position: BABYLON.Vector3) {
        this.mMesh.position = position;
    }

    setRotation(rotation: BABYLON.Vector3) {
        this.mMesh.rotation = rotation;
    }

    setOrientation(anzimuth: number) {
        this.mMesh.rotation.y = anzimuth;
    }
            

    mNamedAnimations: {[key: string]: BABYLON.AnimationGroup} = {};
    mNamedAnimationProperties: {[key: string]: animationProperties};
    
    private meshLoaded = false;
    private scene: BABYLON.Scene;
    private mMesh: BABYLON.Mesh;

    finishedLoading(): boolean {return this.meshLoaded};
} 