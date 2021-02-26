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
            let animation = assetTask.loadedAnimationGroups[0];      
            animation.start();
            animation.stop();        
            console.log(Object.keys(namedAnimationProperties));    
            Object.keys(namedAnimationProperties).forEach(animationName => {
                animation.start();
                console.log(`add ${animationName}`);
                this.mNamedAnimations[animationName] = animation.clone(animationName);
                console.log(this.mNamedAnimations[animationName]);
                // console.log("char did LOAD");
                animation.stop();
            });
            
            this.meshLoaded = true;
        }
    }

    isPlaying(animationName: string) : boolean {
        return this.mNamedAnimations[animationName]?.isPlaying ?? false;
    }
            
    play(animationName: string): void 
    {
        console.log(`Start animation: ${animationName}`);
        if (!this.meshLoaded || !Object.keys(this.mNamedAnimations).includes(animationName)) {
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
            

    mMesh: BABYLON.Mesh;
    mNamedAnimations: {[key: string]: BABYLON.AnimationGroup} = {};
    mNamedAnimationProperties: {[key: string]: animationProperties};
    
    private meshLoaded = false;
    private scene: BABYLON.Scene;

    finishedLoading(): boolean {return this.meshLoaded};
} 